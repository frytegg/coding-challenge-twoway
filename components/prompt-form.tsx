'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface PromptFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    body: string;
    tags: { id: string; name: string }[];
    isPublic: boolean;
  };
}

export default function PromptForm({ mode, initialData }: PromptFormProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [tags, setTags] = useState<string[]>(
    initialData?.tags.map((t) => t.name) ?? [],
  );
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Avoid hydration mismatch — resolvedTheme is undefined on first render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const colorMode = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  // ── Tag helpers ──────────────────────────────────────────────────

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If user pastes or types a comma, split and add all parts except the trailing one
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.slice(0, -1).forEach((p) => addTag(p));
      setTagInput(parts[parts.length - 1]);
    } else {
      setTagInput(value);
    }
  };

  // ── Validation ───────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!body.trim()) errs.body = 'Prompt body is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');

    try {
      const url =
        mode === 'create'
          ? '/api/prompts'
          : `/api/prompts/${initialData!.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tags,
          isPublic,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setApiError(json.error?.message ?? 'Something went wrong');
        return;
      }

      router.push(`/prompts/${json.data.id}`);
    } catch {
      setApiError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1.5">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="Give your prompt a title"
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Body — Markdown editor */}
      <div data-color-mode={colorMode}>
        <label className="block text-sm font-medium mb-1.5">Body</label>
        <MDEditor
          value={body}
          onChange={(val) => {
            setBody(val ?? '');
            if (errors.body) setErrors((prev) => ({ ...prev, body: '' }));
          }}
          height={300}
          preview="edit"
          style={{ minHeight: 300 }}
        />
        {errors.body && (
          <p className="mt-1 text-sm text-red-500">{errors.body}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tag-input" className="block text-sm font-medium mb-1.5">
          Tags
        </label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          id="tag-input"
          type="text"
          value={tagInput}
          onChange={handleTagChange}
          onKeyDown={handleTagKeyDown}
          placeholder="Type a tag and press Enter"
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {/* Public toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="relative inline-block">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="sr-only peer"
          />
          <span className="block h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2 dark:bg-neutral-700 dark:peer-focus-visible:ring-offset-neutral-950" />
          <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </span>
        <span className="text-sm">Make this prompt public</span>
      </label>

      {/* API error */}
      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {apiError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? 'Saving…'
          : mode === 'create'
            ? 'Create Prompt'
            : 'Save Changes'}
      </button>
    </form>
  );
}
