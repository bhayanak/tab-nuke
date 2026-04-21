import { FocusModeState, SavedTab } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';
import { getDomain, sanitizeUrl } from '@/shared/utils';

let focusState: FocusModeState = {
  active: false,
  protectedDomain: '',
  closedTabs: [],
};

export async function initFocusMode(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.FOCUS_MODE);
  if (stored[STORAGE_KEYS.FOCUS_MODE]) {
    focusState = stored[STORAGE_KEYS.FOCUS_MODE];
  }
}

export async function toggleFocusMode(): Promise<FocusModeState> {
  if (focusState.active) {
    return deactivateFocusMode();
  }
  return activateFocusMode();
}

export function getFocusModeState(): FocusModeState {
  return { ...focusState };
}

async function activateFocusMode(): Promise<FocusModeState> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.url) return focusState;

  const protectedDomain = getDomain(activeTab.url);
  const allTabs = await chrome.tabs.query({ currentWindow: true });
  const closedTabs: SavedTab[] = [];
  const tabsToClose: number[] = [];

  for (const tab of allTabs) {
    if (!tab.id || tab.id === activeTab.id) continue;
    if (tab.url && getDomain(tab.url) === protectedDomain) continue;
    if (tab.pinned) continue;

    closedTabs.push({
      url: sanitizeUrl(tab.url ?? '') || (tab.url ?? ''),
      title: tab.title ?? 'Untitled',
      favIconUrl: tab.favIconUrl,
      scrollPosition: { x: 0, y: 0 },
    });
    tabsToClose.push(tab.id);
  }

  // Close tabs in reverse to preserve indices
  for (const tabId of tabsToClose.reverse()) {
    try {
      await chrome.tabs.remove(tabId);
    } catch {
      // Tab may already be closed
    }
  }

  focusState = {
    active: true,
    protectedDomain,
    closedTabs,
    activatedAt: new Date().toISOString(),
  };

  await persistFocusState();
  return { ...focusState };
}

async function deactivateFocusMode(): Promise<FocusModeState> {
  // Restore previously closed tabs
  for (const savedTab of focusState.closedTabs) {
    const safeUrl = sanitizeUrl(savedTab.url);
    if (safeUrl) {
      try {
        await chrome.tabs.create({ url: safeUrl, active: false });
      } catch {
        // Failed to restore tab
      }
    }
  }

  focusState = {
    active: false,
    protectedDomain: '',
    closedTabs: [],
  };

  await persistFocusState();
  return { ...focusState };
}

async function persistFocusState(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS_MODE]: focusState });
}
