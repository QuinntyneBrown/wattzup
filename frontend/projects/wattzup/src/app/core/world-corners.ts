// What a race puts out where the road bends (L2-110 AC9): the corners of the street are found
// from the bend itself (`apexes`), so the furniture stands at each apex, on the outside of the
// turn, wherever the rider meets it.
import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { apexes } from './scene-bend';
import type { World } from './worlds';

/** The corners furnished at once: the nearest ones ahead of the rider. */
const POOL = 4;
/** Corners are looked for from a little behind the rider to the end of the street in view. */
const FROM = -30;
const TO = 400;
/** The foam mattresses strapped to the outside barrier: how many, each how long. */
const PADS = 6;
const PAD = 2;
/** The chevron board stands this far before the apex, where the turn begins. */
const CHEVRON_BEFORE = 14;
/** The fans gathered at each corner, and their shirts. */
const KNOT = 6;
const SHIRTS = [0xd8283a, 0x2456a6, 0xf2f0e8, 0x2f8f4e, 0xf29c1f, 0x6b3fa0, 0x1b1e24];

const X_AXIS = new Vector3(1, 0, 0);
const Z_AXIS = new Vector3(0, 0, 1);

export class Corners {
  readonly group = new Group();
  private readonly corners: Group[] = [];
  /** Each corner marshal's flag arm, waved as the rider rides. */
  private readonly flags: Group[] = [];

  constructor(private readonly disposables: { dispose(): void }[]) {}

  /**
   * Builds the furniture of one corner: on the left of the road, as for a right-hander, and
   * mirrored for a left-hander. `kerb` is the pavement's height above the road and
   * `barrier` how far from the centre line the crowd barriers stand.
   */
  build(roadHalf: number, kerb: number, barrier: number): void {
    const pad = new BoxGeometry(barrier - roadHalf - 0.12, 0.9, PAD - 0.06);
    const boardGeometry = new PlaneGeometry(1.6, 0.6);
    boardGeometry.translate(-barrier - 0.3, kerb + 1.75, CHEVRON_BEFORE);
    const postLeft = new BoxGeometry(0.05, 1.8, 0.05);
    postLeft.translate(-barrier - 0.9, kerb + 0.9, CHEVRON_BEFORE - 0.04);
    const postRight = new BoxGeometry(0.05, 1.8, 0.05);
    postRight.translate(-barrier + 0.3, kerb + 0.9, CHEVRON_BEFORE - 0.04);
    const postsGeometry = mergeGeometries([postLeft, postRight])!;
    postLeft.dispose();
    postRight.dispose();

    const chevrons = new MeshStandardMaterial({ map: chevronTexture(), roughness: 0.6 });
    const steel = new MeshStandardMaterial({ color: 0x8d939b, metalness: 0.6, roughness: 0.4 });
    const matte = new MeshStandardMaterial({ vertexColors: true, roughness: 0.78 });
    const yellow = new MeshStandardMaterial({ color: 0xf5d000, roughness: 0.7, side: DoubleSide });
    this.disposables.push(
      boardGeometry,
      postsGeometry,
      chevrons,
      chevrons.map!,
      steel,
      matte,
      yellow,
    );

    const legsGeo = new CapsuleGeometry(0.13, 0.64, 4, 8);
    const torsoGeo = new CapsuleGeometry(0.18, 0.42, 4, 10);
    const headGeo = new SphereGeometry(0.105, 12, 8);
    const armGeo = new CapsuleGeometry(0.05, 0.5, 4, 6);
    const stickGeo = new BoxGeometry(0.025, 0.9, 0.025);
    const clothGeo = new PlaneGeometry(0.7, 0.5);
    // Flown square to the street, out over the road, so the riders see it coming.
    clothGeo.translate(0.57, 1.18, 0);
    this.disposables.push(clothGeo);

    // Shared waving flag-arm geometry (vest arm + dark stick) reused across all corners.
    const flagArmParts = [
      paintedPart(
        armGeo,
        0xe8f021,
        new Vector3(0.12, 0.27, 0),
        new Quaternion().setFromAxisAngle(Z_AXIS, -0.45),
      ),
      paintedPart(stickGeo, 0x20242c, new Vector3(0.27, 0.95, 0)),
    ];
    const flagArmGeometry = mergeGeometries(flagArmParts)!;
    for (const p of flagArmParts) p.dispose();
    this.disposables.push(flagArmGeometry);

    for (let c = 0; c < POOL; c++) {
      const corner = new Group();
      const matteParts: BufferGeometry[] = [];

      // Foam padding along the outside barrier, red and white mattresses in turn.
      for (let i = 0; i < PADS; i++) {
        matteParts.push(
          paintedPart(
            pad,
            i % 2 === 0 ? 0xc8242c : 0xf2f0ea,
            new Vector3(-(roadHalf + barrier) / 2 - 0.04, kerb + 0.45, (i - (PADS - 1) / 2) * PAD),
          ),
        );
      }

      // Marshal body at the apex behind the barrier.
      const mx = -barrier - 0.6;
      matteParts.push(
        paintedPart(legsGeo, 0x20242c, new Vector3(mx, kerb + 0.45, 0)),
        paintedPart(torsoGeo, 0xe8f021, new Vector3(mx, kerb + 1.22, 0)),
        paintedPart(headGeo, 0xc58c64, new Vector3(mx, kerb + 1.72, 0)),
      );

      // Knot of cheering fans either side of the marshal.
      for (let i = 0; i < KNOT; i++) {
        const along = (i - (KNOT - 1) / 2) * 0.75 + (i >= KNOT / 2 ? 0.9 : -0.9);
        const tall = 0.88 + ((i * 7 + c * 3) % 5) * 0.04;
        const fx = -barrier - 0.5 - (i % 2) * 0.45;
        const shirt = SHIRTS[(i + c * 2) % SHIRTS.length]!;
        const scale = new Vector3(tall, tall, tall);
        matteParts.push(
          paintedPart(
            legsGeo,
            0x20242c,
            new Vector3(fx, kerb + 0.45 * tall, along),
            undefined,
            scale,
          ),
          paintedPart(
            torsoGeo,
            shirt,
            new Vector3(fx, kerb + 1.22 * tall, along),
            undefined,
            scale,
          ),
          paintedPart(
            headGeo,
            0xc58c64,
            new Vector3(fx, kerb + 1.72 * tall, along),
            undefined,
            scale,
          ),
        );
        if (i % 2 === 0) {
          for (const side of [-1, 1]) {
            matteParts.push(
              paintedPart(
                armGeo,
                shirt,
                new Vector3(fx, kerb + 1.78 * tall, along + side * 0.22 * tall),
                new Quaternion().setFromAxisAngle(X_AXIS, side * 0.35),
                scale,
              ),
            );
          }
        }
      }

      const mergedMatte = mergeGeometries(matteParts)!;
      for (const p of matteParts) p.dispose();
      this.disposables.push(mergedMatte);

      const matteMesh = new Mesh(mergedMatte, matte);
      matteMesh.castShadow = true;
      matteMesh.receiveShadow = true;

      const board = new Mesh(boardGeometry, chevrons);
      board.castShadow = true;
      const posts = new Mesh(postsGeometry, steel);

      const flag = new Group();
      flag.position.set(mx + 0.2, kerb + 1.5, 0);
      const flagArm = new Mesh(flagArmGeometry, matte);
      flagArm.castShadow = true;
      const flagCloth = new Mesh(clothGeo, yellow);
      flagCloth.castShadow = true;
      flag.add(flagArm, flagCloth);
      this.flags.push(flag);

      corner.add(matteMesh, board, posts, flag);
      corner.visible = false;
      this.corners.push(corner);
      this.group.add(corner);
    }

    for (const g of [pad, legsGeo, torsoGeo, headGeo, armGeo, stickGeo]) g.dispose();
  }

