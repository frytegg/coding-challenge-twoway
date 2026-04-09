'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PromptCard, type PromptCardData } from '@/components/prompt-card';

interface FetchResult {
  prompts: PromptCardData[];
  total: number;
  starredIds: string[];
  filterKey: string;
}

export function PromptGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const sort = searchParams.get('sort') === 'stars' ? 'stars' : 'recent';

  // Stable key representing the current filter combination
  const filterKey = `${q}|${tag}|${sort}`;

  const [result, setResult] = useState<FetchResult>({ prompts: [], total: 0, starredIds: [], filterKey: '' });
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  // Derive loading: true when the result doesn't match current filters
  const loading = result.filterKey !== filterKey;

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
    const key = filterKey;

    fetch(buildUrl(1))
      .then((res) => res.json())
      .then((json: { data: PromptCardData[]; meta: { total: number; starredIds?: string[] } }) => {
        if (!cancelled) {
          const starredIds = json.meta.starredIds ?? [];
          const starredSet = new Set(starredIds);
          const prompts = json.data.map((p) => ({ ...p, isStarred: starredSet.has(p.id) }));
          setResult({ prompts, total: json.meta.total, starredIds, filterKey: key });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ prompts: [], total: 0, starredIds: [], filterKey: key });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [buildUrl, filterKey]);

  // Load next page
  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    if (result.prompts.length >= result.total) return;

    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    fetch(buildUrl(nextPage))
      .then((res) => res.json())
      .then((json: { data: PromptCardData[]; meta: { total: number; starredIds?: string[] } }) => {
        pageRef.current = nextPage;
        const newStarredIds = json.meta.starredIds ?? [];
        setResult((prev) => {
          const mergedStarred = [...new Set([...prev.starredIds, ...newStarredIds])];
          const starredSet = new Set(mergedStarred);
          const newPrompts = json.data.map((p) => ({ ...p, isStarred: starredSet.has(p.id) }));
          return {
            ...prev,
            prompts: [...prev.prompts, ...newPrompts],
            total: json.meta.total,
            starredIds: mergedStarred,
          };
        });
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, loading, result.prompts.length, result.total, buildUrl]);

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

  const hasMore = result.prompts.length < result.total;

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
              {result.total} {result.total === 1 ? 'prompt' : 'prompts'}
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
      {!loading && result.prompts.length === 0 && (
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
      {!loading && result.prompts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.prompts.map((prompt) => (
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
