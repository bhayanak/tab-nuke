import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/popup/components/SearchBar';
import { useStore } from '@/shared/store';

describe('SearchBar', () => {
  beforeEach(() => {
    useStore.setState({ searchQuery: '' });
  });

  it('renders search input', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search tabs...')).toBeInTheDocument();
  });

  it('displays current search query', () => {
    useStore.setState({ searchQuery: 'hello' });
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search tabs...')).toHaveValue('hello');
  });

  it('updates search query on input change', () => {
    render(<SearchBar />);
    fireEvent.change(screen.getByPlaceholderText('Search tabs...'), {
      target: { value: 'test query' },
    });
    expect(useStore.getState().searchQuery).toBe('test query');
  });
});