  /** Puts the furniture at the corners ahead of the rider at `s`, on the road's height. */
  place(world: World, s: number, heightAt: (metres: number) => number): void {
    const found = apexes(world, s + FROM, s + TO);
    this.corners.forEach((corner, i) => {
      const apex = found[i];
      corner.visible = apex !== undefined;
      if (!apex) return;
      const metres = apex.s - s;
      corner.position.set(0, heightAt(metres), -metres);
      // The corner lies along the street's slope, so on a ramp the chevron board 14 m before the
      // apex and the padding either side stand on the pavement, not level with the apex.
      corner.rotation.x = Math.atan((heightAt(metres + 1) - heightAt(metres - 1)) / 2);
      // The outside of a right-hander is the left of the road; a left-hander's corner is its
      // mirror image, chevrons and all.
      corner.scale.x = apex.turn;
      // The flag waves to and fro as the rider rides on; under reduced motion it still moves
      // only as the rider does.
      const flag = this.flags[i];
      if (flag) flag.rotation.z = -0.35 * Math.sin(s / 1.6 + i);
    });
  }
}

const TMP_MATRIX = new Matrix4();
const TMP_QUAT = new Quaternion();
const TMP_SCALE = new Vector3(1, 1, 1);
const TMP_COLOR = new Color();

/** Clones `geometry`, transforms it, and paints its vertices `hex` so parts merge into one draw. */
function paintedPart(
  geometry: BufferGeometry,
  hex: number,
  position: Vector3,
  rotation: Quaternion = TMP_QUAT.identity(),
  scale: Vector3 = TMP_SCALE,
): BufferGeometry {
  const clone = geometry.clone();
  clone.applyMatrix4(TMP_MATRIX.compose(position, rotation, scale));
  const count = clone.getAttribute('position').count;
  const colours = new Float32Array(count * 3);
  TMP_COLOR.setHex(hex);
  for (let i = 0; i < count; i++) {
    colours[i * 3] = TMP_COLOR.r;
    colours[i * 3 + 1] = TMP_COLOR.g;
    colours[i * 3 + 2] = TMP_COLOR.b;
  }
  clone.setAttribute('color', new BufferAttribute(colours, 3));
  return clone;
}

/** Three white chevrons on black, pointing right: the way a right-hander turns. */
function chevronTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#16181c';
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#f4f1e8';
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 70;
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + 36, 48);
      ctx.lineTo(x, 84);
      ctx.lineTo(x - 22, 84);
      ctx.lineTo(x + 14, 48);
      ctx.lineTo(x - 22, 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 90);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
