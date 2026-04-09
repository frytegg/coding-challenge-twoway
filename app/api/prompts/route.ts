import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  createdResponse,
  badRequest,
  unauthorized,
  rateLimited,
} from '@/lib/api-response';
import { getSessionUser } from '@/lib/auth-guard';
import { mutationLimiter } from '@/lib/rate-limit';
import { Prisma } from '@/app/generated/prisma/client';
import { auth } from '@/lib/auth';

// Shared include for prompt queries
const promptInclude = {
  author: { select: { id: true, name: true, image: true } },
  tags: { select: { id: true, name: true } },
  _count: { select: { stars: true } },
} satisfies Prisma.PromptInclude;

// ─── GET /api/prompts ───────────────────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl;

  const q = searchParams.get('q')?.trim() ?? '';
  const tag = searchParams.get('tag')?.trim().toLowerCase() ?? '';
  const sort = searchParams.get('sort') === 'stars' ? 'stars' : 'recent';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 12));
  const skip = (page - 1) * limit;

  // Build where clause
  // SQLite LIKE is case-insensitive for ASCII by default, so
  // `contains` works without `mode: "insensitive"`.
  // For PostgreSQL in production, add `mode: "insensitive"`.
  const where: Prisma.PromptWhereInput = {
    isPublic: true,
    ...(q && {
      OR: [
        { title: { contains: q } },
        { body: { contains: q } },
      ],
    }),
    ...(tag && {
      tags: { some: { name: tag } },
    }),
  };

  const orderBy: Prisma.PromptOrderByWithRelationInput =
    sort === 'stars' ? { starCount: 'desc' } : { createdAt: 'desc' };

  const [prompts, total, session] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: promptInclude,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.prompt.count({ where }),
    auth(),
  ]);

  // When authenticated, include the user's starred prompt IDs so the UI
  // can render filled stars without extra round-trips.
  let starredIds: string[] = [];
  if (session?.user?.id) {
    const promptIds = prompts.map((p) => p.id);
    const stars = await prisma.star.findMany({
      where: { userId: session.user.id, promptId: { in: promptIds } },
      select: { promptId: true },
    });
    starredIds = stars.map((s) => s.promptId);
  }

  return successResponse(prompts, { page, limit, total, starredIds });
}

// ─── POST /api/prompts ──────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  const rl = await mutationLimiter(req);
  if (!rl.success) return rateLimited(rl.resetAt);

  const session = await getSessionUser();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const { title, body: promptBody, tags, isPublic } = body as {
    title?: unknown;
    body?: unknown;
    tags?: unknown;
    isPublic?: unknown;
  };

  // Validate required fields
  if (typeof title !== 'string' || !title.trim()) {
    return badRequest('title is required and must be a non-empty string');
  }
  if (typeof promptBody !== 'string' || !promptBody.trim()) {
    return badRequest('body is required and must be a non-empty string');
  }
  if (!Array.isArray(tags) || !tags.every((t): t is string => typeof t === 'string')) {
    return badRequest('tags must be an array of strings');
  }

  // Normalize tags: trim, lowercase, dedupe, filter empty
  const normalizedTags = [...new Set(
    tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
  )];

  const prompt = await prisma.prompt.create({
    data: {
      title: title.trim(),
      body: promptBody.trim(),
      authorId: session.userId,
      isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      tags: {
        connectOrCreate: normalizedTags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: promptInclude,
  });

  return createdResponse(prompt);
}
