export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  groupId?: string;
  status: 'active' | 'suspended' | 'loading';
  lastActiveAt: string;
  memoryUsageMB: number;
  scrollPosition: { x: number; y: number };
  suspendedAt?: string;
}

export interface TabSession {
  id: string;
  name: string;
  tabs: SavedTab[];
  createdAt: string;
  tags: string[];
  tabCount: number;
}

export interface SavedTab {
  url: string;
  title: string;
  favIconUrl?: string;
  scrollPosition: { x: number; y: number };
  groupName?: string;
}

export type TabGroupColor = 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan' | 'orange';

export interface TabGroup {
  id: string;
  name: string;
  color: TabGroupColor;
  tabIds: number[];
  isCollapsed: boolean;
}

export interface SuspendConfig {
  autoSuspendMinutes: number;
  whitelist: string[];
  preservePinned: boolean;
  preserveAudio: boolean;
  preserveForms: boolean;
  showSuspendNotification: boolean;
}

export interface MemoryStats {
  totalSavedMB: number;
  currentUsageMB: number;
  suspendedCount: number;
  activeCount: number;
  peakUsageMB: number;
  savingsHistory: { date: string; savedMB: number }[];
}

export interface FocusModeState {
  active: boolean;
  protectedDomain: string;
  closedTabs: SavedTab[];
  activatedAt?: string;
}

export type MessageType =
  | { type: 'SUSPEND_TAB'; tabId: number }
  | { type: 'RESTORE_TAB'; tabId: number; url: string }
  | { type: 'SUSPEND_ALL' }
  | { type: 'RESTORE_ALL' }
  | { type: 'GET_TAB_INFO'; tabId: number }
  | { type: 'GET_ALL_TABS' }
  | { type: 'SAVE_SESSION'; name: string; tags: string[] }
  | { type: 'RESTORE_SESSION'; sessionId: string }
  | { type: 'DELETE_SESSION'; sessionId: string }
  | { type: 'GET_SESSIONS' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'GET_MEMORY_STATS' }
  | { type: 'GET_CONFIG' }
  | { type: 'UPDATE_CONFIG'; config: Partial<SuspendConfig> }
  | { type: 'SEARCH_TABS'; query: string }
  | { type: 'GET_SCROLL_POSITION' }
  | { type: 'SET_SCROLL_POSITION'; position: { x: number; y: number } }
  | { type: 'GROUP_BY_DOMAIN' };
