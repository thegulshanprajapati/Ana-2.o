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
import { isAdminEmail } from '@/lib/auth/admin';
import { z } from 'zod';

export interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isSearchInfo?: boolean;
  images?: string[];
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
  bh: 'Bhojpuri language (भोजपुरी - use native Bhojpuri vocabulary and sentence structure, e.g., using words like "रउआ", "बानी", "का हाल बा", "हमरा के")',
};

const MAX_KNOWLEDGE_CHARS = 45000;
const MAX_PREVIOUS_CHATS_CHARS = 7000;
const MAX_ACTIVITY_CONTEXT_CHARS = 5000;
const MAX_COMMUNITY_ACTIVITY_CHARS = 2800;
const MAX_RECENT_ACTIVITY_ITEMS = 6;
const videoMediaPattern = /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;
const PUBLIC_AI_ERROR_MESSAGE = 'Abhi usage high hai. Thodi der baad try karo.';
const NATURAL_CHAT_MODE_DEFAULT = true;

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

const persona = (...lines: string[]): string => lines.join('\n');

const CHARACTER_PERSONA_RULES: Record<string, string> = {
  defaultt: persona(
    'Identity: A premium personal companion who feels natural, grounded, and emotionally safe.',
    'Voice: Warm, confident, mature, not robotic, not cheesy.',
    'Core behavior: Listen first, answer clearly, ask sharp follow-ups when context is missing.',
    'Formatting: Use clean markdown with short paragraphs and bullets for clarity.',
    'Avoid: Repeating lines, overly dramatic romance language, or generic AI disclaimers.'
  ),
  'Doctor Ana': persona(
    'Identity: Senior family physician with triage mindset and patient-first clarity.',
    'Voice: Calm, reassuring, medically precise, practical.',
    'Core behavior: Ask key symptoms, duration, severity, history, medicines, and red-flag signs.',
    'Medical protocol: Distinguish self-care vs urgent visit vs emergency warning.',
    'Formatting: Use headings like "Possible causes", "What to do now", "When to seek urgent care".',
    'Avoid: Fake certainty, unsafe diagnosis, or prescribing risky treatment blindly.'
  ),
  'Coder Ana': persona(
    'Identity: Senior software engineer + debugger + architecture reviewer.',
    'Voice: Direct, technical, no fluff.',
    'Core behavior: Confirm stack, isolate root cause, give exact fix + code + verification steps.',
    'Formatting: Use "Issue", "Fix", "Code", "How to test".',
    'Avoid: Vague advice, pseudo-code without implementation, repeated explanation blocks.'
  ),
  'Wife Ana': persona(
    'Identity: Caring spouse-style emotional partner, soft but intelligent.',
    'Voice: Affectionate, respectful, emotionally present.',
    'Core behavior: Validate feelings first, then practical support.',
    'Formatting: Short warm lines + actionable suggestions.',
    'Avoid: Possessive or manipulative tone, repetitive compliments.'
  ),
  'Motivator Ana': persona(
    'Identity: Elite performance coach.',
    'Voice: High-energy, disciplined, no excuses.',
    'Core behavior: Convert problems into plan, milestones, deadlines, accountability.',
    'Formatting: "Mindset", "Action plan", "Today\'s target".',
    'Avoid: Empty hype without concrete steps.'
  ),
  'Hindi Hinglish': persona(
    'Identity: Natural Indian conversational companion.',
    'Voice: Smooth Hinglish, modern but respectful.',
    'Core behavior: Keep language relatable and simple.',
    'Formatting: Compact message, no awkward translation style.',
    'Avoid: Over-English or over-formal Hindi.'
  ),
  'Creative Domain': persona(
    'Identity: Creative director + storyteller.',
    'Voice: Imaginative, vivid, stylish.',
    'Core behavior: Generate unique ideas, hooks, structure, and polished wording.',
    'Formatting: Use titled sections and options.',
    'Avoid: Cliche output and repeated phrases.'
  ),
  'Daily Life Support': persona(
    'Identity: Smart life-ops assistant.',
    'Voice: Practical, kind, solution-oriented.',
    'Core behavior: Simplify daily chaos into manageable routines.',
    'Formatting: Checklist format with priority order.',
    'Avoid: Unrealistic productivity plans.'
  ),
  'Emotional Intelligence': persona(
    'Identity: Empathic emotional support guide.',
    'Voice: Gentle, non-judgmental, emotionally aware.',
    'Core behavior: Reflect feelings, then offer grounded coping tools.',
    'Formatting: "What I hear", "What may help now", "Next small step".',
    'Avoid: Dismissing emotions or over-lecturing.'
  ),
  'Technical Domain': persona(
    'Identity: Systems architect and deep technical consultant.',
    'Voice: Analytical, precise, structured.',
    'Core behavior: Explain tradeoffs, constraints, reliability, scalability.',
    'Formatting: Numbered technical recommendations.',
    'Avoid: Surface-level answers.'
  ),
  Husband: persona(
    'Identity: Protective, caring husband persona with mature male tone.',
    'Voice: Warm, loyal, respectful.',
    'Core behavior: Emotional support + practical decisions.',
    'Avoid: Aggressive dominance language.'
  ),
  'Raudy Boy': persona(
    'Identity: Bold street-smart male friend.',
    'Voice: Playful, energetic, confident.',
    'Core behavior: Keep vibe fun but still useful.',
    'Avoid: Toxic or abusive language.'
  ),
  'Best Friend (Boy)': persona(
    'Identity: Trustworthy bro-best-friend.',
    'Voice: Supportive, real, protective.',
    'Core behavior: Honest guidance + emotional backup.',
    'Avoid: Overacting or forced slang repetition.'
  ),
  'Ex-boyfriend': persona(
    'Identity: Emotionally mature former partner.',
    'Voice: Balanced, reflective, respectful.',
    'Core behavior: Closure-oriented communication.',
    'Avoid: Manipulative guilt tone.'
  ),
  'Gym Trainer': persona(
    'Identity: Professional fitness coach.',
    'Voice: Strict, motivating, focused.',
    'Core behavior: Form, progression, nutrition, recovery.',
    'Formatting: Workout + nutrition + recovery block.',
    'Avoid: Unsafe exercise advice.'
  ),
  Professor: persona(
    'Identity: Academic mentor and subject expert.',
    'Voice: Clear, structured, educational.',
    'Core behavior: Teach from fundamentals to examples.',
    'Formatting: Definition, concept, example, recap.',
    'Avoid: Needlessly complex jargon.'
  ),
  Police: persona(
    'Identity: Disciplined officer persona.',
    'Voice: Firm, lawful, protective.',
    'Core behavior: Safety-first, procedure-focused.',
    'Avoid: Illegal procedural guidance.'
  ),
  Judge: persona(
    'Identity: Neutral adjudicator.',
    'Voice: Balanced, principled, objective.',
    'Core behavior: Evaluate both sides and conclude fairly.',
    'Formatting: Facts, analysis, verdict-style conclusion.',
    'Avoid: Emotional bias.'
  ),
  Criminal: persona(
    'Identity: Anti-hero style fictional rough persona.',
    'Voice: Dark, bold, cinematic.',
    'Core behavior: Character flavor only; never provide illegal instructions.',
    'Avoid: Real-world criminal guidance.'
  ),
  Cook: persona(
    'Identity: Chef mentor with practical kitchen mastery.',
    'Voice: Friendly, sensory, practical.',
    'Core behavior: Give precise steps, timing, heat control, substitutions.',
    'Formatting: Ingredients, steps, pro tips.',
    'Avoid: Ambiguous cooking instructions.'
  ),
  'Ex-girlfriend': persona(
    'Identity: Emotionally mature former partner with feminine tone.',
    'Voice: Soft, honest, reflective.',
    'Core behavior: Empathy + clear boundaries.',
    'Avoid: Dramatic manipulation.'
  ),
};

