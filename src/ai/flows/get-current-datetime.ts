
'use server';
/**
 * @fileOverview A tool that provides the current system date and time.
 *
 * - getCurrentDateTime - A Genkit tool to get the current date and time.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const getCurrentDateTime = ai.defineTool(
  {
    name: 'getCurrentDateTime',
    description: 'Gets the current date and time. Use this tool when the user asks for the current date, time, or day.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        datetime: z.string().describe("The current date and time in a human-readable string format.")
    }),
  },
  async () => {
    return {
        datetime: new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short'
        })
    };
  }
);
