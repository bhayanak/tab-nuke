import Fuse from 'fuse.js';
import { isSuspended } from './suspend-engine';

interface SearchResult {
  tab: chrome.tabs.Tab;
  score: number;
  suspended: boolean;
}

export async function searchTabs(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const tabs = await chrome.tabs.query({});
  const items = tabs.map((tab) => ({
    tab,
    title: tab.title ?? '',
    url: tab.url ?? '',
    suspended: tab.id ? isSuspended(tab.id) : false,
  }));

  const fuse = new Fuse(items, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'url', weight: 0.4 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(query);
  return results.map((r) => ({
    tab: r.item.tab,
    score: r.score ?? 1,
    suspended: r.item.suspended,
  }));
}
