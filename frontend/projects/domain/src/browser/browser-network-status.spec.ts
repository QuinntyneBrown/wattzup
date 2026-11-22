// Unit test
// Traces to: L2-135 AC4
// Description: the network status starts from navigator.onLine, follows the window's offline and online events, and
// stops listening when its owner goes.
import { TestBed } from '@angular/core/testing';
import { BrowserNetworkStatus } from './browser-network-status';

describe('BrowserNetworkStatus', () => {
  let onLine: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    TestBed.configureTestingModule({ providers: [BrowserNetworkStatus] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    onLine.mockRestore();
  });

  it('starts from navigator.onLine', () => {
    onLine.mockReturnValue(false);

    expect(TestBed.inject(BrowserNetworkStatus).online()).toBe(false);
  });

  it('follows the window going offline and back online', () => {
    const status = TestBed.inject(BrowserNetworkStatus);

    onLine.mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(status.online()).toBe(false);

    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    expect(status.online()).toBe(true);
  });

  it('stops listening when its owner goes', () => {
    const status = TestBed.inject(BrowserNetworkStatus);
    TestBed.resetTestingModule();

    onLine.mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));

    expect(status.online()).toBe(true);
  });
});
