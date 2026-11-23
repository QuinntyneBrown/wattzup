import { DoubleSide } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { fenceMaterial } from './fence-material';

describe('fenceMaterial', () => {
  it('builds an alpha-tested double-sided guardrail material and disposes cleanly', () => {
    const mat = fenceMaterial(null, 0);
    expect(mat.side).toBe(DoubleSide);
    expect(mat.alphaTest).toBe(0.5);
    mat.dispose();
  });
});
