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
  InstancedMesh,
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

interface OwnerPart {
  readonly part: number;
  readonly slot: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Many figures, each made of several instanced parts (skin, clothes, hair, a flag) that move
 * together: a part is asked for by key, and visible figures pack tightly into each part's buffer.
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
  private readonly parts: { mesh: InstancedMesh }[] = [];
  private readonly slots: OwnerPart[][] = [];
  private counts = new Int32Array(0);
  private dynamicMode = false;

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

  /** Makes one instanced mesh per kind of part. */
  build(): void {
    for (const kind of this.kinds.values()) {
      const cap = Math.max(1, kind.owners.length);
      const mesh = new InstancedMesh(kind.geometry, kind.material, cap);
      mesh.count = kind.owners.length;
      mesh.frustumCulled = false;
      mesh.castShadow = kind.castShadow;
      kind.colours.forEach((c, i) => mesh.setColorAt(i, c));
      const part = this.parts.length;
      kind.owners.forEach((owner, slot) => {
        const c = kind.colours[slot]!;
        (this.slots[owner] ??= []).push({ part, slot, r: c.r, g: c.g, b: c.b });
      });
      this.parts.push({ mesh });
      this.group.add(mesh);
      this.disposables.push(mesh);
    }
    this.counts = new Int32Array(this.parts.length);
  }

  /** Resets active counts for culled per-frame emission. */
  beginFrame(): void {
    this.counts.fill(0);
    this.dynamicMode = true;
  }

  /** Packs visible figure `owner` into the next compact slot of each of its part meshes. */
  emit(owner: number, matrix: Matrix4, colorsChanged: boolean): void {
    const entries = this.slots[owner];
    if (!entries) return;
    const e = matrix.elements;
    for (const entry of entries) {
      const mesh = this.parts[entry.part]!.mesh;
      const slot = this.counts[entry.part]!;
      this.counts[entry.part] = slot + 1;
      const mArr = mesh.instanceMatrix.array as Float32Array;
      const o = slot * 16;
      mArr[o] = e[0];
      mArr[o + 1] = e[1];
      mArr[o + 2] = e[2];
      mArr[o + 3] = e[3];
      mArr[o + 4] = e[4];
      mArr[o + 5] = e[5];
      mArr[o + 6] = e[6];
      mArr[o + 7] = e[7];
      mArr[o + 8] = e[8];
      mArr[o + 9] = e[9];
      mArr[o + 10] = e[10];
      mArr[o + 11] = e[11];
      mArr[o + 12] = e[12];
      mArr[o + 13] = e[13];
      mArr[o + 14] = e[14];
      mArr[o + 15] = e[15];
      if (colorsChanged && mesh.instanceColor) {
        const cArr = mesh.instanceColor.array as Float32Array;
        const c3 = slot * 3;
        cArr[c3] = entry.r;
        cArr[c3 + 1] = entry.g;
        cArr[c3 + 2] = entry.b;
      }
    }
  }

  /** Packs visible figure `owner` using direct Y-rotation and scale `(sx, sy, sx)` with zero Matrix4 overhead. */
  emitYawScale(
    owner: number,
    tx: number,
    ty: number,
    tz: number,
    cy: number,
    sy: number,
    sx: number,
    syScale: number,
    colorsChanged: boolean,
  ): void {
    const entries = this.slots[owner];
    if (!entries) return;
    const m0 = cy * sx;
    const m2 = -sy * sx;
    const m8 = sy * sx;
    const m10 = cy * sx;
    for (const entry of entries) {
      const mesh = this.parts[entry.part]!.mesh;
      const slot = this.counts[entry.part]!;
      this.counts[entry.part] = slot + 1;
      const mArr = mesh.instanceMatrix.array as Float32Array;
      const o = slot * 16;
      mArr[o] = m0;
      mArr[o + 1] = 0;
      mArr[o + 2] = m2;
      mArr[o + 3] = 0;
      mArr[o + 4] = 0;
      mArr[o + 5] = syScale;
      mArr[o + 6] = 0;
      mArr[o + 7] = 0;
      mArr[o + 8] = m8;
      mArr[o + 9] = 0;
      mArr[o + 10] = m10;
      mArr[o + 11] = 0;
      mArr[o + 12] = tx;
      mArr[o + 13] = ty;
      mArr[o + 14] = tz;
      mArr[o + 15] = 1;
      if (colorsChanged && mesh.instanceColor) {
        const cArr = mesh.instanceColor.array as Float32Array;
        const c3 = slot * 3;
        cArr[c3] = entry.r;
        cArr[c3 + 1] = entry.g;
        cArr[c3 + 2] = entry.b;
      }
    }
  }

  /** Moves every part of figure `owner` to `matrix` in fixed-slot mode. */
  set(owner: number, matrix: Matrix4): void {
    for (const entry of this.slots[owner] ?? []) {
      this.parts[entry.part]!.mesh.setMatrixAt(entry.slot, matrix);
    }
  }

