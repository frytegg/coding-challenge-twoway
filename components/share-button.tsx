'use client';

import { useState, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (error: unknown) {
        // User cancelled or share failed — fall through to clipboard
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-900"
      aria-label="Share prompt"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Link copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
