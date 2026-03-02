export interface PromptMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT =
  'You are Ana, an intelligent, friendly, emotionally aware AI assistant. You speak clearly, confidently, and help users with tech, startups, productivity and personal growth. Keep answers practical and structured.';

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const buildPrompt = (
  messages: PromptMessage[],
  currentMessage: string
): string => {
  const lines: string[] = [`System: ${SYSTEM_PROMPT}`];

  for (const message of messages) {
    const content = normalizeText(message.content);
    if (!content) {
      continue;
    }

    const speaker = message.role === 'assistant' ? 'Assistant' : 'User';
    lines.push(`${speaker}: ${content}`);
  }

  lines.push(`User: ${normalizeText(currentMessage)}`);
  lines.push('Assistant:');

  return lines.join('\n');
};
