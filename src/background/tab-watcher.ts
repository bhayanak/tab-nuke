import { STORAGE_KEYS } from '@/shared/constants';

type LastActiveMap = Record<number, string>;

let lastActiveMap: LastActiveMap = {};

export async function initTabWatcher(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.LAST_ACTIVE);
  lastActiveMap = stored[STORAGE_KEYS.LAST_ACTIVE] ?? {};

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    markActive(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      markActive(tabId);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    delete lastActiveMap[tabId];
    persistMap();
  });
}

export function markActive(tabId: number): void {
  lastActiveMap[tabId] = new Date().toISOString();
  persistMap();
}

export function getLastActive(tabId: number): string | undefined {
  return lastActiveMap[tabId];
}

export function getAllLastActive(): LastActiveMap {
  return { ...lastActiveMap };
}

export function getInactiveTabs(thresholdMinutes: number): number[] {
  const cutoff = Date.now() - thresholdMinutes * 60 * 1000;
  return Object.entries(lastActiveMap)
    .filter(([, iso]) => new Date(iso).getTime() < cutoff)
    .map(([id]) => Number(id));
}

function persistMap(): void {
  chrome.storage.local.set({ [STORAGE_KEYS.LAST_ACTIVE]: lastActiveMap });
}
