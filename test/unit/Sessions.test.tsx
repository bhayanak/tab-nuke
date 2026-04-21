import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sessions } from '@/popup/pages/Sessions';
import { useStore } from '@/shared/store';

vi.mock('@/shared/messages', () => ({
  saveSession: vi.fn().mockResolvedValue({
    id: 'new-1',
    name: 'My Session',
    tabs: [],
    createdAt: new Date().toISOString(),
    tags: [],
    tabCount: 3,
  }),
  restoreSession: vi.fn().mockResolvedValue(true),
  deleteSession: vi.fn().mockResolvedValue(true),
}));

describe('Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      sessions: [
        {
          id: 'sess-1',
          name: 'Work Session',
          tabs: [{ url: 'https://a.com', title: 'A', scrollPosition: { x: 0, y: 0 } }],
          createdAt: new Date().toISOString(),
          tags: [],
          tabCount: 1,
        },
      ],
    });
  });

  it('renders session name input', () => {
    render(<Sessions />);
    expect(screen.getByPlaceholderText('Session name...')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<Sessions />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders existing sessions', () => {
    render(<Sessions />);
    expect(screen.getByText('Work Session')).toBeInTheDocument();
    expect(screen.getByText(/1 tabs/)).toBeInTheDocument();
  });

  it('shows empty state when no sessions', () => {
    useStore.setState({ sessions: [] });
    render(<Sessions />);
    expect(screen.getByText('No saved sessions yet')).toBeInTheDocument();
  });

  it('saves a new session', async () => {
    const { saveSession } = await import('@/shared/messages');
    render(<Sessions />);
    fireEvent.change(screen.getByPlaceholderText('Session name...'), {
      target: { value: 'My Session' },
    });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(saveSession).toHaveBeenCalledWith('My Session', []));
  });

  it('does not save session with empty name', async () => {
    const { saveSession } = await import('@/shared/messages');
    render(<Sessions />);
    fireEvent.click(screen.getByText('Save'));
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('restores a session', async () => {
    const { restoreSession } = await import('@/shared/messages');
    render(<Sessions />);
    fireEvent.click(screen.getByTitle('Restore session'));
    expect(restoreSession).toHaveBeenCalledWith('sess-1');
  });

  it('deletes a session', async () => {
    const { deleteSession } = await import('@/shared/messages');
    render(<Sessions />);
    fireEvent.click(screen.getByTitle('Delete session'));
    expect(deleteSession).toHaveBeenCalledWith('sess-1');
  });

  it('saves session on Enter key', async () => {
    const { saveSession } = await import('@/shared/messages');
    render(<Sessions />);
    const input = screen.getByPlaceholderText('Session name...');
    fireEvent.change(input, { target: { value: 'Quick Save' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(saveSession).toHaveBeenCalledWith('Quick Save', []));
  });

  it('handles save session error', async () => {
    const { saveSession } = await import('@/shared/messages');
    (saveSession as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('save error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Sessions />);
    fireEvent.change(screen.getByPlaceholderText('Session name...'), {
      target: { value: 'Error Session' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save session:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('ignores non-Enter keydown', () => {
    render(<Sessions />);
    const input = screen.getByPlaceholderText('Session name...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    // Should not trigger save
  });
});
