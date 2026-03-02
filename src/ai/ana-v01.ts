'use server';

import { z } from 'zod';

export type AnaRole = 'system' | 'user' | 'assistant';

export interface AnaMessage {
  role: AnaRole;
  content: string;
}

const DEFAULT_ANA_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';

const getAnaApiKey = (): string => {
  const key = process.env.ANA_V01_API_KEY || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Missing ANA_V01_API_KEY (or GROQ_API_KEY).');
  }
  return key;
};

const getAnaModel = (): string => {
  return process.env.ANA_V01_MODEL || DEFAULT_ANA_MODEL;
};

const getAnaBaseUrl = (): string => {
  return process.env.ANA_V01_BASE_URL || DEFAULT_BASE_URL;
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
}: {
  messages: AnaMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> => {
  const endpoint = `${getAnaBaseUrl()}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAnaApiKey()}`,
    },
    body: JSON.stringify({
      model: getAnaModel(),
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const providerError =
      payload?.error?.message ||
      payload?.message ||
      `LLM request failed with status ${response.status}`;
    throw new Error(providerError);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('LLM response was empty.');
  }

  return content.trim();
};

export const anaGenerateJson = async <T>({
  messages,
  schema,
  temperature = 0.2,
  maxTokens = 1024,
}: {
  messages: AnaMessage[];
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
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
  });

  const parsed = extractJsonObject(raw);
  return schema.parse(parsed);
};

export const normalizeModelText = (raw: string): string => {
  return removeMarkdownCodeFence(raw);
};
