import { SuspendConfig } from '@/shared/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/shared/constants';
import { isInternalUrl, sanitizeUrl } from '@/shared/utils';
import { getInactiveTabs, markActive } from './tab-watcher';

let config: SuspendConfig = { ...DEFAULT_CONFIG };
const suspendedTabs = new Map<number, { url: string; title: string; favIconUrl?: string }>();

export async function initSuspendEngine(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
  if (stored[STORAGE_KEYS.CONFIG]) {
    config = { ...DEFAULT_CONFIG, ...stored[STORAGE_KEYS.CONFIG] };
  }
}

export function getConfig(): SuspendConfig {
  return { ...config };
}

export async function updateConfig(partial: Partial<SuspendConfig>): Promise<SuspendConfig> {
  config = { ...config, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: config });
  return { ...config };
}

export async function checkAndSuspendInactive(): Promise<number> {
  if (config.autoSuspendMinutes <= 0) return 0;

  const inactiveIds = getInactiveTabs(config.autoSuspendMinutes);
  let suspended = 0;

  for (const tabId of inactiveIds) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (shouldSuspend(tab)) {
        await suspendTab(tabId);
        suspended++;
      }
    } catch {
      // Tab no longer exists
    }
  }

  updateBadge();
  return suspended;
}

export async function suspendTab(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || !shouldSuspend(tab)) return false;

    const safeUrl = sanitizeUrl(tab.url);
    if (!safeUrl) return false;

    suspendedTabs.set(tabId, {
      url: safeUrl,
      title: tab.title ?? 'Untitled',
      favIconUrl: tab.favIconUrl,
    });

    const suspendedUrl = buildSuspendedUrl(safeUrl, tab.title ?? 'Untitled', tab.favIconUrl);
    await chrome.tabs.update(tabId, { url: suspendedUrl });
    updateBadge();
    return true;
  } catch {
    return false;
  }
}

export async function restoreTab(tabId: number): Promise<boolean> {
  const info = suspendedTabs.get(tabId);
  if (!info) return false;

  try {
    const safeUrl = sanitizeUrl(info.url);
    if (!safeUrl) return false;

    await chrome.tabs.update(tabId, { url: safeUrl });
    suspendedTabs.delete(tabId);
    markActive(tabId);
    updateBadge();
    return true;
  } catch {
    return false;
  }
}

export async function suspendAllOther(): Promise<number> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const allTabs = await chrome.tabs.query({ currentWindow: true });
  let count = 0;

  for (const tab of allTabs) {
    if (tab.id && tab.id !== activeTab?.id && shouldSuspend(tab)) {
      if (await suspendTab(tab.id)) count++;
    }
  }

  return count;
}

export async function restoreAll(): Promise<number> {
  let count = 0;
  for (const tabId of suspendedTabs.keys()) {
    if (await restoreTab(tabId)) count++;
  }
  return count;
}

export function getSuspendedCount(): number {
  return suspendedTabs.size;
}

export function isSuspended(tabId: number): boolean {
  return suspendedTabs.has(tabId);
}

function shouldSuspend(tab: chrome.tabs.Tab): boolean {
  if (!tab.url) return false;
  if (isInternalUrl(tab.url)) return false;
  if (isSuspendedUrl(tab.url)) return false;
  if (config.preservePinned && tab.pinned) return false;
  if (config.preserveAudio && tab.audible) return false;
  if (config.whitelist.some((domain) => tab.url!.includes(domain))) return false;
  return true;
}

function isSuspendedUrl(url: string): boolean {
  try {
    const extensionOrigin = chrome.runtime.getURL('');
    return url.startsWith(extensionOrigin) && url.includes('suspended');
  } catch {
    return false;
  }
}

function buildSuspendedUrl(originalUrl: string, title: string, favIconUrl?: string): string {
  const base = chrome.runtime.getURL('src/suspended/suspended.html');
  const params = new URLSearchParams({
    url: originalUrl,
    title,
  });
  if (favIconUrl) params.set('favicon', favIconUrl);
  return `${base}?${params.toString()}`;
}

function updateBadge(): void {
  const count = suspendedTabs.size;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#f97316' });
}
