
'use server';
/**
 * @fileOverview A tool that performs a web search using Google Custom Search API.
 *
 * - webSearch - A Genkit tool to search the web.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const webSearch = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Searches the web for real-time information. Use for questions about current events, recent topics, or anything that requires up-to-date knowledge.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.object({
      results: z.array(z.string()).describe('A list of text snippets from the top search results.'),
    }),
  },
  async (input) => {
    try {
      // The API call is made to our own Next.js API route to keep keys secure.
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input.query }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Web search failed.');
      }

      const data = await response.json();
      return { results: data.results };

    } catch (error) {
      console.error('Web search tool error:', error);
      return { results: ['Search failed to retrieve results.'] };
    }
  }
);
