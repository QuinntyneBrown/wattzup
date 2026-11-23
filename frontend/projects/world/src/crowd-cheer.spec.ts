import { cheer, CHEER_FROM, CHEER_FULL } from './crowd-cheer';

describe('the crowd cheering a rider as they pass (L2-166 AC86)', () => {
  it('does not cheer a rider who is far off', () => {
    expect(cheer(CHEER_FROM)).toBe(0);
    expect(cheer(200)).toBe(0);
  });

  it('cheers its loudest as the rider goes by', () => {
    expect(cheer(CHEER_FULL)).toBe(1);
    expect(cheer(0)).toBe(1);
  });

  it('rises smoothly as the rider comes and falls the same way as they go', () => {
    let last = 0;
    for (let metres = CHEER_FROM; metres >= CHEER_FULL; metres -= 0.5) {
      const now = cheer(metres);
      expect(now).toBeGreaterThanOrEqual(last);
      // No jump: half a metre nearer is never a tenth more.
      expect(now - last).toBeLessThan(0.1);
      last = now;
    }
    expect(cheer(20)).toBeGreaterThan(0.3);
    expect(cheer(20)).toBeLessThan(0.9);
  });
});
