import { TabSession, SavedTab } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';
import { generateId, sanitizeUrl } from '@/shared/utils';

let sessions: TabSession[] = [];

export async function initSessionManager(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS);
  sessions = stored[STORAGE_KEYS.SESSIONS] ?? [];
}

export async function saveSession(name: string, tags: string[] = []): Promise<TabSession> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groups = await getGroupMap();

  const savedTabs: SavedTab[] = tabs
    .filter((tab) => tab.url)
    .map((tab) => ({
      url: sanitizeUrl(tab.url!) || tab.url!,
      title: tab.title ?? 'Untitled',
      favIconUrl: tab.favIconUrl,
      scrollPosition: { x: 0, y: 0 },
      groupName: tab.groupId !== undefined && tab.groupId >= 0 ? groups.get(tab.groupId) : undefined,
    }));

  const session: TabSession = {
    id: generateId(),
    name,
    tabs: savedTabs,
    createdAt: new Date().toISOString(),
    tags,
    tabCount: savedTabs.length,
  };

  sessions.unshift(session);
  await persistSessions();
  return session;
}

export async function restoreSession(sessionId: string): Promise<boolean> {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return false;

  const groupTabMap = new Map<string, number[]>();

  for (const savedTab of session.tabs) {
    const safeUrl = sanitizeUrl(savedTab.url);
    if (!safeUrl) continue;

    const tab = await chrome.tabs.create({ url: safeUrl });
    if (savedTab.groupName && tab.id) {
      const existing = groupTabMap.get(savedTab.groupName) ?? [];
      existing.push(tab.id);
      groupTabMap.set(savedTab.groupName, existing);
    }
  }

  // Re-create groups
  for (const [groupName, tabIds] of groupTabMap) {
    try {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, { title: groupName });
    } catch {
      // Tab groups may not be supported
    }
  }

  return true;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return false;
  sessions.splice(idx, 1);
  await persistSessions();
  return true;
}

export function getSessions(): TabSession[] {
  return [...sessions];
}

async function getGroupMap(): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const groups = await chrome.tabGroups.query({});
    for (const group of groups) {
      map.set(group.id, group.title ?? `Group ${group.id}`);
    }
  } catch {
    // tabGroups API may not be available
  }
  return map;
}

async function persistSessions(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions });
}
