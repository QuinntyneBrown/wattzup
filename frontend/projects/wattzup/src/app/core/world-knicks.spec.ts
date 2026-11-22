import { vi } from 'vitest';
import { InstancedMesh, Mesh, type BufferGeometry } from 'three/webgpu';
import { KnicksStreet } from './world-knicks';

describe('KnicksStreet (L2-101 AC1, L2-111 AC10)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initialises vertex normals on every street mesh at build time, before lay() runs', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new KnicksStreet((t) => t, disposables);
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

  it('right-sizes falling ticker tape, flattens canyon buildings and props, culls past 320 m, and gates shadows to the near shadow box', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new KnicksStreet((t) => t, disposables);
    street.build(3.5, 161);

    let totalMeshes = 0;
    const uniqueMaterials = new Set<unknown>();
    street.group.traverse((obj) => {
      if (obj instanceof Mesh) {
        totalMeshes++;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) uniqueMaterials.add(m);
      }
    });
    // Down from ~860+ meshes (multi-material towers, 160 lamp meshes, 30 bunting meshes, 56 Woolworth sub-draws, 90 float meshes).
    expect(totalMeshes).toBeLessThan(260);
    // Street banners (4 -> 1) and road paint (8 -> 1) pack into shared texture atlases (< 48 unique materials vs 67+).
    expect(uniqueMaterials.size).toBeLessThan(48);

    const points = Array.from({ length: 161 }, (_, i) => ({
      metres: (i - 10) * 2,
      height: (i - 10) * 0.02,
    }));
    street.lay(points, 0);
    street.setTime(3.0);
    street.place(0, (m) => m * 0.02);

    // Falling ticker tape + streamers stay right-sized (< 1,000 total instances vs 3,120).
    let particleInstances = 0;
    street.group.traverse((obj) => {
      if (
        obj instanceof InstancedMesh &&
        !obj.castShadow &&
        obj.geometry.attributes['position']?.count === 4
      ) {
        if (obj.count > 80) particleInstances += obj.count;
      }
    });
    expect(particleInstances).toBeGreaterThan(0);
    expect(particleInstances).toBeLessThanOrEqual(900);

    // Props beyond 320 m along the 480 m loop are hidden, and no visible canyon prop past 45 m casts shadows.
    let visiblePastRoad = 0;
    let farShadowCasters = 0;
    for (const child of street.group.children) {
      if (child instanceof InstancedMesh || child instanceof Mesh) continue;
      const metres = -child.position.z;
      if (metres > 320 && metres < 500 && child.visible) visiblePastRoad++;
      if (child.visible && metres > 45) {
        child.traverse((obj) => {
          if (obj instanceof Mesh && obj.castShadow) farShadowCasters++;
        });
      }
    }
    expect(visiblePastRoad).toBe(0);
    expect(farShadowCasters).toBe(0);

    for (const d of disposables) d.dispose();
  });
});
