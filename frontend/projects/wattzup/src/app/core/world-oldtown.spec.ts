import { vi } from 'vitest';
import {
  BatchedMesh,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type BufferAttribute,
  type BufferGeometry,
} from 'three/webgpu';
import { cobbleTextures, OldTownStreet } from './world-oldtown';
import { Corners } from './world-corners';
import { apexes } from './scene-bend';
import { worldById } from './worlds';

describe('OldTownStreet and Corners (L2-101 AC1, L2-110 AC9, L2-111 AC10)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initialises vertex normals on every street mesh at build time, before lay() runs', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new OldTownStreet((t) => t, disposables);
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

    const points = Array.from({ length: 161 }, (_, i) => ({
      metres: (i - 10) * 2,
      height: (i - 10) * 0.04,
    }));
    street.lay(points, 42);
    street.place(42, (m) => m * 0.02);

    for (const d of disposables) d.dispose();
  });

  it('places corners at the bend apexes ahead, mirrored for turn direction and pitched on ramps', () => {
    const disposables: { dispose(): void }[] = [];
    const corners = new Corners(disposables);
    corners.build(3.5, 0.15, 3.9);

    const world = worldById('oldtown');
    const expected = apexes(world, -30, 400);
    corners.place(world, 0, (m) => m * 0.06);

    const visible = corners.group.children.filter((c) => c.visible);
    expect(visible.length).toBe(Math.min(expected.length, corners.group.children.length));
    visible.forEach((corner, i) => {
      expect(corner.scale.x).toBe(expected[i]!.turn);
      expect(corner.position.z).toBeCloseTo(-expected[i]!.s, 5);
      expect(corner.rotation.x).toBeCloseTo(Math.atan(0.06), 5);
    });

    // Advancing s updates corner positions and waves the marshal's flag.
    const beforePosZ = visible[0]!.position.z;
    corners.place(world, 5, (m) => m * 0.06);
    expect(visible[0]!.position.z).toBeCloseTo(beforePosZ + 5, 5);

    // Every corner mesh has normals ready for lighting and bending, uses at most 3 meshes per
    // corner across 2 shared materials, and gates shadow casting to corners inside (-30, 90) m.
    const materials = new Set<unknown>();
    for (const corner of corners.group.children) {
      let meshCount = 0;
      corner.traverse((obj) => {
        if (!(obj instanceof Mesh)) return;
        meshCount++;
        materials.add(obj.material);
        const normal = (obj.geometry as BufferGeometry).getAttribute('normal') as
          BufferAttribute | undefined;
        expect(normal).toBeDefined();
      });
      expect(meshCount).toBeLessThanOrEqual(3);
    }
    expect(materials.size).toBe(2);

    const firstApexS = expected[0]!.s;
    corners.place(world, firstApexS - 40, (m) => m * 0.06);
    for (const corner of corners.group.children.filter((c) => c.visible)) {
      const metres = -corner.position.z;
      const inShadow = metres > -30 && metres < 90;
      corner.traverse((obj) => {
        if (obj instanceof Mesh) expect(obj.castShadow).toBe(inShadow);
      });
    }

    for (const d of disposables) d.dispose();
  });

  it('batches street frontages by material, culls blocks behind the camera, and restricts shadow casting to near blocks', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new OldTownStreet((t) => t, disposables);
    street.build(3.5, 161);

    const batched: BatchedMesh[] = [];
    let totalMeshes = 0;
    street.group.traverse((obj) => {
      if (obj instanceof Mesh) totalMeshes++;
      if (obj instanceof BatchedMesh) batched.push(obj);
    });
    expect(batched.length).toBeGreaterThan(0);
    expect(totalMeshes).toBeLessThan(80);

    street.place(0, (m) => m * 0.05);
    const countVisibleIn = (meshes: readonly BatchedMesh[]) =>
      meshes.reduce((sum, b) => {
        let v = 0;
        for (let id = 0; id < b.instanceCount; id++) if (b.getVisibleAt(id)) v++;
        return sum + v;
      }, 0);

    const visibleAtStart = countVisibleIn(batched);
    const shadowCasters = batched.filter((b) => b.castShadow);
    const nonShadowCasters = batched.filter((b) => !b.castShadow);
    const visibleShadowInstances = countVisibleIn(shadowCasters);

    expect(visibleAtStart).toBeGreaterThan(0);
    expect(visibleAtStart).toBeLessThan(185);
    expect(visibleShadowInstances).toBeGreaterThan(0);
    expect(visibleShadowInstances).toBeLessThan(55);
    // Every BatchedMesh has at least one visible instance at s=0 so warmUp() compiles all programs.
    for (const b of [...shadowCasters, ...nonShadowCasters]) {
      expect(countVisibleIn([b])).toBeGreaterThan(0);
    }

    street.place(210, (m) => m * 0.05);
    expect(countVisibleIn(batched)).toBeGreaterThan(0);
    expect(countVisibleIn(shadowCasters)).toBeLessThan(55);

    for (const d of disposables) d.dispose();
  });

  it('compacts spectator hats, hand flags and hair InstancedMeshes with zero degenerate scale=0 instances', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new OldTownStreet((t) => t, disposables);
    street.build(3.5, 161);
    street.place(25, (m) => m * 0.03);

    const instanced = street.group.children.filter(
      (c): c is InstancedMesh => c instanceof InstancedMesh,
    );
    // Crowd InstancedMeshes are the 7 added by addCrowd (before bunting flags, cords and swifts).
    const crowdMeshes = instanced.slice(-10, -3);
    expect(crowdMeshes).toHaveLength(7);
    const [legs, , , , hats, waved, hair] = crowdMeshes;

    expect(hats!.count + hair!.count).toBe(legs!.count);
    expect(waved!.count).toBeGreaterThan(0);
    expect(waved!.count).toBeLessThan(Math.ceil(legs!.count * 0.3));

    const m = new Matrix4();
    for (const accessory of [hats!, waved!, hair!]) {
      for (let i = 0; i < accessory.count; i++) {
        accessory.getMatrixAt(i, m);
        expect(Math.abs(m.determinant())).toBeGreaterThan(1e-6);
      }
    }

    for (const d of disposables) d.dispose();
  });

  it('packs street banners, road paint and lamp pennants into shared atlas materials and distance-gates banner shadows', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new OldTownStreet((t) => t, disposables);
    street.build(3.5, 161);
    street.place(0, (m) => m * 0.04);

    // Direct non-instanced, non-batched Mesh children on street.group include the 3 street banners
    // (x === 0, elevated above the road) and 4 road-paint slogans (transparent,polygonOffset).
    const directMeshes = street.group.children.filter(
      (c): c is Mesh =>
        c instanceof Mesh && !(c instanceof InstancedMesh) && !(c instanceof BatchedMesh),
    );
    const paintMeshes = directMeshes.filter(
      (m) =>
        m.material instanceof MeshStandardMaterial &&
        m.material.transparent &&
        m.material.polygonOffset &&
        m.position.z !== 0,
    );
    const bannerMeshes = directMeshes.filter(
      (m) =>
        m.material instanceof MeshStandardMaterial &&
        !m.material.transparent &&
        m.position.x === 0 &&
        m.position.z !== 0,
    );

    expect(paintMeshes).toHaveLength(4);
    expect(new Set(paintMeshes.map((m) => m.material)).size).toBe(1);
    for (const m of paintMeshes) {
      expect(m.rotation.x).toBeCloseTo(Math.atan(0.04), 5);
    }

    expect(bannerMeshes).toHaveLength(3);
    expect(new Set(bannerMeshes.map((m) => m.material)).size).toBe(1);
    expect(bannerMeshes.filter((m) => m.castShadow)).toHaveLength(1);

    street.place(170, (m) => m * 0.04);
    expect(bannerMeshes.filter((m) => m.castShadow)).toHaveLength(1);

    const instanced = street.group.children.filter(
      (c): c is InstancedMesh => c instanceof InstancedMesh,
    );
    // Lamp pennants are the 6th and 7th InstancedMeshes added by addFurniture.
    const [pen0, pen1] = [instanced[5]!, instanced[6]!];
    expect(pen0.material).toBe(pen1.material);

    for (const d of disposables) d.dispose();
  });

  it('creates repeating cobbled diffuse and normal relief textures', () => {
    const { map, relief } = cobbleTextures();
    expect(map.colorSpace).toBe(SRGBColorSpace);
    expect(map.wrapS).toBe(RepeatWrapping);
    expect(map.wrapT).toBe(RepeatWrapping);
    expect(relief.wrapS).toBe(RepeatWrapping);
    expect(relief.wrapT).toBe(RepeatWrapping);
    map.dispose();
    relief.dispose();
  });
});
