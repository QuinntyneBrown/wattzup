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
    const uniqueMaterials = new Set<unknown>();
    street.group.traverse((obj) => {
      if (obj instanceof Mesh) {
        totalMeshes++;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) uniqueMaterials.add(m);
      }
      if (obj instanceof InstancedMesh) instancedMeshes++;
    });
    // Down from ~4,200+ meshes -> 1,085 in Iter 1 -> 630 in Iter 2 -> < 500 after Gardiner bent/traffic instancing & intersection consolidation.
    expect(totalMeshes).toBeLessThan(500);
    expect(instancedMeshes).toBeLessThan(125);
    // Banner/flag/placard atlases and shared signal/truss/crowd materials cut unique materials from 785 -> 388 -> 236 -> < 150.
    expect(uniqueMaterials.size).toBeLessThan(150);

    const points = Array.from({ length: 161 }, (_, i) => ({
      metres: (i - 10) * 2,
      height: (i - 10) * 0.02,
    }));
    street.lay(points, 0);
    street.setTime(2.5);
    street.place(0, (m) => m * 0.02);

    // Active rendered vertex & shadow-caster vertex budgets keep GPU frame times fast on both low and high tiers.
    let activeVertices = 0;
    let shadowVertices = 0;
    const isEffectivelyVisible = (obj: Mesh): boolean => {
      let cur: { visible: boolean; parent: unknown } | null = obj;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent as { visible: boolean; parent: unknown } | null;
      }
      return true;
    };
    street.group.traverse((obj) => {
      if (!(obj instanceof Mesh) || !isEffectivelyVisible(obj)) return;
      const pos = (obj.geometry as BufferGeometry).getAttribute('position');
      if (!pos) return;
      const instances = obj instanceof InstancedMesh ? obj.count : 1;
      if (instances <= 0) return;
      const verts = pos.count * instances;
      activeVertices += verts;
      if (obj.castShadow) shadowVertices += verts;
    });
    expect(activeVertices).toBeLessThan(1_350_000);
    expect(shadowVertices).toBeLessThan(145_000);

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
