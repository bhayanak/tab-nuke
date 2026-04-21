import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/popup/App';
import { useStore } from '@/shared/store';

vi.mock('@/shared/messages', () => ({
  getAllTabs: vi.fn().mockResolvedValue([
    { id: 1, url: 'https://example.com', title: 'Example', pinned: false, audible: false },
  ]),
  getSessions: vi.fn().mockResolvedValue([]),
  getConfig: vi.fn().mockResolvedValue({
    autoSuspendMinutes: 30,
    whitelist: [],
    preservePinned: true,
    preserveAudio: true,
    preserveForms: true,
    showSuspendNotification: true,
  }),
  getMemoryStats: vi.fn().mockResolvedValue({
    totalSavedMB: 0,
    currentUsageMB: 100,
    suspendedCount: 0,
    activeCount: 1,
    peakUsageMB: 100,
    savingsHistory: [],
  }),
  suspendTab: vi.fn().mockResolvedValue(true),
  restoreTab: vi.fn().mockResolvedValue(true),
  suspendAll: vi.fn().mockResolvedValue(1),
  restoreAll: vi.fn().mockResolvedValue(0),
  toggleFocusMode: vi.fn().mockResolvedValue({ active: false, protectedDomain: '', closedTabs: [] }),
}));

describe('popup App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    useStore.setState({
      activeView: 'tabs',
      tabs: [],
      sessions: [],
      searchQuery: '',
      loading: false,
      config: {
        autoSuspendMinutes: 30,
        whitelist: [],
        preservePinned: true,
        preserveAudio: true,
        preserveForms: true,
        showSuspendNotification: true,
      },
      memoryStats: {
        totalSavedMB: 0,
        currentUsageMB: 0,
        suspendedCount: 0,
        activeCount: 0,
        peakUsageMB: 0,
        savingsHistory: [],
      },
      focusMode: { active: false, protectedDomain: '', closedTabs: [] },
    });
  });

  it('renders header with Tab Nuke', async () => {
    render(<App />);
    expect(screen.getByText('Tab Nuke')).toBeInTheDocument();
  });

  it('renders navigation tabs', async () => {
    render(<App />);
    expect(screen.getByText('📑 Tabs')).toBeInTheDocument();
    expect(screen.getByText('💾 Sessions')).toBeInTheDocument();
    expect(screen.getByText('📁 Groups')).toBeInTheDocument();
    expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
  });

  it('renders search bar', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Search tabs...')).toBeInTheDocument();
  });

  it('loads data on mount', async () => {
    const { getAllTabs, getSessions, getConfig, getMemoryStats } =
      await import('@/shared/messages');

    render(<App />);

    await waitFor(() => {
      expect(getAllTabs).toHaveBeenCalled();
      expect(getSessions).toHaveBeenCalled();
      expect(getConfig).toHaveBeenCalled();
      expect(getMemoryStats).toHaveBeenCalled();
    });
  });

  it('shows TabList by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Suspend All/)).toBeInTheDocument();
    });
  });

  it('navigates to Sessions view', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('💾 Sessions'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Session name...')).toBeInTheDocument();
    });
  });

  it('navigates to Groups view', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('📁 Groups'));
    await waitFor(() => {
      expect(screen.getByText(/Group by Domain/)).toBeInTheDocument();
    });
  });

  it('navigates to Settings view', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('⚙️ Settings'));
    await waitFor(() => {
      expect(screen.getByText(/Auto-suspend after/)).toBeInTheDocument();
    });
  });

  it('renders emoji logo', () => {
    render(<App />);
    expect(screen.getByText('☢️')).toBeInTheDocument();
  });

  it('handles data load error gracefully', async () => {
    const msgs = await import('@/shared/messages');
    (msgs.getAllTabs as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load data:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('maps tabs with undefined fields correctly', async () => {
    const msgs = await import('@/shared/messages');
    (msgs.getAllTabs as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, url: undefined, title: undefined, pinned: undefined, audible: undefined, favIconUrl: undefined },
      { id: 2, url: 'chrome-extension://x/suspended.html?url=test', title: 'Suspended', pinned: false, audible: false },
      { id: 3, url: 'https://ok.com', title: 'OK', pinned: true, audible: true, groupId: 5 },
    ]);

    render(<App />);

    await waitFor(() => {
      expect(useStore.getState().tabs.length).toBe(3);
    });

    const tabs = useStore.getState().tabs;
    expect(tabs[0].url).toBe('');
    expect(tabs[0].title).toBe('Untitled');
    expect(tabs[0].pinned).toBe(false);
    expect(tabs[0].audible).toBe(false);
    expect(tabs[0].suspended).toBe(false);
    expect(tabs[1].suspended).toBe(true);
    expect(tabs[2].pinned).toBe(true);
    expect(tabs[2].audible).toBe(true);
    expect(tabs[2].groupId).toBe(5);
  });
});
