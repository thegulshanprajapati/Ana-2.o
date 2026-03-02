import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { buildPrompt, type PromptMessage } from '@/lib/chat/build-prompt';
import { isRateLimited } from '@/lib/chat/rate-limit';
import { getMongoDb } from '@/lib/mongodb';
import {
  generateHuggingFaceReply,
  HuggingFaceError,
} from '@/lib/services/huggingface';

interface ChatRequestBody {
  userId?: string;
  message?: string;
}

interface ChatMessageDocument {
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const MESSAGES_COLLECTION = 'messages';
const MAX_HISTORY_MESSAGES = 10;
const MAX_PROMPT_TOKENS = 1800;
const TOKEN_CHAR_RATIO = 4;
const MAX_CURRENT_MESSAGE_CHARS = 2500;

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const estimateTokenCount = (value: string): number =>
  Math.ceil(value.length / TOKEN_CHAR_RATIO);

const applyTokenLengthSafeguard = (
  historyMessages: PromptMessage[],
  currentMessage: string
): { prompt: string; usedHistoryCount: number } => {
  let safeCurrentMessage = currentMessage.slice(0, MAX_CURRENT_MESSAGE_CHARS);
  let scopedHistory = [...historyMessages];
  let prompt = buildPrompt(scopedHistory, safeCurrentMessage);

  // Drop oldest history first until prompt stays inside the token budget.
  while (scopedHistory.length > 0 && estimateTokenCount(prompt) > MAX_PROMPT_TOKENS) {
    scopedHistory = scopedHistory.slice(1);
    prompt = buildPrompt(scopedHistory, safeCurrentMessage);
  }

  // If still too long, fall back to current message only.
  if (estimateTokenCount(prompt) > MAX_PROMPT_TOKENS) {
    const maxCharsForCurrent = Math.max(
      200,
      MAX_PROMPT_TOKENS * TOKEN_CHAR_RATIO - 600
    );
    safeCurrentMessage = safeCurrentMessage.slice(0, maxCharsForCurrent);
    prompt = buildPrompt([], safeCurrentMessage);
    scopedHistory = [];
  }

  return {
    prompt,
    usedHistoryCount: scopedHistory.length,
  };
};

export const handleChatPost = async (
  request: NextRequest
): Promise<NextResponse> => {
  const startedAt = Date.now();

  try {
    // 1) Parse body and validate required fields.
    let payload: ChatRequestBody;
    try {
      payload = (await request.json()) as ChatRequestBody;
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const userId = normalizeText(payload.userId);
    const currentMessage = normalizeText(payload.message);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    if (!currentMessage) {
      return NextResponse.json(
        { error: 'message cannot be empty.' },
        { status: 400 }
      );
    }

    // 2) Apply basic per-user rate limiting.
    if (isRateLimited(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please retry shortly.' },
        { status: 429 }
      );
    }

    const db = await getMongoDb();
    const messagesCollection = db.collection<ChatMessageDocument>(MESSAGES_COLLECTION);

    // 3) Save the incoming user message.
    const userInsertResult = await messagesCollection.insertOne({
      userId,
      role: 'user',
      content: currentMessage,
      createdAt: new Date(),
    });

    // 4) Fetch last 10 messages and order ascending for prompt context.
    const recentMessages = await messagesCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY_MESSAGES)
      .toArray();

    const ascendingMessages = recentMessages.reverse();
    const previousMessages: PromptMessage[] = ascendingMessages
      .filter(
        (messageDoc) =>
          String(messageDoc._id) !== String(userInsertResult.insertedId)
      )
      .map((messageDoc) => ({
        role: messageDoc.role,
        content: normalizeText(messageDoc.content),
      }))
      .filter((messageDoc) => Boolean(messageDoc.content));

    // 5) Build prompt with token-length safeguards.
    const { prompt, usedHistoryCount } = applyTokenLengthSafeguard(
      previousMessages,
      currentMessage
    );

    // 6) Call Hugging Face Inference API.
    const aiReply = (await generateHuggingFaceReply(prompt)).trim();

    // 7) Save assistant response back to MongoDB.
    await messagesCollection.insertOne({
      userId,
      role: 'assistant',
      content: aiReply,
      createdAt: new Date(),
    });

    // 8) Log generation metadata for operational visibility.
    console.info('[api/chat] response_generated', {
      userId,
      durationMs: Date.now() - startedAt,
      historyMessages: usedHistoryCount,
      promptTokensApprox: estimateTokenCount(prompt),
      replyChars: aiReply.length,
    });

    // 9) Return assistant reply to the client.
    return NextResponse.json({ reply: aiReply }, { status: 200 });
  } catch (error) {
    if (error instanceof HuggingFaceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[api/chat] internal_error', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
};
