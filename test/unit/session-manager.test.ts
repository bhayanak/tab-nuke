import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('session-manager', () => {
    let sessionManager: typeof import('@/background/session-manager');

    beforeEach(async () => {
        vi.resetModules();
    vi.clearAllMocks();
        (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
        (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        sessionManager = await import('@/background/session-manager');
  });

    describe('initSessionManager', () => {
        it('initializes with empty sessions', async () => {
            await sessionManager.initSessionManager();
            expect(sessionManager.getSessions()).toEqual([]);
        });

        it('restores sessions from storage', async () => {
            const stored = [{ id: '1', name: 'Test', tabs: [], createdAt: '2026-01-01', tags: [], tabCount: 0 }];
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-sessions': stored,
            });
            await sessionManager.initSessionManager();
            expect(sessionManager.getSessions()).toEqual(stored);
        });
    });

    describe('saveSession', () => {
        it('creates a session with current tabs', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://example.com', title: 'Example', groupId: -1 },
                { id: 2, url: 'https://test.com', title: 'Test', groupId: -1 },
            ]);

            const session = await sessionManager.saveSession('My Session', ['work']);
            expect(session.name).toBe('My Session');
            expect(session.tabs.length).toBe(2);
            expect(session.tags).toContain('work');
            expect(session.tabCount).toBe(2);
            expect(session.id).toBeDefined();
            expect(chrome.storage.local.set).toHaveBeenCalled();
        });

        it('filters tabs without URL', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://example.com', title: 'Has URL' },
                { id: 2, url: undefined, title: 'No URL' },
            ]);

            const session = await sessionManager.saveSession('Filtered');
            expect(session.tabs.length).toBe(1);
        });

        it('includes group name for grouped tabs', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://example.com', title: 'Grouped', groupId: 5 },
            ]);
            (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 5, title: 'Work', color: 'blue', collapsed: false },
            ]);

            const session = await sessionManager.saveSession('With Groups');
            expect(session.tabs[0].groupName).toBe('Work');
        });

        it('uses fallback group name when title is undefined', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://example.com', title: 'Tab', groupId: 7 },
            ]);
            (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 7, title: undefined, color: 'blue', collapsed: false },
            ]);

            const session = await sessionManager.saveSession('Fallback Group');
            expect(session.tabs[0].groupName).toBe('Group 7');
      });

        it('does not include groupName for tabs without group', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://example.com', title: 'Ungrouped', groupId: -1 },
            ]);

            const session = await sessionManager.saveSession('No Group');
            expect(session.tabs[0].groupName).toBeUndefined();
        });
    });

    describe('restoreSession', () => {
        it('restores tabs from saved session', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com', title: 'A' },
            ]);
            const session = await sessionManager.saveSession('Restore Test');

            (chrome.tabs.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 10 });
            const result = await sessionManager.restoreSession(session.id);
            expect(result).toBe(true);
            expect(chrome.tabs.create).toHaveBeenCalled();
        });

        it('returns false for non-existent session', async () => {
            await sessionManager.initSessionManager();
            const result = await sessionManager.restoreSession('nonexistent');
            expect(result).toBe(false);
        });

        it('re-creates tab groups during restore', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com', title: 'A', groupId: 5 },
            ]);
            (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 5, title: 'Dev', color: 'blue', collapsed: false },
            ]);
            const session = await sessionManager.saveSession('Groups Test');

            (chrome.tabs.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 20 });
            (chrome.tabs.group as ReturnType<typeof vi.fn>).mockResolvedValue(99);
            (chrome.tabGroups.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            await sessionManager.restoreSession(session.id);
            expect(chrome.tabs.group).toHaveBeenCalled();
            expect(chrome.tabGroups.update).toHaveBeenCalledWith(99, expect.objectContaining({ title: 'Dev' }));
        });

        it('handles tab group API failure gracefully', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com', title: 'A', groupId: 5 },
            ]);
            (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 5, title: 'Dev', color: 'blue', collapsed: false },
            ]);
            const session = await sessionManager.saveSession('Error Test');

            (chrome.tabs.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 20 });
            (chrome.tabs.group as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not supported'));

            const result = await sessionManager.restoreSession(session.id);
            expect(result).toBe(true); // Should still succeed
        });
    });

    describe('deleteSession', () => {
        it('deletes an existing session', async () => {
            await sessionManager.initSessionManager();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1, url: 'https://a.com', title: 'A' },
            ]);
            const session = await sessionManager.saveSession('Delete Me');

            const result = await sessionManager.deleteSession(session.id);
            expect(result).toBe(true);
            expect(sessionManager.getSessions().length).toBe(0);
        });

        it('returns false for non-existent session', async () => {
            await sessionManager.initSessionManager();
            const result = await sessionManager.deleteSession('nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('getSessions', () => {
        it('returns a copy of sessions array', async () => {
            await sessionManager.initSessionManager();
            const sessions = sessionManager.getSessions();
            expect(Array.isArray(sessions)).toBe(true);
        });
  });
});
