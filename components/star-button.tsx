'use client';

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SignInDialog } from '@/components/auth/sign-in-dialog';
import { useToast } from '@/components/toast';

interface StarButtonProps {
  promptId: string;
  initialStarred: boolean;
  initialCount: number;
  /** Compact mode for cards (smaller, no label) */
  compact?: boolean;
}

export function StarButton({
  promptId,
  initialStarred,
  initialCount,
  compact = false,
}: StarButtonProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!session?.user) {
        setShowSignIn(true);
        return;
      }

      if (loading) return;

      // Optimistic update
      const prevStarred = starred;
      const prevCount = count;
      setStarred(!starred);
      setCount(starred ? count - 1 : count + 1);
      setLoading(true);

      try {
        const res = await fetch(`/api/prompts/${promptId}/star`, {
          method: 'POST',
        });

        if (!res.ok) {
          // Revert
          setStarred(prevStarred);
          setCount(prevCount);
          showToast('Failed to update star');
          return;
        }

        const json = await res.json();
        // Sync with server truth
        setStarred(json.data.starred);
        setCount(json.data.starCount);
      } catch {
        // Revert
        setStarred(prevStarred);
        setCount(prevCount);
        showToast('Failed to update star');
      } finally {
        setLoading(false);
      }
    },
    [session, starred, count, loading, promptId, showToast]
  );

  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={
          compact
            ? 'flex items-center gap-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:rounded'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-900'
        }
        aria-label={starred ? 'Unstar prompt' : 'Star prompt'}
      >
        <Star
          className={`${iconSize} transition-colors ${
            starred ? 'fill-amber-400 text-amber-400' : 'text-neutral-400 hover:text-amber-400'
          }`}
        />
        <span
          className={
            starred
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-neutral-500 dark:text-neutral-400'
          }
        >
          {count}
        </span>
      </button>

      <SignInDialog isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
}
