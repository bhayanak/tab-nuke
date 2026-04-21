import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryBadge } from '@/popup/components/MemoryBadge';
import { useStore } from '@/shared/store';

describe('MemoryBadge', () => {
  beforeEach(() => {
    useStore.setState({
      memoryStats: {
        totalSavedMB: 0,
        currentUsageMB: 150,
        suspendedCount: 0,
        activeCount: 5,
        peakUsageMB: 200,
        savingsHistory: [],
      },
    });
  });

  it('displays current memory usage', () => {
    render(<MemoryBadge />);
    expect(screen.getByText('150.0 MB')).toBeInTheDocument();
  });

  it('shows suspended count when > 0', () => {
    useStore.setState({
      memoryStats: {
        totalSavedMB: 50,
        currentUsageMB: 100,
        suspendedCount: 3,
        activeCount: 5,
        peakUsageMB: 200,
        savingsHistory: [],
      },
    });
    render(<MemoryBadge />);
    expect(screen.getByText(/3 saved/)).toBeInTheDocument();
  });

  it('hides suspended badge when count is 0', () => {
    render(<MemoryBadge />);
    expect(screen.queryByText(/saved/)).not.toBeInTheDocument();
  });

  it('formats sub-MB values as KB', () => {
    useStore.setState({
      memoryStats: {
        totalSavedMB: 0,
        currentUsageMB: 0.5,
        suspendedCount: 0,
        activeCount: 1,
        peakUsageMB: 1,
        savingsHistory: [],
      },
    });
    render(<MemoryBadge />);
    expect(screen.getByText('512 KB')).toBeInTheDocument();
  });
});
