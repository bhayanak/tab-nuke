import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('suspended page', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    // Clear the DOM
    document.body.innerHTML = '';
  });

  function setupDOM() {
    document.body.innerHTML = `
      <img id="favicon" style="display:none" />
      <h1 id="title"></h1>
      <p id="url"></p>
      <button id="restore">Restore</button>
    `;
  }

  function setUrlParams(params: Record<string, string>) {
    const search = new URLSearchParams(params).toString();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: `?${search}`, href: `chrome-extension://mock/suspended.html?${search}` },
      writable: true,
      configurable: true,
    });
  }

  it('populates title and URL from params', async () => {
    setupDOM();
    setUrlParams({ url: 'https://example.com', title: 'Example', favicon: 'https://example.com/favicon.ico' });

    await import('@/suspended/page');

    expect(document.getElementById('title')!.textContent).toBe('Example');
    expect(document.getElementById('url')!.textContent).toBe('https://example.com');
    expect(document.title).toContain('Example');
  });

  it('sets favicon src for valid https URL', async () => {
    setupDOM();
    setUrlParams({ url: 'https://example.com', title: 'Test', favicon: 'https://example.com/icon.png' });

    await import('@/suspended/page');

    const img = document.getElementById('favicon') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/icon.png');
  });

  it('does not set favicon for invalid URL', async () => {
    setupDOM();
    setUrlParams({ url: 'https://example.com', title: 'Test', favicon: 'not-a-valid-url' });

    await import('@/suspended/page');

    const img = document.getElementById('favicon') as HTMLImageElement;
    expect(img.src).toBe('');
  });

  it('handles missing DOM elements gracefully', async () => {
    // No DOM setup — elements don't exist
    setUrlParams({ url: 'https://example.com', title: 'Test' });

    // Should not throw
    await import('@/suspended/page');
  });

  it('restore button click sends RESTORE_TAB message', async () => {
    setupDOM();
    setUrlParams({ url: 'https://example.com', title: 'Test' });

    await import('@/suspended/page');

    const restoreBtn = document.getElementById('restore')!;
    restoreBtn.click();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESTORE_TAB',
        url: 'https://example.com',
      }),
    );
  });

  it('body click restores tab', async () => {
    setupDOM();
    setUrlParams({ url: 'https://example.com', title: 'Test' });

    await import('@/suspended/page');

    // Click somewhere on the body (not on restore button)
    const div = document.createElement('div');
    div.id = 'other';
    document.body.appendChild(div);
    div.click();

    expect(chrome.runtime.sendMessage).toHaveBeenCalled();
  });

  it('does not restore for javascript: URLs', async () => {
    setupDOM();
    setUrlParams({ url: 'javascript:alert(1)', title: 'XSS' });

    await import('@/suspended/page');

    const restoreBtn = document.getElementById('restore')!;
    restoreBtn.click();

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('does not restore for data: URLs', async () => {
    setupDOM();
    setUrlParams({ url: 'data:text/html,<h1>hi</h1>', title: 'Data' });

    await import('@/suspended/page');

    const restoreBtn = document.getElementById('restore')!;
    restoreBtn.click();

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('handles missing URL param', async () => {
    setupDOM();
    setUrlParams({ title: 'No URL' });

    await import('@/suspended/page');

    // Restore button should not trigger sendMessage when URL is missing
    const restoreBtn = document.getElementById('restore')!;
    restoreBtn.click();
    // No URL means the handler was not attached, so no message sent
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('does not restore for invalid URL (not parseable)', async () => {
    setupDOM();
    setUrlParams({ url: '://invalid', title: 'Bad URL' });

    await import('@/suspended/page');

    const restoreBtn = document.getElementById('restore')!;
    restoreBtn.click();
    // URL fails new URL() parsing, so restoreTab returns early
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('does not set favicon for non-http/https/data protocol', async () => {
    setupDOM();
    setUrlParams({ url: 'https://example.com', title: 'Test', favicon: 'ftp://files.com/icon.png' });

    await import('@/suspended/page');

    const img = document.getElementById('favicon') as HTMLImageElement;
    // ftp: is not in the allowed list ['http:', 'https:', 'data:']
    expect(img.src).toBe('');
  });
});
