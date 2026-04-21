import { TabGroup, TabGroupColor } from '@/shared/types';
import { getDomain } from '@/shared/utils';

export async function groupByDomain(): Promise<TabGroup[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const domainMap = new Map<string, number[]>();

  for (const tab of tabs) {
    if (!tab.url || !tab.id) continue;
    const domain = getDomain(tab.url);
    if (!domain) continue;

    const existing = domainMap.get(domain) ?? [];
    existing.push(tab.id);
    domainMap.set(domain, existing);
  }

  const groups: TabGroup[] = [];
  const colors: TabGroupColor[] = [
    'blue',
    'red',
    'yellow',
    'green',
    'pink',
    'purple',
    'cyan',
    'orange',
  ];
  let colorIdx = 0;

  for (const [domain, tabIds] of domainMap) {
    if (tabIds.length < 2) continue; // Only group if 2+ tabs

    try {
      const groupId = await chrome.tabs.group({ tabIds });
      const color = colors[colorIdx % colors.length];
      await chrome.tabGroups.update(groupId, {
        title: domain,
        color,
        collapsed: false,
      });

      groups.push({
        id: String(groupId),
        name: domain,
        color,
        tabIds,
        isCollapsed: false,
      });

      colorIdx++;
    } catch {
      // tabGroups API may not be supported
    }
  }

  return groups;
}

export async function ungroupAll(): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  for (const tab of tabs) {
    if (tab.id && tab.groupId !== undefined && tab.groupId >= 0) {
      try {
        await chrome.tabs.ungroup(tab.id);
      } catch {
        // Tab may have been removed
      }
    }
  }
}

export async function getExistingGroups(): Promise<TabGroup[]> {
  try {
    const groups = await chrome.tabGroups.query({});
    const result: TabGroup[] = [];

    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      result.push({
        id: String(group.id),
        name: group.title ?? `Group ${group.id}`,
        color: group.color,
        tabIds: tabs.map((t) => t.id!).filter(Boolean),
        isCollapsed: group.collapsed,
      });
    }

    return result;
  } catch {
    return [];
  }
}
