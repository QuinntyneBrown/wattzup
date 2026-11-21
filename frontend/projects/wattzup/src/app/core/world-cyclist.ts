// A cyclist on a road bike, seen from the chase camera (L2-110): the rider's bike and the
// simulated pacers are drawn from one kit. The bike points along -z; its rear axle is at +z.
import {
  BufferAttribute,
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

// Pre-allocated scratch vectors for zero-allocation per-frame pose() IK.
const POSE_PEDAL = new Vector3();
const POSE_BB = new Vector3();
const POSE_HIP = new Vector3();
const POSE_ANKLE = new Vector3();
const POSE_HINT = new Vector3();
const POSE_KNEE = new Vector3();
const PLACE_DIFF = new Vector3();
const BEND_DIR = new Vector3();
const BEND_SIDE = new Vector3();

interface Limb {
  readonly mesh: Mesh;
  readonly length: number;
}

const RUBBER_HEX = 0x18191c;
const SHORTS_HEX = 0x15161a;
const SKIN_HEX = 0xc58c6a;
const SHOE_HEX = 0xf1f1ee;
const BOTTLE_HEX = 0x2f7bd0;
const PAINT_COLOR = new Color();

interface AtlasRect {
  readonly u0: number;
  readonly u1: number;
  readonly v0: number;
  readonly v1: number;
}

export interface CyclistOptions {
  readonly helmetColor?: Color | number;
  readonly frameColor?: Color | number;
}

/** Geometry and materials shared by every cyclist in the scene. */
export class CyclistKit {
  private readonly tube = new CylinderGeometry(1, 1, 1, 6, 1, true);
  private readonly bibPlanes = new Map<number, PlaneGeometry>();
  private readonly ownedGeometries: BufferGeometry[] = [];
  readonly solid = new MeshStandardMaterial({ vertexColors: true, roughness: 0.72 });
  readonly metal = new MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.8, roughness: 0.3 });
  readonly apparel: MeshStandardMaterial;
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
  private readonly frameShape: BufferGeometry;
  private readonly bikeSolidShape: BufferGeometry;
  private readonly bikeMetalShape: BufferGeometry;
  private readonly wheelDiscsShape: BufferGeometry;
  private readonly bodyJerseyShape: BufferGeometry;
  private readonly helmetShape: BufferGeometry;
  private readonly bodySolidShape: BufferGeometry;
  private readonly thighShape: BufferGeometry;
  private readonly shinShape: BufferGeometry;
  private readonly footShape: BufferGeometry;

  constructor(private readonly frame: Material) {
    const atlas = apparelAtlasTexture();
    this.apparel = new MeshStandardMaterial({
      map: atlas.texture,
      vertexColors: true,
      roughness: 0.55,
    });
    const tyre = new TorusGeometry(WHEEL - 0.012, 0.016, 6, 24);
    const rim = new TorusGeometry(WHEEL - 0.04, 0.012, 5, 24);
    const disc = new CircleGeometry(WHEEL - 0.04, 24);
    const chainring = new TorusGeometry(0.1, 0.008, 4, 20);
    const head = new SphereGeometry(0.1, 12, 9);
    const torso = new CapsuleGeometry(0.15, 0.3, 4, 8);

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
    this.frameShape = paintGeometry(mergeGeometries(frameParts, false)!, 0xffffff);
    for (const g of frameParts) g.dispose();

    const down = HEAD_BOTTOM.clone().sub(BB);
    const bottlePos = BB.clone()
      .addScaledVector(down, 0.45)
      .add(new Vector3(0, 0.035, 0.02));
    const bottleQuat = new Quaternion().setFromUnitVectors(UP, down.clone().normalize());
    const bottlePart = new CylinderGeometry(0.034, 0.034, 0.2, 8);
    bottlePart.applyMatrix4(new Matrix4().compose(bottlePos, bottleQuat, new Vector3(1, 1, 1)));
    const bikeSolidParts = [
      paintGeometry(wheelPartGeometry(tyre, -WHEELBASE), RUBBER_HEX),
      paintGeometry(wheelPartGeometry(tyre, WHEELBASE), RUBBER_HEX),
      paintGeometry(
        stickGeometry(
          this.tube,
          SEAT.clone().add(new Vector3(0, 0.07, 0.1)),
          SEAT.clone().add(new Vector3(0, 0.07, -0.14)),
          0.035,
          1.6,
        ),
        RUBBER_HEX,
      ),
      paintGeometry(bottlePart, BOTTLE_HEX),
    ];
    this.bikeSolidShape = mergeGeometries(bikeSolidParts, false)!;
    for (const g of bikeSolidParts) g.dispose();

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

    // Rigid upper-body sub-assemblies: torso + upper arms + shoulder caps (jersey), helmet shell,
    // and neck + head + forearms + chin straps + seat pad (vertex-coloured solid).
    const along = SHOULDER.clone().sub(HIP).normalize();
    const skull = SHOULDER.clone().add(new Vector3(0, 0.15, -0.1));
    const nape = SHOULDER.clone().addScaledVector(along, -0.06);
    const throat = skull.clone().add(new Vector3(0, -0.04, 0.02));
    const chin = skull.clone().add(new Vector3(0, -0.1, -0.06));

    const torsoPart = torso.clone();
    torsoPart.applyMatrix4(
      new Matrix4().compose(
        HIP.clone().lerp(SHOULDER, 0.5),
        new Quaternion().setFromUnitVectors(UP, along),
        new Vector3(1.15, 1, 0.85),
      ),
    );
    const headPart = head.clone();
    headPart.applyMatrix4(
      new Matrix4().compose(
        skull.clone().add(new Vector3(0, -0.01, -0.01)),
        new Quaternion().setFromAxisAngle(ACROSS, 0.3),
        new Vector3(0.82, 1.08, 1.02),
      ),
    );
    const seatPadPart = new CapsuleGeometry(0.1, 0.1, 2, 6);
    seatPadPart.applyMatrix4(
      new Matrix4().compose(
        HIP.clone().add(new Vector3(0, 0.02, 0.04)),
        new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2),
        new Vector3(1, 1, 0.9),
      ),
    );
    const jerseyParts: BufferGeometry[] = [torsoPart];
    const bodySolidParts: BufferGeometry[] = [
      paintGeometry(limbGeometry(0.055, nape.distanceTo(throat), nape, throat), SKIN_HEX),
      paintGeometry(headPart, SKIN_HEX),
      paintGeometry(seatPadPart, SHORTS_HEX),
    ];
    for (const side of [-1, 1]) {
      bodySolidParts.push(
        paintGeometry(
          limbGeometry(0.007, 0.1, skull.clone().add(new Vector3(side * 0.085, -0.02, 0.01)), chin),
          RUBBER_HEX,
        ),
      );
      const shoulder = SHOULDER.clone().setX(side * 0.19);
      const hand = new Vector3(side * 0.21, HEAD_TOP.y + 0.04, HANDS.z - 0.06);
      const elbow = bendInto(
        new Vector3(),
        shoulder,
        hand,
        UPPER_ARM,
        FOREARM,
        new Vector3(side * 0.7, -0.45, 0.25),
      );
      jerseyParts.push(limbGeometry(0.05, UPPER_ARM, shoulder, elbow));
      jerseyParts.push(
        limbGeometry(
          0.065,
          0.2,
          SHOULDER.clone()
            .setX(side * 0.04)
            .addScaledVector(along, -0.03),
          shoulder,
        ),
      );
      bodySolidParts.push(paintGeometry(limbGeometry(0.04, FOREARM, elbow, hand), SKIN_HEX));
    }
    this.bodyJerseyShape = remapAtlasUv(mergeGeometries(jerseyParts, false)!, atlas.jersey);
    this.bodySolidShape = mergeGeometries(bodySolidParts, false)!;
    for (const g of [...jerseyParts, ...bodySolidParts]) g.dispose();

    const helmetGeo = new SphereGeometry(0.13, 12, 7, 0, Math.PI * 2, 0, Math.PI / 1.65);
    helmetGeo.applyMatrix4(
      new Matrix4().compose(
        skull.clone().add(new Vector3(0, 0, 0.01)),
        new Quaternion().setFromAxisAngle(ACROSS, -0.15),
        new Vector3(0.86, 0.82, 1.15),
      ),
    );
    this.helmetShape = remapAtlasUv(helmetGeo, atlas.vent);

    this.thighShape = paintGeometry(new CapsuleGeometry(0.075, THIGH - 0.15, 2, 6), SHORTS_HEX);
    const shinCore = paintGeometry(new CapsuleGeometry(0.055, SHIN - 0.11, 2, 6), SKIN_HEX);
    const sockPart = this.tube.clone();
    sockPart.scale(0.06, 0.13, 0.06);
    sockPart.translate(0, SHIN / 2 - 0.1, 0);
    paintGeometry(sockPart, SHOE_HEX);
    this.shinShape = mergeGeometries([shinCore, sockPart], false)!;
    shinCore.dispose();
    sockPart.dispose();
    this.footShape = paintGeometry(new CapsuleGeometry(0.04, 0.12, 2, 6), SHOE_HEX);

    tyre.dispose();
    rim.dispose();
    disc.dispose();
    chainring.dispose();
    head.dispose();
    torso.dispose();
  }

  /** A rider in `jersey`, with race `number` pinned to their back, on a `frame` of their own. */
  make(
    jersey: Color,
    number: number,
    frame: Material = this.frame,
    options?: CyclistOptions,
  ): Cyclist {
    const jerseyPart = paintByColor(this.bodyJerseyShape.clone(), jersey);
    const shellColor =
      options?.helmetColor !== undefined ? PAINT_COLOR.set(options.helmetColor) : jersey;
    const helmetPart = paintByColor(this.helmetShape.clone(), shellColor);
    const bibPart = paintGeometry(this.bibGeometry(number).clone(), 0xffffff);
    const bodyApparel = mergeGeometries([jerseyPart, helmetPart, bibPart], false)!;
    jerseyPart.dispose();
    helmetPart.dispose();
    bibPart.dispose();
    this.ownedGeometries.push(bodyApparel);

    let frameGeo = this.frameShape;
    if (options?.frameColor !== undefined) {
      frameGeo = paintByColor(this.frameShape.clone(), PAINT_COLOR.set(options.frameColor));
      this.ownedGeometries.push(frameGeo);
    }
    return new Cyclist(this, frame, frameGeo, bodyApparel);
  }

  bibGeometry(number: number): PlaneGeometry {
    const slot = (((number - 1) % 8) + 8) % 8;
    let plane = this.bibPlanes.get(slot);
    if (!plane) {
      plane = new PlaneGeometry(0.21, 0.16);
      const col = slot % 4;
      const row = Math.floor(slot / 4);
      const u0 = (col * 128 + 1) / 512;
      const u1 = ((col + 1) * 128 - 1) / 512;
      const v0 = 1 - ((row + 1) * 96 - 1) / 320;
      const v1 = 1 - (row * 96 + 1) / 320;
      const uv = plane.getAttribute('uv') as BufferAttribute;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
      }
      uv.needsUpdate = true;
      const along = SHOULDER.clone().sub(HIP).normalize();
      const back = new Vector3(0, -along.z, along.y);
      const pos = HIP.clone()
        .lerp(SHOULDER, 0.5)
        .addScaledVector(along, -0.07)
        .addScaledVector(back, 0.135);
      const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), back);
      plane.applyMatrix4(new Matrix4().compose(pos, quat, new Vector3(1, 1, 1)));
      this.bibPlanes.set(slot, plane);
    }
    return plane;
  }

  tubeGeometry(): CylinderGeometry {
    return this.tube;
  }

  parts(): {
    frame: BufferGeometry;
    bikeSolid: BufferGeometry;
    bikeMetal: BufferGeometry;
    wheelDiscs: BufferGeometry;
    bodySolid: BufferGeometry;
    thigh: BufferGeometry;
    shin: BufferGeometry;
    foot: BufferGeometry;
  } {
    return {
      frame: this.frameShape,
      bikeSolid: this.bikeSolidShape,
      bikeMetal: this.bikeMetalShape,
      wheelDiscs: this.wheelDiscsShape,
      bodySolid: this.bodySolidShape,
      thigh: this.thighShape,
      shin: this.shinShape,
      foot: this.footShape,
    };
  }

  dispose(): void {
    for (const d of [
      this.tube,
      this.frameShape,
      this.bikeSolidShape,
      this.bikeMetalShape,
      this.wheelDiscsShape,
      this.bodyJerseyShape,
      this.helmetShape,
      this.bodySolidShape,
      this.thighShape,
      this.shinShape,
      this.footShape,
      ...this.ownedGeometries,
    ]) {
      d.dispose();
    }
    this.ownedGeometries.length = 0;
    for (const g of this.bibPlanes.values()) g.dispose();
    this.spokeLace.alphaMap?.dispose();
    this.apparel.map?.dispose();
    for (const m of [this.spokeLace, this.solid, this.metal, this.apparel, this.spokes]) {
      m.dispose();
    }
  }
}

