import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/sidebar/App';

vi.mock('@/shared/messages', () => ({
  getMemoryStats: vi.fn().mockResolvedValue({
    totalSavedMB: 50,
    currentUsageMB: 100,
    suspendedCount: 3,
    activeCount: 10,
    peakUsageMB: 200,
    savingsHistory: [{ date: '2024-01-01', savedMB: 25 }],
  }),
  getSessions: vi.fn().mockResolvedValue([
    {
      id: 'sess-1',
      name: 'Dev Session',
      tabs: [
        { url: 'https://a.com', title: 'Tab A', scrollPosition: { x: 0, y: 0 } },
        { url: 'https://b.com', title: 'Tab B', scrollPosition: { x: 0, y: 0 } },
      ],
      createdAt: new Date().toISOString(),
      tags: [],
      tabCount: 2,
    },
  ]),
  restoreSession: vi.fn().mockResolvedValue(true),
  deleteSession: vi.fn().mockResolvedValue(true),
}));

describe('sidebar App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', async () => {
    render(<App />);
    expect(screen.getByText('Tab Nuke')).toBeInTheDocument();
  });

  it('renders Analytics tab by default', async () => {
    render(<App />);
    expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
    expect(screen.getByText('💾 Sessions')).toBeInTheDocument();
  });

  it('loads and displays memory stats', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
    });
    expect(screen.getByText('10')).toBeInTheDocument(); // Active Tabs
    expect(screen.getByText('3')).toBeInTheDocument(); // Suspended
  });

  it('displays savings history', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Savings History')).toBeInTheDocument();
    });
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });

  it('switches to sessions view', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('💾 Sessions'));
    await waitFor(() => {
      expect(screen.getByText('Dev Session')).toBeInTheDocument();
    });
    expect(screen.getByText('2 tabs')).toBeInTheDocument();
  });

  it('renders session tab previews', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('💾 Sessions'));
    await waitFor(() => {
      expect(screen.getByText('Tab A')).toBeInTheDocument();
      expect(screen.getByText('Tab B')).toBeInTheDocument();
    });
  });

  it('restores a session', async () => {
    const { restoreSession } = await import('@/shared/messages');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('💾 Sessions'));
    await waitFor(() => {
      expect(screen.getByText('Restore')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Restore'));
    expect(restoreSession).toHaveBeenCalledWith('sess-1');
  });

  it('deletes a session', async () => {
    const { deleteSession } = await import('@/shared/messages');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('💾 Sessions'));
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Delete'));
    expect(deleteSession).toHaveBeenCalledWith('sess-1');
  });

  it('shows no sessions message when empty', async () => {
    const msgs = await import('@/shared/messages');
    (msgs.getSessions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('💾 Sessions'));
    await waitFor(() => {
      expect(screen.getByText('No saved sessions')).toBeInTheDocument();
    });
  });

  it('renders stat blocks with icons', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('📑')).toBeInTheDocument(); // Active Tabs icon
      expect(screen.getByText('💤')).toBeInTheDocument(); // Suspended icon
      expect(screen.getByText('📈')).toBeInTheDocument(); // Usage icon
    });
  });

  it('handles data load error gracefully', async () => {
    const msgs = await import('@/shared/messages');
    (msgs.getMemoryStats as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load sidebar data:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('shows peak usage stat', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Peak Usage')).toBeInTheDocument();
      expect(screen.getByText('🔺')).toBeInTheDocument();
    });
  });
});
