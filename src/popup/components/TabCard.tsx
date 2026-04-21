import React from 'react';
import { TabEntry } from '@/shared/store';
import { getDomain } from '@/shared/utils';

interface TabCardProps {
  tab: TabEntry;
  onSuspend: (tabId: number) => void;
  onRestore: (tabId: number) => void;
  onClose: (tabId: number) => void;
}

export function TabCard({ tab, onSuspend, onRestore, onClose }: TabCardProps) {
  const domain = getDomain(tab.url);

  function handleClick() {
    chrome.tabs.update(tab.id, { active: true });
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group transition-colors ${
        tab.suspended ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      {/* Favicon */}
      <div className="flex-shrink-0 w-5 h-5">
        {tab.favIconUrl ? (
          <img src={tab.favIconUrl} alt="" className="w-5 h-5 rounded" />
        ) : (
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-[10px]">
            🌐
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-gray-900 dark:text-white">
          {tab.suspended && <span className="text-orange-500 mr-1">💤</span>}
          {tab.pinned && <span className="mr-1">📌</span>}
          {tab.audible && <span className="mr-1">🔊</span>}
          {tab.title}
        </div>
        <div className="text-xs text-gray-400 truncate">{domain}</div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {tab.suspended ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore(tab.id);
            }}
            className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200"
            title="Restore tab"
          >
            ▶
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSuspend(tab.id);
            }}
            className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200"
            title="Suspend tab"
          >
            💤
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(tab.id);
          }}
          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
          title="Close tab"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
