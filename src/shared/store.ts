import { create } from 'zustand';
import { TabSession, SuspendConfig, MemoryStats, FocusModeState } from './types';

interface TabEntry {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  pinned: boolean;
  audible: boolean;
  suspended: boolean;
  groupId?: number;
}

interface AppState {
  tabs: TabEntry[];
  sessions: TabSession[];
  config: SuspendConfig;
  memoryStats: MemoryStats;
  focusMode: FocusModeState;
  searchQuery: string;
  activeView: 'tabs' | 'sessions' | 'groups' | 'settings';
  loading: boolean;

  setTabs: (tabs: TabEntry[]) => void;
  setSessions: (sessions: TabSession[]) => void;
  setConfig: (config: SuspendConfig) => void;
  setMemoryStats: (stats: MemoryStats) => void;
  setFocusMode: (state: FocusModeState) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: AppState['activeView']) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
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

  setTabs: (tabs) => set({ tabs }),
  setSessions: (sessions) => set({ sessions }),
  setConfig: (config) => set({ config }),
  setMemoryStats: (memoryStats) => set({ memoryStats }),
  setFocusMode: (focusMode) => set({ focusMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveView: (activeView) => set({ activeView }),
  setLoading: (loading) => set({ loading }),
}));

export type { TabEntry };
