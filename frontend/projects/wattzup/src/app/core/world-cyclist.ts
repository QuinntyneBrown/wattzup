// A cyclist on a road bike, seen from the chase camera (L2-110): the rider's bike and the
// simulated pacers are drawn from one kit. The bike points along -z; its rear axle is at +z.
import {
  type BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const WHEEL = 0.34;
const WHEELBASE = 0.5;
/** The bottom bracket, the pedals' centre: just ahead of the middle, below the axles. */
const BB = new Vector3(0, 0.3, 0.06);
const CRANK = 0.17;
const SEAT = new Vector3(0, 0.86, 0.24);
const HEAD_TOP = new Vector3(0, 0.9, -0.36);
const HEAD_BOTTOM = new Vector3(0, 0.76, -0.4);
const HIP = new Vector3(0, 0.96, 0.22);
const SHOULDER = new Vector3(0, 1.27, -0.27);
const HANDS = new Vector3(0, 0.93, -0.5);
const THIGH = 0.44;
const SHIN = 0.44;
const UPPER_ARM = 0.27;
const FOREARM = 0.27;
const UP = new Vector3(0, 1, 0);
const ACROSS = new Vector3(1, 0, 0);
/** Where the hands hold the hoods, the pivot of a rider standing on the pedals. */
const HOODS = new Vector3(0, HEAD_TOP.y + 0.04, HANDS.z - 0.06);

interface Limb {
  readonly mesh: Mesh;
  readonly length: number;
}

/** Geometry and materials shared by every cyclist in the scene. */
export class CyclistKit {
  private readonly tube = new CylinderGeometry(1, 1, 1, 8);
  private readonly head = new SphereGeometry(0.1, 20, 16);
  private readonly helmet = new SphereGeometry(0.13, 18, 10, 0, Math.PI * 2, 0, Math.PI / 1.65);
  private readonly torso = new CapsuleGeometry(0.15, 0.3, 6, 12);
  private readonly limbs = new Map<number, CapsuleGeometry>();
  readonly rubber = new MeshStandardMaterial({ color: 0x18191c, roughness: 0.85 });
  readonly metal = new MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.8, roughness: 0.3 });
  readonly shorts = new MeshStandardMaterial({ color: 0x15161a, roughness: 0.75 });
  readonly skin = new MeshStandardMaterial({ color: 0xc58c6a, roughness: 0.7 });
  readonly shoe = new MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.5 });
  readonly spokes = new MeshBasicMaterial({
    color: 0x9aa0a6,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: DoubleSide,
  });

  /** Thirty-two steel spokes laced from hub to rim, drawn as an alpha mask. */
  readonly spokeLace = new MeshBasicMaterial({
    color: 0x6f757c,
    alphaMap: spokeTexture(),
    alphaTest: 0.35,
    side: DoubleSide,
  });
  readonly bottle = new MeshStandardMaterial({ color: 0x2f7bd0, roughness: 0.4 });
  private readonly bottleShape = new CylinderGeometry(0.034, 0.034, 0.2, 10);
  private readonly bibPlane = new PlaneGeometry(0.21, 0.16);
  private readonly frameShape: BufferGeometry;
  private readonly bikeRubberShape: BufferGeometry;
  private readonly bikeMetalShape: BufferGeometry;
  private readonly wheelDiscsShape: BufferGeometry;

  /** The jersey's cut, tinted by each rider's colour: dark side panels and a pale hem band. */
  private readonly kitTexture = jerseyTexture();
  /** A road helmet's shell: vents running front to back over the crown. */
  private readonly ventTexture = ventTexture();

  constructor(private readonly frame: Material) {
    const tyre = new TorusGeometry(WHEEL - 0.012, 0.016, 8, 40);
    const rim = new TorusGeometry(WHEEL - 0.04, 0.012, 6, 40);
    const disc = new CircleGeometry(WHEEL - 0.04, 32);
    const chainring = new TorusGeometry(0.1, 0.008, 6, 32);

    const front = new Vector3(0, WHEEL, -WHEELBASE);
    const rear = new Vector3(0, WHEEL, WHEELBASE);
    const bar = HANDS.clone().setY(HEAD_TOP.y + 0.03);
    const tubes: [Vector3, Vector3, number][] = [
      [BB, SEAT, 0.018],
      [SEAT, HEAD_TOP, 0.016],
      [BB, HEAD_BOTTOM, 0.022],
      [HEAD_BOTTOM, HEAD_TOP, 0.02],
      [HEAD_BOTTOM, front, 0.014],
      [SEAT, SEAT.clone().add(new Vector3(0, 0.06, 0.02)), 0.012],
      [HEAD_TOP, bar, 0.014],
      [bar.clone().setX(-0.21), bar.clone().setX(0.21), 0.012],
    ];
    for (const x of [-0.045, 0.045]) {
      tubes.push([BB.clone().setX(x), rear.clone().setX(x), 0.011]);
      tubes.push([SEAT.clone().setX(x * 0.4), rear.clone().setX(x), 0.01]);
    }
    for (const x of [-0.21, 0.21]) {
      const hood = bar
        .clone()
        .setX(x)
        .add(new Vector3(0, 0, -0.06));
      tubes.push([bar.clone().setX(x), hood, 0.012]);
      tubes.push([hood, hood.clone().add(new Vector3(0, -0.13, 0.05)), 0.012]);
    }
    const frameParts = tubes.map(([a, b, r]) => stickGeometry(this.tube, a, b, r));
    this.frameShape = mergeGeometries(frameParts, false)!;
    for (const g of frameParts) g.dispose();

    const rubberParts = [
      wheelPartGeometry(tyre, -WHEELBASE),
      wheelPartGeometry(tyre, WHEELBASE),
      stickGeometry(
        this.tube,
        SEAT.clone().add(new Vector3(0, 0.07, 0.1)),
        SEAT.clone().add(new Vector3(0, 0.07, -0.14)),
        0.035,
        1.6,
      ),
    ];
    this.bikeRubberShape = mergeGeometries(rubberParts, false)!;
    for (const g of rubberParts) g.dispose();

    const ringPart = chainring.clone();
    ringPart.rotateY(Math.PI / 2);
    ringPart.translate(0.055, BB.y, BB.z);
    const metalParts = [
      wheelPartGeometry(rim, -WHEELBASE),
      wheelPartGeometry(rim, WHEELBASE),
      ringPart,
    ];
    this.bikeMetalShape = mergeGeometries(metalParts, false)!;
    for (const g of metalParts) g.dispose();

    const discParts = [wheelPartGeometry(disc, -WHEELBASE), wheelPartGeometry(disc, WHEELBASE)];
    this.wheelDiscsShape = mergeGeometries(discParts, false)!;
    for (const g of discParts) g.dispose();

    tyre.dispose();
    rim.dispose();
    disc.dispose();
    chainring.dispose();
  }

  /** A rider in `jersey`, with race `number` pinned to their back, on a `frame` of their own. */
  make(jersey: Color, number: number, frame: Material = this.frame): Cyclist {
    const top = new MeshStandardMaterial({ color: jersey, roughness: 0.65, map: this.kitTexture });
    const bib = new MeshStandardMaterial({ map: bibTexture(number), roughness: 0.8 });
    const shell = new MeshStandardMaterial({
      color: jersey,
      map: this.ventTexture,
      roughness: 0.35,
    });
    return new Cyclist(this, frame, top, bib, shell);
  }

  bibGeometry(): PlaneGeometry {
    return this.bibPlane;
  }

  tubeGeometry(): CylinderGeometry {
    return this.tube;
  }

  limb(radius: number, length: number): CapsuleGeometry {
    const key = Math.round(radius * 1000) * 10000 + Math.round(length * 1000);
    let geometry = this.limbs.get(key);
    if (!geometry) {
      geometry = new CapsuleGeometry(radius, length, 4, 10);
      this.limbs.set(key, geometry);
    }
    return geometry;
  }

  parts(): {
    frame: BufferGeometry;
    bikeRubber: BufferGeometry;
    bikeMetal: BufferGeometry;
    wheelDiscs: BufferGeometry;
    head: SphereGeometry;
    helmet: SphereGeometry;
    torso: CapsuleGeometry;
    bottle: CylinderGeometry;
  } {
    return {
      frame: this.frameShape,
      bikeRubber: this.bikeRubberShape,
      bikeMetal: this.bikeMetalShape,
      wheelDiscs: this.wheelDiscsShape,
      bottle: this.bottleShape,
      head: this.head,
      helmet: this.helmet,
      torso: this.torso,
    };
  }

  dispose(): void {
    for (const d of [
      this.tube,
      this.head,
      this.helmet,
      this.torso,
      this.frameShape,
      this.bikeRubberShape,
      this.bikeMetalShape,
      this.wheelDiscsShape,
    ]) {
      d.dispose();
    }
    for (const g of this.limbs.values()) g.dispose();
    this.kitTexture.dispose();
    this.ventTexture.dispose();
    this.bibPlane.dispose();
    this.bottleShape.dispose();
    this.spokeLace.alphaMap?.dispose();
    for (const m of [
      this.spokeLace,
      this.bottle,
      this.rubber,
      this.metal,
      this.shorts,
      this.skin,
      this.shoe,
      this.spokes,
    ]) {
      m.dispose();
    }
  }
}

