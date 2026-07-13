'use server';
/**
 * @fileOverview Generates a complete webpage (HTML+CSS+JS) from prompt.
 */

import { anaGenerateText, normalizeModelText } from '@/ai/ana-v01';
import { z } from 'zod';

const GenerateWebpageInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the webpage to generate.'),
});
export type GenerateWebpageInput = z.infer<typeof GenerateWebpageInputSchema>;

const GenerateWebpageOutputSchema = z.object({
  html: z
    .string()
    .describe(
      'Complete HTML including CSS in <style> and JS in <script> tags.'
    ),
});
export type GenerateWebpageOutput = z.infer<typeof GenerateWebpageOutputSchema>;

export async function generateWebpage(
  input: GenerateWebpageInput
): Promise<GenerateWebpageOutput> {
  const raw = await anaGenerateText({
    messages: [
      {
        role: 'system',
        content:
          'You are an expert web developer. Return only one full HTML file with embedded CSS and JS. No markdown fences.',
      },
      {
        role: 'user',
        content: `Create a modern, responsive webpage for:\n${input.prompt}`,
      },
    ],
    temperature: 0.4,
    maxTokens: 5000,
  });

  return {
    html: normalizeModelText(raw),
  };
}
