import React, { useCallback, useEffect } from 'react';
import { useStore } from '@/shared/store';
import * as api from '@/shared/messages';
import { TabList } from './pages/TabList';
import { Sessions } from './pages/Sessions';
import { Groups } from './pages/Groups';
import { Settings } from './pages/Settings';
import { SearchBar } from './components/SearchBar';
import { MemoryBadge } from './components/MemoryBadge';

const NAV_ITEMS = [
  { key: 'tabs' as const, label: '📑 Tabs' },
  { key: 'sessions' as const, label: '💾 Sessions' },
  { key: 'groups' as const, label: '📁 Groups' },
  { key: 'settings' as const, label: '⚙️ Settings' },
];

export default function App() {
  const { activeView, setActiveView, setTabs, setSessions, setConfig, setMemoryStats, setLoading } =
    useStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tabs, sessions, config, stats] = await Promise.all([
        api.getAllTabs(),
        api.getSessions(),
        api.getConfig(),
        api.getMemoryStats(),
      ]);

      setTabs(
        tabs.map((t) => ({
          id: t.id!,
          url: t.url ?? '',
          title: t.title ?? 'Untitled',
          favIconUrl: t.favIconUrl,
          pinned: t.pinned ?? false,
          audible: t.audible ?? false,
          suspended: t.url?.includes('suspended.html') ?? false,
          groupId: t.groupId,
        })),
      );
      setSessions(sessions);
      setConfig(config);
      setMemoryStats(stats);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoading(false);
  }, [setLoading, setTabs, setSessions, setConfig, setMemoryStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="w-[400px] min-h-[500px] max-h-[600px] flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">☢️</span>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tab Nuke</h1>
        </div>
        <MemoryBadge />
      </div>

      {/* Search */}
      <SearchBar />

      {/* Navigation */}
      <nav className="flex border-b border-gray-200 dark:border-gray-700">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeView === item.key
                ? 'text-orange-600 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'tabs' && <TabList onRefresh={loadData} />}
        {activeView === 'sessions' && <Sessions />}
        {activeView === 'groups' && <Groups />}
        {activeView === 'settings' && <Settings />}
      </div>
    </div>
  );
}
