'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const shortcuts = [
  { keys: 'Ctrl+K', description: 'Focus search' },
  { keys: 'Ctrl+N', description: 'New prompt' },
  { keys: 'Ctrl+D', description: 'Toggle dark mode' },
  { keys: 'Escape', description: 'Blur / close' },
];

export function KeyboardHint() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={panelRef}>
      {open && (
        <div className="mb-2 w-56 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Keyboard Shortcuts
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-neutral-300"
              aria-label="Close shortcuts"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-2">
            {shortcuts.map((s) => (
              <li key={s.keys} className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">{s.description}</span>
                <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {s.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-950"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        <span className="text-sm font-medium">?</span>
      </button>
    </div>
  );
}