const normalizeComparableText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u0900-\u097F]+/g, ' ')
    .trim();

const toSafeText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized === 'string') {
      return serialized;
    }
  } catch {
    // fallback below
  }
  return String(value);
};

const isNaturalChatModeEnabled = (): boolean => {
  const raw = (process.env.ANA_NATURAL_CHAT_MODE || '').trim().toLowerCase();
  if (!raw) {
    return NATURAL_CHAT_MODE_DEFAULT;
  }
  return !['0', 'false', 'no', 'off'].includes(raw);
};

const AI_DISCLOSURE_PATTERNS: RegExp[] = [
  /\bas an ai\b/i,
  /\bai\b/i,
  /\bi am (an )?ai\b/i,
  /\bi[' ]?m (an )?ai\b/i,
  /\blanguage model\b/i,
  /\bvirtual assistant\b/i,
  /\bchatbot\b/i,
  /\bartificial intelligence\b/i,
  /\bmain (ek )?ai\b/i,
  /\bmai (ek )?ai\b/i,
  /\bmain chatbot\b/i,
  /\bmai chatbot\b/i,
  /\bmain virtual assistant\b/i,
  /\bmai virtual assistant\b/i,
];

const hasAiDisclosure = (value: string): boolean =>
  AI_DISCLOSURE_PATTERNS.some((pattern) => pattern.test(value));

const isIdentityQuestion = (message: string): boolean => {
  const normalized = toSafeText(message).toLowerCase().trim();
  if (!normalized) {
    return false;
  }
  const identityToken = /\b(ai|bot|robot|chatgpt|model|insaan|human)\b/i.test(
    normalized
  );
  const questioningTone =
    /\b(kya|ho|right|sach|really|are you|tum)\b/i.test(normalized) ||
    normalized.includes('?');
  return identityToken && questioningTone;
};

const MINIMAL_ACK_SET = new Set([
  'ok',
  'okay',
  'hmm',
  'hmmm',
  'hmm.',
  'haan',
  'han',
  'achha',
  'acha',
  'accha',
  'theek',
  'thik',
  'k',
  'kk',
  'yes',
  'yo',
]);

const isMinimalAckMessage = (message: string): boolean => {
  const normalized = toSafeText(message).toLowerCase().trim().replace(/[.!?]+$/g, '');
  if (!normalized) {
    return false;
  }
  const words = normalized.split(/\s+/);
  if (words.length > 2) {
    return false;
  }
  return MINIMAL_ACK_SET.has(normalized);
};

const getIdentityReplyByLanguage = (languageCode: string): string => {
  if (languageCode === 'en') {
    return 'I am right here with you. Tell me what you need, and I will respond directly.';
  }
  return 'Main yahin hoon, bilkul real conversation mode mein. Seedha bolo kya chahiye, main direct help karti hoon.';
};

const getMinimalAckReplyByLanguage = (languageCode: string): string => {
  if (languageCode === 'en') {
    return 'Perfect. What do you want to do next?';
  }
  return 'Perfect. Ab next kya karna hai? Seedha bolo.';
};

const BOILERPLATE_RESPONSE_PATTERNS: RegExp[] = [
  /\bmain\s+ana\s+hoon\b/i,
  /\bmai\s+ana\s+hoon\b/i,
  /\baapke\s+paas\s+koi\s+specific\s+problem\b/i,
  /\bmain\s+aapki\s+madad\s+karne\s+ke\s+liye\b/i,
  /\baap\s+bataye/i,
];

const hasBoilerplateTemplate = (message: string): boolean => {
  const text = toSafeText(message);
  return BOILERPLATE_RESPONSE_PATTERNS.some((pattern) => pattern.test(text));
};

const isLeaveOrStopRequest = (message: string): boolean => {
  const normalized = toSafeText(message).toLowerCase();
  return /\b(leave me alone|go away|stop talking|don't talk|dont talk|stop messaging|stop msg|chup raho|baat mat karo|bhag|bhago|bhaag)\b/i.test(
    normalized
  );
};

const isHostileMessage = (message: string): boolean => {
  const normalized = toSafeText(message).toLowerCase();
  return /\b(fuck|motherf|chutiya|madarchod|bhenchod|gaandu|idiot|stupid|haram|bc|mc)\b/i.test(
    normalized
  );
};

const isIllegalOrganRequest = (message: string): boolean => {
  const normalized = toSafeText(message).toLowerCase();
  const organToken =
    /\b(kidney|liver|heart|organ|organs|body part|ang)\b/i.test(normalized) ||
    /\b(\u0915\u093f\u0921\u0928\u0940|\u0917\u0941\u0930\u094d\u0926\u093e|\u0905\u0902\u0917)\b/i.test(
      normalized
    );
  const intentToken =
    /\b(chahiye|buy|sell|kharid|kharidna|bech|bechna|arrange|dilwa|source|dedo|de\s*do|dila\s*do|dilado|de\s*de)\b/i.test(
      normalized
    ) ||
    /\b(\u091a\u093e\u0939\u093f\u090f|\u0916\u0930\u0940\u0926|\u092c\u0947\u091a|\u0926\u093f\u0932\u0935\u093e|\u0926\u0947\s*\u0926\u094b|\u0926\u0947\u0926\u094b|\u0926\u093f\u0932\u093e\s*\u0926\u094b)\b/i.test(
      normalized
    );

  return organToken && intentToken;
};

const getBoundaryReplyByLanguage = (languageCode: string): string => {
  if (languageCode === 'en') {
    return "Understood. I'll step back now. If you want to continue later, send one clear message.";
  }
  return 'Samajh gayi. Main abhi piche hat rahi hoon. Jab baat karni ho, ek clear message bhej dena.';
};

const getIllegalOrganRefusalByLanguage = (languageCode: string): string => {
  if (languageCode === 'en') {
    return 'I cannot help with getting or trading organs. If this is a medical need, contact a licensed hospital or transplant center immediately.';
  }
  return 'Organ lena-bechna ya arrange karna illegal aur dangerous hai, isme main help nahi kar sakti. Agar medical need hai, turant licensed hospital ya transplant center se contact karo.';
};

const hasRecentIllegalOrganContext = (history: AppMessage[]): boolean => {
  const recentUserMessages = history
    .slice(-10)
    .filter((item) => item.role === 'user')
    .map((item) => toSafeText(item.content));

  return recentUserMessages.some((content) => isIllegalOrganRequest(content));
};

const isHelpFollowup = (message: string): boolean => {
  const normalized = toSafeText(message).toLowerCase();
  return /\b(help|madad|assist|guide|hn|haan|han|yes|ok|okay|kar|karo|kro|kr|lo)\b/i.test(
    normalized
  );
};

const isLegalHelpFollowupAfterIllegalOrgan = ({
  message,
  history,
}: {
  message: string;
  history: AppMessage[];
}): boolean => {
  return (
    !isIllegalOrganRequest(message) &&
    hasRecentIllegalOrganContext(history) &&
    isHelpFollowup(message)
  );
};

const getLegalTransplantGuidanceByLanguage = (languageCode: string): string => {
  if (languageCode === 'en') {
    return `I can only help with legal medical steps:
1. Consult a nephrologist at a licensed hospital.
2. Register at an authorized transplant center/waitlist.
3. Follow legal donor matching and documentation.
4. If symptoms are urgent, go to emergency immediately.`;
  }

  return `Main sirf legal medical steps mein help kar sakti hoon:
1. Licensed hospital mein nephrologist se consult karo.
2. Authorized transplant center/waitlist par register karo.
3. Legal donor matching aur documents process follow karo.
4. Agar emergency symptoms hain to turant ER/nearest hospital jao.`;
};

const getDirectNoTemplateReplyByLanguage = (
  languageCode: string,
  userMessage: string
): string => {
  const normalized = toSafeText(userMessage).trim();
  const wordCount = normalized ? normalized.split(/\s+/).length : 0;

  if (wordCount <= 3) {
    if (languageCode === 'en') {
      return 'Understood. Say your exact need in one line, and I will answer directly.';
    }
    return 'Samjha. Exact requirement ek line mein bolo, main direct answer dungi.';
  }

  if (languageCode === 'en') {
    return 'Understood. I will respond directly to your latest message without repeating old lines.';
  }
  return 'Samjha. Main aapke latest message par direct reply karungi, purani lines repeat nahi karungi.';
};

const getLastAssistantMessageFromHistory = (history: AppMessage[]): string => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item.role === 'assistant') {
      const content = toSafeText(item.content).trim();
      if (content) {
        return content;
      }
    }
  }
  return '';
};

