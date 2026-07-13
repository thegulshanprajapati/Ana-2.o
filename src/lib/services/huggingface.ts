const HF_MODEL =
  process.env.HF_MODEL?.trim() || 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

const HF_PARAMETERS = {
  max_tokens: 200,
  temperature: 0.7,
};

interface HuggingFaceErrorObject {
  message?: string;
}

interface HuggingFaceChoiceMessage {
  content?: string | null;
}

interface HuggingFaceChoice {
  message?: HuggingFaceChoiceMessage;
  text?: string;
}

interface HuggingFaceResponsePayload {
  choices?: HuggingFaceChoice[];
  error?: string | HuggingFaceErrorObject;
  message?: string;
}

const parseGeneratedText = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const responsePayload = payload as HuggingFaceResponsePayload;
  if (!Array.isArray(responsePayload.choices) || responsePayload.choices.length === 0) {
    return '';
  }

  const firstChoice = responsePayload.choices[0];
  if (typeof firstChoice?.message?.content === 'string') {
    return firstChoice.message.content.trim();
  }

  if (typeof firstChoice?.text === 'string') {
    return firstChoice.text.trim();
  }

  return '';
};

const parseErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const responsePayload = payload as HuggingFaceResponsePayload;
  if (typeof responsePayload.error === 'string' && responsePayload.error.trim()) {
    return responsePayload.error.trim();
  }

  if (responsePayload.error && typeof responsePayload.error === 'object') {
    const nestedMessage = responsePayload.error.message;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage.trim();
    }
  }

  if (typeof responsePayload.message === 'string' && responsePayload.message.trim()) {
    return responsePayload.message.trim();
  }

  return null;
};

export class HuggingFaceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'HuggingFaceError';
    this.statusCode = statusCode;
  }
}

export const generateHuggingFaceReply = async (prompt: string): Promise<string> => {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) {
    throw new Error('HF_TOKEN environment variable is missing.');
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [{ role: 'user', content: prompt }],
      ...HF_PARAMETERS,
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      parseErrorMessage(payload) ||
      `Hugging Face request failed with status ${response.status}.`;
    throw new HuggingFaceError(message, response.status);
  }

  const responseError = parseErrorMessage(payload);
  if (responseError) {
    throw new HuggingFaceError(responseError, 400);
  }

  const rawReply = parseGeneratedText(payload);
  const cleanedReply = rawReply.replace(/^assistant\s*:\s*/i, '').trim();

  if (!cleanedReply) {
    throw new HuggingFaceError('Hugging Face returned an empty response.', 400);
  }

  return cleanedReply;
};
