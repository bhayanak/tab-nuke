import React, { useMemo } from 'react';
import { useStore } from '@/shared/store';
import * as api from '@/shared/messages';
import { TabCard } from '../components/TabCard';

interface TabListProps {
  onRefresh: () => void;
}

export function TabList({ onRefresh }: TabListProps) {
  const { tabs, searchQuery, focusMode, setTabs, setFocusMode } = useStore();

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs;
    const q = searchQuery.toLowerCase();
    return tabs.filter((t) => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q));
  }, [tabs, searchQuery]);

  async function handleSuspend(tabId: number) {
    await api.suspendTab(tabId);
    onRefresh();
  }

  async function handleRestore(tabId: number) {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      await api.restoreTab(tabId, tab.url);
      onRefresh();
    }
  }

  async function handleClose(tabId: number) {
    await chrome.tabs.remove(tabId);
    setTabs(tabs.filter((t) => t.id !== tabId));
  }

  async function handleSuspendAll() {
    await api.suspendAll();
    onRefresh();
  }

  async function handleRestoreAll() {
    await api.restoreAll();
    onRefresh();
  }

  async function handleFocusMode() {
    const state = await api.toggleFocusMode();
    setFocusMode(state);
    onRefresh();
  }

  const suspendedCount = tabs.filter((t) => t.suspended).length;

  return (
    <div>
      {/* Quick Actions */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSuspendAll}
          className="flex-1 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 transition-colors"
        >
          💤 Suspend All
        </button>
        <button
          onClick={handleRestoreAll}
          className="flex-1 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 transition-colors"
          disabled={suspendedCount === 0}
        >
          ▶ Restore All
        </button>
        <button
          onClick={handleFocusMode}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            focusMode.active
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}
        >
          {focusMode.active ? '🔴 Defocus' : '🎯 Focus'}
        </button>
      </div>

      {/* Tab count */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        {tabs.length} tabs · {suspendedCount} suspended
      </div>

      {/* Tab list */}
      <div>
        {filteredTabs.map((tab) => (
          <TabCard
            key={tab.id}
            tab={tab}
            onSuspend={handleSuspend}
            onRestore={handleRestore}
            onClose={handleClose}
          />
        ))}
        {filteredTabs.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            {searchQuery ? 'No matching tabs found' : 'No tabs open'}
          </div>
        )}
      </div>
    </div>
  );
}
