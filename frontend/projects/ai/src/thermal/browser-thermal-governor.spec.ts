// Unit test
// Traces to: L2-173 AC3
import { BrowserThermalGovernor, type PressureRecordLike } from './browser-thermal-governor';

describe('BrowserThermalGovernor (L2-173 AC3)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sheds live synthesis on serious/critical and recovers only after 30 s of nominal/fair', () => {
    const hooks: { emit?: (records: readonly PressureRecordLike[]) => void } = {};
    const disconnect = vi.fn();
    const governor = new BrowserThermalGovernor((cb) => {
      hooks.emit = cb;
      return { observe: async () => undefined, disconnect };
    });

    governor.start();
    expect(governor.allowLiveSynthesis()).toBe(true);

    hooks.emit?.([{ state: 'serious' }]);
    expect(governor.allowLiveSynthesis()).toBe(false);

    hooks.emit?.([{ state: 'fair' }]);
    vi.advanceTimersByTime(29_000);
    expect(governor.allowLiveSynthesis()).toBe(false);

    // A spike back to critical resets the 30 s recovery window.
    hooks.emit?.([{ state: 'critical' }]);
    hooks.emit?.([{ state: 'nominal' }]);
    vi.advanceTimersByTime(29_000);
    expect(governor.allowLiveSynthesis()).toBe(false);

    vi.advanceTimersByTime(1_000);
    expect(governor.allowLiveSynthesis()).toBe(true);

    governor.stop();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
