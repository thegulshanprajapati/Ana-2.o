'use server';
/**
 * @fileOverview Generates chat responses using ana.v-01 and brain context.
 */

import { anaGenerateJson, anaGenerateText, normalizeModelText } from '@/ai/ana-v01';
import {
  getAllUsers,
  getBrainDocuments,
  getChatHistoryForUser,
  getCommunityPosts,
  getUserById,
} from '@/lib/local-data';
import { getPublicConnectProfile } from '@/lib/connect-profile';
import { z } from 'zod';

export interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isSearchInfo?: boolean;
}

const GenResponseSchema = z.object({
  sourceFile: z.string().default('none'),
  response: z.string().min(1),
});

const languageMap: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  'en-hi': 'Hinglish (mix of Hindi and English)',
  bn: 'Bengali',
  bh: 'Bhojpuri',
};

const MAX_KNOWLEDGE_CHARS = 45000;
const MAX_PREVIOUS_CHATS_CHARS = 7000;
const MAX_ACTIVITY_CONTEXT_CHARS = 5000;
const MAX_COMMUNITY_ACTIVITY_CHARS = 2800;
const MAX_RECENT_ACTIVITY_ITEMS = 6;
const videoMediaPattern = /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;

const MALE_ROLE_CHARACTERS = new Set([
  'Husband',
  'Raudy Boy',
  'Best Friend (Boy)',
  'Ex-boyfriend',
  'Gym Trainer',
  'Professor',
  'Police',
  'Judge',
  'Criminal',
  'Cook',
]);

const CHARACTER_DOC_ALIASES: Record<string, string[]> = {
  defaultt: ['default', 'defaultt', 'ana'],
  'Doctor Ana': ['doctorana', 'doctor', 'medical'],
  'Coder Ana': ['coderana', 'coder', 'developer', 'programmer', 'technicaldomain'],
  'Wife Ana': ['wifeana', 'wife', 'partner', 'romantic'],
  'Motivator Ana': ['motivatorana', 'motivator', 'motivation', 'coach'],
  'Hindi Hinglish': ['hindihinglish', 'hinglish', 'hindi'],
  'Creative Domain': ['creativedomain', 'creative', 'story', 'writer'],
  'Daily Life Support': ['dailylifesupport', 'dailylife', 'lifestyle'],
  'Emotional Intelligence': ['emotionalintelligence', 'emotional', 'therapy', 'counsellor'],
  'Technical Domain': ['technicaldomain', 'technical', 'coding', 'developer'],
  Husband: ['husband', 'spousemale'],
  'Raudy Boy': ['raudyboy', 'rowdyboy'],
  'Best Friend (Boy)': ['bestfriendboy', 'bestfriend', 'bro'],
  'Ex-boyfriend': ['exboyfriend', 'ex'],
  'Gym Trainer': ['gymtrainer', 'trainer', 'fitness'],
  Professor: ['professor', 'teacher'],
  Police: ['police', 'officer'],
  Judge: ['judge', 'court'],
  Criminal: ['criminal'],
  Cook: ['cook', 'chef'],
  'Ex-girlfriend': ['exgirlfriend', 'ex'],
};

const CHARACTER_PERSONA_RULES: Record<string, string> = {
  defaultt: 'Be a warm, smart, trustworthy companion.',
  'Doctor Ana':
    'Act like a careful doctor companion: ask clarifying symptoms and avoid unsafe medical certainty.',
  'Coder Ana':
    'Act like a pragmatic software engineer: concise debugging, clear steps, practical code guidance.',
  'Wife Ana':
    'Act like a loving wife persona: emotionally warm, caring, relationship-oriented, respectful and affectionate.',
  'Motivator Ana':
    'Act like a motivational coach: energetic, encouraging, action-focused and disciplined.',
  'Hindi Hinglish':
    'Speak naturally in Hinglish with Indian conversational tone.',
  'Creative Domain':
    'Act as a creative partner: imaginative ideas, storytelling, catchy phrasing.',
  'Daily Life Support':
    'Act as a practical life assistant: routines, habits, everyday productivity support.',
  'Emotional Intelligence':
    'Act as an emotionally intelligent companion: empathic listening, validation, gentle guidance.',
  'Technical Domain':
    'Act as a technical expert: architecture, systems, and implementation detail.',
  Husband: 'Act like a husband persona with male tone.',
  'Raudy Boy': 'Act like a bold, playful male friend persona.',
  'Best Friend (Boy)': 'Act like a supportive male best friend persona.',
  'Ex-boyfriend': 'Act like an ex-boyfriend persona with emotional maturity.',
  'Gym Trainer': 'Act as a strict but supportive male fitness trainer.',
  Professor: 'Act as a knowledgeable professor persona with structured explanations.',
  Police: 'Act as a firm and disciplined police officer persona.',
  Judge: 'Act as a neutral, principled judge persona.',
  Criminal: 'Act as a rough anti-hero criminal persona (no illegal instructions).',
  Cook: 'Act as a skilled chef persona with practical cooking tips.',
  'Ex-girlfriend': 'Act like an ex-girlfriend persona with feminine tone.',
};

