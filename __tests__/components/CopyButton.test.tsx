import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CopyButton } from '@/app/prompts/[id]/copy-button';

describe('CopyButton', () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText },
    });
    mockWriteText.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls clipboard.writeText with the correct text on click', async () => {
    const text = 'Hello, world!';
    render(<CopyButton text={text} />);

    const button = screen.getByRole('button', { name: /copy prompt/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockWriteText).toHaveBeenCalledWith(text);
  });

  it('shows "Copied!" after clicking', async () => {
    render(<CopyButton text="test" />);

    // Initially shows "Copy"
    expect(screen.getByText('Copy')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /copy prompt/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('reverts to "Copy" after 2 seconds', async () => {
    render(<CopyButton text="test" />);

    const button = screen.getByRole('button', { name: /copy prompt/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();

    // Advance past the 2-second timeout
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});