export class Cyclist {
  readonly group = new Group();
  /** The discs that blur the spokes at speed (technique 34). */
  readonly wheelBlur: Mesh[] = [];
  readonly apparel: MeshStandardMaterial;
  private readonly legs: { thigh: Limb; shin: Limb; foot: Mesh; side: number }[] = [];
  private readonly cranks: Mesh[] = [];
  private readonly shadowCasters: Mesh[] = [];
  private castingShadow = true;
  /** Torso, head and arms: they pivot about the hands when the rider stands on the pedals. */
  private readonly body = new Group();
  private readonly hip = HIP.clone();

  constructor(
    private readonly kit: CyclistKit,
    frame: Material,
    frameGeo: BufferGeometry,
    bodyApparelGeo: BufferGeometry,
  ) {
    this.apparel = kit.apparel;
    const parts = kit.parts();
    // No blob under the bike: the shadow map grounds the rider in their own shape (#933, #937).
    const frameMesh = new Mesh(frameGeo, frame);
    frameMesh.castShadow = true;
    const bikeSolid = new Mesh(parts.bikeSolid, kit.solid);
    bikeSolid.castShadow = true;
    const bikeMetal = new Mesh(parts.bikeMetal, kit.metal);
    const spokeLace = new Mesh(parts.wheelDiscs, kit.spokeLace);
    const blurDisc = new Mesh(parts.wheelDiscs, kit.spokes);
    blurDisc.visible = false;
    this.wheelBlur.push(blurDisc);
    this.group.add(frameMesh, bikeSolid, bikeMetal, spokeLace, blurDisc);
    for (let i = 0; i < 2; i++) {
      const crank = this.stick(BB, BB, 0.014, kit.metal);
      this.cranks.push(crank);
      this.group.add(crank);
    }

    // The rider: pre-merged apparel (jersey + helmet + bib number) and solid (neck + head +
    // forearms + chin straps + seat pad) — 2 body meshes total.
    const bodyApparel = new Mesh(bodyApparelGeo, kit.apparel);
    const bodySolid = new Mesh(parts.bodySolid, kit.solid);
    bodyApparel.castShadow = bodySolid.castShadow = true;
    this.body.add(bodyApparel, bodySolid);

    for (const side of [-1, 1]) {
      const thighMesh = new Mesh(parts.thigh, kit.solid);
      thighMesh.castShadow = true;
      const shinMesh = new Mesh(parts.shin, kit.solid);
      shinMesh.castShadow = true;
      const foot = new Mesh(parts.foot, kit.solid);
      foot.rotation.x = Math.PI / 2;
      this.group.add(thighMesh, shinMesh, foot);
      this.legs.push({
        thigh: { mesh: thighMesh, length: THIGH },
        shin: { mesh: shinMesh, length: SHIN },
        foot,
        side,
      });
    }
    this.group.add(this.body);
    this.group.traverse((o) => {
      if ((o as Mesh).isMesh && o.castShadow) this.shadowCasters.push(o as Mesh);
    });
    this.pose(0);
  }

