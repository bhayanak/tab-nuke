import React, { useState } from 'react';
import { useStore } from '@/shared/store';
import { getDomain } from '@/shared/utils';

export function Groups() {
  const { tabs } = useStore();
  const [grouping, setGrouping] = useState(false);

  const domainGroups = React.useMemo(() => {
    const map = new Map<string, typeof tabs>();
    for (const tab of tabs) {
      const domain = getDomain(tab.url) || 'Other';
      const group = map.get(domain) ?? [];
      group.push(tab);
      map.set(domain, group);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [tabs]);

  async function handleGroupByDomain() {
    setGrouping(true);
    try {
      await chrome.runtime.sendMessage({ type: 'GROUP_BY_DOMAIN' });
    } catch (e) {
      console.error('Failed to group tabs:', e);
    }
    setGrouping(false);
  }

  return (
    <div>
      {/* Actions */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleGroupByDomain}
          disabled={grouping}
          className="w-full py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          {grouping ? 'Grouping...' : '📁 Group by Domain'}
        </button>
      </div>

      {/* Domain groups preview */}
      <div>
        {domainGroups.map(([domain, domainTabs]) => (
          <div key={domain} className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                {domain}
              </span>
              <span className="text-xs text-gray-400">{domainTabs.length}</span>
            </div>
            {domainTabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-6 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => chrome.tabs.update(tab.id, { active: true })}
              >
                {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded" />}
                <span className="truncate">{tab.title}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
