// Passo Campolongo's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the climb
// out of Corvara in Alta Badia on a summer morning. The rider winds up through spruce forest, the
// hillside rising on the right and falling away on the left behind a wooden fence, with ski pistes
// cut green through the trees and chairlifts swinging their chairs across the road overhead. Ahead
// the forest opens onto the grassy saddle of the pass, its hay barns and the rifugio, with the
// Sella's pale layered walls rising on one hand and the Sassongher's spire on the other. Road signs
// count the kilometres to the pass and climbers share the road. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  TorusGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  dolomiteTexture,
  Figures,
  loopMetres,
  meadowTexture,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** A chairlift crosses the road at LIFT each lap; a kilometre sign every SIGN metres. */
const LIFT = 150;
const SIGN = 100;
/** The lift's cable height over the road, and its chairs' spacing along it. */
const CABLE = 14;
const CHAIRS = 12;

const CLIMBER_WEAR = {
  tops: ['#ff2d78', '#2dd4ff', '#ffd23f', '#1f5fbf', '#f5f5f0', '#2a7a4a', '#c8102e', '#ff9f1c'],
  bottoms: ['#1d1f24', '#1d1f24', '#2f3e5c'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5'],
};

interface Climber {
  readonly bike: Mesh;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

export class CampolongoStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly climbers: Climber[] = [];
  private riders: Figures | null = null;
  private readonly chairs: Mesh[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addSlopes(roadHalf, points);
    this.addFence(roadHalf);
    this.addForest(roadHalf);
    this.addLift();
    this.addSigns(roadHalf);
    this.addClimbers(roadHalf);
    this.addSaddle();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The chairs ride the cable across the road, up one side and back down the other.
    const span = 124;
    this.chairs.forEach((chair, k) => {
      const up = k % 2 === 0;
      const u = ((seconds * 2.2 + (k >> 1) * (span / (CHAIRS / 2))) % span) / span;
      chair.position.x = (up ? u : 1 - u) * span - span / 2;
      chair.position.z = up ? -1.4 : 1.4;
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, so the forest falls away to the valley. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 200);
      position.setY(i * 2 + 1, p.height - 200);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const riders = this.riders;
    if (riders) {
      this.climbers.forEach((c, i) => {
        const metres = loopMetres(c.offset + c.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(metres);
        const heading = c.speed > 0 ? 0 : Math.PI;
        const rock = c.speed > 0 ? Math.sin(this.time * 3.6 + c.phase) * 0.08 : 0;
        c.bike.position.set(c.x, y, -metres);
        c.bike.rotation.set(0, heading, rock);
        const bob = Math.abs(Math.sin(this.time * 3.6 + c.phase)) * 0.03;
        riders.set(i, c.x, y + 0.2, -metres, heading, 0.95, bob);
      });
      riders.commit();
    }
    // The saddle and the mountains keep their bearing as the road climbs.
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The hillside rising on the right, the slope falling away on the left, and the far valley. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const floor = this.material({ map: this.repeat(forestFloorTexture(), 8, 8), roughness: 1 });
    const meadow = this.material({ map: this.repeat(meadowTexture(), 10, 10), roughness: 1 });
    const far = this.material({
      map: this.repeat(forestFloorTexture(), 80, 80),
      color: 0x6a8a5a,
      roughness: 1,
    });
    const verge = this.material({ map: this.repeat(meadowTexture(), 3, 3), roughness: 1 });
    this.ribbons.add(points, floor, [
      [r + 200, 70],
      [r + 6, 2],
    ]);
    this.ribbons.add(points, verge, [
      [r + 6, 2],
      [r + 1.4, 0.2],
      [r, 0.004],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.004],
      [-r - 2.5, -0.1],
    ]);
    this.ribbons.add(points, meadow, [
      [-r - 2.5, -0.1],
      [-r - 12, -3],
    ]);
    this.ribbons.add(points, floor, [
      [-r - 12, -3],
      [-r - 200, -30],
    ]);
    this.ribbons.add(points, far, [
      [-r - 200, -30],
      [-r - 320, -38],
      [-r - 700, 160],
      [-r - 1500, 420],
    ]);
  }

  /** The Ladin wooden fence along the valley side: split rails crossed between posts. */
  private addFence(roadHalf: number): void {
    const wood = this.material({ color: 0x8a6a48, roughness: 0.95 });
    const parts: BufferGeometry[] = [];
    for (let z = 0; z < 40; z += 2.5) {
      const post = new BoxGeometry(0.1, 1.2, 0.1);
      post.translate(0, 0.6, -z);
      const a = new BoxGeometry(0.06, 0.08, 3.1);
      a.rotateX(0.32);
      a.translate(0, 0.7, -z - 1.25);
      const b = a.clone();
      b.rotateX(0);
      b.translate(0, 0.25, 0);
      parts.push(post, a, b);
    }
    const row = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(row);
    for (let offset = 0; offset < LOOP; offset += 40) {
      const holder = new Group();
      const mesh = new Mesh(row, wood);
      mesh.castShadow = true;
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.4 });
    }
  }

  /**
   * Spruce and larch forest on both slopes, thick on the hillside, with a ski piste cut through
   * it under the lift.
   */
  private addForest(roadHalf: number): void {
    const random = seeded(1501);
    const bark = this.material({ color: 0x4a3a2c, roughness: 1 });
    const needles = [0x2f5a32, 0x3a6a3a, 0x2a4a2c, 0x4f7a3a].map((c) =>
      this.material({ color: c, roughness: 0.95 }),
    );
    const trunk = new CylinderGeometry(0.15, 0.25, 4, 6);
    trunk.translate(0, 2, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 4; k++) {
      const tier = new ConeGeometry(2.4 - k * 0.5, 4 - k * 0.5, 8);
      tier.translate(0, 4 + k * 2.4, 0);
      parts.push(tier);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 1.6 + random() * 2.6) {
      for (const side of [-1, 1] as const) {
        const d = (side > 0 ? 7 : 14) + random() ** 0.7 * 90;
        // Leave the piste open under the lift.
        if (Math.abs(offset - LIFT) < 18 && random() < 0.9) continue;
        if (random() < (side > 0 ? 0.35 : 0.15)) continue;
        const tree = new Group();
        tree.add(new Mesh(trunk, bark), new Mesh(crown, needles[Math.floor(random() * 4)]!));
        tree.children.forEach((c) => (c.castShadow = true));
        tree.scale.setScalar(0.9 + random() * 0.9);
        tree.position.y = side > 0 ? 2 + (d - 6) * (68 / 194) : -3 - (d - 12) * (27 / 188);
        this.group.add(tree);
        this.props.push({ mesh: tree, offset, x: side * (roadHalf + d) });
      }
    }
  }

  /** A chairlift crossing the road: its pylons on either slope, the cable, and its chairs. */
  private addLift(): void {
    const steel = this.material({ color: 0x9aa0a8, metalness: 0.6, roughness: 0.4 });
    const seat = this.material({ color: 0xd8302a, roughness: 0.6 });
    const lift = new Group();
    // The pylons stand on the two slopes, their arms CABLE metres up; the cable runs between them.
    const feet = [
      [-60, -19],
      [60, 20],
    ] as const;
    for (const [x, foot] of feet) {
      const pylon = new Mesh(this.unit, steel);
      pylon.scale.set(0.8, CABLE + 6, 0.8);
      pylon.position.set(x, foot + (CABLE + 6) / 2, 0);
      const arm = new Mesh(this.unit, steel);
      arm.scale.set(0.4, 0.4, 4);
      arm.position.set(x, foot + CABLE + 6, 0);
      lift.add(pylon, arm);
    }
    const rise = feet[1][1] - feet[0][1];
    const mid = (feet[0][1] + feet[1][1]) / 2 + CABLE + 6;
    const length = Math.hypot(120, rise);
    const cable = new CylinderGeometry(0.03, 0.03, length, 4);
    cable.rotateZ(Math.PI / 2);
    this.disposables.push(cable);
    for (const z of [-1.4, 1.4]) {
      const c = new Mesh(cable, steel);
      c.position.set(0, mid, z);
      c.rotation.z = Math.atan2(rise, 120);
      lift.add(c);
    }
    const hanger = new BoxGeometry(0.06, 2.2, 0.06);
    hanger.translate(0, -1.1, 0);
    const bench = new BoxGeometry(0.6, 0.12, 1.8);
    bench.translate(0, -2.2, 0);
    const back = new BoxGeometry(0.1, 0.7, 1.8);
    back.translate(0.3, -1.85, 0);
    const chairShape = mergeGeometries([hanger, bench, back])!;
    [hanger, bench, back].forEach((p) => p.dispose());
    this.disposables.push(chairShape);
    const chairs = new Group();
    for (let k = 0; k < CHAIRS; k++) {
      const chair = new Mesh(chairShape, seat);
      chair.castShadow = true;
      chairs.add(chair);
      this.chairs.push(chair);
    }
    // The chairs hang from the sloping cable; the group tilts them up the hill with it.
    chairs.position.y = mid;
    chairs.rotation.z = Math.atan2(rise, 120);
    lift.add(chairs);
    lift.rotation.y = 0.15;
    this.group.add(lift);
    this.props.push({ mesh: lift, offset: LIFT, x: 0 });
  }

  /** The kilometre signs and the pass's name board at the verge. */
  private addSigns(roadHalf: number): void {
    const steel = this.material({ color: 0x8a8f99, metalness: 0.6, roughness: 0.4 });
    const pole = new CylinderGeometry(0.05, 0.05, 2.4, 6);
    pole.translate(0, 1.2, 0);
    const plate = new PlaneGeometry(1.3, 0.8);
    plate.translate(0, 2.2, 0.04);
    this.disposables.push(pole, plate);
    for (let offset = 40, n = 5; offset < LOOP; offset += SIGN, n--) {
      const face = this.material({ map: this.track(signTexture(n)), roughness: 0.5 });
      const sign = new Group();
      sign.add(new Mesh(pole, steel), new Mesh(plate, face));
      sign.rotation.y = -0.35;
      this.group.add(sign);
      this.props.push({ mesh: sign, offset, x: roadHalf + 1 });
    }
  }

  /** Fellow climbers grinding up to the pass, and others sweeping down to Corvara. */
  private addClimbers(roadHalf: number): void {
    const random = seeded(1517);
    const frame = this.material({ color: 0x1d1f24, metalness: 0.5, roughness: 0.4 });
    const bike = roadBikeGeometry();
    this.disposables.push(bike);
    for (let offset = 14; offset < LOOP; offset += 16 + random() * 22) {
      const up = random() < 0.7;
      const mesh = new Mesh(bike, frame);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.climbers.push({
        bike: mesh,
        offset,
        x: up ? roadHalf - 0.8 - random() * 1.2 : -roadHalf + 0.9,
        speed: up ? 1.8 + random() * 1.2 : -(10 + random() * 3),
        phase: random() * 6.3,
      });
    }
    this.riders = new Figures(
      this.group,
      this.disposables,
      this.climbers.length,
      CLIMBER_WEAR,
      1523,
    );
  }

  /**
   * The view ahead: the forest opening onto the pass's grassy saddle, its hay barns and rifugio,
   * the Sella's pale layered walls on the left and the Sassongher's spire on the right.
   */
  private addSaddle(): void {
    const grass = this.material({ map: this.repeat(meadowTexture(), 40, 40), roughness: 1 });
    const forest = this.material({ color: 0x2f5a32, roughness: 1 });
    const dolomite = this.material({ map: this.track(dolomiteTexture()), roughness: 0.95 });
    const larch = this.material({ color: 0x8a6a48, roughness: 0.95 });
    const roof = this.material({ color: 0x4a3a30, roughness: 0.8 });
    const white = this.material({ color: 0xf2eee4, roughness: 0.8 });
    // The saddle: two grassy shoulders meeting low ahead, wooded on their flanks.
    const hump = new ConeGeometry(1, 1, 24, 1);
    this.disposables.push(hump);
    for (const [x, sx, sy] of [
      [-520, 700, 180],
      [560, 760, 220],
    ] as const) {
      const shoulder = new Mesh(hump, grass);
      shoulder.scale.set(sx, sy, 420);
      shoulder.position.set(x, 40 + sy / 2, -900);
      const wood = new Mesh(hump, forest);
      wood.scale.set(sx * 1.05, sy * 0.6, 440);
      wood.position.set(x, 40 + sy * 0.3, -860);
      this.horizon.add(shoulder, wood);
    }
    // The far side of the valley: wooded slopes climbing to meadows, across from the road.
    const across = this.material({
      map: this.repeat(forestFloorTexture(), 30, 30),
      color: 0x5a7a4a,
      roughness: 1,
    });
    for (const [z, sx, sy] of [
      [-250, 110, 95],
      [-800, 130, 120],
      [-1350, 120, 105],
      [-1900, 150, 140],
    ] as const) {
      const slope = new Mesh(hump, across);
      slope.scale.set(sx, sy, 380);
      slope.position.set(-300 - sx, -40 + sy / 2, z);
      this.horizon.add(slope);
    }
    // The valley floor beyond the road's reach, wooded, closing the view down the valley.
    const valley = new Mesh(new PlaneGeometry(4000, 3000), across);
    this.disposables.push(valley.geometry);
    valley.rotation.x = -Math.PI / 2;
    valley.position.set(-2160, -14, -1500);
    this.horizon.add(valley);
    const saddle = new Mesh(this.unit, grass);
    saddle.scale.set(500, 60, 300);
    saddle.position.set(0, 50, -980);
    this.horizon.add(saddle);
    // Hay barns and the rifugio on the saddle.
    const random = seeded(1531);
    const gable = new ConeGeometry(1, 1, 4);
    gable.rotateY(Math.PI / 4);
    this.disposables.push(gable);
    for (let k = 0; k < 7; k++) {
      const big = k === 3;
      const w = big ? 26 : 8 + random() * 6;
      const hut = new Group();
      const body = new Mesh(this.unit, big ? white : larch);
      body.scale.set(w, big ? 14 : 6, w * 0.8);
      body.position.y = body.scale.y / 2;
      const top = new Mesh(gable, roof);
      top.scale.set(w * 0.85, w * 0.5, w * 0.7);
      top.position.y = body.scale.y + w * 0.25;
      hut.add(body, top);
      hut.position.set(-200 + k * 65 + random() * 20, 80, -900 - random() * 60);
      this.horizon.add(hut);
    }
    // The Sella: a massive pale block in layered tiers.
    for (let k = 0; k < 3; k++) {
      const tier = new Mesh(this.unit, dolomite);
      tier.scale.set(1100 - k * 180, 160, 500 - k * 60);
      tier.position.set(-900 + k * 40, 180 + k * 150, -1700);
      this.horizon.add(tier);
    }
    // The Sassongher's spire and its neighbours.
    const spire = new ConeGeometry(1, 1, 6);
    this.disposables.push(spire);
    for (const [x, h, w] of [
      [700, 820, 260],
      [920, 560, 220],
      [480, 480, 200],
    ] as const) {
      const m = new Mesh(spire, dolomite);
      m.scale.set(w, h, w);
      m.position.set(x, 80 + h / 2, -1600);
      this.horizon.add(m);
    }
    this.group.add(this.horizon);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** A light road bike, along z: two wheels, its frame and drop bars. */
function roadBikeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const z of [-0.5, 0.5]) {
    const wheel = new TorusGeometry(0.34, 0.02, 4, 18);
    wheel.rotateY(Math.PI / 2);
    wheel.translate(0, 0.35, z);
    parts.push(wheel);
  }
  const tube = (length: number, y: number, z: number, tilt: number) => {
    const t = new CylinderGeometry(0.02, 0.02, length, 5);
    t.rotateX(tilt);
    t.translate(0, y, z);
    parts.push(t);
  };
  tube(0.6, 0.72, -0.05, Math.PI / 2 - 0.1);
  tube(0.6, 0.55, 0.15, 0.3);
  tube(0.55, 0.55, -0.32, -0.6);
  const saddle = new BoxGeometry(0.1, 0.04, 0.24);
  saddle.translate(0, 0.9, 0.22);
  const bars = new BoxGeometry(0.42, 0.03, 0.03);
  bars.translate(0, 0.86, -0.42);
  parts.push(saddle, bars);
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** The forest floor: needles, moss and roots. */
function forestFloorTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#4a5a34', 1537);
    const random = seeded(1543);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '90,70,40' : '30,50,25'},${0.2 + random() * 0.3})`;
      g.fillRect(random() * 256, random() * 256, 4 + random() * 18, 2 + random() * 6);
    }
  });
}

/** A kilometre sign: white on brown, the distance to the pass and its height. */
function signTexture(km: number): CanvasTexture {
  return canvasTexture(180, 110, (g) => {
    g.fillStyle = '#6b3a1e';
    g.fillRect(0, 0, 180, 110);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(5, 5, 170, 100);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = 'bold 17px sans-serif';
    g.fillText('PASSO CAMPOLONGO', 90, 32);
    g.font = 'bold 36px sans-serif';
    g.fillText(`${km} km`, 90, 72);
    g.font = '13px sans-serif';
    g.fillText('1875 m', 90, 96);
  });
}
