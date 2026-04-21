import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as messages from '@/shared/messages';

describe('messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('getAllTabs sends GET_ALL_TABS message', async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await messages.getAllTabs();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'GET_ALL_TABS' });
  });

  it('suspendTab sends SUSPEND_TAB message', async () => {
    await messages.suspendTab(42);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'SUSPEND_TAB', tabId: 42 });
  });

  it('restoreTab sends RESTORE_TAB message', async () => {
    await messages.restoreTab(42, 'https://example.com');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'RESTORE_TAB',
      tabId: 42,
      url: 'https://example.com',
    });
  });

  it('suspendAll sends SUSPEND_ALL message', async () => {
    await messages.suspendAll();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'SUSPEND_ALL' });
  });

  it('restoreAll sends RESTORE_ALL message', async () => {
    await messages.restoreAll();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'RESTORE_ALL' });
  });

  it('saveSession sends SAVE_SESSION message', async () => {
    await messages.saveSession('My Session', ['work']);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SAVE_SESSION',
      name: 'My Session',
      tags: ['work'],
    });
  });

  it('restoreSession sends RESTORE_SESSION message', async () => {
    await messages.restoreSession('abc');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'RESTORE_SESSION',
      sessionId: 'abc',
    });
  });

  it('deleteSession sends DELETE_SESSION message', async () => {
    await messages.deleteSession('abc');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'DELETE_SESSION',
      sessionId: 'abc',
    });
  });

  it('getSessions sends GET_SESSIONS message', async () => {
    await messages.getSessions();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'GET_SESSIONS' });
  });

  it('toggleFocusMode sends TOGGLE_FOCUS_MODE message', async () => {
    await messages.toggleFocusMode();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TOGGLE_FOCUS_MODE' });
  });

  it('getMemoryStats sends GET_MEMORY_STATS message', async () => {
    await messages.getMemoryStats();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'GET_MEMORY_STATS' });
  });

  it('getConfig sends GET_CONFIG message', async () => {
    await messages.getConfig();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'GET_CONFIG' });
  });

  it('updateConfig sends UPDATE_CONFIG message', async () => {
    await messages.updateConfig({ autoSuspendMinutes: 15 });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'UPDATE_CONFIG',
      config: { autoSuspendMinutes: 15 },
    });
  });

  it('searchTabs sends SEARCH_TABS message', async () => {
    await messages.searchTabs('hello');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SEARCH_TABS',
      query: 'hello',
    });
  });
});
