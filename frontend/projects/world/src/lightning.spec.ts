import { lightning } from './lightning';

describe('sheet lightning inside the thunderheads on the horizon (L2-166 AC73)', () => {
  const run = (which: number, seconds: number): number[] => {
    const seen: number[] = [];
    for (let t = 0; t < seconds; t += 0.01) seen.push(lightning(t, which));
    return seen;
  };

  it('is dark nearly all the time', () => {
    for (const which of [0, 1]) {
      const seen = run(which, 120);
      expect(seen.filter((b) => b > 0.02).length / seen.length).toBeLessThan(0.08);
      expect(Math.max(...seen)).toBeGreaterThan(0.8);
      expect(Math.max(...seen)).toBeLessThanOrEqual(1);
      expect(Math.min(...seen)).toBe(0);
    }
  });

  it('flickers when it comes: two or three pulses, then nothing for seconds', () => {
    const seen = run(0, 120);
    // A pulse begins where the light jumps up from one hundredth of a second to the next.
    const starts: number[] = [];
    for (let i = 1; i < seen.length; i++) if (seen[i]! - seen[i - 1]! > 0.3) starts.push(i / 100);
    expect(starts.length).toBeGreaterThan(8);
    // Never more than three pulses in any one second (no flashing a viewer could be harmed by).
    for (const at of starts)
      expect(starts.filter((s) => s >= at && s < at + 1).length).toBeLessThanOrEqual(3);
    // And gaps of several seconds between one flicker and the next.
    const gaps = starts.slice(1).map((s, i) => s - starts[i]!);
    expect(Math.max(...gaps)).toBeGreaterThan(5);
  });

  it('is not the same in one thunderhead as in another', () => {
    const a = run(0, 60);
    const b = run(1, 60);
    const both = a.filter((v, i) => v > 0.3 && b[i]! > 0.3).length;
    const either = a.filter((v, i) => v > 0.3 || b[i]! > 0.3).length;
    expect(both / either).toBeLessThan(0.2);
  });

  it('is the same at the same second of every ride', () => {
    expect(lightning(37.42, 0)).toBe(lightning(37.42, 0));
    expect(lightning(-5, 1)).toBe(0);
  });
});
