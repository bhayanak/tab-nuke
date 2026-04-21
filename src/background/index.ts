import { MessageType } from '@/shared/types';
import { ALARM_NAMES } from '@/shared/constants';
import { initTabWatcher } from './tab-watcher';
import {
  initSuspendEngine,
  checkAndSuspendInactive,
  suspendTab,
  restoreTab,
  suspendAllOther,
  restoreAll,
  getConfig,
  updateConfig,
} from './suspend-engine';
import {
  initSessionManager,
  saveSession,
  restoreSession,
  deleteSession,
  getSessions,
} from './session-manager';
import { initMemoryMonitor, updateMemoryStats, getMemoryStats } from './memory-monitor';
import { groupByDomain } from './group-engine';
import { initFocusMode, toggleFocusMode } from './focus-mode';
import { searchTabs } from './search';

// Initialize all modules
chrome.runtime.onInstalled.addListener(async () => {
  await initialize();
  setupAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  await initialize();
  setupAlarms();
});

async function initialize(): Promise<void> {
  await initTabWatcher();
  await initSuspendEngine();
  await initSessionManager();
  await initMemoryMonitor();
  await initFocusMode();
}

function setupAlarms(): void {
  chrome.alarms.create(ALARM_NAMES.CHECK_INACTIVE, { periodInMinutes: 1 });
  chrome.alarms.create(ALARM_NAMES.MEMORY_SNAPSHOT, { periodInMinutes: 5 });
}

// Alarm handlers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAMES.CHECK_INACTIVE) {
    await checkAndSuspendInactive();
  } else if (alarm.name === ALARM_NAMES.MEMORY_SNAPSHOT) {
    await updateMemoryStats();
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message: Record<string, unknown>, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(message: Record<string, unknown>): Promise<unknown> {
  const msg = message as MessageType & { type: string };
  switch (msg.type) {
    case 'SUSPEND_TAB':
      return suspendTab(msg.tabId as number);

    case 'RESTORE_TAB':
      return restoreTab(msg.tabId as number);

    case 'SUSPEND_ALL':
      return suspendAllOther();

    case 'RESTORE_ALL':
      return restoreAll();

    case 'GET_ALL_TABS':
      return chrome.tabs.query({ currentWindow: true });

    case 'SAVE_SESSION':
      return saveSession(msg.name as string, msg.tags as string[]);

    case 'RESTORE_SESSION':
      return restoreSession(msg.sessionId as string);

    case 'DELETE_SESSION':
      return deleteSession(msg.sessionId as string);

    case 'GET_SESSIONS':
      return getSessions();

    case 'TOGGLE_FOCUS_MODE':
      return toggleFocusMode();

    case 'GET_MEMORY_STATS':
      return getMemoryStats();

    case 'GET_CONFIG':
      return getConfig();

    case 'UPDATE_CONFIG':
      return updateConfig(msg.config as Parameters<typeof updateConfig>[0]);

    case 'SEARCH_TABS':
      return searchTabs(msg.query as string);

    case 'GROUP_BY_DOMAIN':
      return groupByDomain();

    default:
      return null;
  }
}

// Keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'suspend-current': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await suspendTab(tab.id);
      break;
    }
    case 'suspend-all':
      await suspendAllOther();
      break;
    case 'focus-mode':
      await toggleFocusMode();
      break;
    case 'search-tabs':
      await chrome.action.openPopup();
      break;
  }
});
