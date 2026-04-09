'use client';

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'register';

export function SignInDialog({ isOpen, onClose }: SignInDialogProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    setMode('signin');
    onClose();
  }, [onClose, reset]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
      return;
    }

    handleClose();
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(json.error?.message ?? 'Registration failed');
        return;
      }

      setSuccess('Check your email to verify your account.');
    } catch {
      setLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'register' : 'signin');
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-md text-neutral-400 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-neutral-300"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2
          id="signin-dialog-title"
          className="mb-6 text-center text-2xl font-bold text-neutral-900 dark:text-neutral-100"
        >
          {mode === 'signin' ? 'Sign in to PromptVault' : 'Create your account'}
        </h2>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => signIn('google')}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => signIn('github')}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">or</span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Error / Success messages */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            {success}
          </div>
        )}

        {/* Credentials form */}
        {!success && (
          <form
            onSubmit={mode === 'signin' ? handleSignIn : handleRegister}
            className="flex flex-col gap-4"
          >
            {mode === 'register' && (
              <div>
                <label htmlFor="signin-name" className="sr-only">
                  Name
                </label>
                <input
                  id="signin-name"
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-violet-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="signin-email" className="sr-only">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-violet-500"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="sr-only">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-offset-neutral-900"
            >
              {loading
                ? mode === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle mode */}
        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={toggleMode}
                className="font-medium text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:rounded dark:text-neutral-100"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={toggleMode}
                className="font-medium text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:rounded dark:text-neutral-100"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