export class Cyclist {
  readonly group = new Group();
  /** The discs that blur the spokes at speed (technique 34). */
  readonly wheelBlur: Mesh[] = [];
  private readonly legs: { thigh: Limb; shin: Limb; foot: Mesh; side: number }[] = [];
  private readonly cranks: Mesh[] = [];
  /** Torso, head and arms: they pivot about the hands when the rider stands on the pedals. */
  private readonly body = new Group();
  private readonly hip = HIP.clone();

  constructor(
    private readonly kit: CyclistKit,
    frame: Material,
    readonly jersey: MeshStandardMaterial,
    readonly bib: MeshStandardMaterial,
    readonly shell: MeshStandardMaterial,
  ) {
    const parts = kit.parts();
    // No blob under the bike: the shadow map grounds the rider in their own shape (#933, #937).
    const frameMesh = new Mesh(parts.frame, frame);
    frameMesh.castShadow = true;
    const bikeRubber = new Mesh(parts.bikeRubber, kit.rubber);
    bikeRubber.castShadow = true;
    const bikeMetal = new Mesh(parts.bikeMetal, kit.metal);
    const spokeLace = new Mesh(parts.wheelDiscs, kit.spokeLace);
    const blurDisc = new Mesh(parts.wheelDiscs, kit.spokes);
    blurDisc.visible = false;
    this.wheelBlur.push(blurDisc);
    const bottle = new Mesh(parts.bottle, kit.bottle);
    const down = HEAD_BOTTOM.clone().sub(BB);
    bottle.position
      .copy(BB)
      .addScaledVector(down, 0.45)
      .add(new Vector3(0, 0.035, 0.02));
    bottle.quaternion.setFromUnitVectors(UP, down.normalize());
    this.group.add(frameMesh, bikeRubber, bikeMetal, spokeLace, blurDisc, bottle);
    for (let i = 0; i < 2; i++) {
      const crank = this.stick(BB, BB, 0.014, kit.metal);
      this.cranks.push(crank);
      this.group.add(crank);
    }

    // The rider: hips on the saddle, back bent towards the bars.
    const torso = new Mesh(parts.torso, jersey);
    torso.position.copy(HIP).lerp(SHOULDER, 0.5);
    torso.quaternion.setFromUnitVectors(UP, SHOULDER.clone().sub(HIP).normalize());
    torso.scale.set(1.15, 1, 0.85);
    torso.castShadow = true;
    this.body.add(torso);
    // The race number, pinned low on the back.
    const along = SHOULDER.clone().sub(HIP).normalize();
    const back = new Vector3(0, -along.z, along.y);
    const number = new Mesh(kit.bibGeometry(), bib);
    number.position.copy(torso.position).addScaledVector(along, -0.07).addScaledVector(back, 0.135);
    number.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), back);
    this.body.add(number);
    const seatPad = new Mesh(kit.limb(0.1, 0.1), kit.shorts);
    seatPad.position.copy(HIP).add(new Vector3(0, 0.02, 0.04));
    seatPad.rotation.z = Math.PI / 2;
    seatPad.scale.set(1, 1, 0.9);
    this.body.add(seatPad);
    // The neck rises from inside the top of the back, up and forward to the base of the skull,
    // so the head sits on the shoulders instead of floating over them.
    const skull = SHOULDER.clone().add(new Vector3(0, 0.15, -0.1));
    const nape = SHOULDER.clone().addScaledVector(along, -0.06);
    const throat = skull.clone().add(new Vector3(0, -0.04, 0.02));
    const neck = this.limbMesh(0.055, nape.distanceTo(throat), kit.skin);
    place(neck, nape, throat);
    this.body.add(neck.mesh);
    // A head is taller than it is wide and longer front to back than across: an egg, not a ball,
    // its jaw dropping towards the throat.
    const head = new Mesh(parts.head, kit.skin);
    head.position.copy(skull).add(new Vector3(0, -0.01, -0.01));
    head.scale.set(0.82, 1.08, 1.02);
    head.rotation.x = 0.3;
    // The helmet hugs the skull, a finger's width proud of it all round and down over the back of
    // the head, held on by a strap from each side of the shell under the jaw.
    const helmet = new Mesh(parts.helmet, shell);
    helmet.position.copy(skull).add(new Vector3(0, 0, 0.01));
    helmet.scale.set(0.86, 0.82, 1.15);
    helmet.rotation.x = -0.15;
    head.castShadow = helmet.castShadow = true;
    this.body.add(head, helmet);
    const chin = skull.clone().add(new Vector3(0, -0.1, -0.06));
    for (const side of [-1, 1]) {
      const strap = this.limbMesh(0.007, 0.1, kit.rubber);
      place(strap, skull.clone().add(new Vector3(side * 0.085, -0.02, 0.01)), chin);
      this.body.add(strap.mesh);
    }
    for (const side of [-1, 1]) {
      const shoulder = SHOULDER.clone().setX(side * 0.19);
      // Hands on the hoods, elbows bent out and down.
      const hand = new Vector3(side * 0.21, HEAD_TOP.y + 0.04, HANDS.z - 0.06);
      const elbow = bend(shoulder, hand, UPPER_ARM, FOREARM, new Vector3(side * 0.7, -0.45, 0.25));
      const upper = this.limbMesh(0.05, UPPER_ARM, jersey);
      const fore = this.limbMesh(0.04, FOREARM, kit.skin);
      place(upper, shoulder, elbow);
      place(fore, elbow, hand);
      // The shoulder: the jersey rounds over the joint from the top of the back to the arm, so
      // the arm grows out of the body instead of hanging beside it.
      const cap = this.limbMesh(0.065, 0.2, jersey);
      place(
        cap,
        SHOULDER.clone()
          .setX(side * 0.04)
          .addScaledVector(along, -0.03),
        shoulder,
      );
      this.body.add(upper.mesh, fore.mesh, cap.mesh);
      const thigh = this.limbMesh(0.075, THIGH, kit.shorts);
      const shin = this.limbMesh(0.055, SHIN, kit.skin);
      // White race socks to mid-calf, carried on the shin.
      const sock = new Mesh(kit.tubeGeometry(), kit.shoe);
      sock.scale.set(0.06, 0.13, 0.06);
      sock.position.y = SHIN / 2 - 0.1;
      shin.mesh.add(sock);
      const foot = new Mesh(kit.limb(0.04, 0.12), kit.shoe);
      foot.rotation.x = Math.PI / 2;
      this.group.add(thigh.mesh, shin.mesh, foot);
      this.legs.push({ thigh, shin, foot, side });
    }
    this.group.add(this.body);
    this.pose(0);
  }

  /**
   * Turns the cranks to `angle` radians and moves the legs with them, the bike leaning `lean`
   * radians into a bend (positive to the left, as a rotation about the way ahead).
   */
  pose(angle: number, lean = 0, standing = 0): void {
    // The bike rocks a little under each pedal stroke, about where the tyres meet the road, and
    // swings side to side when the rider stands on the pedals.
    this.group.rotation.z = lean + Math.sin(angle) * (0.03 + 0.09 * standing);
    // Out of the saddle the body pivots forward about the hands on the hoods, lifting the hips.
    const tilt = -0.14 * standing;
    this.body.rotation.x = tilt;
    this.body.position.copy(HOODS).sub(this.hip.copy(HOODS).applyAxisAngle(ACROSS, tilt));
    this.hip.copy(HIP).applyAxisAngle(ACROSS, tilt).add(this.body.position);
    this.legs.forEach((leg, i) => {
      const a = angle + i * Math.PI;
      const pedal = new Vector3(
        leg.side * 0.1,
        BB.y - Math.cos(a) * CRANK,
        BB.z - Math.sin(a) * CRANK,
      );
      const crank = this.cranks[i]!;
      place({ mesh: crank, length: CRANK }, BB.clone().setX(leg.side * 0.07), pedal, true);
      const hip = this.hip.clone().setX(leg.side * 0.1);
      const ankle = pedal.clone().add(new Vector3(0, 0.06, 0.03));
      const knee = bend(hip, ankle, THIGH, SHIN, new Vector3(leg.side * 0.08, 0.3, -1));
      place(leg.thigh, hip, knee);
      place(leg.shin, knee, ankle);
      leg.foot.position.copy(pedal).add(new Vector3(0, 0.03, -0.02));
    });
  }

  private stick(a: Vector3, b: Vector3, radius: number, material: Material): Mesh {
    const mesh = new Mesh(this.kit.tubeGeometry(), material);
    mesh.scale.set(radius, Math.max(a.distanceTo(b), 0.001), radius);
    mesh.position.copy(a).lerp(b, 0.5);
    if (a.distanceTo(b) > 0) {
      mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    }
    mesh.castShadow = true;
    return mesh;
  }

  private limbMesh(radius: number, length: number, material: Material): Limb {
    const mesh = new Mesh(this.kit.limb(radius, length - 2 * radius), material);
    mesh.castShadow = true;
    return { mesh, length };
  }
}

