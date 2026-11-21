import { type Mesh, type MeshStandardMaterial } from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';
import { RampSign } from './world-ramps';

describe('RampSign persistent pre-warmed texture', () => {
  it('attaches its CanvasTexture at construction time and updates grade in place without changing face.map', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const disposables: { dispose(): void }[] = [];
    const ramp = new RampSign(disposables);

    const signMesh = ramp.group.children.find((c): c is Mesh => (c as Mesh).isMesh)!;
    const face = signMesh.material as MeshStandardMaterial;
    const initialMap = face.map;
    expect(initialMap).not.toBeNull();
    expect(face.transparent).toBe(false);

    ramp.place(
      [
        { metres: 0, height: 0, grade: 1 },
        { metres: 10, height: 0.2, grade: 4 },
        { metres: 20, height: 0.9, grade: 7 },
      ],
      4.5,
      0.15,
    );
    expect(ramp.group.visible).toBe(true);
    // Reuses the exact same CanvasTexture instance so ToonLook twins stay bound and 0 programs recompile.
    expect(face.map).toBe(initialMap);

    ramp.dispose();
    for (const d of disposables) d.dispose();
    vi.restoreAllMocks();
  });
});
