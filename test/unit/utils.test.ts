import { describe, it, expect, vi } from 'vitest';
import {
    isValidUrl,
    getDomain,
    sanitizeUrl,
    formatMemoryMB,
    timeAgo,
    generateId,
    isInternalUrl,
    debounce,
    escapeHtml,
} from '@/shared/utils';

describe('isValidUrl', () => {
  it('returns true for http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('returns true for https URLs', () => {
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
  });

    it('returns true for ftp URLs', () => {
        expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

  it('returns false for javascript: URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

    it('returns false for data: URLs', () => {
        expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
    });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

describe('getDomain', () => {
    it('extracts domain from https URL', () => {
    expect(getDomain('https://www.example.com/path')).toBe('www.example.com');
  });

    it('extracts domain from http URL', () => {
        expect(getDomain('http://localhost:3000')).toBe('localhost');
    });

  it('returns empty string for invalid URL', () => {
    expect(getDomain('invalid')).toBe('');
  });

    it('returns empty string for empty string', () => {
        expect(getDomain('')).toBe('');
    });
});

describe('sanitizeUrl', () => {
    it('returns valid http URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('returns empty string for javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

    it('returns empty string for data: URLs', () => {
        expect(sanitizeUrl('data:text/html,hello')).toBe('');
    });

  it('returns empty string for invalid URLs', () => {
    expect(sanitizeUrl('not-a-url')).toBe('');
  });

    it('returns empty string for vbscript: URLs', () => {
        expect(sanitizeUrl('vbscript:msgbox')).toBe('');
    });
});

describe('formatMemoryMB', () => {
  it('formats MB values', () => {
    expect(formatMemoryMB(150.5)).toBe('150.5 MB');
  });

  it('formats sub-MB values as KB', () => {
    expect(formatMemoryMB(0.5)).toBe('512 KB');
  });

    it('formats zero', () => {
        expect(formatMemoryMB(0)).toBe('0 KB');
    });

    it('formats exactly 1 MB', () => {
        expect(formatMemoryMB(1)).toBe('1.0 MB');
    });
});

describe('timeAgo', () => {
  it('returns "just now" for recent dates', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId()));
    expect(ids.size).toBe(10);
  });
});

describe('isInternalUrl', () => {
  it('detects chrome:// URLs', () => {
    expect(isInternalUrl('chrome://settings')).toBe(true);
  });

  it('detects chrome-extension:// URLs', () => {
    expect(isInternalUrl('chrome-extension://abc/page.html')).toBe(true);
  });

    it('detects about: URLs', () => {
        expect(isInternalUrl('about:blank')).toBe(true);
    });

    it('detects edge:// URLs', () => {
        expect(isInternalUrl('edge://settings')).toBe(true);
    });

    it('detects moz-extension:// URLs', () => {
        expect(isInternalUrl('moz-extension://abc')).toBe(true);
    });

  it('returns false for http URLs', () => {
    expect(isInternalUrl('https://example.com')).toBe(false);
  });
});

describe('debounce', () => {
  it('debounces function calls', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 100));
    expect(fn).toHaveBeenCalledTimes(1);
  });

    it('calls with latest arguments', async () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 50);
        debounced('a');
        debounced('b');
        debounced('c');
        await new Promise((r) => setTimeout(r, 100));
        expect(fn).toHaveBeenCalledWith('c');
    });
});

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
      const result = escapeHtml('<script>alert("xss")</script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<script>');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

    it('escapes ampersands', () => {
        expect(escapeHtml('a & b')).toContain('&amp;');
    });
});
