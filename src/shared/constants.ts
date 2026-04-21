export const DEFAULT_CONFIG = {
  autoSuspendMinutes: 30,
  whitelist: [] as string[],
  preservePinned: true,
  preserveAudio: true,
  preserveForms: true,
  showSuspendNotification: true,
} as const;

export const STORAGE_KEYS = {
  CONFIG: 'tab-nuke-config',
  TABS: 'tab-nuke-tabs',
  SESSIONS: 'tab-nuke-sessions',
  MEMORY_STATS: 'tab-nuke-memory-stats',
  FOCUS_MODE: 'tab-nuke-focus-mode',
  LAST_ACTIVE: 'tab-nuke-last-active',
} as const;

export const ALARM_NAMES = {
  CHECK_INACTIVE: 'tab-nuke-check-inactive',
  MEMORY_SNAPSHOT: 'tab-nuke-memory-snapshot',
} as const;

export const SUSPENDED_URL_PREFIX = chrome.runtime.getURL('src/suspended/suspended.html');

export const MEMORY_HOG_THRESHOLD_MB = 200;

export const INTERNAL_URL_PATTERNS = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'moz-extension://',
  'brave://',
];