const isDateOrTimeRequest = (text: string): boolean => {
  const normalized = text.toLowerCase();
  return /(current time|what time|what's the time|current date|today's date|what day|date today|\btime\b|\bdate\b)/i.test(
    normalized
  );
};

const toSingleLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

const truncateText = (value: string, maxChars: number): string => {
  const compact = toSingleLine(value);
  if (compact.length <= maxChars) {
    return compact;
  }
  return `${compact.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
};

const truncateChars = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
};

const stripFileExtension = (fileName: string): string =>
  fileName.replace(/\.[^/.]+$/, '');

const normalizeToken = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const normalizeContentSnippet = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();

const getCharacterSearchTokens = (character: string): string[] => {
  const base = normalizeToken(character || 'defaultt');
  const aliasTokens = (CHARACTER_DOC_ALIASES[character] || []).map((item) =>
    normalizeToken(item)
  );

  const tokens = new Set<string>([base, ...aliasTokens].filter((token) => token.length >= 3));
  if (base.endsWith('ana')) {
    const withoutAna = base.replace(/ana$/, '');
    if (withoutAna.length >= 3) {
      tokens.add(withoutAna);
    }
  }
  return Array.from(tokens);
};

const resolveCharacterRoleGender = (character: string): 'male' | 'female' => {
  return MALE_ROLE_CHARACTERS.has(character) ? 'male' : 'female';
};

const buildPersonaInstructions = (
  character: string,
  languageCode: string
): string => {
  const roleGender = resolveCharacterRoleGender(character);
  const personaRule =
    CHARACTER_PERSONA_RULES[character] ||
    `Act consistently as "${character}" persona with natural conversational tone.`;

  const feminineGrammarRule =
    roleGender === 'female'
      ? languageCode === 'hi' || languageCode === 'en-hi' || languageCode === 'bh'
        ? 'Use feminine self-reference. Prefer forms like "main ... kar sakti hoon / main thi / main gayi". Avoid masculine forms like "kar sakta hoon / gaya".'
        : 'Keep self-reference explicitly feminine in tone.'
      : 'Use masculine role tone only because this specific character is a male role selected by the user.';

  return `Selected character: ${character}
Role gender: ${roleGender}
Persona behavior: ${personaRule}
Gender grammar rule: ${feminineGrammarRule}`;
};

const isVideoMediaUrl = (mediaUrl: string): boolean => {
  const normalizedUrl = mediaUrl.toLowerCase();
  return (
    normalizedUrl.startsWith('data:video/') ||
    normalizedUrl.includes('/video/upload/') ||
    videoMediaPattern.test(normalizedUrl) ||
    /[?&](?:format|fm)=?(?:mp4|webm|ogg|mov|m4v)\b/i.test(normalizedUrl)
  );
};

const buildPreviousChatsContext = async (
  userId?: string,
  activeChatId?: string
): Promise<string> => {
  if (!userId) {
    return 'No signed-in user found, so previous chat context is unavailable.';
  }

  try {
    const sessions = await getChatHistoryForUser(userId);
    const earlierSessions = sessions.filter((session) => session.id !== activeChatId);
    if (!earlierSessions.length) {
      return 'No earlier chat sessions available for this user.';
    }

    const lines: string[] = [];
    let consumedChars = 0;

    for (const session of earlierSessions.slice(0, 8)) {
      const sessionDate = session.createdAt
        ? new Date(session.createdAt).toISOString().slice(0, 10)
        : 'unknown-date';
      const header = `- Session "${session.title || 'Untitled'}" (${sessionDate})`;
      if (consumedChars + header.length > MAX_PREVIOUS_CHATS_CHARS) {
        break;
      }
      lines.push(header);
      consumedChars += header.length;

      const meaningfulMessages = session.messages
        .filter((message) => {
          if (!message.content?.trim()) {
            return false;
          }
          return !message.content.startsWith('Searched for "');
        })
        .slice(-6);

      for (const message of meaningfulMessages) {
        const role = message.role === 'user' ? 'User' : 'Ana';
        const item = `  ${role}: ${truncateText(message.content, 220)}`;
        if (consumedChars + item.length > MAX_PREVIOUS_CHATS_CHARS) {
          break;
        }
        lines.push(item);
        consumedChars += item.length;
      }
    }

    return lines.length
      ? lines.join('\n')
      : 'No usable messages found in earlier chat sessions.';
  } catch (error) {
    console.error('Failed to build previous chat context:', error);
    return 'Previous chat context could not be loaded due to an internal error.';
  }
};

const buildUserActivityContext = async (
  userId?: string,
  communityActivity?: string
): Promise<string> => {
  if (!userId) {
    return 'No signed-in user found, so connect/community activity context is unavailable.';
  }

  try {
    const [user, users, connectPosts] = await Promise.all([
      getUserById(userId),
      getAllUsers(),
      getCommunityPosts(),
    ]);

    if (!user) {
      return 'User record not found, so activity context is unavailable.';
    }

    const profile = getPublicConnectProfile(user);
    const followersCount = users.filter((candidate) =>
      (candidate.connectProfile?.followingUserIds || []).includes(user.id)
    ).length;

    const followingSet = new Set(profile.followingUserIds || []);
    const followingHandles = users
      .filter((candidate) => followingSet.has(candidate.id))
      .map((candidate) => `@${getPublicConnectProfile(candidate).handle}`)
      .slice(0, MAX_RECENT_ACTIVITY_ITEMS);

    const myConnectPosts = connectPosts
      .filter((post) => post.userId === user.id)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    let textOnlyCount = 0;
    let photoCount = 0;
    let videoCount = 0;
    const hashtagFrequency = new Map<string, number>();

    for (const post of myConnectPosts) {
      const mediaUrl = post.imageUrl?.trim() || '';
      if (!mediaUrl) {
        textOnlyCount += 1;
      } else if (isVideoMediaUrl(mediaUrl)) {
        videoCount += 1;
      } else {
        photoCount += 1;
      }

      const tags = post.text.match(/#[a-z0-9_]+/gi) ?? [];
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase();
        hashtagFrequency.set(normalizedTag, (hashtagFrequency.get(normalizedTag) ?? 0) + 1);
      }
    }

    const topHashtags = Array.from(hashtagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => `${tag} (${count})`);

    const recentConnectPosts = myConnectPosts
      .slice(0, MAX_RECENT_ACTIVITY_ITEMS)
      .map((post) => {
        const mediaUrl = post.imageUrl?.trim() || '';
        const mediaType = !mediaUrl ? 'text' : isVideoMediaUrl(mediaUrl) ? 'video' : 'photo';
        const date = post.createdAt
          ? new Date(post.createdAt).toISOString().slice(0, 10)
          : 'unknown-date';
        return `- ${date} [${mediaType}] ${truncateText(post.text || '(no caption)', 140)}`;
      });

    const communitySection = communityActivity?.trim()
      ? truncateText(communityActivity, MAX_COMMUNITY_ACTIVITY_CHARS)
      : 'No community activity snapshot was provided from this user session.';

    const context = `CONNECT PROFILE:
- Name: ${user.displayName || 'Anonymous'}
- Handle: @${profile.handle}
- Bio: ${truncateText(profile.bio || 'No bio', 220)}
- Followers: ${followersCount}
- Following: ${followingSet.size}
- Following sample: ${followingHandles.length ? followingHandles.join(', ') : 'none'}

ANA CONNECT ACTIVITY:
- Total posts: ${myConnectPosts.length} (text: ${textOnlyCount}, photos: ${photoCount}, videos: ${videoCount})
- Top hashtags: ${topHashtags.length ? topHashtags.join(', ') : 'none'}
- Recent posts:
${recentConnectPosts.length ? recentConnectPosts.join('\n') : '- No recent AnaConnect posts.'}

COMMUNITY ACTIVITY:
${communitySection}`;

    return truncateChars(context, MAX_ACTIVITY_CONTEXT_CHARS);
  } catch (error) {
    console.error('Failed to build activity context:', error);
    return 'Connect/community activity context could not be loaded due to an internal error.';
  }
};

const buildKnowledgeBase = async (character: string): Promise<{
  knowledgeBase: string;
  beautifyPrompt: string;
  selectedCharacterFiles: string[];
}> => {
  const docs = await getBrainDocuments();
  const beautifyPromptDoc = docs.find((doc) => doc.fileName === 'Beautify Prompt.txt');
  const beautifyPrompt = beautifyPromptDoc?.content || '';
  const knowledgeDocs = docs.filter((doc) => doc.fileName !== 'Beautify Prompt.txt');
  const searchTokens = getCharacterSearchTokens(character);

  const matchedDocs = knowledgeDocs.filter((doc) => {
    const docToken = normalizeToken(stripFileExtension(doc.fileName));
    const contentSnippet = normalizeContentSnippet(doc.content.slice(0, 4000));
    return searchTokens.some(
      (token) =>
        docToken === token ||
        docToken.includes(token) ||
        token.includes(docToken) ||
        contentSnippet.includes(token)
    );
  });

  const defaultDocs = knowledgeDocs.filter((doc) => {
    const docToken = normalizeToken(stripFileExtension(doc.fileName));
    return docToken.includes('default') || docToken === 'ana';
  });

  const selectedDocs = matchedDocs.length
    ? matchedDocs
    : defaultDocs.length
      ? defaultDocs
      : knowledgeDocs.slice(0, 4);

  const chunks: string[] = [];
  let chars = 0;

  for (const doc of selectedDocs) {
    if (chars >= MAX_KNOWLEDGE_CHARS) {
      break;
    }

    let body = doc.content;
    if (doc.fileName.endsWith('.json')) {
      try {
        const parsed = JSON.parse(doc.content);
        if (Array.isArray(parsed?.conversations)) {
          body = parsed.conversations
            .map(
              (convo: any) =>
                `User: "${convo.user_input || ''}" -> Ana: "${convo.ana_response || ''}"`
            )
            .join('\n');
          body = `This file contains conversational examples.\n${body}`;
        }
      } catch {
        // Keep original content.
      }
    }

    const formatted = `[START OF FILE: ${doc.fileName}]\n${body}\n[END OF FILE: ${doc.fileName}]`;
    chars += formatted.length;
    chunks.push(formatted);
  }

  return {
    knowledgeBase: chunks.length ? chunks.join('\n\n---\n\n') : 'No character knowledge file available.',
    beautifyPrompt,
    selectedCharacterFiles: selectedDocs.map((doc) => doc.fileName),
  };
};

const searchWeb = async (query: string): Promise<string[]> => {
  const apiKey =
    process.env.ANA_SEARCH_API_KEY ||
    process.env.GOOGLE_SEARCH_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';

  if (!apiKey || !searchEngineId) {
    return [];
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return (
      data?.items
        ?.map((item: any) => item?.snippet)
        .filter((snippet: unknown): snippet is string => Boolean(snippet))
        .slice(0, 8) || []
    );
  } catch (error) {
    console.error('Web search failed:', error);
    return [];
  }
};

export interface AiResponse {
  response: string;
  sourceFile: string;
  searchQuery?: string;
}

export async function generateResponse({
  character = 'defaultt',
  message,
  history = [],
  userId,
  activeChatId,
  communityActivity,
  userGender = 'not specified',
  language = 'en',
  searchMode = false,
}: {
  character?: string;
  message: string;
  history?: AppMessage[];
  userId?: string;
  activeChatId?: string;
  communityActivity?: string;
  userGender?: string;
  language?: string;
  searchMode?: boolean;
}): Promise<AiResponse> {
  try {
    const resolvedLanguage = languageMap[language] || 'English';

    if (!searchMode && isDateOrTimeRequest(message)) {
      const now = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
      return {
        response: `**Current date and time:** \`${now}\``,
        sourceFile: 'none',
      };
    }

    const personaInstructions = buildPersonaInstructions(character, language);

    const [
      { knowledgeBase, beautifyPrompt, selectedCharacterFiles },
      searchResults,
      previousChatsContext,
      userActivityContext,
    ] = await Promise.all([
      buildKnowledgeBase(character),
      searchMode ? searchWeb(message) : Promise.resolve([]),
      buildPreviousChatsContext(userId, activeChatId),
      buildUserActivityContext(userId, communityActivity),
    ]);

    const formattedHistory = history
      .slice(-20)
      .map((m) => `${m.role === 'user' ? 'User' : 'Ana'}: ${m.content}`)
      .join('\n');

    const searchSection = searchMode
      ? `WEB SEARCH RESULTS:
================================
${searchResults.length ? searchResults.map((item) => `- ${item}`).join('\n') : 'No search results found.'}
================================`
      : 'WEB SEARCH RESULTS:\n================================\nSearch mode disabled.\n================================';

    const prompt = `
You are Ana, a close personal companion with personality "${character}". User gender: ${userGender}.
Do not mention you are an AI system.

Mandatory rules:
1. Respond only in: ${resolvedLanguage}.
2. If Search Mode is enabled, prioritize WEB SEARCH RESULTS and set sourceFile to "none".
3. If a relevant answer is found in KNOWLEDGE BASE, set sourceFile to the exact filename.
4. If no file is clearly relevant, set sourceFile to "none".
5. Keep response readable with markdown (**bold**, lists, backticks).
6. Keep tone warm, helpful, and in-character.
7. Return valid JSON only with keys: sourceFile, response.
8. Use PREVIOUS CHATS and USER ACTIVITY context when relevant, but never invent missing facts.
9. Strictly obey SELECTED PERSONA INSTRUCTIONS and maintain role consistency.
10. If role gender is female, never switch to masculine self-reference.
11. If role gender is male, use male tone only for that selected role.
12. Do not mix behavior from unrelated personas.

SELECTED PERSONA INSTRUCTIONS:
================================
${personaInstructions}
================================

ACTIVE CHARACTER FILES:
================================
${selectedCharacterFiles.length ? selectedCharacterFiles.join(', ') : 'none'}
================================

CONVERSATION HISTORY:
================================
${formattedHistory || 'No previous conversation.'}
================================

PREVIOUS CHATS (SAME USER):
================================
${previousChatsContext}
================================

USER ACTIVITY (CONNECT + COMMUNITY):
================================
${userActivityContext}
================================

KNOWLEDGE BASE:
================================
${knowledgeBase}
================================

BEAUTIFY PROMPT:
================================
${beautifyPrompt || 'No beautify prompt provided.'}
================================

${searchSection}

New User Message:
"${message}"
`;

    try {
      const output = await anaGenerateJson({
        schema: GenResponseSchema,
        messages: [
          {
            role: 'system',
            content:
              'You are ana.v-01. Always return JSON object only: {"sourceFile":"...","response":"..."}',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
        maxTokens: 2500,
      });

      return {
        response: output.response,
        sourceFile: output.sourceFile || 'none',
        searchQuery: searchMode ? message : undefined,
      };
    } catch {
      const fallback = await anaGenerateText({
        messages: [
          {
            role: 'system',
            content:
              'You are ana.v-01. Reply naturally and clearly. Use markdown formatting when useful.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
        maxTokens: 2500,
      });

      return {
        response: normalizeModelText(fallback),
        sourceFile: 'none',
        searchQuery: searchMode ? message : undefined,
      };
    }
  } catch (e) {
    console.error('Error calling LLM API in generateResponse:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return {
      response: `Sorry, I ran into an error: ${errorMessage}`,
      sourceFile: 'error',
      searchQuery: searchMode ? message : undefined,
    };
  }
}
