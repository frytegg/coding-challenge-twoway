import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromptCard, type PromptCardData } from '@/components/prompt-card';

// ── Mocks ──────────────────────────────────────────────────────

// Mock next/link to render a plain <a> tag
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock StarButton to avoid needing SessionProvider / ToastProvider
vi.mock('@/components/star-button', () => ({
  StarButton: ({ initialCount }: { initialCount: number }) => (
    <span data-testid="star-count">{initialCount}</span>
  ),
}));

// ── Test Data ──────────────────────────────────────────────────

const mockPrompt: PromptCardData = {
  id: 'prompt-123',
  title: 'Write a Python web scraper',
  body: '## Instructions\n\nCreate a **Python** script that scrapes product prices from an e-commerce site.',
  starCount: 42,
  isStarred: false,
  createdAt: new Date('2025-01-15T10:00:00Z').toISOString(),
  author: {
    id: 'user-1',
    name: 'Alice Johnson',
    image: null,
  },
  tags: [
    { id: 'tag-1', name: 'python' },
    { id: 'tag-2', name: 'web-scraping' },
    { id: 'tag-3', name: 'automation' },
  ],
};

// ── Tests ──────────────────────────────────────────────────────

describe('PromptCard', () => {
  it('renders the title', () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('Write a Python web scraper')).toBeInTheDocument();
  });

  it('renders each tag name as a pill', () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('web-scraping')).toBeInTheDocument();
    expect(screen.getByText('automation')).toBeInTheDocument();
  });

  it('displays the star count', () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByTestId('star-count')).toHaveTextContent('42');
  });

  it("displays the author's name", () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('links to /prompts/[id]', () => {
    render(<PromptCard prompt={mockPrompt} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/prompts/prompt-123');
  });

  it('renders "Anonymous" when author name is null', () => {
    const noNamePrompt: PromptCardData = {
      ...mockPrompt,
      author: { ...mockPrompt.author, name: null },
    };
    render(<PromptCard prompt={noNamePrompt} />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });
});
