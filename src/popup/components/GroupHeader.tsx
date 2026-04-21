import React from 'react';

interface GroupHeaderProps {
  name: string;
  count: number;
  color?: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function GroupHeader({ name, count, collapsed, onToggle }: GroupHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750"
    >
      <span
        className="transition-transform"
        style={{ transform: collapsed ? '' : 'rotate(90deg)' }}
      >
        ▶
      </span>
      <span className="flex-1 text-left">{name}</span>
      <span className="text-xs text-gray-400">{count}</span>
    </button>
  );
}
