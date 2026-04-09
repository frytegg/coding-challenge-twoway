import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import PromptForm from '@/components/prompt-form';

export const metadata: Metadata = {
  title: 'Edit Prompt — PromptVault',
};

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, prompt] = await Promise.all([
    auth(),
    prisma.prompt.findUnique({
      where: { id },
      include: { tags: { select: { id: true, name: true } } },
    }),
  ]);

  if (!prompt) notFound();

  // Only the author can edit
  if (!session?.user?.id || session.user.id !== prompt.authorId) {
    redirect(`/prompts/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Edit Prompt</h1>
      <PromptForm
        mode="edit"
        initialData={{
          id: prompt.id,
          title: prompt.title,
          body: prompt.body,
          tags: prompt.tags,
          isPublic: prompt.isPublic,
        }}
      />
    </div>
  );
}