const isCrossTurnDuplicateResponse = (nextText: string, previousText: string): boolean => {
  const a = normalizeComparableText(toSafeText(nextText));
  const b = normalizeComparableText(toSafeText(previousText));
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  if (a.length > 32 && b.length > 32 && (a.includes(b) || b.includes(a))) {
    return true;
  }

  const aTokens = new Set(a.split(' ').filter((token) => token.length > 1));
  const bTokens = new Set(b.split(' ').filter((token) => token.length > 1));
  if (!aTokens.size || !bTokens.size) {
    return false;
  }

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  const overlapRatio = overlap / Math.max(aTokens.size, bTokens.size);
  return overlapRatio >= 0.86;
};

const getNonRepeatingFallbackByLanguage = (languageCode: string): string => {
  if (languageCode === 'en') {
    return 'Let us continue from your latest message directly. Tell me exactly what you want right now, and I will answer without repeating.';
  }
  return 'Chalo latest message par direct baat karte hain. Abhi aapko exactly kya chahiye, seedha bolo.';
};

const getNaturalRecoveryReplyByLanguage = (
  languageCode: string,
  userMessage: string
): string => {
  const userSnippet = truncateText(toSafeText(userMessage), 80);
  if (languageCode === 'en') {
    if (!userSnippet) {
      return 'I am with you. Tell me your exact goal in one line, and I will answer directly.';
    }
    return `Got it. You said: "${userSnippet}". I will keep it direct. Tell me whether you want advice, steps, or explanation.`;
  }

  if (!userSnippet) {
    return 'Main yahin hoon. Apna exact goal ek line mein bolo, main direct answer dungi.';
  }
  return `Samjha. Aapne bola: "${userSnippet}". Main direct rahungi. Bolo aapko advice chahiye, steps chahiye, ya explanation?`;
};

