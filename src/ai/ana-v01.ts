'use server';

import { z } from 'zod';
import { saveTokenUsage } from '@/lib/local-data';

export type AnaRole = 'system' | 'user' | 'assistant';

export interface AnaMessage {
  role: AnaRole;
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_HF_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const DEFAULT_HF_BASE_URL = 'https://router.huggingface.co/v1';
const DEFAULT_PROVIDER_MODE = 'huggingface';
const DEFAULT_REQUEST_TIMEOUT_MS = 45000;
const DEFAULT_REQUEST_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 600;

interface ProviderConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const getRequestTimeoutMs = (): number =>
  toPositiveNumber(process.env.ANA_REQUEST_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS);

const getRequestAttempts = (): number =>
  Math.max(1, Math.floor(toPositiveNumber(process.env.ANA_REQUEST_ATTEMPTS, DEFAULT_REQUEST_ATTEMPTS)));

const getRetryBaseDelayMs = (): number =>
  toPositiveNumber(process.env.ANA_RETRY_BASE_DELAY_MS, DEFAULT_RETRY_BASE_DELAY_MS);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const computeRetryDelay = (attemptIndex: number): number => {
  const jitter = Math.floor(Math.random() * 180);
  return getRetryBaseDelayMs() * Math.pow(2, attemptIndex) + jitter;
};

const RETRIABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
]);

const getErrorCode = (error: unknown): string => {
  const candidate = error as { code?: string; cause?: { code?: string } };
  return (candidate?.code || candidate?.cause?.code || '').toUpperCase().trim();
};

const isRetriableNetworkError = (error: unknown): boolean => {
  const name = (error as { name?: string } | null)?.name || '';
  if (name === 'AbortError') {
    return true;
  }

  const code = getErrorCode(error);
  if (RETRIABLE_NETWORK_CODES.has(code)) {
    return true;
  }

  const message = String((error as { message?: string } | null)?.message || '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('socket hang up') ||
    message.includes('network')
  );
};

const isRetriableStatus = (status: number): boolean =>
  status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;

const extractProviderError = (payload: any, status: number): string => {
  const message =
    payload?.error?.message ||
    payload?.error ||
    payload?.message ||
    `LLM request failed with status ${status}`;
  return typeof message === 'string' ? message : String(message);
};

const getGroqApiKey = (): string => {
  return (process.env.ANA_V01_API_KEY || process.env.GROQ_API_KEY || '').trim();
};

const getHuggingFaceApiKey = (): string => {
  return (process.env.HF_TOKEN || '').trim();
};

type ProviderMode = 'huggingface' | 'groq' | 'auto';

const getProviderMode = (): ProviderMode => {
  const raw =
    (
      process.env.ANA_PROVIDER ||
      process.env.ANA_V01_PROVIDER ||
      process.env.ANA_LLM_PROVIDER ||
      DEFAULT_PROVIDER_MODE
    )
      .toLowerCase()
      .trim();

  if (raw === 'groq') {
    return 'groq';
  }
  if (raw === 'auto') {
    return 'auto';
  }
  return 'huggingface';
};

