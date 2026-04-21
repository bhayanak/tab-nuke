import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Groups } from '@/popup/pages/Groups';
import { useStore } from '@/shared/store';

describe('Groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    useStore.setState({
      tabs: [
        { id: 1, url: 'https://github.com/repo1', title: 'Repo 1', pinned: false, audible: false, suspended: false },
        { id: 2, url: 'https://github.com/repo2', title: 'Repo 2', pinned: false, audible: false, suspended: false },
        { id: 3, url: 'https://google.com/search', title: 'Search', pinned: false, audible: false, suspended: false },
      ],
    });
  });

  it('renders Group by Domain button', () => {
    render(<Groups />);
    expect(screen.getByText(/Group by Domain/)).toBeInTheDocument();
  });

  it('renders domain groups', () => {
    render(<Groups />);
    expect(screen.getByText('github.com')).toBeInTheDocument();
    expect(screen.getByText('google.com')).toBeInTheDocument();
  });

  it('shows tab count per domain', () => {
    render(<Groups />);
    expect(screen.getByText('2')).toBeInTheDocument(); // github.com has 2
    expect(screen.getByText('1')).toBeInTheDocument(); // google.com has 1
  });

  it('shows tab titles under domains', () => {
    render(<Groups />);
    expect(screen.getByText('Repo 1')).toBeInTheDocument();
    expect(screen.getByText('Repo 2')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('sends GROUP_BY_DOMAIN message on button click', () => {
    render(<Groups />);
    fireEvent.click(screen.getByText(/Group by Domain/));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'GROUP_BY_DOMAIN' });
  });

  it('activates tab on click', () => {
    render(<Groups />);
    fireEvent.click(screen.getByText('Repo 1'));
    expect(chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
  });

  it('sorts domains by tab count (most first)', () => {
    render(<Groups />);
    const domainHeaders = screen.getAllByText(/github\.com|google\.com/);
    expect(domainHeaders[0].textContent).toBe('github.com');
  });

  it('renders tab favicon when available', () => {
    useStore.setState({
      tabs: [
        { id: 1, url: 'https://github.com', title: 'GH', pinned: false, audible: false, suspended: false, favIconUrl: 'https://github.com/favicon.ico' },
      ],
    });
    const { container } = render(<Groups />);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://github.com/favicon.ico');
  });

  it('handles tabs with no valid URL', () => {
    useStore.setState({
      tabs: [
        { id: 1, url: '', title: 'No URL', pinned: false, audible: false, suspended: false },
      ],
    });
    render(<Groups />);
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('handles group by domain error', async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Groups />);
    fireEvent.click(screen.getByText(/Group by Domain/));
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
