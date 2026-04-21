import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabCard } from '@/popup/components/TabCard';

describe('TabCard', () => {
  const defaultTab = {
    id: 1,
    url: 'https://example.com/page',
    title: 'Example Page',
    pinned: false,
    audible: false,
    suspended: false,
    favIconUrl: 'https://example.com/favicon.ico',
  };

  const onSuspend = vi.fn();
  const onRestore = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('renders tab title and domain', () => {
    render(<TabCard tab={defaultTab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByText('Example Page')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('renders favicon image', () => {
    const { container } = render(<TabCard tab={defaultTab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  it('renders placeholder when no favicon', () => {
    const tab = { ...defaultTab, favIconUrl: undefined };
    render(<TabCard tab={tab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('shows suspend button for active tabs', () => {
    render(<TabCard tab={defaultTab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByTitle('Suspend tab')).toBeInTheDocument();
  });

  it('shows restore button for suspended tabs', () => {
    const tab = { ...defaultTab, suspended: true };
    render(<TabCard tab={tab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByTitle('Restore tab')).toBeInTheDocument();
  });

  it('calls onSuspend when suspend button clicked', () => {
    render(<TabCard tab={defaultTab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Suspend tab'));
    expect(onSuspend).toHaveBeenCalledWith(1);
  });

  it('calls onRestore when restore button clicked', () => {
    const tab = { ...defaultTab, suspended: true };
    render(<TabCard tab={tab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Restore tab'));
    expect(onRestore).toHaveBeenCalledWith(1);
  });

  it('calls onClose when close button clicked', () => {
    render(<TabCard tab={defaultTab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close tab'));
    expect(onClose).toHaveBeenCalledWith(1);
  });

  it('activates tab on card click', () => {
    render(<TabCard tab={defaultTab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    // Click on the title text (which is inside the card)
    fireEvent.click(screen.getByText('Example Page'));
    expect(chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
  });

  it('shows pinned icon for pinned tabs', () => {
    const tab = { ...defaultTab, pinned: true };
    render(<TabCard tab={tab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByText('📌')).toBeInTheDocument();
  });

  it('shows audio icon for audible tabs', () => {
    const tab = { ...defaultTab, audible: true };
    render(<TabCard tab={tab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByText('🔊')).toBeInTheDocument();
  });

  it('shows sleep icon for suspended tabs', () => {
    const tab = { ...defaultTab, suspended: true };
    render(<TabCard tab={tab} onSuspend={onSuspend} onRestore={onRestore} onClose={onClose} />);
    expect(screen.getByText('💤', { exact: false })).toBeInTheDocument();
  });
});
