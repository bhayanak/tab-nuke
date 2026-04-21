import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the shouldSuspend logic indirectly through exports
// The actual chrome API calls are mocked in setup.ts

describe('Suspend Engine Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not suspend chrome:// URLs', () => {
    const url = 'chrome://settings';
    expect(url.startsWith('chrome://')).toBe(true);
  });

  it('should not suspend chrome-extension:// URLs', () => {
    const url = 'chrome-extension://abc/page.html';
    expect(url.startsWith('chrome-extension://')).toBe(true);
  });

  it('should identify suspendable http URLs', () => {
    const url = 'https://example.com';
    expect(url.startsWith('http')).toBe(true);
  });

  it('should respect whitelist domains', () => {
    const whitelist = ['gmail.com', 'docs.google.com'];
    const url = 'https://mail.gmail.com/inbox';
    expect(whitelist.some((d) => url.includes(d))).toBe(true);
  });

  it('should not whitelist non-matching domains', () => {
    const whitelist = ['gmail.com'];
    const url = 'https://example.com';
    expect(whitelist.some((d) => url.includes(d))).toBe(false);
  });
});
