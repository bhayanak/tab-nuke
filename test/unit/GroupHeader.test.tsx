import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupHeader } from '@/popup/components/GroupHeader';

describe('GroupHeader', () => {
  it('renders group name and count', () => {
    render(<GroupHeader name="Work" count={5} collapsed={false} onToggle={() => {}} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<GroupHeader name="Work" count={3} collapsed={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('renders collapsed state', () => {
    render(<GroupHeader name="Work" count={3} collapsed={true} onToggle={() => {}} />);
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('renders expanded state', () => {
    render(<GroupHeader name="Work" count={3} collapsed={false} onToggle={() => {}} />);
    const arrow = screen.getByText('▶');
    expect(arrow).toBeInTheDocument();
    // When expanded, the arrow should be rotated (via style)
    expect(arrow.style.transform).toBe('rotate(90deg)');
  });
});
