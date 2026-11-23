import { Color, type MeshLambertNodeMaterial } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { surfaceTexture } from './ground-material';
import { wallMaterial } from './wall-material';

describe('wallMaterial', () => {
  it('builds a flat-shaded node material for course walls and disposes cleanly', () => {
    const detail = surfaceTexture();
    const mat = wallMaterial(detail, null, 0) as MeshLambertNodeMaterial;
    expect(mat.fog).toBe(true);
    mat.dispose();
    detail.dispose();
  });

  it('disables scene fog when haze is provided for distant skyline walls', () => {
    const detail = surfaceTexture();
    const mat = wallMaterial(detail, null, 0, new Color('#e6b2ac')) as MeshLambertNodeMaterial;
    expect(mat.fog).toBe(false);
    mat.dispose();
    detail.dispose();
  });
});
