import { MemoryStats } from '@/shared/types';
import { STORAGE_KEYS, MEMORY_HOG_THRESHOLD_MB } from '@/shared/constants';
import { getSuspendedCount } from './suspend-engine';

let stats: MemoryStats = {
  totalSavedMB: 0,
  currentUsageMB: 0,
  suspendedCount: 0,
  activeCount: 0,
  peakUsageMB: 0,
  savingsHistory: [],
};

const ESTIMATED_TAB_MB = 50;

export async function initMemoryMonitor(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.MEMORY_STATS);
  if (stored[STORAGE_KEYS.MEMORY_STATS]) {
    stats = { ...stats, ...stored[STORAGE_KEYS.MEMORY_STATS] };
  }
}

export async function updateMemoryStats(): Promise<MemoryStats> {
  const tabs = await chrome.tabs.query({});
  const suspendedCount = getSuspendedCount();
  const activeCount = tabs.length - suspendedCount;

  // Use estimated memory since chrome.processes is limited
  const estimatedUsage = activeCount * ESTIMATED_TAB_MB;
  const estimatedSavings = suspendedCount * ESTIMATED_TAB_MB;

  stats = {
    ...stats,
    currentUsageMB: estimatedUsage,
    totalSavedMB: stats.totalSavedMB + (estimatedSavings > stats.totalSavedMB ? estimatedSavings - stats.totalSavedMB : 0),
    suspendedCount,
    activeCount,
    peakUsageMB: Math.max(stats.peakUsageMB, estimatedUsage),
  };

  // Record daily savings
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = stats.savingsHistory.find((e) => e.date === today);
  if (todayEntry) {
    todayEntry.savedMB = Math.max(todayEntry.savedMB, estimatedSavings);
  } else {
    stats.savingsHistory.push({ date: today, savedMB: estimatedSavings });
    // Keep last 30 days
    if (stats.savingsHistory.length > 30) {
      stats.savingsHistory = stats.savingsHistory.slice(-30);
    }
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.MEMORY_STATS]: stats });
  return { ...stats };
}

export function getMemoryStats(): MemoryStats {
  return { ...stats };
}

export function isMemoryHog(memoryMB: number): boolean {
  return memoryMB >= MEMORY_HOG_THRESHOLD_MB;
}

export function getEstimatedTabMemory(): number {
  return ESTIMATED_TAB_MB;
}
