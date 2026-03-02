import type { NextRequest } from 'next/server';

import { handleChatPost } from './chat-controller';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleChatPost(request);
}