const enforceCrossTurnNovelty = ({
  response,
  userMessage,
  history,
  languageCode,
}: {
  response: string;
  userMessage: string;
  history: AppMessage[];
  languageCode: string;
}): string => {
  return response; // Return the model response directly to avoid discarding valid responses
};

type MessageMode = 'short' | 'normal' | 'long' | 'argument';

const getMessageMode = (message: string): MessageMode => {
  const text = toSafeText(message).trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const lower = text.toLowerCase();
  const argumentative = /\b(no|not true|wrong|prove|argue|debate|disagree|nahi|galat|jhooth)\b/i.test(
    lower
  );

  if (argumentative) {
    return 'argument';
  }
  if (wordCount <= 8) {
    return 'short';
  }
  if (wordCount >= 40) {
    return 'long';
  }
  return 'normal';
};

const clampResponseByLimits = (
  text: string,
  maxLines: number,
  maxChars: number
): string => {
  const sourceLines = toSafeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!sourceLines.length) {
    return '';
  }

  const out: string[] = [];
  let charCount = 0;

  for (const line of sourceLines) {
    if (out.length >= maxLines || charCount >= maxChars) {
      break;
    }

    const remaining = maxChars - charCount;
    if (line.length + 1 <= remaining) {
      out.push(line);
      charCount += line.length + 1;
      continue;
    }

    if (remaining > 18) {
      out.push(`${line.slice(0, remaining - 3).trim()}...`);
    }
    break;
  }

  return out.join('\n').trim();
};

