import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('group-engine', () => {
    let groupEngine: typeof import('@/background/group-engine');

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
        (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        groupEngine = await import('@/background/group-engine');
    });

    describe('groupByDomain', () => {
        it('groups tabs by domain when 2+ tabs share domain', async () => {
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://github.com/repo1' },
                { id: 2, url: 'https://github.com/repo2' },
                { id: 3, url: 'https://google.com/search' },
            ]);
            (chrome.tabs.group as ReturnType<typeof vi.fn>).mockResolvedValue(100);
            (chrome.tabGroups.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const groups = await groupEngine.groupByDomain();
            expect(groups.length).toBe(1); // only github.com has 2+ tabs
            expect(groups[0].name).toBe('github.com');
            expect(groups[0].tabIds).toEqual([1, 2]);
        });

        it('skips tabs without URL or id', async () => {
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com' },
                { id: undefined, url: 'https://a.com' },
                { id: 2, url: undefined },
            ]);
            (chrome.tabs.group as ReturnType<typeof vi.fn>).mockResolvedValue(100);
            (chrome.tabGroups.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const groups = await groupEngine.groupByDomain();
            expect(groups.length).toBe(0);
        });

        it('handles tabGroups API failure gracefully', async () => {
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com/1' },
                { id: 2, url: 'https://a.com/2' },
            ]);
            (chrome.tabs.group as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not supported'));

            const groups = await groupEngine.groupByDomain();
            expect(groups.length).toBe(0);
        });

        it('assigns different colors to groups', async () => {
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com/1' },
                { id: 2, url: 'https://a.com/2' },
                { id: 3, url: 'https://b.com/1' },
                { id: 4, url: 'https://b.com/2' },
            ]);
            (chrome.tabs.group as ReturnType<typeof vi.fn>).mockResolvedValue(100);
            (chrome.tabGroups.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const groups = await groupEngine.groupByDomain();
            expect(groups.length).toBe(2);
            expect(groups[0].color).not.toBe(groups[1].color);
        });
    });

    describe('ungroupAll', () => {
        it('ungroups all grouped tabs', async () => {
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, groupId: 5 },
                { id: 2, groupId: -1 },
                { id: 3, groupId: 10 },
            ]);
            (chrome.tabs.ungroup as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await groupEngine.ungroupAll();
            expect(chrome.tabs.ungroup).toHaveBeenCalledTimes(2);
        });

        it('handles ungroup failure gracefully', async () => {
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, groupId: 5 },
            ]);
            (chrome.tabs.ungroup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

            await expect(groupEngine.ungroupAll()).resolves.toBeUndefined();
        });
    });

    describe('getExistingGroups', () => {
        it('returns existing tab groups with tabs', async () => {
            (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 5, title: 'Work', color: 'blue', collapsed: false },
            ]);
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1 }, { id: 2 },
            ]);

        const groups = await groupEngine.getExistingGroups();
        expect(groups.length).toBe(1);
        expect(groups[0].name).toBe('Work');
        expect(groups[0].tabIds.length).toBe(2);
    });

      it('handles API failure gracefully', async () => {
          (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
          const groups = await groupEngine.getExistingGroups();
          expect(groups).toEqual([]);
      });

      it('uses fallback name for groups without title', async () => {
          (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([
              { id: 7, title: undefined, color: 'red', collapsed: true },
          ]);
        (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const groups = await groupEngine.getExistingGroups();
        expect(groups[0].name).toBe('Group 7');
        expect(groups[0].isCollapsed).toBe(true);
    });
  });
});