  /** Enables or disables shadow casting across this cyclist's meshes when entering/leaving the shadow box. */
  setCastShadow(on: boolean): void {
    if (this.castingShadow === on) return;
    this.castingShadow = on;
    for (const mesh of this.shadowCasters) {
      mesh.castShadow = on;
    }
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
    for (let i = 0; i < this.legs.length; i++) {
      const leg = this.legs[i]!;
      const a = angle + i * Math.PI;
      POSE_PEDAL.set(leg.side * 0.1, BB.y - Math.cos(a) * CRANK, BB.z - Math.sin(a) * CRANK);
      POSE_BB.set(leg.side * 0.07, BB.y, BB.z);
      placeMesh(this.cranks[i]!, POSE_BB, POSE_PEDAL, true);
      POSE_HIP.set(leg.side * 0.1, this.hip.y, this.hip.z);
      POSE_ANKLE.set(POSE_PEDAL.x, POSE_PEDAL.y + 0.06, POSE_PEDAL.z + 0.03);
      POSE_HINT.set(leg.side * 0.08, 0.3, -1);
      bendInto(POSE_KNEE, POSE_HIP, POSE_ANKLE, THIGH, SHIN, POSE_HINT);
      placeMesh(leg.thigh.mesh, POSE_HIP, POSE_KNEE, false);
      placeMesh(leg.shin.mesh, POSE_KNEE, POSE_ANKLE, false);
      leg.foot.position.set(POSE_PEDAL.x, POSE_PEDAL.y + 0.03, POSE_PEDAL.z - 0.02);
    }
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
}

function paintByColor<T extends BufferGeometry>(geometry: T, c: Color): T {
  const count = geometry.getAttribute('position').count;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colours[i * 3] = c.r;
    colours[i * 3 + 1] = c.g;
    colours[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  geometry.clearGroups();
  return geometry;
}

function paintGeometry<T extends BufferGeometry>(geometry: T, hex: number): T {
  return paintByColor(geometry, PAINT_COLOR.setHex(hex));
}

function remapAtlasUv<T extends BufferGeometry>(geometry: T, rect: AtlasRect): T {
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      rect.u0 + uv.getX(i) * (rect.u1 - rect.u0),
      rect.v0 + uv.getY(i) * (rect.v1 - rect.v0),
    );
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * Packs race bib numbers `1..8`, the jersey cut (`jerseyTexture`), and the helmet vents
 * (`ventTexture`) into one `512 × 320` atlas with 4 px edge-extruded gutters so all riders share
 * a single `kit.apparel` `MeshStandardMaterial`.
 */
function apparelAtlasTexture(): {
  texture: CanvasTexture;
  jersey: AtlasRect;
  vent: AtlasRect;
} {
  const W = 512;
  const H = 320;
  const pad = 4;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0, 0, W, 192);
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let slot = 0; slot < 8; slot++) {
      const ox = (slot % 4) * 128;
      const oy = Math.floor(slot / 4) * 96;
      ctx.fillStyle = '#16171a';
      ctx.fillText(String(slot + 1), ox + 64, oy + 52);
      ctx.fillStyle = '#9aa0a6';
      for (const [x, y] of [
        [8, 8],
        [120, 8],
        [8, 88],
        [120, 88],
      ]) {
        ctx.fillRect(ox + x - 3, oy + y - 2, 6, 4);
      }
    }
  }
  const place = (
    srcTex: CanvasTexture,
    cx: number,
    cy: number,
    dw: number,
    dh: number,
  ): AtlasRect => {
    const img = srcTex.image as HTMLCanvasElement;
    const sw = img.width;
    const sh = img.height;
    const ix = cx + pad;
    const iy = cy + pad;
    if (ctx) {
      ctx.drawImage(img, ix, iy, dw, dh);
      ctx.drawImage(img, 0, 0, sw, 1, ix, iy - pad, dw, pad);
      ctx.drawImage(img, 0, sh - 1, sw, 1, ix, iy + dh, dw, pad);
      ctx.drawImage(img, 0, 0, 1, sh, ix - pad, iy, pad, dh);
      ctx.drawImage(img, sw - 1, 0, 1, sh, ix + dw, iy, pad, dh);
    }
    srcTex.dispose();
    return {
      u0: (ix + 0.5) / W,
      u1: (ix + dw - 0.5) / W,
      v0: 1 - (iy + dh - 0.5) / H,
      v1: 1 - (iy + 0.5) / H,
    };
  };
  const jersey = place(jerseyTexture(), 0, 192, 184, 120);
  const vent = place(ventTexture(), 192, 192, 312, 120);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, jersey, vent };
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

