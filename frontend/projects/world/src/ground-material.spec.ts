import { Color } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { groundMaterial, surfaceTexture } from './ground-material';

describe('groundMaterial', () => {
  it('creates a disposable standard node material and updates the eye cleanly', () => {
    const detail = surfaceTexture();
    const { material, eye } = groundMaterial(detail, 5, null, 0, new Color('#e6b2ac'), null);
    expect(() => eye.at(120, 0, 1.8)).not.toThrow();
    material.dispose();
    detail.dispose();
  });
});
