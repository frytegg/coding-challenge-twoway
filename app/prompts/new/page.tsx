import type { Metadata } from 'next';
import PromptForm from '@/components/prompt-form';

export const metadata: Metadata = {
  title: 'Create New Prompt — PromptVault',
};

export default function NewPromptPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">
        Create New Prompt
      </h1>
      <PromptForm mode="create" />
    </div>
  );
}
