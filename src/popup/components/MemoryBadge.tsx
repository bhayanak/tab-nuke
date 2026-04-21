import React from 'react';
import { useStore } from '@/shared/store';
import { formatMemoryMB } from '@/shared/utils';

export function MemoryBadge() {
  const { memoryStats } = useStore();

  return (
    <div className="flex items-center gap-2 text-xs">
      {memoryStats.suspendedCount > 0 && (
        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
          💤 {memoryStats.suspendedCount} saved
        </span>
      )}
      <span className="text-gray-500 dark:text-gray-400">
        {formatMemoryMB(memoryStats.currentUsageMB)}
      </span>
    </div>
  );
}
