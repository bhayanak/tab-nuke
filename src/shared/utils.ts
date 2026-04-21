import { INTERNAL_URL_PATTERNS } from './constants';

export function generateId(): string {
  return crypto.randomUUID();
}

export function isInternalUrl(url: string): boolean {
  return INTERNAL_URL_PATTERNS.some((pattern) => url.startsWith(pattern));
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ftp:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function sanitizeUrl(url: string): string {
  if (!isValidUrl(url)) return '';
  const parsed = new URL(url);
  // Strip any javascript: or data: schemes that might have been injected
  if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
    return '';
  }
  return parsed.href;
}

export function formatMemoryMB(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
