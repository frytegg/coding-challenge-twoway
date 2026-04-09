'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { SignInDialog } from './sign-in-dialog';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu() {
  const { data: session, status } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, [closeDropdown]);

  if (status === 'loading') {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
    );
  }

  if (!session?.user) {
    return (
      <>
        <button
          onClick={() => setDialogOpen(true)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Sign In
        </button>
        <SignInDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
      </>
    );
  }

  const user = session.user;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            {getInitials(user.name ?? user.email ?? '?')}
          </div>
        )}
        <span className="hidden text-sm font-medium text-neutral-700 sm:inline dark:text-neutral-200">
          {user.name}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`hidden text-neutral-400 transition-transform sm:inline ${dropdownOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <a
              href="/dashboard"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              onClick={() => setDropdownOpen(false)}
            >
              My Prompts
            </a>
            <button
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
