import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, unauthorized, notFound, rateLimited } from '@/lib/api-response';
import { getSessionUser } from '@/lib/auth-guard';
import { mutationLimiter } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const rl = await mutationLimiter(req);
  if (!rl.success) return rateLimited(rl.resetAt);

  const session = await getSessionUser();
  if (!session) return unauthorized();

  const { id: promptId } = await params;

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId } });
  if (!prompt) return notFound('Prompt not found');

  const userId = session.userId;

  const existingStar = await prisma.star.findUnique({
    where: { userId_promptId: { userId, promptId } },
  });

  if (existingStar) {
    const [, updatedPrompt] = await prisma.$transaction([
      prisma.star.delete({ where: { id: existingStar.id } }),
      prisma.prompt.update({
        where: { id: promptId },
        data: { starCount: { decrement: 1 } },
      }),
    ]);

    return successResponse({ starred: false, starCount: updatedPrompt.starCount });
  }

  const [, updatedPrompt] = await prisma.$transaction([
    prisma.star.create({ data: { userId, promptId } }),
    prisma.prompt.update({
      where: { id: promptId },
      data: { starCount: { increment: 1 } },
    }),
  ]);

  return successResponse({ starred: true, starCount: updatedPrompt.starCount });
}
