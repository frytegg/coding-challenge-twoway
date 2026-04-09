import { PrismaClient } from '@/app/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';
  const isSqlite = url.startsWith('file:') || url.endsWith('.db') || !url;

  if (!isSqlite) {
    // PostgreSQL via pg driver adapter (Neon, Supabase, etc.)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }

  // SQLite via better-sqlite3 driver adapter (local development)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  const resolvedUrl = url || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolvedUrl }) });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
