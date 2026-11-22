// Unit test
// Traces to: L2-159 AC4, AC5, L2-160 AC1, AC2, AC4, AC5, L2-161 AC1
import { RECOMMENDED_SETTINGS } from '../storage/local-ride-settings-store';
import { worldQuality } from './world-quality';

describe('worldQuality', () => {
  it('opens Auto at Low, always stepping down, at the display rate and full resolution', () => {
    expect(worldQuality(RECOMMENDED_SETTINGS)).toEqual({
      tier: null,
      stepDown: true,
      frameCapFps: null,
      renderScale: 1,
      forceWebGL: false,
    });
  });

  it.each([
    ['auto', false, true],
    ['high', true, true],
    ['high', false, false],
    ['low', false, false],
  ] as const)('with %s and the switch %s, steps down: %s', (quality, stepDown, expected) => {
    expect(worldQuality({ ...RECOMMENDED_SETTINGS, quality, stepDown }).stepDown).toBe(expected);
  });

  it('opens a fixed level there', () => {
    expect(worldQuality({ ...RECOMMENDED_SETTINGS, quality: 'medium' }).tier).toBe('medium');
  });

  it('caps the frames at 30, scales the buffer and asks for WebGL 2', () => {
    const quality = worldQuality({
      ...RECOMMENDED_SETTINGS,
      frameRate: '30',
      resolution: 55,
      graphics: 'webgl2',
    });
    expect(quality).toMatchObject({ frameCapFps: 30, renderScale: 0.55, forceWebGL: true });
  });
});
