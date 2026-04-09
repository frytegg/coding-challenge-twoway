import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, unauthorized, notFound, errorResponse } from '@/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return unauthorized();
  }

  const { id: promptId } = await params;

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId } });
  if (!prompt) {
    return notFound('Prompt not found');
  }

  const existingStar = await prisma.star.findUnique({
    where: { userId_promptId: { userId, promptId } },
  });

  if (existingStar) {
    // Unstar: delete star + decrement count
    const [, updatedPrompt] = await prisma.$transaction([
      prisma.star.delete({ where: { id: existingStar.id } }),
      prisma.prompt.update({
        where: { id: promptId },
        data: { starCount: { decrement: 1 } },
      }),
    ]);

    return successResponse({ starred: false, starCount: updatedPrompt.starCount });
  }

  // Star: create star + increment count
  const [, updatedPrompt] = await prisma.$transaction([
    prisma.star.create({ data: { userId, promptId } }),
    prisma.prompt.update({
      where: { id: promptId },
      data: { starCount: { increment: 1 } },
    }),
  ]);

  return successResponse({ starred: true, starCount: updatedPrompt.starCount });
}
