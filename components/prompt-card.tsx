'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { stripMarkdown, timeAgo } from '@/lib/utils';
import { StarButton } from '@/components/star-button';

export interface PromptCardData {
  id: string;
  title: string;
  body: string;
  starCount: number;
  createdAt: string;
  isStarred: boolean;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Deterministic color from tag name for visual variety
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

export function PromptCard({ prompt }: { prompt: PromptCardData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(prompt.body).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [prompt.body]
  );

  const plainBody = stripMarkdown(prompt.body);

  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-neutral-800/50"
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group-hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        aria-label="Copy prompt"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>

      {/* Title */}
      <h3 className="line-clamp-2 pr-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {prompt.title}
      </h3>

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

      {/* Footer: author + stars + time */}
      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-neutral-500 dark:text-neutral-400">
        {/* Author */}
        <div className="flex items-center gap-1.5">
          {prompt.author.image ? (
            <Image
              src={prompt.author.image}
              alt={prompt.author.name ?? 'User'}
              width={20}
              height={20}
              className="h-5 w-5 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
              {getInitials(prompt.author.name ?? '?')}
            </div>
          )}
          <span className="max-w-[100px] truncate">{prompt.author.name ?? 'Anonymous'}</span>
        </div>

        {/* Stars */}
        <StarButton
          promptId={prompt.id}
          initialStarred={prompt.isStarred}
          initialCount={prompt.starCount}
          compact
        />

        {/* Time */}
        <span className="ml-auto">{timeAgo(prompt.createdAt)}</span>
      </div>
    </Link>
  );
}