/** A race number: black digits on white cloth, with a safety pin at each corner. */
function bibTexture(n: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0, 0, 128, 96);
    ctx.fillStyle = '#16171a';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), 64, 52);
    ctx.fillStyle = '#9aa0a6';
    for (const [x, y] of [
      [8, 8],
      [120, 8],
      [8, 88],
      [120, 88],
    ]) {
      ctx.fillRect(x - 3, y - 2, 6, 4);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Spokes for a wheel disc: thirty-two lines from the hub to the rim, crossing in pairs. */
function spokeTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    const c = size / 2;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      // Each spoke leaves the hub flange tangentially, as a laced wheel's do.
      const hub = a + (i % 2 ? 0.5 : -0.5);
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(hub) * 10, c + Math.sin(hub) * 10);
      ctx.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c, c, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  return new CanvasTexture(canvas);
}

function ventTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#26282c';
    for (let k = 0; k < 10; k++) {
      const x = ((k + 0.5) / 10) * 256;
      ctx.beginPath();
      ctx.roundRect(x - 5, 18, 10, 70, 5);
      ctx.fill();
    }
    // A dark rim where the shell meets the liner.
    ctx.fillRect(0, 116, 256, 12);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function jerseyTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#3a3d44';
    ctx.fillRect(56, 0, 16, 64);
    ctx.fillRect(0, 0, 8, 64);
    ctx.fillRect(120, 0, 8, 64);
    ctx.fillStyle = '#d9dade';
    ctx.fillRect(0, 50, 128, 6);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Places a unit cylinder between `a` and `b` in local bike space for static geometry merging. */
