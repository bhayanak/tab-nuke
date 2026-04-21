import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  STORAGE_KEYS,
  ALARM_NAMES,
  SUSPENDED_URL_PREFIX,
  MEMORY_HOG_THRESHOLD_MB,
  INTERNAL_URL_PATTERNS,
} from '@/shared/constants';

describe('constants', () => {
  it('DEFAULT_CONFIG has correct defaults', () => {
    expect(DEFAULT_CONFIG.autoSuspendMinutes).toBe(30);
    expect(DEFAULT_CONFIG.whitelist).toEqual([]);
    expect(DEFAULT_CONFIG.preservePinned).toBe(true);
    expect(DEFAULT_CONFIG.preserveAudio).toBe(true);
    expect(DEFAULT_CONFIG.preserveForms).toBe(true);
    expect(DEFAULT_CONFIG.showSuspendNotification).toBe(true);
  });

  it('STORAGE_KEYS are defined', () => {
    expect(STORAGE_KEYS.CONFIG).toBe('tab-nuke-config');
    expect(STORAGE_KEYS.TABS).toBe('tab-nuke-tabs');
    expect(STORAGE_KEYS.SESSIONS).toBe('tab-nuke-sessions');
    expect(STORAGE_KEYS.MEMORY_STATS).toBe('tab-nuke-memory-stats');
    expect(STORAGE_KEYS.FOCUS_MODE).toBe('tab-nuke-focus-mode');
    expect(STORAGE_KEYS.LAST_ACTIVE).toBe('tab-nuke-last-active');
  });

  it('ALARM_NAMES are defined', () => {
    expect(ALARM_NAMES.CHECK_INACTIVE).toBe('tab-nuke-check-inactive');
    expect(ALARM_NAMES.MEMORY_SNAPSHOT).toBe('tab-nuke-memory-snapshot');
  });

  it('SUSPENDED_URL_PREFIX is a chrome-extension URL', () => {
    expect(SUSPENDED_URL_PREFIX).toContain('suspended.html');
  });

  it('MEMORY_HOG_THRESHOLD_MB is 200', () => {
    expect(MEMORY_HOG_THRESHOLD_MB).toBe(200);
  });

  it('INTERNAL_URL_PATTERNS includes expected patterns', () => {
    expect(INTERNAL_URL_PATTERNS).toContain('chrome://');
    expect(INTERNAL_URL_PATTERNS).toContain('chrome-extension://');
    expect(INTERNAL_URL_PATTERNS).toContain('about:');
    expect(INTERNAL_URL_PATTERNS).toContain('edge://');
    expect(INTERNAL_URL_PATTERNS).toContain('moz-extension://');
    expect(INTERNAL_URL_PATTERNS).toContain('brave://');
  });
});
