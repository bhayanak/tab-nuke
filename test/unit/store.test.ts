import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/shared/store';

describe('store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useStore.setState({
      tabs: [],
      sessions: [],
      config: {
        autoSuspendMinutes: 30,
        whitelist: [],
        preservePinned: true,
        preserveAudio: true,
        preserveForms: true,
        showSuspendNotification: true,
      },
      memoryStats: {
        totalSavedMB: 0,
        currentUsageMB: 0,
        suspendedCount: 0,
        activeCount: 0,
        peakUsageMB: 0,
        savingsHistory: [],
      },
      focusMode: {
        active: false,
        protectedDomain: '',
        closedTabs: [],
      },
      searchQuery: '',
      activeView: 'tabs',
      loading: false,
    });
  });

  it('has correct initial state', () => {
    const state = useStore.getState();
    expect(state.tabs).toEqual([]);
    expect(state.sessions).toEqual([]);
    expect(state.searchQuery).toBe('');
    expect(state.activeView).toBe('tabs');
    expect(state.loading).toBe(false);
  });

  it('setTabs updates tabs', () => {
    const tabs = [{ id: 1, url: 'https://a.com', title: 'A', pinned: false, audible: false, suspended: false }];
    useStore.getState().setTabs(tabs);
    expect(useStore.getState().tabs).toEqual(tabs);
  });

  it('setSessions updates sessions', () => {
    const sessions = [{ id: '1', name: 'Test', tabs: [], createdAt: '', tags: [], tabCount: 0 }];
    useStore.getState().setSessions(sessions);
    expect(useStore.getState().sessions).toEqual(sessions);
  });

  it('setConfig updates config', () => {
    useStore.getState().setConfig({ ...useStore.getState().config, autoSuspendMinutes: 60 });
    expect(useStore.getState().config.autoSuspendMinutes).toBe(60);
  });

  it('setMemoryStats updates memoryStats', () => {
    useStore.getState().setMemoryStats({ ...useStore.getState().memoryStats, totalSavedMB: 100 });
    expect(useStore.getState().memoryStats.totalSavedMB).toBe(100);
  });

  it('setFocusMode updates focusMode', () => {
    useStore.getState().setFocusMode({ active: true, protectedDomain: 'x.com', closedTabs: [] });
    expect(useStore.getState().focusMode.active).toBe(true);
  });

  it('setSearchQuery updates searchQuery', () => {
    useStore.getState().setSearchQuery('hello');
    expect(useStore.getState().searchQuery).toBe('hello');
  });

  it('setActiveView updates activeView', () => {
    useStore.getState().setActiveView('sessions');
    expect(useStore.getState().activeView).toBe('sessions');
  });

  it('setLoading updates loading', () => {
    useStore.getState().setLoading(true);
    expect(useStore.getState().loading).toBe(true);
  });
});
