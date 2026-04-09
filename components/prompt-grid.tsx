'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PromptCard, type PromptCardData } from '@/components/prompt-card';

interface Meta {
  page: number;
  limit: number;
  total: number;
}

export function PromptGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const sort = searchParams.get('sort') === 'stars' ? 'stars' : 'recent';

  const [prompts, setPrompts] = useState<PromptCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  // Build API URL for a given page
  const buildUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tag) params.set('tag', tag);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '12');
      return `/api/prompts?${params.toString()}`;
    },
    [q, tag, sort],
  );

  // Fetch first page when filters change
  useEffect(() => {
    pageRef.current = 1;
    let cancelled = false;
    setLoading(true);

    fetch(buildUrl(1))
      .then((res) => res.json())
      .then((json: { data: PromptCardData[]; meta: Meta }) => {
        if (cancelled) return;
        setPrompts(json.data);
        setTotal(json.meta.total);
      })
      .catch(() => {
        if (cancelled) return;
        setPrompts([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildUrl]);

  // Load next page
  const loadMore = useCallback(() => {
    if (loadingMore) return;
    // Check if more pages exist using prompts.length as proxy
    if (prompts.length >= total) return;

    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    fetch(buildUrl(nextPage))
      .then((res) => res.json())
      .then((json: { data: PromptCardData[]; meta: Meta }) => {
        pageRef.current = nextPage;
        setPrompts((prev) => [...prev, ...json.data]);
        setTotal(json.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, prompts.length, total, buildUrl]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Derive hasMore from loaded data vs total — no ref read during render
  const hasMore = prompts.length < total;

  // Sort toggle handler
  const handleSort = (value: 'recent' | 'stars') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <div>
      {/* Sort toggle + count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {!loading ? (
            <>
              {total} {total === 1 ? 'prompt' : 'prompts'}
            </>
          ) : (
            <span className="invisible">0 prompts</span>
          )}
        </p>
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleSort('recent')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              sort === 'recent'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            } rounded-l-md`}
          >
            Recent
          </button>
          <button
            onClick={() => handleSort('stars')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              sort === 'stars'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            } rounded-r-md`}
          >
            Most Starred
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && prompts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">
            No prompts found
          </p>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            {q || tag
              ? 'Try adjusting your search or filters.'
              : 'Be the first to create one!'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && prompts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center py-8">
              {loadingMore && (
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
