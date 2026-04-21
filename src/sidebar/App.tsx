import React, { useEffect, useState } from 'react';
import * as api from '@/shared/messages';
import { MemoryStats, TabSession } from '@/shared/types';
import { formatMemoryMB, timeAgo } from '@/shared/utils';

export default function App() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [sessions, setSessions] = useState<TabSession[]>([]);
  const [view, setView] = useState<'analytics' | 'sessions'>('analytics');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [memStats, allSessions] = await Promise.all([api.getMemoryStats(), api.getSessions()]);
      setStats(memStats);
      setSessions(allSessions);
    } catch (e) {
      console.error('Failed to load sidebar data:', e);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl">☢️</span>
        <h1 className="text-lg font-bold">Tab Nuke</h1>
      </div>

      {/* Nav */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setView('analytics')}
          className={`flex-1 py-2 text-sm font-medium ${
            view === 'analytics' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500'
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setView('sessions')}
          className={`flex-1 py-2 text-sm font-medium ${
            view === 'sessions' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500'
          }`}
        >
          💾 Sessions
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {view === 'analytics' && stats && <Analytics stats={stats} />}
        {view === 'sessions' && <SessionBrowser sessions={sessions} onRefresh={loadData} />}
      </div>
    </div>
  );
}

function Analytics({ stats }: { stats: MemoryStats }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase">Memory Dashboard</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatBlock label="Active Tabs" value={String(stats.activeCount)} icon="📑" />
        <StatBlock label="Suspended" value={String(stats.suspendedCount)} icon="💤" />
        <StatBlock label="Est. Usage" value={formatMemoryMB(stats.currentUsageMB)} icon="📈" />
        <StatBlock label="Total Saved" value={formatMemoryMB(stats.totalSavedMB)} icon="💚" />
        <StatBlock label="Peak Usage" value={formatMemoryMB(stats.peakUsageMB)} icon="🔺" />
      </div>

      {stats.savingsHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Savings History</h3>
          <div className="space-y-1">
            {stats.savingsHistory
              .slice(-7)
              .reverse()
              .map((entry) => (
                <div key={entry.date} className="flex justify-between text-sm">
                  <span className="text-gray-500">{entry.date}</span>
                  <span className="font-medium">{formatMemoryMB(entry.savedMB)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function SessionBrowser({
  sessions,
  onRefresh,
}: {
  sessions: TabSession[];
  onRefresh: () => void;
}) {
  async function handleRestore(id: string) {
    await api.restoreSession(id);
  }

  async function handleDelete(id: string) {
    await api.deleteSession(id);
    onRefresh();
  }

  if (sessions.length === 0) {
    return <div className="text-center text-sm text-gray-400 py-8">No saved sessions</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase">Saved Sessions</h2>
      {sessions.map((session) => (
        <div key={session.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{session.name}</div>
            <div className="text-xs text-gray-400">{timeAgo(session.createdAt)}</div>
          </div>
          <div className="text-xs text-gray-500 mb-2">{session.tabCount} tabs</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRestore(session.id)}
              className="flex-1 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200"
            >
              Restore
            </button>
            <button
              onClick={() => handleDelete(session.id)}
              className="py-1 px-3 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
            >
              Delete
            </button>
          </div>
          {/* Tab preview */}
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {session.tabs.slice(0, 10).map((tab, i) => (
              <div key={i} className="text-xs text-gray-400 truncate">
                {tab.title}
              </div>
            ))}
            {session.tabs.length > 10 && (
              <div className="text-xs text-gray-400">...and {session.tabs.length - 10} more</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
