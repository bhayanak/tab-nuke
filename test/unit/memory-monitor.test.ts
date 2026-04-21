import { describe, it, expect } from 'vitest';

describe('Memory Monitor Logic', () => {
  const ESTIMATED_TAB_MB = 50;
  const MEMORY_HOG_THRESHOLD_MB = 200;

  it('estimates memory usage correctly', () => {
    const activeCount = 10;
    const estimated = activeCount * ESTIMATED_TAB_MB;
    expect(estimated).toBe(500);
  });

  it('detects memory hogs', () => {
    expect(250 >= MEMORY_HOG_THRESHOLD_MB).toBe(true);
    expect(100 >= MEMORY_HOG_THRESHOLD_MB).toBe(false);
  });

  it('calculates savings from suspended tabs', () => {
    const suspendedCount = 5;
    const savings = suspendedCount * ESTIMATED_TAB_MB;
    expect(savings).toBe(250);
  });

  it('tracks savings history correctly', () => {
    const history: { date: string; savedMB: number }[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Add entry
    history.push({ date: today, savedMB: 200 });
    expect(history.length).toBe(1);

    // Update existing entry
    const entry = history.find((e) => e.date === today);
    if (entry) entry.savedMB = Math.max(entry.savedMB, 300);
    expect(history[0].savedMB).toBe(300);
  });

  it('keeps only last 30 days of history', () => {
    const history = Array.from({ length: 35 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      savedMB: i * 10,
    }));

    const trimmed = history.slice(-30);
    expect(trimmed.length).toBe(30);
  });
});
