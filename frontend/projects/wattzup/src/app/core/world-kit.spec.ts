import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  type BufferAttribute,
  type BufferGeometry,
} from 'three/webgpu';
import {
  bob,
  Crowd,
  loopFade,
  loopMetres,
  mergeStaticGroup,
  profileHeight,
  Ribbons,
  wrapFade,
} from './world-kit';

describe('wrapFade: a part shrinks away before it wraps and grows back after (#897)', () => {
  it.each([
    ['at the low end', 0, 0],
    ['half the fade in from the low end', 2.5, 0.5],
    ['the whole fade in from the low end', 5, 1],
    ['in the middle', 50, 1],
    ['the whole fade short of the high end', 95, 1],
    ['half the fade short of the high end', 97.5, 0.5],
    ['at the high end', 100, 0],
  ])('%s: %d gives %d', (_, value, shown) => {
    expect(wrapFade(value, 0, 100, 5)).toBeCloseTo(shown, 9);
  });
});

describe('loopFade: a looping part fades out only at the far end of its loop (#897)', () => {
  it.each([
    ['just behind the rider, where it wraps out of view', -24, 1],
    ['beside the rider', 0, 1],
    ['well ahead', 300, 1],
    ['halfway into the far fade', 356, 0.5],
    ['at the far end, where it wraps', 376, 0],
  ])('%s: %d m gives %d', (_, metres, shown) => {
    expect(loopFade(metres, 400, 24)).toBeCloseTo(shown, 9);
  });
});

describe('bob: a step or bounce with no snap at its bottom (#897)', () => {
  it.each([
    ['at the bottom', 0, 0],
    ['a quarter period on', Math.PI / 4, 0.5],
    ['at the top', Math.PI / 2, 1],
    ['back at the bottom', Math.PI, 0],
  ])('%s', (_, phase, height) => {
    expect(bob(phase)).toBeCloseTo(height, 9);
  });

  it('leaves the bottom as gently as it arrives, unlike |sin|', () => {
    const e = 1e-4;
    expect((bob(e) - bob(0)) / e).toBeCloseTo(0, 3);
    expect((bob(Math.PI) - bob(Math.PI - e)) / e).toBeCloseTo(0, 3);
  });
});

describe('profileHeight: the height of a ribbon profile above the road at x (L2-110 AC12)', () => {
  // A verge as Ribbons lays it, from greater x to smaller.
  const verge: [number, number][] = [
    [16, 12],
    [7, 3],
    [3, 0.6],
    [0, 0],
  ];
  it.each([
    ['at the road edge', 0, 0],
    ['between two points', 1.5, 0.3],
    ['on a point', 3, 0.6],
    ['up the slope', 5, 1.8],
    ['at the far point', 16, 12],
    ['past the far end, held level', 40, 12],
    ['past the near end, held level', -2, 0],
  ])('%s: %d m gives %d m', (_, x, height) => {
    expect(profileHeight(verge, x)).toBeCloseTo(height, 9);
  });

  it('reads a profile laid from smaller x to greater the same way', () => {
    expect(profileHeight([...verge].reverse(), 5)).toBeCloseTo(1.8, 9);
  });
});

describe('Ribbons: normal initialisation and zero-allocation lay()', () => {
  it('initialises vertex normals on add() before lay() and writes unit normals on lay()', () => {
    const group = new Group();
    const disposables: { dispose(): void }[] = [];
    const material = new MeshStandardMaterial();
    disposables.push(material);
    const ribbons = new Ribbons(group, disposables);
    const mesh = ribbons.add(4, material, [
      [4, 0.2],
      [0, 0],
    ]);
    const geometry = mesh.geometry as BufferGeometry;
    const before = geometry.getAttribute('normal') as BufferAttribute | undefined;
    expect(before).toBeDefined();
    expect(before!.count).toBe(8);

    ribbons.lay(
      [
        { metres: 0, height: 0 },
        { metres: 2, height: 0.1 },
        { metres: 4, height: 0.2 },
        { metres: 6, height: 0.3 },
      ],
      10,
    );
    const after = geometry.getAttribute('normal') as BufferAttribute;
    for (let i = 0; i < after.count; i++) {
      const len = Math.hypot(after.getX(i), after.getY(i), after.getZ(i));
      expect(len).toBeCloseTo(1, 5);
    }
    for (const d of disposables) d.dispose();
  });
});

