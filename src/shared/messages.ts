import { MessageType, SuspendConfig, TabSession, MemoryStats, FocusModeState } from './types';

function sendMessage<T = unknown>(message: MessageType): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

export async function getAllTabs(): Promise<chrome.tabs.Tab[]> {
  return sendMessage({ type: 'GET_ALL_TABS' });
}

export async function suspendTab(tabId: number): Promise<boolean> {
  return sendMessage({ type: 'SUSPEND_TAB', tabId });
}

export async function restoreTab(tabId: number, url: string): Promise<boolean> {
  return sendMessage({ type: 'RESTORE_TAB', tabId, url });
}

export async function suspendAll(): Promise<number> {
  return sendMessage({ type: 'SUSPEND_ALL' });
}

export async function restoreAll(): Promise<number> {
  return sendMessage({ type: 'RESTORE_ALL' });
}

export async function saveSession(name: string, tags: string[]): Promise<TabSession> {
  return sendMessage({ type: 'SAVE_SESSION', name, tags });
}

export async function restoreSession(sessionId: string): Promise<boolean> {
  return sendMessage({ type: 'RESTORE_SESSION', sessionId });
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  return sendMessage({ type: 'DELETE_SESSION', sessionId });
}

export async function getSessions(): Promise<TabSession[]> {
  return sendMessage({ type: 'GET_SESSIONS' });
}

export async function toggleFocusMode(): Promise<FocusModeState> {
  return sendMessage({ type: 'TOGGLE_FOCUS_MODE' });
}

export async function getMemoryStats(): Promise<MemoryStats> {
  return sendMessage({ type: 'GET_MEMORY_STATS' });
}

export async function getConfig(): Promise<SuspendConfig> {
  return sendMessage({ type: 'GET_CONFIG' });
}

export async function updateConfig(config: Partial<SuspendConfig>): Promise<SuspendConfig> {
  return sendMessage({ type: 'UPDATE_CONFIG', config });
}

export async function searchTabs(query: string): Promise<unknown[]> {
  return sendMessage({ type: 'SEARCH_TABS', query });
}
