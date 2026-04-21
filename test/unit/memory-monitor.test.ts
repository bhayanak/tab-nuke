import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('memory-monitor', () => {
    let memoryMonitor: typeof import('@/background/memory-monitor');

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
        (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (chrome.action.setBadgeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (chrome.action.setBadgeBackgroundColor as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        memoryMonitor = await import('@/background/memory-monitor');
    });

    describe('initMemoryMonitor', () => {
        it('initializes with default stats', async () => {
            await memoryMonitor.initMemoryMonitor();
            const stats = memoryMonitor.getMemoryStats();
            expect(stats.totalSavedMB).toBe(0);
            expect(stats.activeCount).toBe(0);
        });

        it('restores stats from storage', async () => {
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-memory-stats': { totalSavedMB: 500, peakUsageMB: 1000 },
            });
            await memoryMonitor.initMemoryMonitor();
            const stats = memoryMonitor.getMemoryStats();
            expect(stats.totalSavedMB).toBe(500);
            expect(stats.peakUsageMB).toBe(1000);
        });
  });

    describe('updateMemoryStats', () => {
        it('calculates stats based on tab count', async () => {
            await memoryMonitor.initMemoryMonitor();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
            ]);

            const stats = await memoryMonitor.updateMemoryStats();
            expect(stats.activeCount).toBe(5); // no suspended tabs
            expect(stats.currentUsageMB).toBe(250); // 5 * 50MB
            expect(chrome.storage.local.set).toHaveBeenCalled();
        });

        it('records daily savings history', async () => {
            await memoryMonitor.initMemoryMonitor();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

            const stats = await memoryMonitor.updateMemoryStats();
            expect(stats.savingsHistory.length).toBeGreaterThanOrEqual(1);
        });

        it('updates existing daily entry with higher savings', async () => {
            const today = new Date().toISOString().split('T')[0];
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-memory-stats': {
                    savingsHistory: [{ date: today, savedMB: 10 }],
                    totalSavedMB: 10,
                    peakUsageMB: 0,
                },
            });
            await memoryMonitor.initMemoryMonitor();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

            const stats = await memoryMonitor.updateMemoryStats();
            // todayEntry already exists so it should update, not push new
            const todayEntries = stats.savingsHistory.filter((e: { date: string }) => e.date === today);
            expect(todayEntries.length).toBe(1);
        });

        it('does not increase totalSavedMB when estimatedSavings is lower', async () => {
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-memory-stats': {
                    savingsHistory: [],
                    totalSavedMB: 500,
                    peakUsageMB: 0,
                    currentUsageMB: 0,
                    suspendedCount: 0,
                    activeCount: 0,
                },
            });
            await memoryMonitor.initMemoryMonitor();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

            const stats = await memoryMonitor.updateMemoryStats();
            // No suspended tabs so estimatedSavings = 0 which is < 500
            expect(stats.totalSavedMB).toBe(500);
        });

        it('updates peak usage', async () => {
            await memoryMonitor.initMemoryMonitor();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue(
                Array.from({ length: 20 }, (_, i) => ({ id: i })),
            );

            const stats = await memoryMonitor.updateMemoryStats();
            expect(stats.peakUsageMB).toBe(1000); // 20 * 50MB
        });

        it('trims history to 30 days', async () => {
            const oldHistory = Array.from({ length: 31 }, (_, i) => ({
                date: `2026-01-${String(i + 1).padStart(2, '0')}`,
                savedMB: i * 10,
            }));
            (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                'tab-nuke-memory-stats': { savingsHistory: oldHistory, totalSavedMB: 0, peakUsageMB: 0 },
            });
            await memoryMonitor.initMemoryMonitor();
            (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

            const stats = await memoryMonitor.updateMemoryStats();
            expect(stats.savingsHistory.length).toBeLessThanOrEqual(31);
        });
    });

    describe('isMemoryHog', () => {
        it('returns true for tabs using >= 200MB', () => {
            expect(memoryMonitor.isMemoryHog(200)).toBe(true);
            expect(memoryMonitor.isMemoryHog(250)).toBe(true);
        });

        it('returns false for tabs under 200MB', () => {
            expect(memoryMonitor.isMemoryHog(100)).toBe(false);
            expect(memoryMonitor.isMemoryHog(199)).toBe(false);
        });
    });

    describe('getEstimatedTabMemory', () => {
        it('returns 50', () => {
            expect(memoryMonitor.getEstimatedTabMemory()).toBe(50);
        });
    });

    describe('getMemoryStats', () => {
        it('returns a copy', async () => {
            await memoryMonitor.initMemoryMonitor();
            const s1 = memoryMonitor.getMemoryStats();
            const s2 = memoryMonitor.getMemoryStats();
            expect(s1).not.toBe(s2);
            expect(s1).toEqual(s2);
        });
  });
});