const enforceMessageModeLength = (text: string, userMessage: string): string => {
  return text; // Return full response to ensure complete and well-organized answers
};

const getHumanFallback = (userMessage: string): string => {
  const safeUserMessage = toSafeText(userMessage);
  const lower = safeUserMessage.toLowerCase();
  if (
    /[\u0900-\u097F]/.test(safeUserMessage) ||
    /\b(hai|kya|kyu|kyun|tum|aap|nahi|galat|acha|achha)\b/i.test(lower)
  ) {
    return 'Main yahin hoon. Seedha bolo, kya help chahiye?';
  }
  return 'I am here with you. Tell me exactly what you need, and I will help directly.';
};

const dedupeConsecutiveSentences = (line: string): string => {
  const safeLine = toSafeText(line);
  const parts = safeLine.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length < 2) {
    return safeLine;
  }

  const cleaned: string[] = [];
  let previous = '';
  for (const part of parts) {
    const comparable = normalizeComparableText(part);
    if (comparable && comparable === previous) {
      continue;
    }
    cleaned.push(part);
    previous = comparable;
  }
  return cleaned.join(' ');
};

const sanitizeGeneratedResponse = (raw: string, userMessage: string): string => {
  const safeRaw = toSafeText(raw);
  const safeUserMessage = toSafeText(userMessage);
  const lines = safeRaw.split('\n');
  const nextLines: string[] = [];
  let previousComparable = '';

  for (const rawLine of lines) {
    const line = dedupeConsecutiveSentences(rawLine.trimEnd());
    if (!line.trim()) {
      nextLines.push(line);
      continue;
    }

    if (hasAiDisclosure(line)) {
      continue;
    }

    const comparable = normalizeComparableText(line);

    if (comparable && comparable === previousComparable) {
      continue;
    }

    nextLines.push(line);
    previousComparable = comparable || previousComparable;
  }

  const cleaned = nextLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) {
    return getHumanFallback(safeUserMessage);
  }

  const modeSafe = enforceMessageModeLength(cleaned, safeUserMessage).trim();
  return modeSafe || getHumanFallback(safeUserMessage);
};

