// Unit test
// Traces to: L2-162 AC2, AC3
import { deviceCheckLevels, deviceCheckResult, deviceCheckRunning } from './device-check';

describe('deviceCheckLevels', () => {
  it.each([
    ['webgpu', 'auto', ['ultra', 'high', 'medium', 'low']],
    ['webgpu', 'webgl2', ['high', 'medium', 'low']],
    ['webgl2', 'auto', ['high', 'medium', 'low']],
    ['none', 'auto', []],
  ] as const)('with %s and Graphics %s tries %j', (api, graphics, levels) => {
    expect(deviceCheckLevels(api, graphics)).toEqual(levels);
  });
});

describe('deviceCheckRunning', () => {
  it('reads the level and time left, and asks to keep the tab open', () => {
    expect(deviceCheckRunning({ level: 'ultra', secondsLeft: 30, percent: 0, tried: [] })).toEqual({
      label: 'Trying Ultra · 30 s left',
      foot: 'Keep this tab open; the check rides off screen.',
    });
  });

  it('reads what each level tried held', () => {
    expect(
      deviceCheckRunning({
        level: 'medium',
        secondsLeft: 6,
        percent: 55,
        tried: [
          { level: 'ultra', fps: 41 },
          { level: 'high', fps: 48 },
        ],
      }).foot,
    ).toBe('Ultra held 41 fps. High held 48 fps. Keep this tab open; the check rides off screen.');
  });
});

describe('deviceCheckResult', () => {
  const now = new Date(2026, 10, 22, 20, 0);

  it('reads the level that held the display rate, where Auto starts and when, today', () => {
    expect(
      deviceCheckResult(
        {
          level: 'high',
          displayFps: 60,
          tried: [{ level: 'ultra', fps: 41 }],
          checkedAt: new Date(2026, 10, 22, 19, 31).toISOString(),
        },
        now,
      ),
    ).toEqual({
      level: 'High',
      fps: '60 fps',
      detail: 'Auto now starts at High here. Ultra held 41 fps. Checked today at 7:31 PM.',
    });
  });

  it('reads the top level alone when it held first time, in the morning', () => {
    expect(
      deviceCheckResult(
        {
          level: 'ultra',
          displayFps: 120,
          tried: [],
          checkedAt: new Date(2026, 10, 22, 0, 5).toISOString(),
        },
        now,
      ),
    ).toEqual({
      level: 'Ultra',
      fps: '120 fps',
      detail: 'Auto now starts at Ultra here. Checked today at 12:05 AM.',
    });
  });

  it('reads the day of a check before today', () => {
    expect(
      deviceCheckResult(
        {
          level: 'medium',
          displayFps: 60,
          tried: [],
          checkedAt: new Date(2026, 10, 21, 12, 0).toISOString(),
        },
        now,
      ).detail,
    ).toBe('Auto now starts at Medium here. Checked on Nov 21 at 12:00 PM.');
  });

  it('reads what Low held when no level held the display rate', () => {
    expect(
      deviceCheckResult(
        {
          level: 'low',
          displayFps: 60,
          tried: [
            { level: 'high', fps: 21 },
            { level: 'medium', fps: 30 },
            { level: 'low', fps: 38 },
          ],
          checkedAt: new Date(2026, 10, 22, 19, 31).toISOString(),
        },
        now,
      ),
    ).toEqual({
      level: 'Low',
      fps: '38 fps',
      detail:
        'Auto now starts at Low here. High held 21 fps. Medium held 30 fps. Checked today at 7:31 PM.',
    });
  });
});
