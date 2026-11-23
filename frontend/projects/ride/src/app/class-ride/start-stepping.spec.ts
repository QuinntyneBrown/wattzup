// Unit test
// Traces to: L2-156 AC3, AC4
// Description: World loading starts the world at a quality level and, when a program fails to build there, tries the
// level below; below Low, or where no 3D starts at all, the class rides the panorama.
import type { WorldTier } from '@telo/api';
import { startStepping } from './start-stepping';

/** An attempt that fails to build at the levels given and starts at the rest, recording each level tried. */
function attempts(failing: readonly WorldTier[], draws3d = true) {
  const tried: WorldTier[] = [];
  const attempt = async (tier: WorldTier): Promise<boolean> => {
    tried.push(tier);
    if (failing.includes(tier)) throw new Error(`a program failed to build at ${tier}`);
    return draws3d;
  };
  return { tried, attempt };
}

describe('startStepping', () => {
  it('starts at the level asked for when its programs build', async () => {
    const { tried, attempt } = attempts([]);

    expect(await startStepping('medium', attempt, new AbortController().signal)).toBe('medium');
    expect(tried).toEqual(['medium']);
  });

  it('tries the level below after a program fails to build', async () => {
    const { tried, attempt } = attempts(['high', 'medium']);

    expect(await startStepping('high', attempt, new AbortController().signal)).toBe('low');
    expect(tried).toEqual(['high', 'medium', 'low']);
  });

  it('rides the panorama when a program fails to build at Low', async () => {
    const { tried, attempt } = attempts(['low']);

    expect(await startStepping('low', attempt, new AbortController().signal)).toBeNull();
    expect(tried).toEqual(['low']);
  });

  it('rides the panorama at once where no 3D starts, without trying lower levels', async () => {
    const { tried, attempt } = attempts([], false);

    expect(await startStepping('high', attempt, new AbortController().signal)).toBeNull();
    expect(tried).toEqual(['high']);
  });

  it('tries no lower level once World loading has gone', async () => {
    const gone = new AbortController();
    const { tried, attempt } = attempts(['high']);
    gone.abort();

    expect(await startStepping('high', attempt, gone.signal)).toBeNull();
    expect(tried).toEqual(['high']);
  });
});
