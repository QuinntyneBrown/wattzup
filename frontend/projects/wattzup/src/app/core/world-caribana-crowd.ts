// Caribana Parade's people, drawn by world-caribana.ts: the body parts its figures are built
// from, an ensemble of instanced parts posed together, and the spectators behind the
// barricades in summer clothes, waving flags, dancing and cheering the bands.
import {
  BatchedMesh,
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  type Material,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seeded, tintGeometry } from './world-kit';

const UP_AXIS = new Vector3(0, 1, 0);

/** A limb from `a` to `b`, `r1` thick at `a` and `r2` at `b`, with a round joint at `b`. */
export function limb(
  a: Vector3,
  b: Vector3,
  r1: number,
  r2: number,
  sides = 5,
  joint = true,
): BufferGeometry[] {
  const segs = Math.min(sides, 6);
  const length = a.distanceTo(b);
  const bone = new CylinderGeometry(r2, r1, length, segs, 1, true);
  bone.translate(0, length / 2, 0);
  bone.applyQuaternion(new Quaternion().setFromUnitVectors(UP_AXIS, b.clone().sub(a).normalize()));
  bone.translate(a.x, a.y, a.z);
  if (!joint) return [bone];
  const ball = new SphereGeometry(r2, Math.min(segs, 5), 3);
  ball.translate(b.x, b.y, b.z);
  return [bone, ball];
}

/** A ball of radius `r` stretched by (sx, sy, sz) at (x, y, z). */
export function ellipsoid(
  r: number,
  sx: number,
  sy: number,
  sz: number,
  x: number,
  y: number,
  z: number,
  detail = 7,
): BufferGeometry {
  const wSeg = Math.min(detail, 8);
  const ball = new SphereGeometry(r, wSeg, Math.max(4, Math.round(wSeg * 0.6)));
  ball.scale(sx, sy, sz);
  ball.translate(x, y, z);
  return ball;
}

/** Merges parts into one geometry (preserving index buffers when all parts are indexed) and disposes of the parts. */
export function merge(parts: BufferGeometry[]): BufferGeometry {
  const allIndexed = parts.every((p) => p.index !== null);
  const firstAttrs = Object.keys(parts[0]?.attributes ?? {});
  const sharedAttrs = firstAttrs.filter((attr) =>
    parts.every((p) => p.getAttribute(attr) !== undefined),
  );
  const normalized = parts.map((p) => {
    const g = allIndexed ? p : p.index ? p.toNonIndexed() : p;
    for (const attr of Object.keys(g.attributes)) {
      if (!sharedAttrs.includes(attr)) g.deleteAttribute(attr);
    }
    return g;
  });
  const merged = mergeGeometries(normalized)!;
  for (let i = 0; i < parts.length; i++) {
    if (normalized[i] !== parts[i]) normalized[i]!.dispose();
    parts[i]!.dispose();
  }
  return merged;
}

export function ensureIndexed(g: BufferGeometry): BufferGeometry {
  if (g.getIndex() !== null) return g;
  const count = g.getAttribute('position').count;
  const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
  for (let i = 0; i < count; i++) indices[i] = i;
  g.setIndex(new BufferAttribute(indices, 1));
  return g;
}

export function batchMatricesTexture(batch: BatchedMesh): {
  data: Float32Array;
  tex: { needsUpdate: boolean };
} {
  const tex = (
    batch as unknown as {
      _matricesTexture: { image: { data: Float32Array }; needsUpdate: boolean };
    }
  )._matricesTexture;
  return { data: tex.image.data, tex };
}

/**
 * Many figures, each made of several parts (skin, clothes, hair, accessories) that move together:
 * parts sharing the same `Material` and attribute layout coalesce into one `BatchedMesh` with
 * build-time instance colours and cached per-owner visibility.
 */
