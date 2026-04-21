import { describe, it, expect } from 'vitest';
import { getDomain } from '@/shared/utils';

describe('Group Engine Logic', () => {
  it('groups tabs by domain correctly', () => {
    const tabs = [
      { url: 'https://github.com/repo1', title: 'Repo 1' },
      { url: 'https://github.com/repo2', title: 'Repo 2' },
      { url: 'https://google.com/search', title: 'Search' },
      { url: 'https://google.com/maps', title: 'Maps' },
      { url: 'https://example.com', title: 'Example' },
    ];

    const groups = new Map<string, typeof tabs>();
    for (const tab of tabs) {
      const domain = getDomain(tab.url);
      const group = groups.get(domain) ?? [];
      group.push(tab);
      groups.set(domain, group);
    }

    expect(groups.get('github.com')?.length).toBe(2);
    expect(groups.get('google.com')?.length).toBe(2);
    expect(groups.get('example.com')?.length).toBe(1);
  });

  it('filters single-tab domains for grouping', () => {
    const domainCounts = new Map([
      ['github.com', 3],
      ['google.com', 2],
      ['example.com', 1],
    ]);

    const groupable = Array.from(domainCounts.entries()).filter(
      ([, count]) => count >= 2,
    );
    expect(groupable.length).toBe(2);
  });
});
