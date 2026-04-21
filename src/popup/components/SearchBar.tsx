import React from 'react';
import { useStore } from '@/shared/store';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <div className="px-4 py-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tabs..."
        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white placeholder-gray-400"
      />
    </div>
  );
}