function stickGeometry(
  unitTube: BufferGeometry,
  a: Vector3,
  b: Vector3,
  radius: number,
  scaleX = 1,
): BufferGeometry {
  const part = unitTube.clone();
  const pos = a.clone().lerp(b, 0.5);
  const quat =
    a.distanceTo(b) > 0
      ? new Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize())
      : new Quaternion();
  const scale = new Vector3(radius * scaleX, Math.max(a.distanceTo(b), 0.001), radius);
  part.applyMatrix4(new Matrix4().compose(pos, quat, scale));
  return part;
}

/** Places a wheel torus or spoke disc upright at axle `z` along the bike's centre line. */
function wheelPartGeometry(shape: BufferGeometry, z: number): BufferGeometry {
  const part = shape.clone();
  part.rotateY(Math.PI / 2);
  part.translate(0, WHEEL, z);
  return part;
}

/** Puts a limb (or a unit tube, `stretch`) between two points. */
function place(limb: Limb, a: Vector3, b: Vector3, stretch = false): void {
  limb.mesh.position.copy(a).lerp(b, 0.5);
  const d = b.clone().sub(a);
  if (stretch) limb.mesh.scale.set(0.014, Math.max(d.length(), 0.001), 0.014);
  if (d.lengthSq() > 0) limb.mesh.quaternion.setFromUnitVectors(UP, d.normalize());
}

/**
 * The middle joint of a two-bone limb from `a` to `c` (a knee, an elbow), bent towards `hint`
 * by the law of cosines. A reach too long straightens the limb.
 */
function bend(a: Vector3, c: Vector3, upper: number, lower: number, hint: Vector3): Vector3 {
  const ac = c.clone().sub(a);
  const d = Math.min(ac.length(), upper + lower - 1e-4);
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const out = Math.sqrt(Math.max(upper * upper - along * along, 0));
  const dir = ac.normalize();
  const side = hint
    .clone()
    .sub(dir.clone().multiplyScalar(hint.dot(dir)))
    .normalize();
  return a.clone().add(dir.multiplyScalar(along)).add(side.multiplyScalar(out));
}