export class Ensemble {
  private readonly kinds = new Map<
    string,
    {
      geometry: BufferGeometry;
      material: Material;
      colours: Color[];
      owners: number[];
      castShadow: boolean;
    }
  >();
  private readonly batches: BatchedMesh[] = [];
  private batchMatArrays: Float32Array[] = [];
  private batchMatTextures: { needsUpdate: boolean }[] = [];
  private ownerStart = new Int32Array(0);
  private ownerVisible = new Uint8Array(0);
  private entryBatch = new Int32Array(0);
  private entrySlot = new Int32Array(0);

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
  ) {}

  /** Gives figure `owner` a part of kind `key`, tinted `colour`. */
  put(
    owner: number,
    key: string,
    geometry: BufferGeometry,
    material: Material,
    colour: string,
    castShadow = false,
  ): void {
    let kind = this.kinds.get(key);
    if (!kind) {
      kind = { geometry, material, colours: [], owners: [], castShadow };
      this.kinds.set(key, kind);
    }
    kind.colours.push(new Color(colour));
    kind.owners.push(owner);
  }

  /** Coalesces compatible part kinds into one `BatchedMesh` per `Material` and bakes colours once. */
  build(): void {
    interface KindEntry {
      geometry: BufferGeometry;
      material: Material;
      colours: Color[];
      owners: number[];
      castShadow: boolean;
    }
    const groups = new Map<
      string,
      { material: Material; castShadow: boolean; kinds: KindEntry[] }
    >();
    const matIds = new Map<Material, number>();
    let nextMatId = 1;
    let maxOwner = -1;
    let totalEntries = 0;

    for (const kind of this.kinds.values()) {
      const stdMat = kind.material as MeshStandardMaterial;
      const hasTexture = Boolean(stdMat.map || stdMat.alphaMap || stdMat.emissiveMap);
      let geo = kind.geometry;
      const needsDropUv = !hasTexture && Boolean(geo.getAttribute('uv'));
      const needsWhiteColor = Boolean(stdMat.vertexColors) && !geo.getAttribute('color');
      if (needsDropUv || needsWhiteColor) {
        geo = geo.clone();
        if (needsDropUv) geo.deleteAttribute('uv');
        if (needsWhiteColor) tintGeometry(geo, 0xffffff);
        this.disposables.push(geo);
        kind.geometry = geo;
      }
      ensureIndexed(kind.geometry);
      let mid = matIds.get(kind.material);
      if (mid === undefined) {
        mid = nextMatId++;
        matIds.set(kind.material, mid);
      }
      const attrSig = Object.keys(kind.geometry.attributes).sort().join(',');
      const gKey = `${mid}|${kind.castShadow ? 1 : 0}|${attrSig}`;
      let grp = groups.get(gKey);
      if (!grp) {
        grp = { material: kind.material, castShadow: kind.castShadow, kinds: [] };
        groups.set(gKey, grp);
      }
      grp.kinds.push(kind);
      for (const owner of kind.owners) {
        if (owner > maxOwner) maxOwner = owner;
      }
      totalEntries += kind.owners.length;
    }

    const tempSlots: { batchIdx: number; slot: number }[][] = [];
    for (const grp of groups.values()) {
      let maxInstances = 0;
      let maxVerts = 0;
      let maxIndices = 0;
      for (const k of grp.kinds) {
        maxInstances += k.owners.length;
        maxVerts += k.geometry.getAttribute('position').count;
        maxIndices += k.geometry.getIndex()!.count;
      }
      const batch = new BatchedMesh(
        Math.max(1, maxInstances),
        Math.max(3, maxVerts),
        Math.max(3, maxIndices),
        grp.material,
      );
      batch.sortObjects = false;
      batch.perObjectFrustumCulled = false;
      batch.frustumCulled = false;
      batch.castShadow = grp.castShadow;

      const batchIdx = this.batches.length;
      for (const k of grp.kinds) {
        const gid = batch.addGeometry(k.geometry);
        for (let i = 0; i < k.owners.length; i++) {
          const owner = k.owners[i]!;
          const slot = batch.addInstance(gid);
          batch.setColorAt(slot, k.colours[i]!);
          (tempSlots[owner] ??= []).push({ batchIdx, slot });
        }
      }
      const mt = batchMatricesTexture(batch);
      this.batches.push(batch);
      this.batchMatArrays.push(mt.data);
      this.batchMatTextures.push(mt.tex);
      this.group.add(batch);
      this.disposables.push(batch);
    }

    const ownerCount = maxOwner + 1;
    this.ownerStart = new Int32Array(ownerCount + 1);
    this.ownerVisible = new Uint8Array(ownerCount);
    this.ownerVisible.fill(1);
    this.entryBatch = new Int32Array(totalEntries);
    this.entrySlot = new Int32Array(totalEntries);
    let cursor = 0;
    for (let owner = 0; owner < ownerCount; owner++) {
      this.ownerStart[owner] = cursor;
      const list = tempSlots[owner];
      if (!list) continue;
      for (const entry of list) {
        this.entryBatch[cursor] = entry.batchIdx;
        this.entrySlot[cursor] = entry.slot;
        cursor++;
      }
    }
    this.ownerStart[ownerCount] = cursor;
  }

  /** No-op hook retained for callers; visibility is tracked incrementally per owner. */
  beginFrame(): void {
    // Visibility transitions are applied on demand via hide() and emitYawScaled().
  }

  /** Hides every part of `owner` when culled; O(1) fast-return when already hidden. */
  hide(owner: number): void {
    if (!this.ownerVisible[owner]) return;
    this.ownerVisible[owner] = 0;
    const start = this.ownerStart[owner]!;
    const end = this.ownerStart[owner + 1]!;
    for (let idx = start; idx < end; idx++) {
      this.batches[this.entryBatch[idx]!]!.setVisibleAt(this.entrySlot[idx]!, false);
    }
  }

  /** Places visible figure `owner` using pre-scaled Y-rotation `(cySx, sySx)` and vertical scale `syScale`. */
  emitYawScaled(
    owner: number,
    tx: number,
    ty: number,
    tz: number,
    cySx: number,
    sySx: number,
    syScale: number,
  ): void {
    const start = this.ownerStart[owner]!;
    const end = this.ownerStart[owner + 1]!;
    const becameVisible = !this.ownerVisible[owner];
    if (becameVisible) this.ownerVisible[owner] = 1;
    const m2 = -sySx;
    for (let idx = start; idx < end; idx++) {
      const bIdx = this.entryBatch[idx]!;
      const slot = this.entrySlot[idx]!;
      if (becameVisible) this.batches[bIdx]!.setVisibleAt(slot, true);
      const mArr = this.batchMatArrays[bIdx]!;
      const o = slot * 16;
      mArr[o] = cySx;
      mArr[o + 1] = 0;
      mArr[o + 2] = m2;
      mArr[o + 3] = 0;
      mArr[o + 4] = 0;
      mArr[o + 5] = syScale;
      mArr[o + 6] = 0;
      mArr[o + 7] = 0;
      mArr[o + 8] = sySx;
      mArr[o + 9] = 0;
      mArr[o + 10] = cySx;
      mArr[o + 11] = 0;
      mArr[o + 12] = tx;
      mArr[o + 13] = ty;
      mArr[o + 14] = tz;
      mArr[o + 15] = 1;
    }
  }

  /** Moves every part of figure `owner` to `matrix` in fixed-slot mode. */
  set(owner: number, matrix: Matrix4): void {
    if (owner < 0 || owner + 1 >= this.ownerStart.length) return;
    const start = this.ownerStart[owner]!;
    const end = this.ownerStart[owner + 1]!;
    for (let idx = start; idx < end; idx++) {
      this.batches[this.entryBatch[idx]!]!.setMatrixAt(this.entrySlot[idx]!, matrix);
    }
  }

  commit(): void {
    for (const tex of this.batchMatTextures) {
      tex.needsUpdate = true;
    }
  }
}

