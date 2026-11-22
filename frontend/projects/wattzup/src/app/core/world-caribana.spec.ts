import { vi } from 'vitest';
import { BatchedMesh, InstancedMesh, Matrix4, Mesh, type BufferGeometry } from 'three/webgpu';
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

  it('declutters redundant street micro-objects, batches shared-material props and crowds, culls past 300 m, and gates shadows', () => {
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
    // Down from ~4,200+ meshes -> 1,085 in Iter 1 -> 630 in Iter 2 -> 475 in Iter 3 -> < 240 after BatchedMesh prop & crowd draw-call consolidation.
    expect(totalMeshes).toBeLessThan(240);
    expect(instancedMeshes).toBeLessThan(75);
    // Flag/lamp/stripe atlases and shared materials cut unique materials from 785 -> 388 -> 236 -> 148 -> < 125.
    expect(uniqueMaterials.size).toBeLessThan(125);

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
    const scratchMat = new Matrix4();
    street.group.traverse((obj) => {
      if (!(obj instanceof Mesh) || !isEffectivelyVisible(obj)) return;
      if (obj instanceof BatchedMesh) {
        const instInfo = (
          obj as unknown as {
            _instanceInfo: { visible: boolean; active: boolean; geometryIndex: number }[];
          }
        )._instanceInfo;
        const geoInfo = (
          obj as unknown as {
            _geometryInfo: { reservedVertexCount: number }[];
          }
        )._geometryInfo;
        let verts = 0;
        for (const info of instInfo) {
          if (!info.active || !info.visible) continue;
          verts += geoInfo[info.geometryIndex]?.reservedVertexCount ?? 0;
        }
        activeVertices += verts;
        if (obj.castShadow) shadowVertices += verts;
        return;
      }
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

    // Every visible direct child prop or batched shadow instance past 45 m skips directional shadow casting.
    let farShadowCasters = 0;
    for (const child of street.group.children) {
      if (!child.visible || child instanceof InstancedMesh) continue;
      if (child instanceof BatchedMesh) {
        if (!child.castShadow) continue;
        for (let id = 0; id < child.maxInstanceCount; id++) {
          if (!child.getVisibleAt(id)) continue;
          child.getMatrixAt(id, scratchMat);
          const e = scratchMat.elements;
          const nonZeroScale = e[0] !== 0 || e[5] !== 0 || e[10] !== 0;
          const metres = -e[14];
          if (nonZeroScale && metres > 45) farShadowCasters++;
        }
        continue;
      }
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