/** Places a capsule limb between `a` and `b` in local body space for static geometry merging. */
function limbGeometry(radius: number, length: number, a: Vector3, b: Vector3): BufferGeometry {
  const part = new CapsuleGeometry(radius, length - 2 * radius, 2, 6);
  const pos = a.clone().lerp(b, 0.5);
  const d = b.clone().sub(a);
  const quat =
    d.lengthSq() > 0 ? new Quaternion().setFromUnitVectors(UP, d.normalize()) : new Quaternion();
  part.applyMatrix4(new Matrix4().compose(pos, quat, new Vector3(1, 1, 1)));
  return part;
}

/** Places a wheel torus or spoke disc upright at axle `z` along the bike's centre line. */
function wheelPartGeometry(shape: BufferGeometry, z: number): BufferGeometry {
  const part = shape.clone();
  part.rotateY(Math.PI / 2);
  part.translate(0, WHEEL, z);
  return part;
}

/** Puts a limb (or a unit tube, `stretch`) between two points without allocating heap vectors. */
function placeMesh(mesh: Mesh, a: Vector3, b: Vector3, stretch: boolean): void {
  mesh.position.copy(a).lerp(b, 0.5);
  PLACE_DIFF.subVectors(b, a);
  const lenSq = PLACE_DIFF.lengthSq();
  if (stretch) mesh.scale.set(0.014, Math.max(Math.sqrt(lenSq), 0.001), 0.014);
  if (lenSq > 0) {
    mesh.quaternion.setFromUnitVectors(UP, PLACE_DIFF.divideScalar(Math.sqrt(lenSq)));
  }
}

/**
 * Writes the middle joint of a two-bone limb from `a` to `c` (a knee, an elbow), bent towards
 * `hint` by the law of cosines, into `out` without allocating heap vectors.
 */
function bendInto(
  out: Vector3,
  a: Vector3,
  c: Vector3,
  upper: number,
  lower: number,
  hint: Vector3,
): Vector3 {
  BEND_DIR.subVectors(c, a);
  const len = BEND_DIR.length();
  const d = Math.min(len, upper + lower - 1e-4);
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const reach = Math.sqrt(Math.max(upper * upper - along * along, 0));
  if (len > 0) BEND_DIR.divideScalar(len);
  BEND_SIDE.copy(hint).addScaledVector(BEND_DIR, -hint.dot(BEND_DIR)).normalize();
  return out.copy(a).addScaledVector(BEND_DIR, along).addScaledVector(BEND_SIDE, reach);
}
