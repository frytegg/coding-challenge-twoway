'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, Copy, Check, Pencil, Trash2, Plus, FileText } from 'lucide-react';
import { stripMarkdown, timeAgo } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────

export interface DashboardPrompt {
  id: string;
  title: string;
  body: string;
  starCount: number;
  isPublic: boolean;
  createdAt: string;
  tags: { id: string; name: string }[];
}

// ─── Tag color helper (same as prompt-card) ────────────────────

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
] as const;

function tagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// ─── Dashboard Card ────────────────────────────────────────────

function DashboardCard({
  prompt,
  onDelete,
}: {
  prompt: DashboardPrompt;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prompt.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [prompt.body]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(prompt.id);
      } else {
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const plainBody = stripMarkdown(prompt.body);

  return (
    <div className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-neutral-800/50">
      {/* Top actions row */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Copy prompt"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <Link
          href={`/prompts/${prompt.id}/edit`}
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Edit prompt"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          aria-label="Delete prompt"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Title (clickable) */}
      <Link href={`/prompts/${prompt.id}`} className="pr-24">
        <h3 className="line-clamp-2 text-base font-semibold text-neutral-900 hover:text-violet-600 dark:text-neutral-100 dark:hover:text-violet-400">
          {prompt.title}
        </h3>
      </Link>

      {/* Visibility badge */}
      {!prompt.isPublic && (
        <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          Private
        </span>
      )}

      {/* Body preview */}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
        {plainBody}
      </p>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prompt.tags.map((tag) => (
            <span
              key={tag.id}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag.name)}`}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: stars + time */}
      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          <span>{prompt.starCount}</span>
        </div>
        <span className="ml-auto">{timeAgo(prompt.createdAt)}</span>
      </div>

      {/* Delete confirmation overlay */}
      {confirming && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm dark:bg-neutral-900/95">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Delete this prompt?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Content ─────────────────────────────────────────

export function DashboardContent({
  initialPrompts,
  currentSort,
}: {
  initialPrompts: DashboardPrompt[];
  currentSort: 'recent' | 'stars';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompts, setPrompts] = useState(initialPrompts);

  const handleDelete = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleSort = (value: 'recent' | 'stars') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/dashboard?${params.toString()}`);
  };

  // Empty state
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
          <FileText className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">
          You haven&apos;t created any prompts yet
        </p>
        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
          Start building your collection of LLM prompts.
        </p>
        <Link
          href="/prompts/new"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Create Your First Prompt
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Sort toggle */}
      <div className="mb-4 flex justify-end">
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleSort('recent')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              currentSort === 'recent'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            } rounded-l-md`}
          >
            Recent
          </button>
          <button
            onClick={() => handleSort('stars')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              currentSort === 'stars'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            } rounded-r-md`}
          >
            Most Starred
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <DashboardCard key={prompt.id} prompt={prompt} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
