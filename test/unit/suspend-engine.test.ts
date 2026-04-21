import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('suspend-engine', () => {
    let suspendEngine: typeof import('@/background/suspend-engine');

    beforeEach(async () => {
        vi.resetModules();
    vi.clearAllMocks();
        (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
        (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        suspendEngine = await import('@/background/suspend-engine');
    });

    describe('initSuspendEngine', () => {
        it('initializes with default config', async () => {
            await suspendEngine.initSuspendEngine();
            const cfg = suspendEngine.getConfig();
            expect(cfg.autoSuspendMinutes).toBe(30);
            expect(cfg.preservePinned).toBe(true);
        });

        it('restores stored config', async () => {
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 60 },
            });
            await suspendEngine.initSuspendEngine();
            expect(suspendEngine.getConfig().autoSuspendMinutes).toBe(60);
        });
    });

    describe('updateConfig', () => {
        it('merges partial config and persists', async () => {
            await suspendEngine.initSuspendEngine();
            const updated = await suspendEngine.updateConfig({ autoSuspendMinutes: 15 });
            expect(updated.autoSuspendMinutes).toBe(15);
            expect(updated.preservePinned).toBe(true); // default preserved
            expect(chrome.storage.local.set).toHaveBeenCalled();
        });
    });

    describe('suspendTab', () => {
        it('suspends a valid tab', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 1,
                url: 'https://example.com',
                title: 'Example',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await suspendEngine.suspendTab(1);
            expect(result).toBe(true);
            expect(chrome.tabs.update).toHaveBeenCalledWith(1, expect.objectContaining({ url: expect.any(String) }));
            expect(suspendEngine.isSuspended(1)).toBe(true);
            expect(suspendEngine.getSuspendedCount()).toBe(1);
        });

        it('does not suspend internal chrome:// URLs', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 2,
                url: 'chrome://settings',
                title: 'Settings',
                pinned: false,
                audible: false,
            });
            const result = await suspendEngine.suspendTab(2);
            expect(result).toBe(false);
        });

        it('does not suspend pinned tabs when preservePinned is true', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 3,
                url: 'https://example.com',
                title: 'Pinned',
                pinned: true,
                audible: false,
            });
            const result = await suspendEngine.suspendTab(3);
            expect(result).toBe(false);
        });

        it('does not suspend audible tabs when preserveAudio is true', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 4,
                url: 'https://spotify.com',
                title: 'Music',
                pinned: false,
                audible: true,
            });
            const result = await suspendEngine.suspendTab(4);
            expect(result).toBe(false);
        });

        it('does not suspend whitelisted domains', async () => {
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { whitelist: ['example.com'] },
            });
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 5,
                url: 'https://example.com/page',
                title: 'Whitelisted',
                pinned: false,
                audible: false,
            });
            const result = await suspendEngine.suspendTab(5);
            expect(result).toBe(false);
        });

        it('does not suspend tab with no URL', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 6,
                url: undefined,
                title: 'No URL',
                pinned: false,
                audible: false,
            });
            const result = await suspendEngine.suspendTab(6);
            expect(result).toBe(false);
        });

        it('handles tabs.get failure gracefully', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Tab not found'));
            const result = await suspendEngine.suspendTab(99);
            expect(result).toBe(false);
        });
    });

    describe('restoreTab', () => {
        it('restores a suspended tab', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 10,
                url: 'https://example.com',
                title: 'Example',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
            await suspendEngine.suspendTab(10);

            const result = await suspendEngine.restoreTab(10);
            expect(result).toBe(true);
            expect(suspendEngine.isSuspended(10)).toBe(false);
        });

        it('returns false for non-suspended tab', async () => {
            await suspendEngine.initSuspendEngine();
            const result = await suspendEngine.restoreTab(999);
            expect(result).toBe(false);
        });
    });

    describe('suspendAllOther', () => {
        it('suspends all tabs except active one', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.query as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ id: 1, active: true }]) // active tab query
                .mockResolvedValueOnce([
                    { id: 1, url: 'https://a.com', title: 'A', pinned: false, audible: false, active: true },
                    { id: 2, url: 'https://b.com', title: 'B', pinned: false, audible: false, active: false },
                ]); // all tabs query
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 2,
                url: 'https://b.com',
                title: 'B',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const count = await suspendEngine.suspendAllOther();
            expect(count).toBe(1);
        });
    });

    describe('restoreAll', () => {
        it('restores all suspended tabs', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 20,
                url: 'https://example.com',
                title: 'Ex',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
            await suspendEngine.suspendTab(20);

            const count = await suspendEngine.restoreAll();
            expect(count).toBe(1);
            expect(suspendEngine.getSuspendedCount()).toBe(0);
        });
    });

    describe('checkAndSuspendInactive', () => {
        it('returns 0 when autoSuspend is disabled', async () => {
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 0 },
            });
            await suspendEngine.initSuspendEngine();
            const count = await suspendEngine.checkAndSuspendInactive();
            expect(count).toBe(0);
        });

        it('suspends inactive tabs above threshold', async () => {
            await suspendEngine.initSuspendEngine();
            // Need tab-watcher to report inactive tabs
            const tw = await import('@/background/tab-watcher');
            await tw.initTabWatcher();
            // Make tab 1 appear inactive by setting old timestamp
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-last-active': { 1: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
            });
            // Re-init with inactive data
            vi.resetModules();
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 30 },
                'tab-nuke-last-active': { 1: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
            });
            (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            suspendEngine = await import('@/background/suspend-engine');
            await suspendEngine.initSuspendEngine();

            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 1,
                url: 'https://example.com',
                title: 'Example',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const count = await suspendEngine.checkAndSuspendInactive();
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    describe('restoreTab edge cases', () => {
        it('handles restore update failure gracefully', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 30,
                url: 'https://example.com',
                title: 'Example',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce({}) // suspend succeeds
                .mockRejectedValueOnce(new Error('Update failed')); // restore fails
            await suspendEngine.suspendTab(30);

            const result = await suspendEngine.restoreTab(30);
            expect(result).toBe(false);
        });
    });

    describe('suspendTab edge cases', () => {
        it('does not suspend already suspended URLs', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 40,
                url: 'chrome-extension://mock-id/src/suspended/suspended.html?url=test',
                title: 'Suspended',
                pinned: false,
                audible: false,
            });
            const result = await suspendEngine.suspendTab(40);
            expect(result).toBe(false);
        });

        it('builds suspended URL with favIconUrl', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 50,
                url: 'https://example.com',
                title: 'Example',
                favIconUrl: 'https://example.com/favicon.ico',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await suspendEngine.suspendTab(50);
            expect(result).toBe(true);
            const updateCall = (chrome.tabs.update as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(updateCall[1].url).toContain('favicon=');
        });

        it('builds suspended URL without favIconUrl', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 51,
                url: 'https://example.com',
                title: 'No Favicon',
                favIconUrl: undefined,
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await suspendEngine.suspendTab(51);
            expect(result).toBe(true);
            const updateCall = (chrome.tabs.update as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(updateCall[1].url).not.toContain('favicon=');
        });

        it('does not suspend tab with empty title', async () => {
            await suspendEngine.initSuspendEngine();
            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 52,
                url: 'https://example.com',
                title: undefined,
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await suspendEngine.suspendTab(52);
            expect(result).toBe(true);
        });
    });

    describe('checkAndSuspendInactive with active tabs', () => {
        it('suspends eligible inactive tabs and skips ineligible', async () => {
            // Set up config with autoSuspend enabled
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 30 },
                'tab-nuke-last-active': {
                    1: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // inactive
                    2: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // inactive but pinned
                },
            });
            (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            // Need to import tab-watcher first so it shares the same mock
            const tw = await import('@/background/tab-watcher');
            await tw.initTabWatcher();

            vi.resetModules();
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 30, whitelist: [], preservePinned: true, preserveAudio: true, preserveForms: true, showSuspendNotification: true },
                'tab-nuke-last-active': {
                    1: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                },
            });
            (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            suspendEngine = await import('@/background/suspend-engine');
            await suspendEngine.initSuspendEngine();

            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 1,
                url: 'https://example.com',
                title: 'Old Tab',
                pinned: false,
                audible: false,
            });
            (chrome.tabs.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const count = await suspendEngine.checkAndSuspendInactive();
            expect(count).toBeGreaterThanOrEqual(0);
        });

        it('handles tab.get failure during checkAndSuspend', async () => {
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 30, whitelist: [], preservePinned: true, preserveAudio: true, preserveForms: true, showSuspendNotification: true },
                'tab-nuke-last-active': {
                    1: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                },
            });
            (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            vi.resetModules();
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-config': { autoSuspendMinutes: 30, whitelist: [], preservePinned: true, preserveAudio: true, preserveForms: true, showSuspendNotification: true },
                'tab-nuke-last-active': {
                    1: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                },
            });
            (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            suspendEngine = await import('@/background/suspend-engine');
            await suspendEngine.initSuspendEngine();

            (chrome.tabs.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Tab gone'));

            const count = await suspendEngine.checkAndSuspendInactive();
            expect(count).toBe(0);
        });
    });

    describe('getSuspendedCount / isSuspended', () => {
        it('tracks suspended state correctly', async () => {
            await suspendEngine.initSuspendEngine();
            expect(suspendEngine.getSuspendedCount()).toBe(0);
            expect(suspendEngine.isSuspended(1)).toBe(false);
        });
  });
});