/** How a spectator holds their arms: [left, right] as elbow then hand, in metres. */
const STANCES: readonly (readonly [readonly number[], readonly number[]])[] = [
  // Arms down, hands loose at the sides.
  [
    [-0.21, 1.1, 0.02, -0.23, 0.82, -0.02],
    [0.21, 1.1, 0.02, 0.23, 0.82, -0.02],
  ],
  // The right hand high, holding a flag.
  [
    [-0.21, 1.1, 0.02, -0.22, 0.82, -0.04],
    [0.3, 1.64, -0.02, 0.3, 1.95, -0.06],
  ],
  // Both arms thrown up.
  [
    [-0.33, 1.62, -0.02, -0.42, 1.9, -0.06],
    [0.33, 1.62, -0.02, 0.42, 1.9, -0.06],
  ],
  // Hands raised in front, filming or cheering.
  [
    [-0.2, 1.2, -0.18, -0.05, 1.5, -0.34],
    [0.2, 1.2, -0.18, 0.05, 1.5, -0.34],
  ],
  // Leaning on the barricade, forearms along its top rail.
  [
    [-0.22, 0.98, -0.3, -0.12, 0.96, -0.52],
    [0.22, 0.98, -0.3, 0.12, 0.96, -0.52],
  ],
  // Right arm raised out, left on the hip.
  [
    [-0.3, 1.12, 0.02, -0.17, 0.98, -0.06],
    [0.3, 1.52, -0.3, 0.3, 1.72, -0.56],
  ],
  // Clapping along, the hands together in front of the chest.
  [
    [-0.22, 1.12, -0.16, -0.02, 1.3, -0.3],
    [0.22, 1.12, -0.16, 0.02, 1.3, -0.3],
  ],
  // Arms folded across the chest, watching.
  [
    [-0.2, 1.1, -0.14, 0.12, 1.18, -0.2],
    [0.2, 1.1, -0.14, -0.12, 1.22, -0.21],
  ],
  // A placard held up over the head in both hands.
  [
    [-0.3, 1.6, -0.08, -0.26, 1.93, -0.14],
    [0.3, 1.6, -0.08, 0.26, 1.93, -0.14],
  ],
];
const FLAG_STANCE = 1;
const LEAN_STANCE = 4;
const PLACARD_STANCE = 8;

/** Core stances used by the roadside crowd so instanced body variants stay compact. */
const CROWD_STANCES = [0, FLAG_STANCE, 2, LEAN_STANCE] as const;

/** What the crowd writes on its placards, and the card it is written on. */
const PLACARDS = [
  ['TRINI TO', 'DE BONE!', '#ffffff', '#ce1126'],
  ['BIG UP', 'JAMAICA', '#fed100', '#009b3a'],
  ['BAJAN &', 'PROUD', '#ffffff', '#00267f'],
  ['HAPPY', 'CARIBANA!', '#ff7ab8', '#111111'],
] as const;

const HAIRS = ['#14100d', '#1f1712', '#2e2018', '#3d2a1c', '#6b4a2b', '#0c0c0c'];
const CAPS = ['#c8102e', '#111111', '#ffd23f', '#1b6ad8', '#ffffff', '#0f9d58'];
const STRAWS = ['#e3c98f', '#d8b878', '#f0e2b8'];
const UMBRELLAS = ['#c8102e', '#ffd23f', '#0f9d58', '#1b6ad8', '#111111', '#ff2d87', '#ffffff'];
const BALLOONS = ['#e8133c', '#ffd23f', '#0f9d58', '#ff2d87', '#1b6ad8', '#ff8a00', '#ffffff'];
const SHOES = ['#f2f2f2', '#111111', '#d6d0c4', '#8b5e3c', '#c8102e'];

