const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

const HF_PARAMETERS = {
  max_new_tokens: 200,
  temperature: 0.7,
  return_full_text: false,
};

interface HuggingFaceInferenceItem {
  generated_text?: string;
}

interface HuggingFaceErrorPayload {
  error?: string;
}

const parseGeneratedText = (payload: unknown): string => {
  if (Array.isArray(payload) && payload.length > 0) {
    const firstItem = payload[0] as HuggingFaceInferenceItem;
    return firstItem.generated_text?.trim() || '';
  }

  if (payload && typeof payload === 'object') {
    const singlePayload = payload as HuggingFaceInferenceItem;
    return singlePayload.generated_text?.trim() || '';
  }

  return '';
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
      inputs: prompt,
      parameters: HF_PARAMETERS,
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const hfErrorPayload = payload as HuggingFaceErrorPayload | null;
    const message =
      hfErrorPayload?.error ||
      `Hugging Face request failed with status ${response.status}.`;
    throw new HuggingFaceError(message, response.status);
  }

  const hfErrorPayload = payload as HuggingFaceErrorPayload | null;
  if (hfErrorPayload?.error) {
    throw new HuggingFaceError(hfErrorPayload.error, 400);
  }

  const rawReply = parseGeneratedText(payload);
  const cleanedReply = rawReply.replace(/^assistant\s*:\s*/i, '').trim();

  if (!cleanedReply) {
    throw new HuggingFaceError('Hugging Face returned an empty response.', 400);
  }

  return cleanedReply;
};