const getProviderConfig = (): ProviderConfig => {
  const groqKey = getGroqApiKey();
  const hfKey = getHuggingFaceApiKey();
  const mode = getProviderMode();

  if (mode === 'groq') {
    if (!groqKey) {
      throw new Error('ANA_V01_PROVIDER is set to groq but GROQ key is missing.');
    }
    return {
      baseUrl: process.env.ANA_V01_BASE_URL || DEFAULT_GROQ_BASE_URL,
      model: process.env.ANA_V01_MODEL || DEFAULT_GROQ_MODEL,
      apiKey: groqKey,
    };
  }

  if (mode === 'huggingface') {
    if (hfKey) {
      return {
        baseUrl: process.env.HF_ROUTER_BASE_URL || DEFAULT_HF_BASE_URL,
        model: process.env.HF_MODEL || DEFAULT_HF_MODEL,
        apiKey: hfKey,
      };
    }

    if (groqKey) {
      return {
        baseUrl: process.env.ANA_V01_BASE_URL || DEFAULT_GROQ_BASE_URL,
        model: process.env.ANA_V01_MODEL || DEFAULT_GROQ_MODEL,
        apiKey: groqKey,
      };
    }

    throw new Error('Missing HF_TOKEN (and fallback GROQ key).');
  }

  // auto mode: prefer HF first, fallback to Groq.
  if (hfKey) {
    return {
      baseUrl: process.env.HF_ROUTER_BASE_URL || DEFAULT_HF_BASE_URL,
      model: process.env.HF_MODEL || DEFAULT_HF_MODEL,
      apiKey: hfKey,
    };
  }

  if (groqKey) {
    return {
      baseUrl: process.env.ANA_V01_BASE_URL || DEFAULT_GROQ_BASE_URL,
      model: process.env.ANA_V01_MODEL || DEFAULT_GROQ_MODEL,
      apiKey: groqKey,
    };
  }

  throw new Error('Missing ANA_V01_API_KEY (or GROQ_API_KEY) and HF_TOKEN.');
};

const removeMarkdownCodeFence = (raw: string): string => {
  const fencedMatch = raw.match(/```(?:json|html|xml|markdown|md|txt)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return raw.trim();
};

const extractJsonObject = (raw: string): unknown => {
  const cleaned = removeMarkdownCodeFence(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      return JSON.parse(candidate);
    }
    throw new Error('Model response did not contain valid JSON.');
  }
};

export const anaGenerateText = async ({
  messages,
  temperature = 0.4,
  maxTokens = 2048,
  userId = 'anonymous',
}: {
  messages: AnaMessage[];
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}): Promise<string> => {
  const config = getProviderConfig();
  let modelToUse = config.model;

  const hasImages = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'));
  if (hasImages) {
    const provider = getProviderMode();
    if (provider === 'groq' || provider === 'auto') {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  const attempts = getRequestAttempts();
  const timeoutMs = getRequestTimeoutMs();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const providerError = extractProviderError(payload, response.status);
        if (attempt < attempts - 1 && isRetriableStatus(response.status)) {
          await sleep(computeRetryDelay(attempt));
          continue;
        }
        throw new Error(providerError);
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        const promptTokens = payload?.usage?.prompt_tokens || Math.ceil(messages.reduce((acc, m) => acc + m.content.length, 0) / 4);
        const completionTokens = payload?.usage?.completion_tokens || Math.ceil(content.length / 4);
        const totalTokens = promptTokens + completionTokens;

        saveTokenUsage({
          userId,
          promptTokens,
          completionTokens,
          totalTokens,
          model: config.model,
        }).catch((err) => console.error('Failed to save token usage:', err));

        return content.trim();
      }

      if (attempt < attempts - 1) {
        await sleep(computeRetryDelay(attempt));
        continue;
      }
      throw new Error('LLM response was empty.');
    } catch (error) {
      clearTimeout(timeoutHandle);
      lastError = error;
      if (attempt < attempts - 1 && isRetriableNetworkError(error)) {
        await sleep(computeRetryDelay(attempt));
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('LLM request failed after retries.');
};

export const anaGenerateJson = async <T>({
  messages,
  schema,
  temperature = 0.2,
  maxTokens = 1024,
  userId = 'anonymous',
}: {
  messages: AnaMessage[];
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}): Promise<T> => {
  const jsonInstruction: AnaMessage = {
    role: 'system',
    content:
      'Return only a valid JSON object. Do not include markdown fences, comments, or extra text.',
  };

  const raw = await anaGenerateText({
    messages: [jsonInstruction, ...messages],
    temperature,
    maxTokens,
    userId,
  });

  const parsed = extractJsonObject(raw);
  return schema.parse(parsed);
};

export const normalizeModelText = (raw: string): string => {
  return removeMarkdownCodeFence(raw);
};
