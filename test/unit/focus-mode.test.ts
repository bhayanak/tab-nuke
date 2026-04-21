import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('focus-mode', () => {
  let focusMode: typeof import('@/background/focus-mode');

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    focusMode = await import('@/background/focus-mode');
  });

  describe('initFocusMode', () => {
    it('initializes with inactive state', async () => {
      await focusMode.initFocusMode();
      const state = focusMode.getFocusModeState();
      expect(state.active).toBe(false);
      expect(state.closedTabs).toEqual([]);
    });

    it('restores state from storage', async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        'tab-nuke-focus-mode': { active: true, protectedDomain: 'github.com', closedTabs: [] },
      });
      await focusMode.initFocusMode();
      const state = focusMode.getFocusModeState();
      expect(state.active).toBe(true);
      expect(state.protectedDomain).toBe('github.com');
    });
  });

  describe('toggleFocusMode', () => {
    it('activates focus mode — closes non-domain tabs', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://github.com/repo', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://github.com/repo', active: true },
          { id: 2, url: 'https://twitter.com', title: 'Twitter', pinned: false },
          { id: 3, url: 'https://github.com/other', title: 'Other GH', pinned: false },
        ]);
      (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const state = await focusMode.toggleFocusMode();
      expect(state.active).toBe(true);
      expect(state.protectedDomain).toBe('github.com');
      expect(chrome.tabs.remove).toHaveBeenCalledWith(2);
      expect(state.closedTabs.length).toBe(1);
    });

    it('deactivates focus mode — restores closed tabs', async () => {
      await focusMode.initFocusMode();
      // Activate first
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://github.com/repo', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://github.com/repo', active: true },
          { id: 2, url: 'https://twitter.com', title: 'Twitter', pinned: false },
        ]);
      (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await focusMode.toggleFocusMode();

      // Deactivate
      (chrome.tabs.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 10 });
      const state = await focusMode.toggleFocusMode();
      expect(state.active).toBe(false);
      expect(state.closedTabs).toEqual([]);
      expect(chrome.tabs.create).toHaveBeenCalled();
    });

    it('does not close pinned tabs', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://a.com', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://a.com', active: true },
          { id: 2, url: 'https://b.com', title: 'Pinned', pinned: true },
        ]);

      const state = await focusMode.toggleFocusMode();
      expect(chrome.tabs.remove).not.toHaveBeenCalled();
      expect(state.closedTabs.length).toBe(0);
    });

    it('closes tabs without URL', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://a.com', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://a.com', active: true },
          { id: 2, url: undefined, title: 'No URL Tab', pinned: false },
        ]);
      (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const state = await focusMode.toggleFocusMode();
      expect(state.closedTabs.length).toBe(1);
      expect(chrome.tabs.remove).toHaveBeenCalledWith(2);
    });

    it('skips tabs on the same domain as active tab', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://a.com/page1', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://a.com/page1', active: true },
          { id: 2, url: 'https://a.com/page2', title: 'Same domain', pinned: false },
          { id: 3, url: 'https://b.com', title: 'Other domain', pinned: false },
        ]);
      (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const state = await focusMode.toggleFocusMode();
      expect(state.closedTabs.length).toBe(1);
      expect(chrome.tabs.remove).toHaveBeenCalledWith(3);
      expect(chrome.tabs.remove).not.toHaveBeenCalledWith(2);
    });

    it('returns existing state when active tab has no URL', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        { id: 1, url: undefined, active: true },
      ]);

      const state = await focusMode.toggleFocusMode();
      expect(state.active).toBe(false);
    });

    it('handles tab remove failure gracefully', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://a.com', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://a.com', active: true },
          { id: 2, url: 'https://b.com', title: 'B', pinned: false },
        ]);
      (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const state = await focusMode.toggleFocusMode();
      expect(state.active).toBe(true);
    });

    it('handles tab create failure during deactivation', async () => {
      await focusMode.initFocusMode();
      (chrome.tabs.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ id: 1, url: 'https://a.com', active: true }])
        .mockResolvedValueOnce([
          { id: 1, url: 'https://a.com', active: true },
          { id: 2, url: 'https://b.com', title: 'B', pinned: false },
        ]);
      (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await focusMode.toggleFocusMode();

      (chrome.tabs.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
      const state = await focusMode.toggleFocusMode();
      expect(state.active).toBe(false);
    });
  });

  describe('getFocusModeState', () => {
    it('returns a copy of state', async () => {
      await focusMode.initFocusMode();
      const s1 = focusMode.getFocusModeState();
      const s2 = focusMode.getFocusModeState();
      expect(s1).not.toBe(s2);
      expect(s1).toEqual(s2);
    });
  });
});
