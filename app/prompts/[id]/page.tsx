import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Pencil, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { stripMarkdown, timeAgo } from '@/lib/utils';
import { ShareButton } from '@/components/share-button';
import { StarButton } from '@/components/star-button';
import { CopyButton } from './copy-button';
import { DeleteButton } from './delete-button';

// ── Helpers ─────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

async function getPrompt(id: string) {
  return prisma.prompt.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      tags: { select: { id: true, name: true } },
    },
  });
}

// ── Metadata ────────────────────────────────────────────────────

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const prompt = await getPrompt(id);
  if (!prompt) return { title: 'Prompt Not Found — PromptVault' };

  const description = truncate(stripMarkdown(prompt.body), 160);
  const url = `${process.env.NEXTAUTH_URL}/prompts/${id}`;

  return {
    title: `${prompt.title} — PromptVault`,
    description,
    authors: prompt.author.name ? [{ name: prompt.author.name }] : undefined,
    openGraph: {
      title: prompt.title,
      description,
      type: 'article',
      url,
      siteName: 'PromptVault',
      publishedTime: prompt.createdAt.toISOString(),
      modifiedTime: prompt.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: prompt.title,
      description,
    },
  };
}

// ── Page ────────────────────────────────────────────────────────

export default async function PromptDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [prompt, session] = await Promise.all([getPrompt(id), auth()]);

  if (!prompt) notFound();

  // Only the author or public prompts are viewable
  if (!prompt.isPublic && session?.user?.id !== prompt.authorId) notFound();

  const isAuthor = session?.user?.id === prompt.authorId;

  // Check if the current user has starred this prompt
  let isStarred = false;
  if (session?.user?.id) {
    const star = await prisma.star.findUnique({
      where: { userId_promptId: { userId: session.user.id, promptId: id } },
    });
    isStarred = !!star;
  }
  const promptUrl = `${process.env.NEXTAUTH_URL}/prompts/${id}`;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: prompt.title,
    author: {
      '@type': 'Person',
      name: prompt.author.name ?? 'Anonymous',
    },
    datePublished: prompt.createdAt.toISOString(),
    dateModified: prompt.updatedAt.toISOString(),
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to prompts
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{prompt.title}</h1>

          {/* Author + meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              {prompt.author.image ? (
                <img
                  src={prompt.author.image}
                  alt={prompt.author.name ?? 'User'}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {(prompt.author.name ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span>{prompt.author.name ?? 'Anonymous'}</span>
            </div>

            <span className="text-neutral-300 dark:text-neutral-600">|</span>

            <StarButton
              promptId={id}
              initialStarred={isStarred}
              initialCount={prompt.starCount}
              compact
            />

            <span className="text-neutral-300 dark:text-neutral-600">|</span>

            <span>{timeAgo(prompt.createdAt)}</span>
          </div>

          {/* Tags */}
          {prompt.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prompt.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <CopyButton text={prompt.body} />
          <ShareButton url={promptUrl} />
          {isAuthor && (
            <>
              <Link
                href={`/prompts/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
              <DeleteButton promptId={id} />
            </>
          )}
        </div>

        {/* Prompt body — rendered markdown */}
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {prompt.body}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}
