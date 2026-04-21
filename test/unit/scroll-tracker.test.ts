import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('scroll-tracker', () => {
  let messageHandler: (
    message: Record<string, unknown>,
    sender: unknown,
    sendResponse: (response?: unknown) => void,
  ) => boolean | void;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (handler: typeof messageHandler) => {
        messageHandler = handler;
      },
    );
    await import('@/content/scroll-tracker');
  });

  it('registers a message listener', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(messageHandler).toBeDefined();
  });

  it('handles GET_SCROLL_POSITION', () => {
    const sendResponse = vi.fn();
    Object.defineProperty(window, 'scrollX', { value: 100, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });

    messageHandler({ type: 'GET_SCROLL_POSITION' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ x: 100, y: 200 });
  });

  it('handles SET_SCROLL_POSITION', () => {
    const sendResponse = vi.fn();
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    messageHandler({ type: 'SET_SCROLL_POSITION', position: { x: 50, y: 75 } }, {}, sendResponse);
    expect(scrollToSpy).toHaveBeenCalledWith(50, 75);
    expect(sendResponse).toHaveBeenCalledWith(true);
    scrollToSpy.mockRestore();
  });

  it('handles CHECK_UNSAVED_FORMS with no forms', () => {
    const sendResponse = vi.fn();
    messageHandler({ type: 'CHECK_UNSAVED_FORMS' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith(false);
  });

  it('handles CHECK_UNSAVED_FORMS with unsaved form data', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.defaultValue = '';
    input.value = 'user typed something';
    form.appendChild(input);
    document.body.appendChild(form);

    const sendResponse = vi.fn();
    messageHandler({ type: 'CHECK_UNSAVED_FORMS' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith(true);

    document.body.removeChild(form);
  });

  it('handles CHECK_UNSAVED_FORMS with forms with no changes', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.defaultValue = 'original';
    input.value = 'original';
    form.appendChild(input);
    document.body.appendChild(form);

    const sendResponse = vi.fn();
    messageHandler({ type: 'CHECK_UNSAVED_FORMS' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith(false);

    document.body.removeChild(form);
  });

  it('returns true from listener (keeps channel open)', () => {
    // The addListener callback should return true
    // The original code has `return true;` at the end of the listener
    // We can verify this by checking the return value
    const sendResponse = vi.fn();
    const result = messageHandler({ type: 'GET_SCROLL_POSITION' }, {}, sendResponse);
    expect(result).toBe(true);
  });
});
