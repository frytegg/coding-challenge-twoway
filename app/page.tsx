import { Suspense } from 'react';
import { TagFilter } from '@/components/tag-filter';
import { PromptGrid } from '@/components/prompt-grid';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Tag filter sub-header */}
      <div className="sticky top-14 z-30 -mx-4 bg-white/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 dark:bg-neutral-950/80">
        <Suspense>
          <TagFilter />
        </Suspense>
      </div>

      {/* Prompt grid */}
      <div className="py-4">
        <Suspense>
          <PromptGrid />
        </Suspense>
      </div>
    </div>
  );
}
