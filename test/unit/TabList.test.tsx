import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabList } from '@/popup/pages/TabList';
import { useStore } from '@/shared/store';

vi.mock('@/shared/messages', () => ({
  suspendTab: vi.fn().mockResolvedValue(true),
  restoreTab: vi.fn().mockResolvedValue(true),
  suspendAll: vi.fn().mockResolvedValue(5),
  restoreAll: vi.fn().mockResolvedValue(3),
  toggleFocusMode: vi.fn().mockResolvedValue({ active: true, protectedDomain: 'test.com', closedTabs: [] }),
}));

describe('TabList', () => {
  const mockTabs = [
    { id: 1, url: 'https://github.com', title: 'GitHub', pinned: false, audible: false, suspended: false },
    { id: 2, url: 'https://google.com', title: 'Google', pinned: false, audible: false, suspended: true },
    { id: 3, url: 'https://twitter.com', title: 'Twitter', pinned: false, audible: false, suspended: false },
  ];

  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    useStore.setState({
      tabs: mockTabs,
      searchQuery: '',
      focusMode: { active: false, protectedDomain: '', closedTabs: [] },
    });
  });

  it('renders tab count summary', () => {
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText('3 tabs · 1 suspended')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
  });

  it('filters tabs by search query', () => {
    useStore.setState({ searchQuery: 'github' });
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    expect(screen.queryByText('Twitter')).not.toBeInTheDocument();
  });

  it('shows empty state for no matching tabs', () => {
    useStore.setState({ searchQuery: 'nonexistent' });
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText('No matching tabs found')).toBeInTheDocument();
  });

  it('shows empty state when no tabs', () => {
    useStore.setState({ tabs: [], searchQuery: '' });
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText('No tabs open')).toBeInTheDocument();
  });

  it('renders Suspend All button', () => {
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText(/Suspend All/)).toBeInTheDocument();
  });

  it('renders Restore All button', () => {
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText(/Restore All/)).toBeInTheDocument();
  });

  it('renders Focus mode button', () => {
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText(/Focus/)).toBeInTheDocument();
  });

  it('calls suspend all and refresh', async () => {
    const { suspendAll } = await import('@/shared/messages');
    render(<TabList onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText(/Suspend All/));
    expect(suspendAll).toHaveBeenCalled();
  });

  it('calls restore all and refresh', async () => {
    const { restoreAll } = await import('@/shared/messages');
    render(<TabList onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText(/Restore All/));
    expect(restoreAll).toHaveBeenCalled();
  });

  it('shows Defocus when focus mode is active', () => {
    useStore.setState({ focusMode: { active: true, protectedDomain: 'x.com', closedTabs: [] } });
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.getByText(/Defocus/)).toBeInTheDocument();
  });

  it('disables Restore All when no suspended tabs', () => {
    useStore.setState({
      tabs: [
        { id: 1, url: 'https://a.com', title: 'A', pinned: false, audible: false, suspended: false },
      ],
    });
    render(<TabList onRefresh={onRefresh} />);
    const btn = screen.getByText(/Restore All/);
    expect(btn).toBeDisabled();
  });

  it('calls handleSuspend on individual tab suspend button', async () => {
    const { suspendTab } = await import('@/shared/messages');
    render(<TabList onRefresh={onRefresh} />);
    const suspendButtons = screen.getAllByTitle('Suspend tab');
    fireEvent.click(suspendButtons[0]);
    expect(suspendTab).toHaveBeenCalledWith(1);
  });

  it('calls handleRestore on individual tab restore button', async () => {
    const { restoreTab } = await import('@/shared/messages');
    render(<TabList onRefresh={onRefresh} />);
    const restoreButtons = screen.getAllByTitle('Restore tab');
    fireEvent.click(restoreButtons[0]);
    expect(restoreTab).toHaveBeenCalledWith(2, 'https://google.com');
  });

  it('calls handleClose on individual tab close button', async () => {
    render(<TabList onRefresh={onRefresh} />);
    const closeButtons = screen.getAllByTitle('Close tab');
    fireEvent.click(closeButtons[0]);
    expect(chrome.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('toggles focus mode', async () => {
    const { toggleFocusMode } = await import('@/shared/messages');
    render(<TabList onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText(/Focus/));
    expect(toggleFocusMode).toHaveBeenCalled();
  });

  it('filters tabs by URL', () => {
    useStore.setState({ searchQuery: 'google' });
    render(<TabList onRefresh={onRefresh} />);
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });
});
