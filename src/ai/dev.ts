
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-response.ts';
import '@/ai/flows/generate-code.ts';
import '@/ai/flows/generate-image.ts';
import '@/ai/flows/generate-audio.ts';
import '@/ai/flows/generate-title.ts';
import '@/ai/flows/generate-webpage.ts';
import '@/ai/flows/detect-language.ts';
import '@/ai/flows/get-current-datetime.ts';
import '@/ai/tools/web-search.ts';
