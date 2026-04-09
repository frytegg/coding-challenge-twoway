import { auth } from '@/lib/auth';

// ─── Types ──────────────────────────────────────────────────────

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  image: string;
}

// ─── Session Helper ─────────────────────────────────────────────

/**
 * Retrieves the current authenticated session user via NextAuth.
 * Returns null if no valid session exists — the caller decides
 * whether to throw or return a 401 response.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    userId: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email,
    image: session.user.image ?? '',
  };
}