/** The parts of a spectator's body and clothes for one stance and one cut of bottoms. */
export function spectatorParts(stance: number, shorts: boolean, seated = false) {
  const drop = seated ? 0.42 : 0;
  const v = (x: number, y: number, z: number) => new Vector3(x, y > 0.7 ? y - drop : y, z);
  const skin: BufferGeometry[] = [];
  const top: BufferGeometry[] = [];
  const bottom: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const hip = v(side * 0.095, 0.9, 0);
    const knee = seated ? new Vector3(side * 0.1, 0.5, -0.42) : v(side * 0.1, 0.49, -0.02);
    const ankle = seated ? new Vector3(side * 0.1, 0.08, -0.46) : v(side * 0.1, 0.08, 0);
    const mid = hip.clone().lerp(knee, 0.8);
    bottom.push(...limb(hip, shorts ? mid : knee, 0.095, shorts ? 0.08 : 0.065, 5, false));
    if (shorts) {
      skin.push(
        ...limb(mid, knee, 0.068, 0.06, 5, false),
        ...limb(knee, ankle, 0.06, 0.042, 5, false),
      );
    } else {
      bottom.push(...limb(knee, ankle, 0.065, 0.055, 5, false));
    }
    const shoulder = v(side * 0.18, 1.39, 0);
    const [ex, ey, ez, hx, hy, hz] = STANCES[stance]![side < 0 ? 0 : 1]!;
    const elbow = v(ex!, ey!, ez!);
    const hand = v(hx!, hy!, hz!);
    const sleeve = shoulder.clone().lerp(elbow, 0.45);
    top.push(...limb(shoulder, sleeve, 0.068, 0.062, 5, false));
    skin.push(
      ...limb(sleeve, elbow, 0.046, 0.042, 5),
      ...limb(elbow, hand, 0.042, 0.034, 4, false),
    );
    skin.push(ellipsoid(0.045, 1, 1.25, 0.6, hand.x, hand.y, hand.z, 5));
  }
  bottom.push(ellipsoid(0.16, 1.05, 0.6, 0.8, 0, 0.94 - drop, 0, 6));
  const torso = new LatheGeometry(
    [
      [0.001, 0.93],
      [0.155, 0.96],
      [0.148, 1.08],
      [0.172, 1.32],
      [0.155, 1.4],
      [0.001, 1.455],
    ].map(([r, y]) => new Vector2(r!, y! - drop)),
    7,
  );
  torso.scale(1.08, 1, 0.7);
  top.push(torso);
  const neck = new CylinderGeometry(0.045, 0.05, 0.12, 5, 1, true);
  neck.translate(0, 1.48 - drop, 0);
  skin.push(neck, ellipsoid(0.105, 0.9, 1.1, 1, 0, 1.6 - drop, -0.01, 6));
  const parts = { skin: merge(skin), top: merge(top), bottom: merge(bottom) };
  for (const g of [parts.skin, parts.top, parts.bottom]) bakeOcclusion(g);
  return parts;
}

/**
 * A face: a patch of sphere wrapped round the front of the head (radius 0.105 at 1.6 m, as
 * the bodies are built), for a face texture of eyes, brows, nose and lips; and dark glasses.
 */
export function faceParts(): { face: BufferGeometry; shades: BufferGeometry } {
  const face = new SphereGeometry(
    0.108,
    8,
    6,
    Math.PI * 1.12,
    Math.PI * 0.76,
    Math.PI * 0.3,
    Math.PI * 0.42,
  );
  face.scale(0.9, 1.1, 1);
  face.translate(0, 1.6, -0.01);
  const lenses = [-1, 1].map((side) => {
    const lens = new BoxGeometry(0.06, 0.035, 0.012);
    lens.translate(side * 0.036, 1.625, -0.112);
    return lens;
  });
  const bridge = new BoxGeometry(0.17, 0.012, 0.012);
  bridge.translate(0, 1.64, -0.11);
  return { face, shades: merge([...lenses, bridge]) };
}

