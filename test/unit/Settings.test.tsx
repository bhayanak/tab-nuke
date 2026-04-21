import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '@/popup/pages/Settings';
import { useStore } from '@/shared/store';

vi.mock('@/shared/messages', () => ({
  updateConfig: vi.fn().mockImplementation(async (partial) => ({
    autoSuspendMinutes: 30,
    whitelist: [],
    preservePinned: true,
    preserveAudio: true,
    preserveForms: true,
    showSuspendNotification: true,
    ...partial,
  })),
}));

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      config: {
        autoSuspendMinutes: 30,
        whitelist: ['example.com'],
        preservePinned: true,
        preserveAudio: true,
        preserveForms: true,
        showSuspendNotification: true,
      },
      memoryStats: {
        totalSavedMB: 50,
        currentUsageMB: 100,
        suspendedCount: 3,
        activeCount: 10,
        peakUsageMB: 200,
        savingsHistory: [],
      },
    });
  });

  it('renders auto-suspend minutes input', () => {
    render(<Settings />);
    expect(screen.getByText(/Auto-suspend after/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('renders toggle options', () => {
    render(<Settings />);
    expect(screen.getByText('Preserve pinned tabs')).toBeInTheDocument();
    expect(screen.getByText('Preserve audio tabs')).toBeInTheDocument();
    expect(screen.getByText('Preserve forms')).toBeInTheDocument();
  });

  it('renders whitelist section', () => {
    render(<Settings />);
    expect(screen.getByText('Whitelist domains')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('renders memory stats', () => {
    render(<Settings />);
    expect(screen.getByText('Active Tabs')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders version number', () => {
    render(<Settings />);
    expect(screen.getByText('Tab Nuke v1.0.0')).toBeInTheDocument();
  });

  it('updates auto-suspend minutes', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    fireEvent.change(screen.getByDisplayValue('30'), {
      target: { value: '60' },
    });
    expect(updateConfig).toHaveBeenCalledWith({ autoSuspendMinutes: 60 });
  });

  it('adds domain to whitelist', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    fireEvent.change(screen.getByPlaceholderText('example.com'), {
      target: { value: 'newsite.com' },
    });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() =>
      expect(updateConfig).toHaveBeenCalledWith({
        whitelist: ['example.com', 'newsite.com'],
      }),
    );
  });

  it('removes domain from whitelist', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    fireEvent.click(screen.getByText('×'));
    expect(updateConfig).toHaveBeenCalledWith({ whitelist: [] });
  });

  it('does not add empty domain', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    fireEvent.click(screen.getByText('Add'));
    expect(updateConfig).not.toHaveBeenCalled();
  });

  it('does not add duplicate domain', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    fireEvent.change(screen.getByPlaceholderText('example.com'), {
      target: { value: 'example.com' },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(updateConfig).not.toHaveBeenCalled();
  });

  it('toggles preservePinned option', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    // Find the toggle div for "Preserve pinned tabs" and click it
    const toggleLabel = screen.getByText('Preserve pinned tabs');
    const labelWrapper = toggleLabel.closest('label')!;
    const toggleDiv = labelWrapper.querySelector('.rounded-full')!;
    fireEvent.click(toggleDiv);
    expect(updateConfig).toHaveBeenCalledWith({ preservePinned: false });
  });

  it('toggles preserveAudio option', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    const toggleLabel = screen.getByText('Preserve audio tabs');
    const labelWrapper = toggleLabel.closest('label')!;
    const toggleDiv = labelWrapper.querySelector('.rounded-full')!;
    fireEvent.click(toggleDiv);
    expect(updateConfig).toHaveBeenCalledWith({ preserveAudio: false });
  });

  it('adds whitelist domain on Enter key', async () => {
    const { updateConfig } = await import('@/shared/messages');
    render(<Settings />);
    const input = screen.getByPlaceholderText('example.com');
    fireEvent.change(input, { target: { value: 'enter-site.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(updateConfig).toHaveBeenCalledWith({
        whitelist: ['example.com', 'enter-site.com'],
      }),
    );
  });
});
