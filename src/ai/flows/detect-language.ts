'use server';
/**
 * @fileOverview Detects the primary language for input text.
 */

import { anaGenerateJson } from '@/ai/ana-v01';
import { z } from 'zod';

const DetectLanguageInputSchema = z.object({
  text: z.string().describe('The text to analyze.'),
});
export type DetectLanguageInput = z.infer<typeof DetectLanguageInputSchema>;

const DetectLanguageOutputSchema = z.object({
  languageCode: z.string().describe('Detected language code.'),
  languageName: z.string().describe('Detected language name.'),
});
export type DetectLanguageOutput = z.infer<typeof DetectLanguageOutputSchema>;

const fallbackDetect = (text: string): DetectLanguageOutput => {
  if (/[\u0980-\u09FF]/.test(text)) {
    return { languageCode: 'bn', languageName: 'Bengali' };
  }
  if (/[\u0900-\u097F]/.test(text)) {
    return { languageCode: 'hi', languageName: 'Hindi' };
  }
  return { languageCode: 'en', languageName: 'English' };
};

export async function detectLanguage(
  input: DetectLanguageInput
): Promise<DetectLanguageOutput> {
  try {
    return await anaGenerateJson({
      schema: DetectLanguageOutputSchema,
      messages: [
        {
          role: 'system',
          content:
            'Identify the primary language of the user text. Return JSON with languageCode and languageName.',
        },
        {
          role: 'user',
          content: `Text:\n${input.text}`,
        },
      ],
      temperature: 0,
      maxTokens: 200,
    });
  } catch {
    return fallbackDetect(input.text);
  }
}
