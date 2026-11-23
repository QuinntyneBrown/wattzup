import { Color, DoubleSide } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { surfaceTexture } from './ground-material';
import { windowMaterial } from './window-material';

describe('windowMaterial', () => {
  it('builds a double-sided alpha-tested window and shutter material and disposes cleanly', () => {
    const detail = surfaceTexture();
    const mat = windowMaterial(detail, new Color('#e6b2ac'), null);
    expect(mat.side).toBe(DoubleSide);
    expect(mat.alphaTest).toBe(0.5);
    mat.dispose();
    detail.dispose();
  });
});
