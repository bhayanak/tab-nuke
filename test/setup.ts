import '@testing-library/jest-dom';

// Mock chrome APIs
const chromeMock = {
  runtime: {
    getURL: (path: string) => `chrome-extension://mock-id/${path}`,
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    group: vi.fn(),
    ungroup: vi.fn(),
    onActivated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
    TAB_ID_NONE: -1,
  },
  tabGroups: {
    query: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    openPopup: vi.fn(),
  },
  commands: {
    onCommand: { addListener: vi.fn() },
  },
};

// @ts-expect-error - mock chrome global
globalThis.chrome = chromeMock;
