'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useHotkeys } from 'react-hotkeys-hook';
import Link from 'next/link';
import { Sparkles, Search, Plus, Menu, X } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

function SearchInput({
  initialQuery,
  onSearch,
}: {
  initialQuery: string;
  onSearch: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    inputRef.current?.focus();
  });

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        ref={inputRef}
        id="search-input"
        type="text"
        placeholder="Search prompts..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-16 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:bg-neutral-800"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline-block dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-500">
        Ctrl+K
      </kbd>
    </div>
  );
}

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams],
  );

  // key={urlQuery} resets SearchInput state when URL changes externally (back/forward)
  return <SearchInput key={urlQuery} initialQuery={urlQuery} onSearch={handleSearch} />;
}

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  // Close mobile menu on resize
  useEffect(() => {
    const handler = () => setMobileOpen(false);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="text-base">PromptVault</span>
        </Link>

        {/* Desktop search */}
        <div className="hidden flex-1 justify-center md:flex">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {/* Desktop right section */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {session?.user && (
            <Link
              href="/prompts/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4" />
              New Prompt
            </Link>
          )}
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile hamburger */}
        <button
          className="ml-auto inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="border-t border-neutral-200 bg-white px-4 pb-4 pt-3 md:hidden dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="mb-3">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>
          <div className="flex flex-col gap-2">
            {session?.user && (
              <Link
                href="/prompts/new"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <Plus className="h-4 w-4" />
                New Prompt
              </Link>
            )}
            <div className="flex items-center gap-2 pt-1">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
