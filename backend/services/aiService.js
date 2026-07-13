const MODEL_ID = 'Qwen/Qwen2.5-VL-7B-Instruct';
const MODEL_ENDPOINT =
  process.env.HF_MODEL_ENDPOINT?.trim() ||
  `https://api-inference.huggingface.co/models/${MODEL_ID}`;
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.HF_REQUEST_TIMEOUT_MS || '45000', 10);

const DEFAULT_GENERATION_PARAMETERS = {
  max_new_tokens: 1024,
  temperature: 0.3,
  top_p: 0.9,
  return_full_text: false,
};

class AIServiceError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const extractTextFromContent = (content) => {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part.trim();
      }

      if (isObject(part) && typeof part.text === 'string') {
        return part.text.trim();
      }

      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();
};

const parseErrorMessage = (payload) => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    const nestedMessage = payload
      .map((item) => parseErrorMessage(item))
      .find(Boolean);

    return nestedMessage || null;
  }

  if (!isObject(payload)) {
    return null;
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  if (isObject(payload.error) && typeof payload.error.message === 'string') {
    return payload.error.message.trim();
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  return null;
};

const extractGeneratedText = (payload) => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedText = extractGeneratedText(item);
      if (nestedText) {
        return nestedText;
      }
    }

    return '';
  }

  if (!isObject(payload)) {
    return '';
  }

  if (typeof payload.generated_text === 'string') {
    return payload.generated_text.trim();
  }

  if (Array.isArray(payload.choices) && payload.choices.length > 0) {
    const firstChoice = payload.choices[0];

    if (typeof firstChoice?.text === 'string') {
      return firstChoice.text.trim();
    }

    const messageText = extractTextFromContent(firstChoice?.message?.content);
    if (messageText) {
      return messageText;
    }
  }

  if (isObject(payload.message)) {
    const messageText = extractTextFromContent(payload.message.content);
    if (messageText) {
      return messageText;
    }
  }

  return '';
};

const getApiKey = () => normalizeText(process.env.HF_API_KEY || process.env.HF_TOKEN);

const buildMessagesPayload = ({ prompt, imageUrl }) => ({
  messages: [
    {
      role: 'user',
      content: imageUrl
        ? [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ]
        : [
            {
              type: 'text',
              text: prompt,
            },
          ],
    },
  ],
  parameters: DEFAULT_GENERATION_PARAMETERS,
  options: {
    use_cache: false,
    wait_for_model: true,
  },
});

const buildTextFallbackPayload = (prompt) => ({
  inputs: prompt,
  parameters: DEFAULT_GENERATION_PARAMETERS,
  options: {
    use_cache: false,
    wait_for_model: true,
  },
});

const shouldRetryWithTextPayload = ({ error, hasImage }) => {
  if (hasImage || !(error instanceof AIServiceError)) {
    return false;
  }

  if (![400, 422].includes(error.statusCode)) {
    return false;
  }

  const details = parseErrorMessage(error.details) || error.message;

  return /messages|content|chat/i.test(details);
};

const callHuggingFace = async (payload) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new AIServiceError(
      'Hugging Face API key is missing. Set HF_API_KEY in your .env file.',
      500
    );
  }

  let response;
  try {
    response = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new AIServiceError('Hugging Face request timed out.', 504);
    }

    throw new AIServiceError('Failed to reach Hugging Face.', 502, error);
  }

  const responsePayload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AIServiceError(
      parseErrorMessage(responsePayload) ||
        `Hugging Face request failed with status ${response.status}.`,
      response.status,
      responsePayload
    );
  }

  const payloadError = parseErrorMessage(responsePayload);
  if (payloadError) {
    throw new AIServiceError(payloadError, 502, responsePayload);
  }

  const generatedText = extractGeneratedText(responsePayload)
    .replace(/^assistant\s*:\s*/i, '')
    .trim();

  if (!generatedText) {
    throw new AIServiceError('Hugging Face returned an empty response.', 502, responsePayload);
  }

  return generatedText;
};

const generateChatReply = async ({ prompt, imageUrl }) => {
  try {
    return await callHuggingFace(
      buildMessagesPayload({
        prompt,
        imageUrl,
      })
    );
  } catch (error) {
    // Some HF model endpoints still expect legacy text-generation payloads for text-only prompts.
    if (shouldRetryWithTextPayload({ error, hasImage: Boolean(imageUrl) })) {
      return callHuggingFace(buildTextFallbackPayload(prompt));
    }

    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError('Unexpected AI service failure.', 500, error);
  }
};

module.exports = {
  AIServiceError,
  MODEL_ENDPOINT,
  MODEL_ID,
  generateChatReply,
};
