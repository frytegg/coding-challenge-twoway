import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';

export async function GET(): Promise<Response> {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { prompts: true } } },
    orderBy: { name: 'asc' },
  });

  const data = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    promptCount: tag._count.prompts,
  }));

  return successResponse(data);
}