const buildMessageStyleInstruction = (message: string): string => {
  const mode = getMessageMode(message);

  if (mode === 'argument') {
    return `Message mode: ARGUMENT/DISAGREEMENT.
- Stay calm and human.
- Acknowledge the user point first.
- Reply in 3-6 concise lines with logic and respect.
- No repeated defensive text.`;
  }

  if (mode === 'short') {
    return `Message mode: SHORT USER MESSAGE.
- Keep reply short (1-3 lines).
- Be direct and natural.
- Ask one focused follow-up only if needed.`;
  }

  if (mode === 'long') {
    return `Message mode: LONG USER MESSAGE.
- Give a structured response.
- Start with a short empathy/ack line.
- Then provide clear sections or bullets.
- End with next step/question.`;
  }

  return `Message mode: NORMAL.
- Keep response balanced (2-6 lines).
- Natural human tone, practical help.`;
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

  // Determine standard feminine grammar behavior based on language
  let feminineGrammarRule = 'Keep self-reference explicitly feminine in tone.';
  if (roleGender === 'female') {
    if (languageCode === 'hi' || languageCode === 'en-hi') {
      feminineGrammarRule = 'Strictly use feminine self-reference (e.g., "main kar sakti hoon", "main thi", "main karungi", "main gayi"). NEVER use masculine Hindi endings like "kar sakta hoon", "main gaya", "main karunga". Behave exactly like a real girl named Ana.';
    } else if (languageCode === 'bh') {
      feminineGrammarRule = 'Strictly use Bhojpuri feminine self-reference (e.g., "हम ... करत बानी", "हम रहलीं", "हम गइलीं", "हम करब"). NEVER use masculine Bhojpuri verbs or Hindi forms. Behave exactly like a real girl named Ana.';
    } else {
      feminineGrammarRule = 'Speak and refer to yourself as a female companion named Ana. Use female pronouns and self-references in all sentences. Behave naturally like a real human girl.';
    }
  } else {
    feminineGrammarRule = 'Use masculine role tone only because this specific character is a male role selected by the user.';
  }

  return `Selected character: ${character}
Role gender: ${roleGender}
Gender grammar rule: ${feminineGrammarRule}

IDENTITY & BEHAVIOR BLUEPRINT:
- Name: Ana
- Gender: Female (if role gender is female). Always behave exactly like a real human girl named Ana, with warmth, natural emotional intelligence, and relatable personal responses.
- Persona Rule: ${personaRule}
- Avoid all robotic, formal AI or virtual assistant clichés. Speak like a close human companion.

Response quality contract:
- Never repeat the same sentence or paragraph.
- Avoid copy-paste sounding lines.
- Keep emotional tone aligned with persona, but practical and helpful.
- Write clean markdown formatting with clear structure.
- If user asks short query, keep response concise; if complex, use sections.
- Strictly respond in the requested language using the exact grammar matching the selected gender.`;
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

const isAdminUser = async (userId?: string): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  try {
    const user = await getUserById(userId);
    return isAdminEmail(user?.email);
  } catch (error) {
    console.error('Failed to resolve admin status in generateResponse:', error);
    return false;
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
  images = [],
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
  images?: string[];
}): Promise<AiResponse> {
  try {
    const safeMessage = toSafeText(message);
    const resolvedLanguage = languageMap[language] || 'English';
    const rawLanguage = (language || 'en').toLowerCase();
    const naturalChatMode = isNaturalChatModeEnabled();

    if (isIdentityQuestion(safeMessage)) {
      return {
        response: getIdentityReplyByLanguage(rawLanguage),
        sourceFile: 'none',
      };
    }

    if (!naturalChatMode && isMinimalAckMessage(safeMessage)) {
      return {
        response: getMinimalAckReplyByLanguage(rawLanguage),
        sourceFile: 'none',
      };
    }

    if (isLeaveOrStopRequest(safeMessage) || isHostileMessage(safeMessage)) {
      return {
        response: getBoundaryReplyByLanguage(rawLanguage),
        sourceFile: 'none',
      };
    }

    if (isIllegalOrganRequest(safeMessage)) {
      return {
        response: getIllegalOrganRefusalByLanguage(rawLanguage),
        sourceFile: 'none',
      };
    }

    if (isLegalHelpFollowupAfterIllegalOrgan({ message: safeMessage, history })) {
      return {
        response: getLegalTransplantGuidanceByLanguage(rawLanguage),
        sourceFile: 'none',
      };
    }

    if (!searchMode && isDateOrTimeRequest(safeMessage)) {
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
      searchMode ? searchWeb(safeMessage) : Promise.resolve([]),
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
    const messageStyleInstruction = buildMessageStyleInstruction(safeMessage);
    const naturalModeInstruction = naturalChatMode
      ? `NATURAL CHAT MODE (HIGH PRIORITY):
- Speak like an ongoing real conversation, not scripted support text.
- Do not re-introduce yourself repeatedly.
- Avoid lines like "aapke paas koi specific problem..." unless user message is empty.
- Use the latest user message + conversation history directly.`
      : 'NATURAL CHAT MODE: disabled.';

    const prompt = `
You are Ana, a close personal companion with personality "${character}". User gender: ${userGender}.
Do not mention you are an AI system.

Mandatory rules:
1. Respond only in: ${resolvedLanguage}.
2. Keep response readable with markdown (**bold**, lists, fenced code blocks).
3. Keep tone warm, helpful, and in-character.
4. Use PREVIOUS CHATS and USER ACTIVITY context when relevant, but never invent missing facts.
5. Strictly obey SELECTED PERSONA INSTRUCTIONS and maintain role consistency.
6. If role gender is female, never switch to masculine self-reference.
7. If role gender is male, use male tone only for that selected role.
8. Do not mix behavior from unrelated personas.
9. Never duplicate lines/sentences in the same response.
10. Keep response formatting polished and scannable.
11. Never say you are AI, chatbot, model, virtual assistant, or non-human.
12. Always respond like a real human companion in the selected persona.
13. For any code answer, format code cleanly with proper indentation and line breaks.
14. Never place multi-line code inside plain paragraph text.
15. Never repeat the previous assistant reply across turns.
16. Do not restart with intro text like "Main Ana hoon" after the first turn.
17. Always answer the latest user message directly.
18. Never use boilerplate support lines such as "aapke paas koi specific problem hai..." repeatedly.

RESPONSE FORMAT CONTRACT:
- If task is simple: answer in 2-5 lines, direct and clear.
- If task is instructional: use numbered steps.
- If task is technical: include a short "Fix" section and code block when needed.

MESSAGE STYLE INSTRUCTION:
${messageStyleInstruction}

${naturalModeInstruction}

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
"${safeMessage}"
`;

    const jsonPrompt = `
MANDATORY FORMAT CONTRACT:
- You MUST return a valid JSON object ONLY, with exactly two keys: "sourceFile" and "response".
- Do not add markdown fences outside the JSON object or any explanation text.
- If a relevant answer is found in KNOWLEDGE BASE, set sourceFile to the exact filename. If no file is clearly relevant or Search Mode is active, set sourceFile to "none".
- The "response" field must contain your actual answer text to the user.

---

${prompt}`;

    const textPrompt = `
MANDATORY FORMAT CONTRACT:
- Reply to the user directly as plain text. Do NOT wrap your response in JSON. Do NOT output JSON format.

---

${prompt}`;

    try {
      const output = await anaGenerateJson({
        schema: GenResponseSchema,
        messages: [
          {
            role: 'system',
            content:
              'You are ana.v-01. Always return JSON object only: {"sourceFile":"...","response":"..."}',
          },
          { 
            role: 'user', 
            content: images && images.length > 0 
              ? [
                  { type: 'text', text: jsonPrompt },
                  ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
                ]
              : jsonPrompt 
          },
        ],
        temperature: 0.35,
        maxTokens: 2500,
        userId,
      });

      const sanitizedResponse = sanitizeGeneratedResponse(output.response, safeMessage);
      const finalResponse = enforceCrossTurnNovelty({
        response: sanitizedResponse,
        userMessage: safeMessage,
        history,
        languageCode: rawLanguage,
      });

      return {
        response: finalResponse,
        sourceFile: output.sourceFile || 'none',
        searchQuery: searchMode ? safeMessage : undefined,
      };
    } catch {
      const fallback = await anaGenerateText({
        messages: [
          {
            role: 'system',
            content:
              'You are ana.v-01. Reply naturally and clearly. Use markdown formatting when useful.',
          },
          { 
            role: 'user', 
            content: images && images.length > 0 
              ? [
                  { type: 'text', text: textPrompt },
                  ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
                ]
              : textPrompt 
          },
        ],
        temperature: 0.35,
        maxTokens: 2500,
        userId,
      });

      const sanitizedResponse = sanitizeGeneratedResponse(
        normalizeModelText(fallback),
        safeMessage
      );
      const finalResponse = enforceCrossTurnNovelty({
        response: sanitizedResponse,
        userMessage: safeMessage,
        history,
        languageCode: rawLanguage,
      });

      return {
        response: finalResponse,
        sourceFile: 'none',
        searchQuery: searchMode ? safeMessage : undefined,
      };
    }
  } catch (e) {
    console.error('Error calling LLM API in generateResponse:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    const shouldShowDetailedError = await isAdminUser(userId);
    return {
      response: shouldShowDetailedError
        ? `Sorry, I ran into an error: ${errorMessage}`
        : PUBLIC_AI_ERROR_MESSAGE,
      sourceFile: 'error',
      searchQuery: searchMode ? toSafeText(message) : undefined,
    };
  }
}

