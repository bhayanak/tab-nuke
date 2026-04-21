// Content script: tracks scroll position and form state
// Injected into all pages at document_idle

function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

function hasUnsavedForms(): boolean {
  const forms = document.querySelectorAll('form');
  for (const form of forms) {
    const inputs = form.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      const el = input as HTMLInputElement | HTMLTextAreaElement;
      if (el.value && el.value !== el.defaultValue) {
        return true;
      }
    }
  }
  return false;
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_SCROLL_POSITION') {
    sendResponse(getScrollPosition());
  } else if (message.type === 'SET_SCROLL_POSITION') {
    window.scrollTo(message.position.x, message.position.y);
    sendResponse(true);
  } else if (message.type === 'CHECK_UNSAVED_FORMS') {
    sendResponse(hasUnsavedForms());
  }
  return true;
});