describe('mergeStaticGroup: collapses static sub-meshes by material while preserving skipped subtrees', () => {
  it('merges single- and multi-material child meshes per material, preserves skipped subtrees, and fixes negative-scale winding', () => {
    const disposables: { dispose(): void }[] = [];
    const red = new MeshStandardMaterial({ color: 0xff0000 });
    const blue = new MeshStandardMaterial({ color: 0x0000ff });
    const unit = new BoxGeometry(1, 1, 1);
    disposables.push(red, blue, unit);

    const root = new Group();
    const a = new Mesh(unit, red);
    a.position.set(-2, 1, 0);
    a.castShadow = true;
    const b = new Mesh(unit, red);
    b.position.set(2, 1, 0);
    b.scale.set(-1, 1, 1); // negative determinant
    b.castShadow = true;
    const multi = new Mesh(unit, [red, red, blue, blue, red, blue]);
    multi.position.set(0, 2, 0);
    multi.castShadow = true;

    const animated = new Group();
    const spinner = new Mesh(unit, red);
    spinner.castShadow = true;
    animated.add(spinner);

    root.add(a, b, multi, animated);
    mergeStaticGroup(root, disposables, new Set([animated]));

    const directMeshes = root.children.filter((c): c is Mesh => c instanceof Mesh);
    // All static red faces (a + b + 3 faces of multi) -> 1 red Mesh; 3 blue faces of multi -> 1 blue Mesh.
    expect(directMeshes.length).toBe(2);
    expect(animated.children).toContain(spinner);
    for (const m of directMeshes) {
      expect(m.geometry.getAttribute('normal')).toBeDefined();
      expect(m.castShadow).toBe(true);
    }

    for (const d of disposables) d.dispose();
  });

  it('folds multiple opaque solid MeshStandardMaterials into one vertex-coloured Mesh when sharedSolidMaterial is given, keeping emissive meshes separate', () => {
    const disposables: { dispose(): void }[] = [];
    const wall = new MeshStandardMaterial({ color: 0xd9d0bf });
    const trim = new MeshStandardMaterial({ color: 0xeee8db });
    const tar = new MeshStandardMaterial({ color: 0x2c2d30 });
    const lamp = new MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2a1a });
    const sharedSolid = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    const unit = new BoxGeometry(1, 1, 1);
    disposables.push(wall, trim, tar, lamp, sharedSolid, unit);

    const root = new Group();
    const block = new Mesh(unit, [wall, wall, tar, wall, wall, wall]);
    block.castShadow = true;
    block.receiveShadow = true;
    const cornice = new Mesh(unit, trim);
    cornice.position.set(0, 2, 0);
    const beacon = new Mesh(unit, lamp);
    beacon.position.set(0, 3, 0);
    root.add(block, cornice, beacon);

    mergeStaticGroup(root, disposables, undefined, sharedSolid);

    const directMeshes = root.children.filter((c): c is Mesh => c instanceof Mesh);
    expect(directMeshes.length).toBe(2); // 1 sharedSolid (wall + tar + trim) + 1 emissive lamp
    const solidMesh = directMeshes.find((m) => m.material === sharedSolid);
    expect(solidMesh).toBeDefined();
    expect(solidMesh!.geometry.getAttribute('color')).toBeDefined();
    expect(solidMesh!.geometry.getAttribute('normal')).toBeDefined();
    expect(solidMesh!.castShadow).toBe(true);
    expect(solidMesh!.receiveShadow).toBe(true);

    for (const d of disposables) d.dispose();
  });
});

describe('Crowd: shadow partitioning and horizon culling', () => {
  it('partitions near shadow-casting figures from far non-shadow-casting figures and culls past 308 m', () => {
    const group = new Group();
    const disposables: { dispose(): void }[] = [];
    const flagMat = new MeshStandardMaterial();
    disposables.push(flagMat);
    const crowd = new Crowd(group, disposables, {
      loop: 480,
      near: 9.1,
      far: 11.4,
      spacing: 2,
      wardrobe: { tops: ['#f58426'], bottoms: ['#1e2530'], skins: ['#f1c7a5'] },
      flags: [flagMat],
      flagShare: 0.25,
      seeds: [101, 107],
    });
    crowd.build();
    crowd.place(
      1.5,
      (m) => m * 0.01,
      (offset, every) => loopMetres(offset, 0, every, 30),
      0.15,
    );

    const instanced = group.children.filter((c): c is InstancedMesh => c instanceof InstancedMesh);
    const shadowCasters = instanced.filter((m) => m.castShadow);
    const nonShadow = instanced.filter((m) => !m.castShadow);
    expect(shadowCasters.length).toBe(3); // near legs, bodies, heads only
    expect(nonShadow.length).toBeGreaterThanOrEqual(5); // far legs, bodies, heads + arms + flags
    // Near shadow casters contain only spectators inside (-14, 34) m (~10% of the 480 m loop).
    expect(shadowCasters[0]!.count).toBeGreaterThan(0);
    expect(shadowCasters[0]!.count).toBeLessThan(nonShadow[0]!.count);

    // Beyond 115 m, occluded back rows (|x| >= near + 0.5) are skipped while front-row silhouettes continue to 308 m.
    const farLegs = nonShadow[0]!;
    const matArr = farLegs.instanceMatrix.array as Float32Array;
    let farBackRowPast120m = 0;
    let farFrontRowPast120m = 0;
    for (let i = 0; i < farLegs.count; i++) {
      const x = Math.abs(matArr[i * 16 + 12]!);
      const metres = -matArr[i * 16 + 14]!;
      if (metres > 120) {
        if (x > 9.65) farBackRowPast120m++;
        else farFrontRowPast120m++;
      }
    }
    expect(farFrontRowPast120m).toBeGreaterThan(0);
    expect(farBackRowPast120m).toBe(0);

    for (const d of disposables) d.dispose();
  });
});
