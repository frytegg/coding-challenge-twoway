import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  rateLimited,
} from '@/lib/api-response';
import { getSessionUser } from '@/lib/auth-guard';
import { mutationLimiter } from '@/lib/rate-limit';
import { Prisma } from '@/app/generated/prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

const promptInclude = {
  author: { select: { id: true, name: true, image: true } },
  tags: { select: { id: true, name: true } },
  _count: { select: { stars: true } },
} satisfies Prisma.PromptInclude;

// ─── GET /api/prompts/:id ───────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: promptInclude,
  });

  if (!prompt) return notFound('Prompt not found');

  return successResponse(prompt);
}

// ─── PUT /api/prompts/:id ───────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const rl = await mutationLimiter(req);
  if (!rl.success) return rateLimited(rl.resetAt);

  const session = await getSessionUser();
  if (!session) return unauthorized();

  const { id } = await params;

  const existing = await prisma.prompt.findUnique({ where: { id } });
  if (!existing) return notFound('Prompt not found');
  if (existing.authorId !== session.userId) return forbidden('You do not own this prompt');

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

  // Build the update data incrementally
  const data: Prisma.PromptUpdateInput = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return badRequest('title must be a non-empty string');
    }
    data.title = title.trim();
  }

  if (promptBody !== undefined) {
    if (typeof promptBody !== 'string' || !promptBody.trim()) {
      return badRequest('body must be a non-empty string');
    }
    data.body = promptBody.trim();
  }

  if (isPublic !== undefined) {
    if (typeof isPublic !== 'boolean') {
      return badRequest('isPublic must be a boolean');
    }
    data.isPublic = isPublic;
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t): t is string => typeof t === 'string')) {
      return badRequest('tags must be an array of strings');
    }

    const normalizedTags = [...new Set(
      tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    )];

    data.tags = {
      set: [], // disconnect all existing tags
      connectOrCreate: normalizedTags.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  const updated = await prisma.prompt.update({
    where: { id },
    data,
    include: promptInclude,
  });

  return successResponse(updated);
}

// ─── DELETE /api/prompts/:id ────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const rl = await mutationLimiter(req);
  if (!rl.success) return rateLimited(rl.resetAt);

  const session = await getSessionUser();
  if (!session) return unauthorized();

  const { id } = await params;

  const existing = await prisma.prompt.findUnique({ where: { id } });
  if (!existing) return notFound('Prompt not found');
  if (existing.authorId !== session.userId) return forbidden('You do not own this prompt');

  await prisma.prompt.delete({ where: { id } });

  return successResponse({ deleted: true });
}
