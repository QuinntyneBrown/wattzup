// Unit test
// Traces to: L2-144 AC1, AC2
// Description: Full screen is available only where the browser offers it; enter asks for the whole page and exit
// leaves; active follows the browser however full screen began or ended, and stops listening when its owner goes.
import { TestBed } from '@angular/core/testing';
import { BrowserFullscreen } from './browser-fullscreen';

describe('BrowserFullscreen', () => {
  let element: Element | null;
  let enabled: boolean;
  let request: ReturnType<typeof vi.fn>;
  let leave: ReturnType<typeof vi.fn>;

  // The test DOM has no Fullscreen API: install the browser's, as the app sees it.
  const install = () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      get: () => enabled,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => element,
    });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: leave });
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: request,
    });
  };

  const create = () => {
    TestBed.configureTestingModule({ providers: [BrowserFullscreen] });
    return TestBed.inject(BrowserFullscreen);
  };
  const change = (to: Element | null) => {
    element = to;
    document.dispatchEvent(new Event('fullscreenchange'));
  };

  beforeEach(() => {
    element = null;
    enabled = true;
    request = vi.fn(async () => undefined);
    leave = vi.fn(async () => undefined);
    install();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    for (const name of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen']) {
      Reflect.deleteProperty(document, name);
    }
    Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
  });

  it('is available where the browser offers full screen, and not where it does not', () => {
    expect(create().available()).toBe(true);
    TestBed.resetTestingModule();
    enabled = false;
    expect(create().available()).toBe(false);
  });

  it('asks for the whole page on enter, and leaves on exit', () => {
    const fullscreen = create();

    fullscreen.enter();
    expect(request).toHaveBeenCalledOnce();
    change(document.documentElement);
    fullscreen.exit();
    expect(leave).toHaveBeenCalledOnce();
  });

  it('is active while the browser shows the page in full screen, however it began or ended', () => {
    const fullscreen = create();
    expect(fullscreen.active()).toBe(false);

    change(document.documentElement);
    expect(fullscreen.active()).toBe(true);
    change(null);
    expect(fullscreen.active()).toBe(false);
  });

  it('carries on when the browser refuses full screen', async () => {
    request.mockRejectedValue(new TypeError('Permissions check failed'));
    const fullscreen = create();

    fullscreen.enter();
    await Promise.resolve();
    expect(fullscreen.active()).toBe(false);
  });

  it('stops following the browser when its owner is destroyed', () => {
    const fullscreen = create();
    TestBed.resetTestingModule();

    change(document.documentElement);
    expect(fullscreen.active()).toBe(false);
  });
});
