import React, { useState } from 'react';
import { useStore } from '@/shared/store';
import * as api from '@/shared/messages';
import { timeAgo } from '@/shared/utils';

export function Sessions() {
  const { sessions, setSessions } = useStore();
  const [sessionName, setSessionName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!sessionName.trim()) return;
    setSaving(true);
    try {
      const session = await api.saveSession(sessionName.trim(), []);
      setSessions([session, ...sessions]);
      setSessionName('');
    } catch (e) {
      console.error('Failed to save session:', e);
    }
    setSaving(false);
  }

  async function handleRestore(sessionId: string) {
    await api.restoreSession(sessionId);
  }

  async function handleDelete(sessionId: string) {
    await api.deleteSession(sessionId);
    setSessions(sessions.filter((s) => s.id !== sessionId));
  }

  return (
    <div>
      {/* Save Session */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session name..."
          className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={saving || !sessionName.trim()}
          className="px-4 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          No saved sessions yet
        </div>
      ) : (
        <div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.name}
                </div>
                <div className="text-xs text-gray-400">
                  {session.tabCount} tabs · {timeAgo(session.createdAt)}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleRestore(session.id)}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200"
                  title="Restore session"
                >
                  ▶
                </button>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
                  title="Delete session"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
