import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('search', () => {
  let search: typeof import('@/background/search');

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    search = await import('@/background/search');
  });

  describe('searchTabs', () => {
    it('returns empty array for empty query', async () => {
      const results = await search.searchTabs('');
      expect(results).toEqual([]);
    });

    it('returns empty array for whitespace query', async () => {
      const results = await search.searchTabs('   ');
      expect(results).toEqual([]);
    });

    it('finds tabs matching title', async () => {
      (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1, title: 'GitHub Repository', url: 'https://github.com' },
        { id: 2, title: 'Google Search', url: 'https://google.com' },
        { id: 3, title: 'Twitter Feed', url: 'https://twitter.com' },
      ]);

      const results = await search.searchTabs('github');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tab.id).toBe(1);
    });

    it('finds tabs matching URL', async () => {
      (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1, title: 'Page', url: 'https://example.com/special-path' },
        { id: 2, title: 'Other', url: 'https://other.com' },
      ]);

      const results = await search.searchTabs('special-path');
      expect(results.length).toBeGreaterThan(0);
    });

    it('includes score and suspended status', async () => {
      (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1, title: 'Test Page', url: 'https://test.com' },
      ]);

      const results = await search.searchTabs('test');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('suspended');
      expect(typeof results[0].suspended).toBe('boolean');
    });

    it('handles tabs without title or url', async () => {
      (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1, title: undefined, url: undefined },
        { id: 2, title: 'Has Title', url: undefined },
        { id: undefined, title: 'No ID', url: 'https://noid.com' },
      ]);

      // Should not throw
      const results = await search.searchTabs('has');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles tab without id', async () => {
      (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
        { title: 'Tab No ID', url: 'https://noid.com' },
      ]);

      const results = await search.searchTabs('noid');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].suspended).toBe(false);
    });
  });
});
