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
    expect(visibleAtStart).toBeLessThan(85);
    expect(visibleShadowInstances).toBeGreaterThan(0);
    expect(visibleShadowInstances).toBeLessThan(26);
    // Cross-street pairing packs both sides into <= 10 longitudinal slices, and every BatchedMesh
    // keeps >= 1 visible instance at s=0 so warmUp() compiles all programs ahead of the ride.
    for (const b of [...shadowCasters, ...nonShadowCasters]) {
      expect(b.instanceCount).toBeLessThanOrEqual(10);
      expect(countVisibleIn([b])).toBeGreaterThan(0);
    }

    street.place(210, (m) => m * 0.05);
    expect(countVisibleIn(batched)).toBeGreaterThan(0);
    expect(countVisibleIn(shadowCasters)).toBeLessThan(26);

    for (const d of disposables) d.dispose();
  });

  it('partitions crowd shadow casters to near spectators, culls far-horizon spectators, and compacts accessories', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new OldTownStreet((t) => t, disposables);
    street.build(3.5, 161);
    street.place(25, (m) => m * 0.03);

    const instanced = street.group.children.filter(
      (c): c is InstancedMesh => c instanceof InstancedMesh,
    );
    // Crowd InstancedMeshes are the 11 added by addCrowd (4 near shadow casters + 4 far non-shadow + 3 accessories).
    const crowdMeshes = instanced.slice(-14, -3);
    expect(crowdMeshes).toHaveLength(11);
    const nearMeshes = crowdMeshes.slice(0, 4);
    const farMeshes = crowdMeshes.slice(4, 8);
    const [hats, waved, hair] = crowdMeshes.slice(8) as [
      InstancedMesh,
      InstancedMesh,
      InstancedMesh,
    ];
    for (const mesh of nearMeshes) expect(mesh.castShadow).toBe(true);
    for (const mesh of [...farMeshes, hats, waved, hair]) expect(mesh.castShadow).toBe(false);

    const nearLegs = nearMeshes[0]!;
    const farLegs = farMeshes[0]!;
    const visibleFans = nearLegs.count + farLegs.count;
    expect(nearLegs.count).toBeGreaterThan(80);
    expect(nearLegs.count).toBeLessThan(170);
    expect(farLegs.count).toBeGreaterThan(250);
    expect(visibleFans).toBeLessThan(530);

    expect(hats.count + hair.count).toBe(visibleFans);
    expect(waved.count).toBeGreaterThan(0);
    expect(waved.count).toBeLessThan(Math.ceil(visibleFans * 0.3));

    const m = new Matrix4();
    for (const accessory of [hats, waved, hair]) {
      for (let i = 0; i < accessory.count; i++) {
        accessory.getMatrixAt(i, m);
        expect(Math.abs(m.determinant())).toBeGreaterThan(1e-6);
      }
    }

    const trisOf = (meshes: readonly InstancedMesh[]) =>
      meshes.reduce((sum, mesh) => {
        const geo = mesh.geometry as BufferGeometry;
        const tris = geo.index ? geo.index.count / 3 : geo.getAttribute('position').count / 3;
        return sum + mesh.count * tris;
      }, 0);

    expect(trisOf(nearMeshes)).toBeLessThan(46_000);
    const crowdTriangles = trisOf(crowdMeshes);
    expect(crowdTriangles).toBeGreaterThan(100_000);
    expect(crowdTriangles).toBeLessThan(175_000);

    // Bunting flags share the crowd hand-flags cloth material rather than duplicating it.
    const buntingFlags = instanced[instanced.length - 3]!;
    expect(buntingFlags.material).toBe(waved.material);

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
    const batchedMaterials = new Set<unknown>(
      street.group.children
        .filter((c): c is BatchedMesh => c instanceof BatchedMesh)
        .map((b) => b.material),
    );
    // Lamp foliage (bloom + trailing merged into instanced[3]) shares houseDetailAtlas detailMat,
    // and lamp pennants are instanced[4] and instanced[5] sharing one pennant atlas material.
    expect(batchedMaterials.has(instanced[3]!.material)).toBe(true);
    const [pen0, pen1] = [instanced[4]!, instanced[5]!];
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
