'use server';
/**
 * @fileOverview Generates a short title from the first user message.
 */

import { anaGenerateJson } from '@/ai/ana-v01';
import { z } from 'zod';

const GenerateTitleInputSchema = z.object({
  message: z.string().describe('The first message of a conversation.'),
});
export type GenerateTitleInput = z.infer<typeof GenerateTitleInputSchema>;

const GenerateTitleOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title (3-5 words).'),
});
export type GenerateTitleOutput = z.infer<typeof GenerateTitleOutputSchema>;

export async function generateTitle(
  input: GenerateTitleInput
): Promise<GenerateTitleOutput> {
  try {
    const output = await anaGenerateJson({
      schema: GenerateTitleOutputSchema,
      messages: [
        {
          role: 'system',
          content:
            'Create a short conversation title (max 5 words). Return JSON: {"title":"..."}',
        },
        {
          role: 'user',
          content: input.message,
        },
      ],
      temperature: 0.3,
      maxTokens: 120,
    });

    return {
      title: output.title.trim().slice(0, 80),
    };
  } catch {
    const words = input.message
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);
    return { title: words.length ? words.join(' ') : 'New Chat' };
  }
}
