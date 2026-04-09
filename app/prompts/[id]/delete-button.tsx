'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function DeleteButton({ promptId }: { promptId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-300">Delete this prompt?</span>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-900"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-900"
        >
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus-visible:ring-offset-neutral-900"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>
  );
}
