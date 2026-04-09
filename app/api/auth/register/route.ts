import { NextRequest } from 'next/server';
import { hash as bcryptHash, genSalt } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { createdResponse, badRequest, errorResponse, rateLimited } from '@/lib/api-response';
import { sendVerificationEmail } from '@/lib/email';
import { registerLimiter } from '@/lib/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest): Promise<Response> {
  const rl = await registerLimiter(req);
  if (!rl.success) return rateLimited(rl.resetAt);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const { name, email, password } = body as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
  };

  // ─── Validation ─────────────────────────────────────────────
  if (typeof name !== 'string' || !name.trim()) {
    return badRequest('name is required');
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return badRequest('A valid email is required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    return badRequest('Password must be at least 8 characters');
  }

  // ─── Duplicate check ───────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return errorResponse('CONFLICT', 'Email already registered', 409);
  }

  // ─── Create user ───────────────────────────────────────────
  const salt = await genSalt(10);
  const passwordHash = await bcryptHash(password, salt);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: null,
    },
  });

  // ─── Verification token ────────────────────────────────────
  const rawToken = randomUUID();
  const hashedToken = hashToken(rawToken);

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: hashedToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // ─── Send email ────────────────────────────────────────────
  await sendVerificationEmail(user.email, rawToken);

  return createdResponse({ message: 'Account created. Check your email to verify.' });
}
