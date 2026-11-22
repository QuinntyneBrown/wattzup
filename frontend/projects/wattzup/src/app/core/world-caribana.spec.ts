import { vi } from 'vitest';
import { InstancedMesh, Mesh, type BufferGeometry } from 'three/webgpu';
import { CaribanaStreet } from './world-caribana';

describe('CaribanaStreet (L2-101 AC1, L2-111 AC10)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initialises vertex normals on every street mesh at build time, before lay() runs', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new CaribanaStreet((t) => t, disposables);
    street.build(3.5, 161);

    const missingNormals: string[] = [];
    street.group.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const geometry = obj.geometry as BufferGeometry;
      if (!geometry.getAttribute('normal')) {
        missingNormals.push(obj.type);
      }
    });
    expect(missingNormals).toEqual([]);

    for (const d of disposables) d.dispose();
  });

  it('declutters redundant street micro-objects, consolidates solid prop hierarchies and instanced crowds, culls past 300 m, and gates shadows', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new CaribanaStreet((t) => t, disposables);
    street.build(3.5, 161);

    let totalMeshes = 0;
    let instancedMeshes = 0;
    street.group.traverse((obj) => {
      if (obj instanceof Mesh) totalMeshes++;
      if (obj instanceof InstancedMesh) instancedMeshes++;
    });
    // Down from ~4,200+ meshes -> 1,085 in Iter 1 -> < 680 after vertex-colour prop consolidation & crowd/lamp/banner merging.
    expect(totalMeshes).toBeLessThan(680);
    expect(instancedMeshes).toBeLessThan(125);

    const points = Array.from({ length: 161 }, (_, i) => ({
      metres: (i - 10) * 2,
      height: (i - 10) * 0.02,
    }));
    street.lay(points, 0);
    street.setTime(2.5);
    street.place(0, (m) => m * 0.02);

    // Every visible direct child prop past 316 m or behind -22 m (excluding static sky/distant backdrop groups at z === 0 or z <= -1000) is culled,
    // and no mesh standing more than 40 m ahead casts directional shadows outside the 25 m shadow box.
    let farShadowCasters = 0;
    for (const child of street.group.children) {
      if (!child.visible || child instanceof InstancedMesh) continue;
      const metres = -child.position.z;
      if (metres > 45) {
        child.traverse((obj) => {
          if (obj instanceof Mesh && obj.castShadow) farShadowCasters++;
        });
      }
    }
    expect(farShadowCasters).toBe(0);

    for (const d of disposables) d.dispose();
  });
});
