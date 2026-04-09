'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tag {
  id: string;
  name: string;
  promptCount: number;
}

export function TagFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag') ?? '';
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((json: { data: Tag[] }) => setTags(json.data))
      .catch(() => {});
  }, []);

  const handleClick = (tagName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tagName) {
      params.set('tag', tagName);
    } else {
      params.delete('tag');
    }
    // Reset to page 1 when changing filter
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
      <button
        onClick={() => handleClick('')}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
          !activeTag
            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => handleClick(tag.name)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
            activeTag === tag.name
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
          }`}
        >
          {tag.name}
          <span className="ml-1.5 text-xs opacity-60">({tag.promptCount})</span>
        </button>
      ))}
    </div>
  );
}
