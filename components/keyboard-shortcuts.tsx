'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useHotkeys } from 'react-hotkeys-hook';

function isFormElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  // Ctrl+K / Cmd+K → focus search input
  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    const input = document.getElementById('search-input') as HTMLInputElement | null;
    input?.focus();
  });

  // Ctrl+N / Cmd+N → navigate to new prompt (if authenticated)
  useHotkeys('ctrl+n, meta+n', (e) => {
    if (isFormElement(document.activeElement)) return;
    e.preventDefault();
    if (session?.user) {
      router.push('/prompts/new');
    }
  });

  // Ctrl+D / Cmd+D → toggle dark mode
  useHotkeys('ctrl+d, meta+d', (e) => {
    if (isFormElement(document.activeElement)) return;
    e.preventDefault();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  });

  // Escape → blur active element (always works, even in form fields)
  useHotkeys(
    'escape',
    () => {
      (document.activeElement as HTMLElement)?.blur?.();
    },
    { enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'] },
  );

  return null;
}
