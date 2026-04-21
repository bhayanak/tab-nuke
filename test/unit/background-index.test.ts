import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all background modules
vi.mock('@/background/tab-watcher', () => ({
  initTabWatcher: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/background/suspend-engine', () => ({
  initSuspendEngine: vi.fn().mockResolvedValue(undefined),
  checkAndSuspendInactive: vi.fn().mockResolvedValue(0),
  suspendTab: vi.fn().mockResolvedValue(true),
  restoreTab: vi.fn().mockResolvedValue(true),
  suspendAllOther: vi.fn().mockResolvedValue(3),
  restoreAll: vi.fn().mockResolvedValue(2),
  getConfig: vi.fn().mockResolvedValue({ autoSuspendMinutes: 30 }),
  updateConfig: vi.fn().mockResolvedValue({ autoSuspendMinutes: 15 }),
}));
vi.mock('@/background/session-manager', () => ({
  initSessionManager: vi.fn().mockResolvedValue(undefined),
  saveSession: vi.fn().mockResolvedValue({ id: '1', name: 'test' }),
  restoreSession: vi.fn().mockResolvedValue(true),
  deleteSession: vi.fn().mockResolvedValue(true),
  getSessions: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/background/memory-monitor', () => ({
  initMemoryMonitor: vi.fn().mockResolvedValue(undefined),
  updateMemoryStats: vi.fn().mockResolvedValue(undefined),
  getMemoryStats: vi.fn().mockResolvedValue({ totalSavedMB: 0 }),
}));
vi.mock('@/background/group-engine', () => ({
  groupByDomain: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/background/focus-mode', () => ({
  initFocusMode: vi.fn().mockResolvedValue(undefined),
  toggleFocusMode: vi.fn().mockResolvedValue({ active: true }),
}));
vi.mock('@/background/search', () => ({
  searchTabs: vi.fn().mockResolvedValue([]),
}));

