import { float } from 'three/tsl';
import { PerspectiveCamera } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { createAmbientOcclusion } from './world-renderer';

describe('createAmbientOcclusion (technique 36 GTAO)', () => {
  it('configures GTAO at half resolution (0.5x) to reduce GPU fragment load by 4x', () => {
    const pass = createAmbientOcclusion(float(0), new PerspectiveCamera());
    expect(pass.resolutionScale).toBe(0.5);
    pass.dispose();
  });
});
