import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  if (!token || !email) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid-token`);
  }

  const hashedToken = hashToken(token);

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: hashedToken },
  });

  if (!record || record.expires < new Date()) {
    // Clean up expired token if it exists
    if (record) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: hashedToken } },
      });
    }
    return NextResponse.redirect(`${baseUrl}/?error=invalid-token`);
  }

  // Verify user and delete token in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: hashedToken } },
    }),
  ]);

  return NextResponse.redirect(`${baseUrl}/?verified=true`);
}
