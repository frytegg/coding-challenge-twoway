import { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth';
import { authLimiter } from '@/lib/rate-limit';
import { rateLimited } from '@/lib/api-response';

export const { GET } = handlers;

export async function POST(req: NextRequest): Promise<Response> {
  const rl = await authLimiter(req);
  if (!rl.success) return rateLimited(rl.resetAt);

  return handlers.POST(req);
}