  commit(colorsChanged = false): void {
    for (let p = 0; p < this.parts.length; p++) {
      const mesh = this.parts[p]!.mesh;
      if (this.dynamicMode) mesh.count = this.counts[p]!;
      mesh.instanceMatrix.needsUpdate = true;
      if (this.dynamicMode && colorsChanged && mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
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
  readonly stance: number;
  readonly balloon?: boolean;
  readonly flag: number;
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
  private readonly scratchMat = new Matrix4();
  private lastBucket = Number.NaN;

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
          const person: Spectator = {
            side,
            row,
            offset: offset + random() * 0.35,
            x,
            height: child ? 0.6 + random() * 0.1 : 0.92 + random() * 0.15,
            build: 1,
            phase: random() * 6.3,
            stance,
            flag: stance === FLAG_STANCE ? Math.floor(random() * o.flagCount) : -1,
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
      this.people[i] = { ...p, height, build };
    });

    const skinMaterial = this.material({ roughness: 0.55, vertexColors: true });
    const cotton = this.material({ roughness: 0.92, vertexColors: true });
    const denim = this.material({ roughness: 0.95, vertexColors: true });
    const rubber = this.material({ roughness: 0.7 });
    const hair = this.material({ roughness: 0.95 });
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
    const latex = this.material({ roughness: 0.25, metalness: 0.05 });
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
    const cloth = this.material({ roughness: 0.8, side: DoubleSide, vertexColors: true });
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
      this.ensemble.put(
        i,
        `skin${bodyStance}`,
        upperSkinMap.get(bodyStance)!,
        skinMaterial,
        skinCol,
      );
      if (shorts) {
        this.ensemble.put(i, 'calves', bareCalves, skinMaterial, skinCol);
      }
      this.ensemble.put(i, `top${bodyStance}`, topMap.get(bodyStance)!, cotton, pick(o.tops));
      this.ensemble.put(
        i,
        shorts ? 'bottoms' : 'bottomt',
        shorts ? bottomShortsParts.bottom : bottomTrousersGeo!,
        denim,
        pick(o.bottoms),
      );
      this.ensemble.put(i, 'shoes', shoes, rubber, pick(SHOES));
      const style = Math.floor(dress() * 4);
      const hairIdx = style === 3 ? 1 : style;
      const colour = style === 2 ? pick(CAPS) : style === 3 ? pick(o.tops) : pick(HAIRS);
      const roll = extra();
      if (roll < 0.11)
        this.ensemble.put(i, 'straw', strawHat, hair, roll < 0.06 ? any(STRAWS) : any(o.tops));
      else this.ensemble.put(i, `hair${hairIdx}`, hairs[hairIdx]!, hair, colour);
      if (p.balloon) {
        this.ensemble.put(i, 'balloon', balloon, latex, any(BALLOONS));
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
  }

  /** Moves the crowd with the rider; `kerb` lifts it onto the pavement. */
  place(
    time: number,
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
    kerb: number,
  ): void {
    const loop = this.options.loop;
    const bucket = Math.floor(along(0, loop) * 0.5);
    const colorsChanged = bucket !== this.lastBucket;
    this.lastBucket = bucket;
    const flagBatch = this.flagBatch;
    const placardBatch = this.placardBatch;
    const me = this.scratchMat.elements;
    me[1] = 0;
    me[3] = 0;
    me[4] = 0;
    me[6] = 0;
    me[7] = 0;
    me[9] = 0;
    me[11] = 0;
    me[15] = 1;
    this.ensemble.beginFrame();
    for (let i = 0; i < this.people.length; i++) {
      const p = this.people[i]!;
      const metres = along(p.offset, loop);
      if (
        metres <= SPECTATOR_BEHIND_CULL ||
        metres > SPECTATOR_HORIZON_CULL ||
        (metres > SPECTATOR_FRONT_ROW_ONLY && p.row > 0)
      ) {
        if (placardBatch && p.placardId >= 0 && placardBatch.getVisibleAt(p.placardId)) {
          placardBatch.setVisibleAt(p.placardId, false);
        }
        if (flagBatch && p.flagId >= 0 && flagBatch.getVisibleAt(p.flagId)) {
          flagBatch.setVisibleAt(p.flagId, false);
        }
        continue;
      }
      const y = heightAt(Math.max(metres, 0)) + kerb;
      const heading = (p.side < 0 ? -Math.PI / 2 : Math.PI / 2) + p.side * 0.3;
      const beat = Math.sin(time * 4.2 + p.phase);
      const calm = p.stance === 0 || p.stance === LEAN_STANCE;
      const bounce = Math.abs(beat) * (calm ? 0.02 : 0.05);
      const yaw = heading + beat * 0.05;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const sx = p.height * p.build;
      const syScale = p.height;
      const ty = y + bounce;
      const tz = -metres;
      this.ensemble.emitYawScale(i, p.x, ty, tz, cy, sy, sx, syScale, colorsChanged);
      if (placardBatch && p.placardId >= 0) {
        if (!placardBatch.getVisibleAt(p.placardId)) placardBatch.setVisibleAt(p.placardId, true);
        me[0] = cy * sx;
        me[2] = -sy * sx;
        me[5] = syScale;
        me[8] = sy * sx;
        me[10] = cy * sx;
        me[12] = p.x;
        me[13] = ty;
        me[14] = tz;
        placardBatch.setMatrixAt(p.placardId, this.scratchMat);
      }
      if (!flagBatch || p.flagId < 0) continue;
      if (!flagBatch.getVisibleAt(p.flagId)) flagBatch.setVisibleAt(p.flagId, true);
      const wave = Math.sin(time * 3 + p.phase) * 0.6;
      const wy = yaw + wave;
      const cwf = Math.cos(wy);
      const swf = Math.sin(wy);
      me[0] = cwf * sx;
      me[2] = -swf * sx;
      me[5] = syScale;
      me[8] = swf * sx;
      me[10] = cwf * sx;
      me[12] = p.x + (0.3 * cy - 0.06 * sy) * sx;
      me[13] = ty + 1.95 * syScale;
      me[14] = tz + (-0.3 * sy - 0.06 * cy) * sx;
      flagBatch.setMatrixAt(p.flagId, this.scratchMat);
    }
    this.ensemble.commit(colorsChanged);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }
}
