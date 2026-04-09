import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import {
  DashboardContent,
  type DashboardPrompt,
} from '@/components/dashboard-content';

export const metadata: Metadata = {
  title: 'My Prompts — PromptVault',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  const sort = sp.sort === 'stars' ? 'stars' : 'recent';

  // Middleware guarantees a session, but guard defensively
  const userId = session?.user?.id;
  if (!userId) return null;

  const prompts = await prisma.prompt.findMany({
    where: { authorId: userId },
    include: { tags: { select: { id: true, name: true } } },
    orderBy: sort === 'stars' ? { starCount: 'desc' } : { createdAt: 'desc' },
  });

  // Serialize dates for the client component
  const serialized: DashboardPrompt[] = prompts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    starCount: p.starCount,
    isPublic: p.isPublic,
    createdAt: p.createdAt.toISOString(),
    tags: p.tags,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Prompts</h1>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {serialized.length}
          </span>
        </div>
        <Link
          href="/prompts/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New Prompt
        </Link>
      </div>

      <Suspense>
        <DashboardContent initialPrompts={serialized} currentSort={sort} />
      </Suspense>
    </div>
  );
}
