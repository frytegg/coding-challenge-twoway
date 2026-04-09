'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEMES = ['system', 'light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cycle = () => {
    const idx = THEMES.indexOf((theme as Theme) ?? 'system');
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg" aria-hidden />;
  }

  const current = (theme as Theme) ?? 'system';
  const Icon = ICONS[current];

  return (
    <button
      onClick={cycle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      aria-label={`Theme: ${current}. Click to cycle.`}
      title={`Theme: ${current}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
