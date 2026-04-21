import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('tab-watcher', () => {
  let tabWatcher: typeof import('@/background/tab-watcher');

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    tabWatcher = await import('@/background/tab-watcher');
  });

  describe('initTabWatcher', () => {
    it('initializes with empty map when no stored data', async () => {
      await tabWatcher.initTabWatcher();
      expect(chrome.storage.local.get).toHaveBeenCalled();
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalled();
    });

    it('restores last active map from storage', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        'tab-nuke-last-active': { 1: '2026-01-01T00:00:00.000Z' },
      });
      await tabWatcher.initTabWatcher();
      expect(tabWatcher.getLastActive(1)).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('markActive', () => {
    it('sets lastActive timestamp for tab', async () => {
      await tabWatcher.initTabWatcher();
      tabWatcher.markActive(42);
      expect(tabWatcher.getLastActive(42)).toBeDefined();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('getLastActive', () => {
    it('returns undefined for unknown tab', async () => {
      await tabWatcher.initTabWatcher();
      expect(tabWatcher.getLastActive(999)).toBeUndefined();
    });
  });

  describe('getAllLastActive', () => {
    it('returns copy of last active map', async () => {
      await tabWatcher.initTabWatcher();
      tabWatcher.markActive(1);
      tabWatcher.markActive(2);
      const all = tabWatcher.getAllLastActive();
      expect(Object.keys(all).length).toBe(2);
    });
  });

  describe('getInactiveTabs', () => {
    it('returns tabs inactive longer than threshold', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        'tab-nuke-last-active': {
          1: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          2: new Date().toISOString(), // now
        },
      });
      await tabWatcher.initTabWatcher();
      const inactive = tabWatcher.getInactiveTabs(30); // 30 min threshold
      expect(inactive).toContain(1);
      expect(inactive).not.toContain(2);
    });

    it('returns empty array when no tabs are inactive', async () => {
      await tabWatcher.initTabWatcher();
      tabWatcher.markActive(1);
      const inactive = tabWatcher.getInactiveTabs(30);
      expect(inactive).toEqual([]);
    });
  });

  describe('listener callbacks', () => {
    it('onActivated listener calls markActive', async () => {
      let activatedCb: (info: { tabId: number }) => void = () => {};
      (chrome.tabs.onActivated.addListener as ReturnType<typeof vi.fn>).mockImplementation(
        (cb: typeof activatedCb) => { activatedCb = cb; },
      );
      await tabWatcher.initTabWatcher();
      activatedCb({ tabId: 99 });
      expect(tabWatcher.getLastActive(99)).toBeDefined();
    });

    it('onUpdated listener calls markActive on status complete', async () => {
      let updatedCb: (tabId: number, changeInfo: { status?: string }) => void = () => {};
      (chrome.tabs.onUpdated.addListener as ReturnType<typeof vi.fn>).mockImplementation(
        (cb: typeof updatedCb) => { updatedCb = cb; },
      );
      await tabWatcher.initTabWatcher();
      updatedCb(88, { status: 'complete' });
      expect(tabWatcher.getLastActive(88)).toBeDefined();
    });

    it('onUpdated listener ignores non-complete status', async () => {
      let updatedCb: (tabId: number, changeInfo: { status?: string }) => void = () => {};
      (chrome.tabs.onUpdated.addListener as ReturnType<typeof vi.fn>).mockImplementation(
        (cb: typeof updatedCb) => { updatedCb = cb; },
      );
      await tabWatcher.initTabWatcher();
      updatedCb(88, { status: 'loading' });
      expect(tabWatcher.getLastActive(88)).toBeUndefined();
    });

    it('onRemoved listener removes tab from map', async () => {
      let removedCb: (tabId: number) => void = () => {};
      (chrome.tabs.onRemoved.addListener as ReturnType<typeof vi.fn>).mockImplementation(
        (cb: typeof removedCb) => { removedCb = cb; },
      );
      await tabWatcher.initTabWatcher();
      tabWatcher.markActive(77);
      expect(tabWatcher.getLastActive(77)).toBeDefined();
      removedCb(77);
      expect(tabWatcher.getLastActive(77)).toBeUndefined();
    });
  });
});
