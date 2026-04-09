'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { KeyboardHint } from '@/components/keyboard-hint';
import { ToastProvider } from '@/components/toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ToastProvider>
          <KeyboardShortcuts />
          {children}
          <KeyboardHint />
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
