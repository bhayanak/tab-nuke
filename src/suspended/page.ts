// Suspended tab page logic
// Reads URL params and sets up restore functionality

function init(): void {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('url');
  const title = params.get('title');
  const favicon = params.get('favicon');

  const titleEl = document.getElementById('title');
  const urlEl = document.getElementById('url');
  const faviconEl = document.getElementById('favicon') as HTMLImageElement | null;
  const restoreEl = document.getElementById('restore');

  if (title && titleEl) {
    titleEl.textContent = title;
    document.title = `💤 ${title}`;
  }

  if (url && urlEl) {
    urlEl.textContent = url;
  }

  if (favicon && faviconEl) {
    // Validate favicon URL to prevent XSS
    try {
      const parsed = new URL(favicon);
      if (['http:', 'https:', 'data:'].includes(parsed.protocol)) {
        faviconEl.src = favicon;
        faviconEl.style.display = 'block';
      }
    } catch {
      // Invalid favicon URL, ignore
    }
  }

  if (restoreEl && url) {
    restoreEl.addEventListener('click', (e) => {
      e.preventDefault();
      restoreTab(url);
    });
  }

  // Also restore on any click on the page body
  document.body.addEventListener('click', (e) => {
    if (url && (e.target as HTMLElement).id !== 'restore') {
      restoreTab(url);
    }
  });
}

function restoreTab(url: string): void {
  // Validate URL before restoring
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'ftp:'].includes(parsed.protocol)) {
      return;
    }
  } catch {
    return;
  }

  // Send message to background to restore
  chrome.runtime.sendMessage({
    type: 'RESTORE_TAB',
    tabId: chrome.tabs?.TAB_ID_NONE,
    url,
  });

  // Fallback: navigate directly
  window.location.href = url;
}

init();