describe('background/index', () => {
  let installedHandler: () => Promise<void>;
  let startupHandler: () => Promise<void>;
  let alarmHandler: (alarm: { name: string }) => Promise<void>;
  let messageHandler: (
    message: Record<string, unknown>,
    sender: unknown,
    sendResponse: (r?: unknown) => void,
  ) => boolean;
  let commandHandler: (command: string) => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Capture listeners
    (chrome.runtime.onInstalled.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: typeof installedHandler) => { installedHandler = cb; },
    );
    (chrome.runtime.onStartup.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: typeof startupHandler) => { startupHandler = cb; },
    );
    (chrome.alarms.onAlarm.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: typeof alarmHandler) => { alarmHandler = cb; },
    );
    (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: typeof messageHandler) => { messageHandler = cb; },
    );
    (chrome.commands.onCommand.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: typeof commandHandler) => { commandHandler = cb; },
    );
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 42, url: 'https://test.com' },
    ]);
    (chrome.action.openPopup as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await import('@/background/index');
  });

  it('registers all chrome listeners', () => {
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
    expect(chrome.runtime.onStartup.addListener).toHaveBeenCalled();
    expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(chrome.commands.onCommand.addListener).toHaveBeenCalled();
  });

  it('onInstalled initializes modules and sets alarms', async () => {
    const { initTabWatcher } = await import('@/background/tab-watcher');
    const { initSuspendEngine } = await import('@/background/suspend-engine');
    const { initSessionManager } = await import('@/background/session-manager');
    const { initMemoryMonitor } = await import('@/background/memory-monitor');
    const { initFocusMode } = await import('@/background/focus-mode');

    await installedHandler();

    expect(initTabWatcher).toHaveBeenCalled();
    expect(initSuspendEngine).toHaveBeenCalled();
    expect(initSessionManager).toHaveBeenCalled();
    expect(initMemoryMonitor).toHaveBeenCalled();
    expect(initFocusMode).toHaveBeenCalled();
    expect(chrome.alarms.create).toHaveBeenCalledTimes(2);
  });

  it('onStartup initializes modules and sets alarms', async () => {
    await startupHandler();
    expect(chrome.alarms.create).toHaveBeenCalled();
  });

  it('alarm handler calls checkAndSuspendInactive for CHECK_INACTIVE', async () => {
    const { checkAndSuspendInactive } = await import('@/background/suspend-engine');
    await alarmHandler({ name: 'tab-nuke-check-inactive' });
    expect(checkAndSuspendInactive).toHaveBeenCalled();
  });

  it('alarm handler calls updateMemoryStats for MEMORY_SNAPSHOT', async () => {
    const { updateMemoryStats } = await import('@/background/memory-monitor');
    await alarmHandler({ name: 'tab-nuke-memory-snapshot' });
    expect(updateMemoryStats).toHaveBeenCalled();
  });

  it('message handler routes SUSPEND_TAB', async () => {
    const { suspendTab } = await import('@/background/suspend-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'SUSPEND_TAB', tabId: 1 }, {}, sendResponse);
    await vi.waitFor(() => expect(suspendTab).toHaveBeenCalledWith(1));
  });

  it('message handler routes RESTORE_TAB', async () => {
    const { restoreTab } = await import('@/background/suspend-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'RESTORE_TAB', tabId: 1 }, {}, sendResponse);
    await vi.waitFor(() => expect(restoreTab).toHaveBeenCalledWith(1));
  });

  it('message handler routes SUSPEND_ALL', async () => {
    const { suspendAllOther } = await import('@/background/suspend-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'SUSPEND_ALL' }, {}, sendResponse);
    await vi.waitFor(() => expect(suspendAllOther).toHaveBeenCalled());
  });

  it('message handler routes RESTORE_ALL', async () => {
    const { restoreAll } = await import('@/background/suspend-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'RESTORE_ALL' }, {}, sendResponse);
    await vi.waitFor(() => expect(restoreAll).toHaveBeenCalled());
  });

  it('message handler routes GET_ALL_TABS', async () => {
    const sendResponse = vi.fn();
    messageHandler({ type: 'GET_ALL_TABS' }, {}, sendResponse);
    await vi.waitFor(() => expect(chrome.tabs.query).toHaveBeenCalledWith({ currentWindow: true }));
  });

  it('message handler routes SAVE_SESSION', async () => {
    const { saveSession } = await import('@/background/session-manager');
    const sendResponse = vi.fn();
    messageHandler({ type: 'SAVE_SESSION', name: 'test', tags: [] }, {}, sendResponse);
    await vi.waitFor(() => expect(saveSession).toHaveBeenCalledWith('test', []));
  });

  it('message handler routes RESTORE_SESSION', async () => {
    const { restoreSession } = await import('@/background/session-manager');
    const sendResponse = vi.fn();
    messageHandler({ type: 'RESTORE_SESSION', sessionId: 'abc' }, {}, sendResponse);
    await vi.waitFor(() => expect(restoreSession).toHaveBeenCalledWith('abc'));
  });

  it('message handler routes DELETE_SESSION', async () => {
    const { deleteSession } = await import('@/background/session-manager');
    const sendResponse = vi.fn();
    messageHandler({ type: 'DELETE_SESSION', sessionId: 'abc' }, {}, sendResponse);
    await vi.waitFor(() => expect(deleteSession).toHaveBeenCalledWith('abc'));
  });

  it('message handler routes GET_SESSIONS', async () => {
    const { getSessions } = await import('@/background/session-manager');
    const sendResponse = vi.fn();
    messageHandler({ type: 'GET_SESSIONS' }, {}, sendResponse);
    await vi.waitFor(() => expect(getSessions).toHaveBeenCalled());
  });

  it('message handler routes TOGGLE_FOCUS_MODE', async () => {
    const { toggleFocusMode } = await import('@/background/focus-mode');
    const sendResponse = vi.fn();
    messageHandler({ type: 'TOGGLE_FOCUS_MODE' }, {}, sendResponse);
    await vi.waitFor(() => expect(toggleFocusMode).toHaveBeenCalled());
  });

  it('message handler routes GET_MEMORY_STATS', async () => {
    const { getMemoryStats } = await import('@/background/memory-monitor');
    const sendResponse = vi.fn();
    messageHandler({ type: 'GET_MEMORY_STATS' }, {}, sendResponse);
    await vi.waitFor(() => expect(getMemoryStats).toHaveBeenCalled());
  });

  it('message handler routes GET_CONFIG', async () => {
    const { getConfig } = await import('@/background/suspend-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'GET_CONFIG' }, {}, sendResponse);
    await vi.waitFor(() => expect(getConfig).toHaveBeenCalled());
  });

  it('message handler routes UPDATE_CONFIG', async () => {
    const { updateConfig } = await import('@/background/suspend-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'UPDATE_CONFIG', config: { autoSuspendMinutes: 15 } }, {}, sendResponse);
    await vi.waitFor(() => expect(updateConfig).toHaveBeenCalledWith({ autoSuspendMinutes: 15 }));
  });

  it('message handler routes SEARCH_TABS', async () => {
    const { searchTabs } = await import('@/background/search');
    const sendResponse = vi.fn();
    messageHandler({ type: 'SEARCH_TABS', query: 'hello' }, {}, sendResponse);
    await vi.waitFor(() => expect(searchTabs).toHaveBeenCalledWith('hello'));
  });

  it('message handler routes GROUP_BY_DOMAIN', async () => {
    const { groupByDomain } = await import('@/background/group-engine');
    const sendResponse = vi.fn();
    messageHandler({ type: 'GROUP_BY_DOMAIN' }, {}, sendResponse);
    await vi.waitFor(() => expect(groupByDomain).toHaveBeenCalled());
  });

  it('message handler returns null for unknown type', async () => {
    const sendResponse = vi.fn();
    messageHandler({ type: 'UNKNOWN' }, {}, sendResponse);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith(null));
  });

  it('message handler returns true to keep channel open', () => {
    const sendResponse = vi.fn();
    const result = messageHandler({ type: 'GET_ALL_TABS' }, {}, sendResponse);
    expect(result).toBe(true);
  });

  it('command handler suspend-current suspends active tab', async () => {
    const { suspendTab } = await import('@/background/suspend-engine');
    await commandHandler('suspend-current');
    expect(suspendTab).toHaveBeenCalledWith(42);
  });

  it('command handler suspend-all calls suspendAllOther', async () => {
    const { suspendAllOther } = await import('@/background/suspend-engine');
    await commandHandler('suspend-all');
    expect(suspendAllOther).toHaveBeenCalled();
  });

  it('command handler focus-mode calls toggleFocusMode', async () => {
    const { toggleFocusMode } = await import('@/background/focus-mode');
    await commandHandler('focus-mode');
    expect(toggleFocusMode).toHaveBeenCalled();
  });

  it('command handler search-tabs opens popup', async () => {
    await commandHandler('search-tabs');
    expect(chrome.action.openPopup).toHaveBeenCalled();
  });
});
