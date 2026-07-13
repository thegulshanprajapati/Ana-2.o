'use server';
/**
 * @fileOverview AI helpers for code generation, debugging, and explanation.
 */

import { anaGenerateJson } from '@/ai/ana-v01';
import { z } from 'zod';

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe("User's request for code generation"),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  xml: z.string().describe('The generated XML code changes.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code that may contain errors'),
});
export type DebugCodeInput = z.infer<typeof DebugCodeInputSchema>;

const DebugCodeOutputSchema = z.object({
  fixedCode: z.string().describe('The corrected and error-free code'),
  explanation: z.string().describe('Explanation of what was fixed'),
});
export type DebugCodeOutput = z.infer<typeof DebugCodeOutputSchema>;

const ExplainCodeInputSchema = z.object({
  code: z.string().describe('The code to be explained'),
});
export type ExplainCodeInput = z.infer<typeof ExplainCodeInputSchema>;

const ExplainCodeOutputSchema = z.object({
  explanation: z.string().describe('Detailed explanation of the given code'),
});
export type ExplainCodeOutput = z.infer<typeof ExplainCodeOutputSchema>;

export async function generateCode(
  input: GenerateCodeInput
): Promise<GenerateCodeOutput> {
  return anaGenerateJson({
    schema: GenerateCodeOutputSchema,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert AI developer. Generate file modifications as XML text and return JSON with key "xml".',
      },
      {
        role: 'user',
        content: `User request:\n${input.prompt}\n\nExpected XML format:\n<changes>\n  <description>summary</description>\n  <change>\n    <file>FULL_ABSOLUTE_PATH</file>\n    <content><![CDATA[\nENTIRE_NEW_FILE_CONTENT\n]]></content>\n  </change>\n</changes>`,
      },
    ],
    temperature: 0.3,
    maxTokens: 3000,
  });
}

export async function debugCode(input: DebugCodeInput): Promise<DebugCodeOutput> {
  return anaGenerateJson({
    schema: DebugCodeOutputSchema,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert debugger. Return JSON with fixedCode and explanation.',
      },
      {
        role: 'user',
        content: `Find issues and fix this code:\n\n${input.code}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 2000,
  });
}

export async function explainCode(
  input: ExplainCodeInput
): Promise<ExplainCodeOutput> {
  return anaGenerateJson({
    schema: ExplainCodeOutputSchema,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert code explainer. Return JSON with a clear and concise explanation.',
      },
      {
        role: 'user',
        content: `Explain this code:\n\n${input.code}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 1200,
  });
}
