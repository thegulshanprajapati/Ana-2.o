
'use server';
/**
 * @fileOverview An AI agent that converts text to speech with personality-based voices.
 *
 * - generateAudio - A function that generates audio from text.
 * - GenerateAudioInput - The input type for the generateAudio functionूं
 * - GenerateAudioOutput - The return type for the generateAudio function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import wav from 'wav';

const GenerateAudioInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  character: z.string().optional().describe('The character personality to determine the voice.'),
});
export type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;

const GenerateAudioOutputSchema = z.object({
  audioUrl: z.string().describe('The data URI of the generated audio.'),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


export async function generateAudio(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  return generateAudioFlow(input);
}

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async ({ text, character }) => {
    // Determine voice based on character
    let voiceName: string;
    const maleCharacters = ["Husband", "Raudy Boy", "Best Friend (Boy)", "Ex-boyfriend", "Coder Ana", "Gym Trainer", "Professor", "Police", "Judge", "Criminal", "Cook"];
    
    if (character && maleCharacters.includes(character)) {
        // Male voice
        voiceName = 'Canopus'; 
    } else {
        // Female voices with different accents
        if (character && ["Wife Ana", "Ex-girlfriend", "Hindi Hinglish"].includes(character)) {
            // Hindi accent female voice
            voiceName = 'Indus';
        } else {
            // Standard English female voice
            voiceName = 'Leda';
        }
    }


    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    if (!media || !media.url) {
      throw new Error('Audio generation failed to produce audio.');
    }
     const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      audioUrl: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);