/** Eyes, brows, the shade of the nose and the lips, transparent round them. */
export function faceTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    g.clearRect(0, 0, 128, 64);
    for (const x of [48, 80]) {
      g.fillStyle = 'rgba(20,14,10,0.85)';
      g.fillRect(x - 9, 15, 18, 3);
      g.fillStyle = '#f2ece4';
      g.beginPath();
      g.ellipse(x, 25, 6.5, 3.6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#2a1a10';
      g.beginPath();
      g.arc(x, 25, 3, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(30,18,10,0.35)';
    g.beginPath();
    g.ellipse(64, 38, 5, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(110,40,40,0.8)';
    g.beginPath();
    g.ellipse(64, 50, 9, 3.2, 0, 0, Math.PI * 2);
    g.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Packs all four hand-made crowd placards into one 2×2 texture atlas (512 × 344). */
function placardAtlasTexture(): CanvasTexture {
  const cellW = 256;
  const cellH = 172;
  const canvas = document.createElement('canvas');
  canvas.width = cellW * 2;
  canvas.height = cellH * 2;
  const g = canvas.getContext('2d');
  if (g) {
    PLACARDS.forEach(([top, bottom, fill, ink], idx) => {
      const x0 = (idx % 2) * cellW;
      const y0 = Math.floor(idx / 2) * cellH;
      g.fillStyle = fill;
      g.fillRect(x0, y0, cellW, cellH);
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.lineWidth = 3;
      g.strokeRect(x0 + 2, y0 + 2, cellW - 4, cellH - 4);
      g.save();
      g.translate(x0 + 128, y0 + 86);
      g.rotate(-0.05);
      g.fillStyle = ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 50px "Comic Sans MS", "Marker Felt", system-ui, sans-serif';
      g.fillText(top, 0, -34, 236);
      g.fillText(bottom, 4, 30, 236);
      g.restore();
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Bakes soft ambient occlusion into a figure's vertex colours, tinting its skin.
 */
export function bakeOcclusion(body: BufferGeometry): void {
  const position = body.getAttribute('position');
  const normal = body.getAttribute('normal');
  const shade = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const up = normal.getY(i) * 0.5 + 0.5;
    let ao = 0.72 + 0.28 * up;
    if (y < 0.92 && y > 0.45 && Math.abs(x) < 0.06) ao *= 0.78;
    if (y > 1.2 && y < 1.36 && Math.abs(x) > 0.15 && Math.abs(x) < 0.22) ao *= 0.85;
    if (y > 1.46 && y < 1.52) ao *= 0.88;
    const o = i * 3;
    shade[o] = ao;
    shade[o + 1] = ao * 0.97;
    shade[o + 2] = ao * 0.95;
  }
  body.setAttribute('color', new BufferAttribute(shade, 3));
}

/** A pair of trainers. */
export function shoeGeometry(): BufferGeometry {
  return merge(
    [-1, 1].map((side) => {
      const shoe = new BoxGeometry(0.11, 0.09, 0.27);
      shoe.translate(side * 0.1, 0.045, -0.05);
      return shoe;
    }),
  );
}

/** Hair and hats: a close crop, an afro, a baseball cap with its brim, or a headwrap. */
export function hairParts(): BufferGeometry[] {
  const crop = ellipsoid(0.112, 0.94, 0.72, 0.95, 0, 1.655, 0.03, 8);
  const afro = ellipsoid(0.16, 1, 0.9, 0.9, 0, 1.71, 0.07, 8);
  const crown = ellipsoid(0.115, 0.95, 0.6, 1.0, 0, 1.675, 0.01, 8);
  const brim = new CylinderGeometry(0.09, 0.09, 0.012, 8);
  brim.scale(1, 1, 1.2);
  brim.translate(0, 1.64, -0.12);
  const wrap = ellipsoid(0.13, 0.95, 0.9, 0.95, 0, 1.71, 0.06, 8);
  return [crop, afro, merge([crown, brim]), wrap];
}

/** An umbrella held up over the head: an eight-panel canopy merged with its dark shaft. */
function umbrellaGeometry(): BufferGeometry {
  const canopy = new ConeGeometry(0.6, 0.28, 8, 1, true);
  canopy.translate(0.05, 2.24, -0.02);
  canopy.deleteAttribute('uv');
  tintGeometry(canopy, 0xffffff);
  const shaft = merge(
    limb(new Vector3(0.23, 0.95, -0.04), new Vector3(0.05, 2.36, -0.02), 0.012, 0.012, 4, false),
  );
  shaft.deleteAttribute('uv');
  tintGeometry(shaft, 0x222222);
  return merge([canopy, shaft]);
}

/** A wide-brimmed straw sun hat, and a soft bucket hat. */
function sunHatParts(): BufferGeometry[] {
  const crown = new CylinderGeometry(0.1, 0.115, 0.12, 8);
  crown.translate(0, 1.73, 0);
  const brim = new CylinderGeometry(0.26, 0.26, 0.012, 9);
  brim.translate(0, 1.68, 0);
  const bucket = new CylinderGeometry(0.11, 0.17, 0.14, 8, 1, true);
  bucket.translate(0, 1.7, 0);
  const top = new CylinderGeometry(0.11, 0.11, 0.01, 8);
  top.translate(0, 1.77, 0);
  return [merge([crown, brim]), merge([bucket, top])];
}

/** Bare lower legs below shorts, shared across every standing crowd stance. */
function spectatorBareCalvesGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const hip = new Vector3(side * 0.095, 0.9, 0);
    const knee = new Vector3(side * 0.1, 0.49, -0.02);
    const ankle = new Vector3(side * 0.1, 0.08, 0);
    const mid = hip.clone().lerp(knee, 0.8);
    parts.push(
      ...limb(mid, knee, 0.068, 0.06, 5, false),
      ...limb(knee, ankle, 0.06, 0.042, 5, false),
    );
  }
  const calves = merge(parts);
  bakeOcclusion(calves);
  return calves;
}

function makeCrowdBatch(
  geometries: readonly BufferGeometry[],
  instanceTotal: number,
  material: Material,
  group: Group,
  disposables: { dispose(): void }[],
): { batch: BatchedMesh; geoIds: number[] } {
  let maxVerts = 0;
  let maxIndices = 0;
  for (const g of geometries) {
    maxVerts += g.getAttribute('position').count;
    maxIndices += g.getIndex() ? g.getIndex()!.count : g.getAttribute('position').count;
  }
  const batch = new BatchedMesh(Math.max(1, instanceTotal), maxVerts, maxIndices, material);
  batch.sortObjects = false;
  batch.perObjectFrustumCulled = false;
  batch.frustumCulled = false;
  batch.castShadow = false;
  const geoIds = geometries.map((g) => batch.addGeometry(g));
  group.add(batch);
  disposables.push(batch);
  return { batch, geoIds };
}

interface Spectator {
  readonly side: -1 | 1;
  readonly row: number;
  readonly offset: number;
  readonly x: number;
  readonly height: number;
  readonly build: number;
  readonly phase: number;
  readonly sinPhase: number;
  readonly cosPhase: number;
  readonly stance: number;
  readonly balloon?: boolean;
  readonly flag: number;
  cosHSx: number;
  sinHSx: number;
  bounceAmp: number;
  placardKind: number;
  placardId: number;
  flagId: number;
}

export interface SpectatorOptions {
  readonly loop: number;
  readonly near: number;
  readonly far: number;
  readonly spacing: number;
  readonly tops: readonly string[];
  readonly bottoms: readonly string[];
  readonly skins: readonly string[];
  readonly flagAtlas: Material;
  readonly flagCount: number;
  readonly seed: number;
  readonly skip?: (side: -1 | 1, offset: number) => boolean;
  readonly solidMaterial?: MeshStandardMaterial;
  readonly doubleSideMaterial?: MeshStandardMaterial;
}

const SPECTATOR_BEHIND_CULL = -14;
const SPECTATOR_FRONT_ROW_ONLY = 75;
const SPECTATOR_HORIZON_CULL = 225;

/**
 * The crowd behind both barricades: people in T-shirts with shorts or trousers, trainers,
 * hair, caps, sun hats and umbrellas, bouncing on the beat and waving Caribbean flags.
 */
export class Spectators {
  private readonly people: Spectator[] = [];
  private readonly ensemble: Ensemble;
  private flagBatch: BatchedMesh | null = null;
  private placardBatch: BatchedMesh | null = null;
  private placardVis = new Uint8Array(0);
  private flagVis = new Uint8Array(0);

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
    private readonly options: SpectatorOptions,
  ) {
    this.ensemble = new Ensemble(group, disposables);
  }

  build(): void {
    const o = this.options;
    const random = seeded(o.seed);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < o.loop; offset += o.spacing) {
        const rows = 1 + Math.floor(random() * 3);
        for (let row = 0; row < rows; row++) {
          const x = side * (o.near + row * 0.72 + random() * 0.3);
          if (Math.abs(x) > o.far) continue;
          const child = row === 0 && random() < 0.07;
          const roll = random();
          const stance = roll < 0.24 ? FLAG_STANCE : roll < 0.48 ? 2 : 0;
          const phase = random() * 6.3;
          const person: Spectator = {
            side,
            row,
            offset: offset + random() * 0.35,
            x,
            height: child ? 0.6 + random() * 0.1 : 0.92 + random() * 0.15,
            build: 1,
            phase,
            sinPhase: Math.sin(phase),
            cosPhase: Math.cos(phase),
            stance,
            flag: stance === FLAG_STANCE ? Math.floor(random() * o.flagCount) : -1,
            cosHSx: 0,
            sinHSx: 0,
            bounceAmp: 0.05,
            placardKind: -1,
            placardId: -1,
            flagId: -1,
          };
          if (!o.skip?.(side, person.offset)) this.people.push(person);
        }
      }
    }
    const habits = seeded(o.seed + 5);
    this.people.forEach((p, i) => {
      const front = Math.abs(p.x) < o.near + 0.3 && p.height > 0.9;
      const roll = habits();
      if (p.height < 0.9 && roll < 0.55) {
        this.people[i] = { ...p, stance: 0, flag: -1, balloon: true };
      } else if (p.stance === 0 && roll > 0.93) {
        this.people[i] = { ...p, balloon: true };
      } else if (front && p.stance === 0 && roll < 0.4) {
        this.people[i] = { ...p, stance: LEAN_STANCE };
      } else if (p.stance === 2 && p.height > 0.9 && roll < 0.28) {
        this.people[i] = { ...p, stance: PLACARD_STANCE };
      }
    });
    const builds = seeded(o.seed + 13);
    this.people.forEach((p, i) => {
      const tall = p.height > 0.9 && builds() < 0.08;
      const height = tall ? p.height * 1.08 : p.height;
      const build = 0.92 + builds() * builds() * 0.36;
      const heading = (p.side < 0 ? -Math.PI / 2 : Math.PI / 2) + p.side * 0.3;
      const sx = height * build;
      const calm = p.stance === 0 || p.stance === LEAN_STANCE;
      this.people[i] = {
        ...p,
        height,
        build,
        cosHSx: Math.cos(heading) * sx,
        sinHSx: Math.sin(heading) * sx,
        bounceAmp: calm ? 0.02 : 0.05,
      };
    });

    const solidMat = o.solidMaterial ?? this.material({ roughness: 0.8, vertexColors: true });
    const upperSkinMap = new Map<number, BufferGeometry>();
    const topMap = new Map<number, BufferGeometry>();
    let bottomTrousersGeo: BufferGeometry | null = null;
    for (const st of CROWD_STANCES) {
      const parts = spectatorParts(st, false);
      this.disposables.push(parts.skin, parts.top);
      upperSkinMap.set(st, parts.skin);
      topMap.set(st, parts.top);
      if (st === 0) {
        bottomTrousersGeo = parts.bottom;
        this.disposables.push(bottomTrousersGeo);
      } else {
        parts.bottom.dispose();
      }
    }
    const bottomShortsParts = spectatorParts(0, true);
    bottomShortsParts.skin.dispose();
    bottomShortsParts.top.dispose();
    const bareCalves = spectatorBareCalvesGeometry();
    this.disposables.push(bottomShortsParts.bottom, bareCalves);

    const shoes = shoeGeometry();
    const allHairs = hairParts();
    const hairs = [allHairs[0]!, allHairs[1]!, allHairs[2]!];
    allHairs[3]!.dispose();
    const balloon = ellipsoid(0.2, 1, 1.18, 1, 0.34, 2.42, -0.02, 6);
    const placardTex = placardAtlasTexture();
    const placardMat = this.material({ map: placardTex, roughness: 0.8, side: DoubleSide });
    const placardCards = PLACARDS.map((_, idx) => {
      const g = new PlaneGeometry(0.72, 0.48);
      const uv = g.getAttribute('uv') as BufferAttribute;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const du = 0.5 / 512;
      const dv = 0.5 / 344;
      const u0 = col * 0.5 + du;
      const u1 = (col + 1) * 0.5 - du;
      const v0 = 1 - (row + 1) * 0.5 + dv;
      const v1 = 1 - row * 0.5 - dv;
      for (let vi = 0; vi < uv.count; vi++) {
        uv.setXY(vi, u0 + uv.getX(vi) * (u1 - u0), v0 + uv.getY(vi) * (v1 - v0));
      }
      g.rotateY(Math.PI);
      g.rotateX(0.12);
      g.translate(0, 2.12, -0.16);
      return g;
    });
    const umbrella = umbrellaGeometry();
    const [strawHat, bucketHat] = sunHatParts();
    bucketHat.dispose();
    const cloth =
      o.doubleSideMaterial ??
      this.material({ roughness: 0.8, side: DoubleSide, vertexColors: true });
    this.disposables.push(
      shoes,
      balloon,
      umbrella,
      strawHat,
      placardTex,
      ...placardCards,
      ...hairs,
    );

    const dress = seeded(o.seed + 1);
    const extra = seeded(o.seed + 3);
    const pick = (list: readonly string[]) => list[Math.floor(dress() * list.length)]!;
    const any = (list: readonly string[]) => list[Math.floor(extra() * list.length)]!;

    this.people.forEach((p, i) => {
      const shorts = dress() < 0.6;
      const bodyStance = p.stance === PLACARD_STANCE ? 2 : p.stance;
      const skinCol = pick(o.skins);
      this.ensemble.put(i, `skin${bodyStance}`, upperSkinMap.get(bodyStance)!, solidMat, skinCol);
      if (shorts) {
        this.ensemble.put(i, 'calves', bareCalves, solidMat, skinCol);
      }
      this.ensemble.put(i, `top${bodyStance}`, topMap.get(bodyStance)!, solidMat, pick(o.tops));
      this.ensemble.put(
        i,
        shorts ? 'bottoms' : 'bottomt',
        shorts ? bottomShortsParts.bottom : bottomTrousersGeo!,
        solidMat,
        pick(o.bottoms),
      );
      this.ensemble.put(i, 'shoes', shoes, solidMat, pick(SHOES));
      const style = Math.floor(dress() * 4);
      const hairIdx = style === 3 ? 1 : style;
      const colour = style === 2 ? pick(CAPS) : style === 3 ? pick(o.tops) : pick(HAIRS);
      const roll = extra();
      if (roll < 0.11)
        this.ensemble.put(i, 'straw', strawHat, solidMat, roll < 0.06 ? any(STRAWS) : any(o.tops));
      else this.ensemble.put(i, `hair${hairIdx}`, hairs[hairIdx]!, solidMat, colour);
      if (p.balloon) {
        this.ensemble.put(i, 'balloon', balloon, solidMat, any(BALLOONS));
      }
      if (p.stance === PLACARD_STANCE) {
        p.placardKind = Math.floor(extra() * placardCards.length);
      }
      const grown = p.height > 0.9;
      if (p.stance === 0 && grown && extra() < 0.22) {
        this.ensemble.put(i, 'umbrella', umbrella, cloth, any(UMBRELLAS));
      }
    });
    this.ensemble.build();

    let placardTotal = 0;
    for (const p of this.people) if (p.placardKind >= 0) placardTotal++;
    const placardPack = makeCrowdBatch(
      placardCards,
      placardTotal,
      placardMat,
      this.group,
      this.disposables,
    );
    this.placardBatch = placardPack.batch;
    for (let k = 0; k < placardCards.length; k++) {
      const gid = placardPack.geoIds[k]!;
      for (const p of this.people) {
        if (p.placardKind === k) p.placardId = placardPack.batch.addInstance(gid);
      }
    }
    this.placardVis = new Uint8Array(Math.max(1, placardTotal));
    this.placardVis.fill(1);

    const flagGeos = Array.from({ length: o.flagCount }, (_, idx) => {
      const flag = new PlaneGeometry(0.75, 0.5, 4, 1);
      flag.translate(0.375, 0.3, 0);
      const uv = flag.getAttribute('uv') as BufferAttribute;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const du = 0.5 / 600;
      const dv = 0.5 / 400;
      const u0 = col * 0.5 + du;
      const u1 = (col + 1) * 0.5 - du;
      const v0 = 1 - (row + 1) * 0.5 + dv;
      const v1 = 1 - row * 0.5 - dv;
      for (let vi = 0; vi < uv.count; vi++) {
        uv.setXY(vi, u0 + uv.getX(vi) * (u1 - u0), v0 + uv.getY(vi) * (v1 - v0));
      }
      const pole = new CylinderGeometry(0.012, 0.012, 0.9, 4);
      pole.translate(0, 0.1, 0);
      const pUv = pole.getAttribute('uv') as BufferAttribute;
      for (let vi = 0; vi < pUv.count; vi++) {
        pUv.setXY(vi, u0 + 0.01, v0 + 0.01);
      }
      const merged = merge([flag, pole]);
      this.disposables.push(merged);
      return merged;
    });
    let flagTotal = 0;
    for (const p of this.people) if (p.flag >= 0) flagTotal++;
    const flagPack = makeCrowdBatch(flagGeos, flagTotal, o.flagAtlas, this.group, this.disposables);
    this.flagBatch = flagPack.batch;
    for (let k = 0; k < o.flagCount; k++) {
      const gid = flagPack.geoIds[k]!;
      for (const p of this.people) {
        if (p.flag === k) p.flagId = flagPack.batch.addInstance(gid);
      }
    }
    this.flagVis = new Uint8Array(Math.max(1, flagTotal));
    this.flagVis.fill(1);
  }

  /** Moves the crowd with the rider; `kerb` lifts it onto the pavement. */
  place(
    time: number,
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
    kerb: number,
  ): void {
    const loop = this.options.loop;
    const flagBatch = this.flagBatch;
    const placardBatch = this.placardBatch;
    const placardMt = placardBatch ? batchMatricesTexture(placardBatch) : null;
    const flagMt = flagBatch ? batchMatricesTexture(flagBatch) : null;
    const placardArr = placardMt ? placardMt.data : null;
    const flagArr = flagMt ? flagMt.data : null;
    const placardVis = this.placardVis;
    const flagVis = this.flagVis;
    const s42 = Math.sin(time * 4.2);
    const c42 = Math.cos(time * 4.2);
    const s30 = Math.sin(time * 3);
    const c30 = Math.cos(time * 3);
    const people = this.people;
    const len = people.length;
    for (let i = 0; i < len; i++) {
      const p = people[i]!;
      const metres = along(p.offset, loop);
      if (
        metres <= SPECTATOR_BEHIND_CULL ||
        metres > SPECTATOR_HORIZON_CULL ||
        (metres > SPECTATOR_FRONT_ROW_ONLY && p.row > 0)
      ) {
        this.ensemble.hide(i);
        if (placardBatch && p.placardId >= 0 && placardVis[p.placardId]) {
          placardVis[p.placardId] = 0;
          placardBatch.setVisibleAt(p.placardId, false);
        }
        if (flagBatch && p.flagId >= 0 && flagVis[p.flagId]) {
          flagVis[p.flagId] = 0;
          flagBatch.setVisibleAt(p.flagId, false);
        }
        continue;
      }
      const y = heightAt(metres > 0 ? metres : 0) + kerb;
      const beat = s42 * p.cosPhase + c42 * p.sinPhase;
      const bounce = (beat < 0 ? -beat : beat) * p.bounceAmp;
      const d = beat * 0.05;
      const cd = 1 - 0.5 * d * d;
      const cySx = p.cosHSx * cd - p.sinHSx * d;
      const sySx = p.sinHSx * cd + p.cosHSx * d;
      const syScale = p.height;
      const ty = y + bounce;
      const tz = -metres;
      this.ensemble.emitYawScaled(i, p.x, ty, tz, cySx, sySx, syScale);
      if (placardBatch && placardArr && p.placardId >= 0) {
        if (!placardVis[p.placardId]) {
          placardVis[p.placardId] = 1;
          placardBatch.setVisibleAt(p.placardId, true);
        }
        const po = p.placardId * 16;
        placardArr[po] = cySx;
        placardArr[po + 1] = 0;
        placardArr[po + 2] = -sySx;
        placardArr[po + 3] = 0;
        placardArr[po + 4] = 0;
        placardArr[po + 5] = syScale;
        placardArr[po + 6] = 0;
        placardArr[po + 7] = 0;
        placardArr[po + 8] = sySx;
        placardArr[po + 9] = 0;
        placardArr[po + 10] = cySx;
        placardArr[po + 11] = 0;
        placardArr[po + 12] = p.x;
        placardArr[po + 13] = ty;
        placardArr[po + 14] = tz;
        placardArr[po + 15] = 1;
      }
      if (!flagBatch || !flagArr || p.flagId < 0) continue;
      if (!flagVis[p.flagId]) {
        flagVis[p.flagId] = 1;
        flagBatch.setVisibleAt(p.flagId, true);
      }
      const wave = (s30 * p.cosPhase + c30 * p.sinPhase) * 0.6;
      const w2 = wave * wave;
      const cw = 1 - 0.5 * w2;
      const sw = wave * (1 - 0.16666667 * w2);
      const cwfSx = cySx * cw - sySx * sw;
      const swfSx = sySx * cw + cySx * sw;
      const fo = p.flagId * 16;
      flagArr[fo] = cwfSx;
      flagArr[fo + 1] = 0;
      flagArr[fo + 2] = -swfSx;
      flagArr[fo + 3] = 0;
      flagArr[fo + 4] = 0;
      flagArr[fo + 5] = syScale;
      flagArr[fo + 6] = 0;
      flagArr[fo + 7] = 0;
      flagArr[fo + 8] = swfSx;
      flagArr[fo + 9] = 0;
      flagArr[fo + 10] = cwfSx;
      flagArr[fo + 11] = 0;
      flagArr[fo + 12] = p.x + 0.3 * cySx - 0.06 * sySx;
      flagArr[fo + 13] = ty + 1.95 * syScale;
      flagArr[fo + 14] = tz - 0.3 * sySx - 0.06 * cySx;
      flagArr[fo + 15] = 1;
    }
    if (placardMt) placardMt.tex.needsUpdate = true;
    if (flagMt) flagMt.tex.needsUpdate = true;
    this.ensemble.commit();
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }
}
