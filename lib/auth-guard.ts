import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  image: string;
}

// ─── Session Helper ─────────────────────────────────────────────

/**
 * Retrieves the current authenticated user from the request.
 *
 * **Phase 2 placeholder:** reads `x-user-id` header and looks up
 * the user in the database. Will be replaced with real NextAuth
 * `auth()` session in Phase 3.
 *
 * Returns null if no valid user — the caller decides whether to
 * return 401 or handle it differently.
 */
export async function getSessionOrThrow(
  req: NextRequest,
): Promise<SessionUser | null> {
  // TODO Phase 3: replace with `auth()` from NextAuth v5
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    name: user.name ?? '',
    email: user.email,
    image: user.image ?? '',
  };
}
