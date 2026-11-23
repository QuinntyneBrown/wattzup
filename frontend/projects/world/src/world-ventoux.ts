// Mont Ventoux's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the bare
// upper slopes of the Giant of Provence in the mistral. Above Chalet Reynard the forest gives out
// and the road climbs across white limestone scree: the slope rises on the right, falls away on
// the left behind a low stone wall to Provence in the haze, and the summit's red-and-white weather
// tower stands ahead. Red-capped bornes count the kilometres, fans' names are painted on the
// road, flags snap in the wind, the Simpson memorial stands once a lap, stunted cedars cling on,
// and fellow climbers grind up while others sweep down. Built on the shared kit (world-kit.ts)
// on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
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
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The Simpson memorial stands this far round each lap. */
const MEMORIAL = 300;
/** The words painted on the road, every PAINT metres. */
const WORDS = ['ALLEZ', 'VENTOUX', 'COURAGE', 'GO GO GO', 'DANSEUSE', 'ALLEZ ALLEZ'];
const PAINT = 60;

const CLIMBER_WEAR = {
  tops: ['#ffd23f', '#d62828', '#1f5fbf', '#f5f5f0', '#2a7a4a', '#f15bb5', '#1d1f24'],
  bottoms: ['#1d1f24', '#1d1f24', '#2f3e5c'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5'],
};

const FAN_WEAR = {
  tops: ['#d62828', '#ffd23f', '#f5f5f0', '#1f5fbf', '#ff9f1c', '#3a6b4a'],
  bottoms: ['#2f3e5c', '#5a5f69', '#e8c9a0', '#1d1f24'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

interface Climber {
  readonly bike: Mesh;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly flag: Mesh | null;
  readonly phase: number;
}

export class VentouxStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  /** Props along the road; one that `lies` on it, as paint does, takes its slope. */
  private readonly props: { mesh: Group; offset: number; x: number; lies?: boolean }[] = [];
  private readonly climbers: Climber[] = [];
  private readonly fans: Fan[] = [];
  private readonly flags: { mesh: Mesh; phase: number }[] = [];
  private riders: Figures | null = null;
  private crowd: Figures | null = null;
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
    this.addScree(roadHalf);
    this.addBornes(roadHalf);
    this.addPaint(roadHalf);
    this.addCedars(roadHalf);
    this.addMemorial(roadHalf);
    this.addFans(roadHalf);
    this.addClimbers(roadHalf);
    this.addSummit();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The mistral snaps the flags.
    for (const flag of this.flags) {
      flag.mesh.rotation.y = Math.sin(seconds * 9 + flag.phase) * 0.35 - 0.5;
      flag.mesh.scale.y = 1 + Math.sin(seconds * 13 + flag.phase) * 0.08;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops far below the road, so the slope falls away to Provence. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 600);
      position.setY(i * 2 + 1, p.height - 600);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    const riders = this.riders;
    if (riders) {
      this.climbers.forEach((c, i) => {
        const metres = loopMetres(c.offset + c.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(metres);
        const heading = c.speed > 0 ? 0 : Math.PI;
        // Climbers rock out of the saddle; descenders sit tucked.
        const rock = c.speed > 0 ? Math.sin(this.time * 4 + c.phase) * 0.12 : 0;
        c.bike.position.set(c.x, y, -metres);
        c.bike.rotation.set(0, heading, rock);
        const lift = c.speed > 0 ? Math.max(0, Math.sin(this.time * 0.4 + c.phase)) * 0.12 : -0.05;
        riders.set(
          i,
          c.x,
          y + 0.2 + lift,
          -metres,
          heading,
          0.95,
          Math.abs(Math.sin(this.time * 4 + c.phase)) * 0.03,
        );
      });
      riders.commit();
    }
    const crowd = this.crowd;
    if (crowd) {
      this.fans.forEach((f, i) => {
        const metres = loopMetres(f.offset, s, LOOP, BEHIND);
        const hop = Math.max(0, Math.sin(this.time * 6 + f.phase)) * 0.12;
        const y = heightAt(metres);
        crowd.set(i, f.x, y + hop, -metres, (Math.PI / 2) * Math.sign(f.x), 0.95, 0);
        f.flag?.position.set(f.x - Math.sign(f.x) * 0.4, y + 1.6 + hop, -metres);
      });
      crowd.commit();
    }
    // The summit and the plains keep their bearing as the road climbs.
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The white scree rising on the right, the low wall and the drop on the left. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const scree = this.material({ map: this.repeat(screeTexture(), 6, 6), roughness: 1 });
    const far = this.material({
      map: this.repeat(screeTexture(), 40, 40),
      color: 0xd8d4cc,
      roughness: 1,
    });
    const wall = this.material({ map: this.repeat(wallTexture(), 1.6, 1.6), roughness: 0.95 });
    const verge = this.material({ color: 0xbdb8ae, roughness: 1 });
    this.ribbons.add(points, far, [
      [r + 400, 140],
      [r + 120, 50],
    ]);
    this.ribbons.add(points, scree, [
      [r + 120, 50],
      [r + 40, 14],
      [r + 10, 2.4],
      [r + 1.2, 0.15],
    ]);
    this.ribbons.add(points, verge, [
      [r + 1.2, 0.15],
      [r, 0.004],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.004],
      [-r - 0.8, 0.04],
    ]);
    // The low dry-stone wall at the edge of the drop.
    this.ribbons.add(points, wall, [
      [-r - 0.8, 0.04],
      [-r - 0.8, 0.7],
      [-r - 1.3, 0.75],
      [-r - 1.3, 0],
    ]);
    this.ribbons.add(points, scree, [
      [-r - 1.3, 0],
      [-r - 30, -14],
      [-r - 120, -60],
    ]);
    this.ribbons.add(points, far, [
      [-r - 120, -60],
      [-r - 1400, -640],
    ]);
  }

  /** Loose limestone blocks littering the slopes, merged into tiles. */
  private addScree(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(screeTexture(), 1, 1),
      color: 0xf0ece4,
      roughness: 1,
    });
    const tiles = [0, 1, 2].map((k) => {
      const random = seeded(701 + k);
      const parts: BufferGeometry[] = [];
      for (let i = 0; i < 40; i++) {
        const rock = new IcosahedronGeometry(0.2 + random() ** 2 * 1.2, 0);
        rock.scale(1, 0.6, 1);
        rock.rotateY(random() * 3);
        const right = random() < 0.65;
        const d = 1.5 + random() * 35;
        // Sit each rock on its slope: rising 0.35 per metre on the right, falling 0.47 on the left.
        const x = right ? roadHalf + d : -roadHalf - 1.3 - d;
        const y = right ? Math.min(d * 0.33, 14) : -d * 0.47;
        rock.translate(x, y, -random() * 50);
        parts.push(rock);
      }
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(merged);
      return merged;
    });
    for (let offset = 0, k = 0; offset < LOOP; offset += 50, k++) {
      const tile = new Group();
      tile.add(new Mesh(tiles[k % 3]!, stone));
      tile.children[0]!.castShadow = true;
      this.group.add(tile);
      this.props.push({ mesh: tile, offset, x: 0 });
    }
  }

  /** The bornes: white roadside posts with red caps and the distance to the summit. */
  private addBornes(roadHalf: number): void {
    const post = new BoxGeometry(0.35, 0.8, 0.22);
    post.translate(0, 0.4, 0);
    const cap = new CylinderGeometry(0.175, 0.175, 0.22, 12, 1, false, 0, Math.PI);
    cap.rotateZ(Math.PI / 2);
    cap.rotateY(Math.PI / 2);
    cap.translate(0, 0.8, 0);
    this.disposables.push(post, cap);
    const red = this.material({ color: 0xc8102e, roughness: 0.6 });
    for (let offset = 20, km = 6; offset < LOOP; offset += 100, km--) {
      const face = this.material({
        map: this.track(borneTexture(Math.max(km, 1))),
        roughness: 0.7,
      });
      const borne = new Group();
      const body = new Mesh(post, face);
      body.castShadow = true;
      borne.add(body, new Mesh(cap, red));
      borne.rotation.y = 0.5;
      this.group.add(borne);
      this.props.push({ mesh: borne, offset, x: roadHalf + 0.9 });
    }
  }

  /** Fans' words painted across the road in white, reading up the climb. */
  private addPaint(roadHalf: number): void {
    const plane = new PlaneGeometry(roadHalf * 1.4, roadHalf * 0.35);
    plane.rotateX(-Math.PI / 2);
    this.disposables.push(plane);
    WORDS.forEach((word, k) => {
      const material = this.material({
        map: this.track(paintTexture(word)),
        transparent: true,
        roughness: 0.8,
        depthWrite: false,
      });
      const painted = new Group();
      const mesh = new Mesh(plane, material);
      mesh.position.y = 0.02;
      mesh.rotation.y = (k % 2 ? 1 : -1) * 0.06;
      painted.add(mesh);
      this.group.add(painted);
      this.props.push({ mesh: painted, offset: 35 + k * PAINT, x: (k % 3) - 1, lies: true });
    });
  }

  /** Stunted cedars and box shrubs bent by the mistral, clinging to the scree. */
  private addCedars(roadHalf: number): void {
    const random = seeded(709);
    const bark = this.material({ color: 0x4a3c30, roughness: 1 });
    const needles = this.material({ color: 0x3f5a3a, roughness: 0.95 });
    const box = this.material({ color: 0x6a7a48, roughness: 1 });
    const trunk = new CylinderGeometry(0.1, 0.18, 2.2, 6);
    trunk.translate(0, 1.1, 0);
    const crown = new ConeGeometry(1.1, 2.6, 7);
    crown.translate(0, 2.6, 0);
    const shrub = new IcosahedronGeometry(0.5, 1);
    shrub.scale(1.4, 0.6, 1);
    this.disposables.push(trunk, crown, shrub);
    for (let offset = 5; offset < LOOP; offset += 12 + random() * 20) {
      const right = random() < 0.6;
      const d = 4 + random() * 30;
      const x = right ? roadHalf + d : -roadHalf - 1.3 - d;
      const y = right ? Math.min(d * 0.33, 14) : -d * 0.47;
      const plant = new Group();
      if (random() < 0.45) {
        const tree = new Group();
        tree.add(new Mesh(trunk, bark), new Mesh(crown, needles));
        tree.position.y = y;
        // Bent away from the mistral, which blows down the valley from the north.
        tree.rotation.set(0.25, random() * 3, -0.2);
        tree.scale.setScalar(0.7 + random() * 0.6);
        tree.children.forEach((c) => (c.castShadow = true));
        plant.add(tree);
      } else {
        for (let k = 0; k < 3; k++) {
          const s = new Mesh(shrub, box);
          s.position.set((random() - 0.5) * 2, y + 0.15, (random() - 0.5) * 2);
          plant.add(s);
        }
      }
      this.group.add(plant);
      this.props.push({ mesh: plant, offset, x });
    }
  }

  /**
   * The Simpson memorial once a lap, up the bank on the right: a granite stele on its steps, with
   * the bidons, caps and flowers riders leave at its foot.
   */
  private addMemorial(roadHalf: number): void {
    const granite = this.material({ map: this.repeat(graniteTexture(), 1, 1), roughness: 0.6 });
    const plaque = this.material({ map: this.track(plaqueTexture()), roughness: 0.4 });
    const memorial = new Group();
    for (let k = 0; k < 3; k++) {
      const step = new Mesh(this.unit, granite);
      step.scale.set(3.6 - k * 0.8, 0.35, 2.6 - k * 0.6);
      step.position.y = 0.17 + k * 0.35;
      memorial.add(step);
    }
    const stele = new Mesh(this.unit, granite);
    stele.scale.set(1.3, 3.2, 0.45);
    stele.position.y = 2.7;
    const face = new Mesh(new PlaneGeometry(1.1, 2.4), plaque);
    this.disposables.push(face.geometry);
    face.position.set(0, 2.8, 0.23);
    memorial.add(stele, face);
    const random = seeded(719);
    const bidon = new CylinderGeometry(0.06, 0.06, 0.22, 8);
    this.disposables.push(bidon);
    const colours = [0xffd23f, 0xd62828, 0x1f5fbf, 0xf5f5f0, 0x2a7a4a].map((c) =>
      this.material({ color: c, roughness: 0.5 }),
    );
    for (let k = 0; k < 22; k++) {
      const b = new Mesh(bidon, colours[k % colours.length]!);
      b.position.set(
        (random() - 0.5) * 3,
        0.82 + (random() < 0.3 ? 0.35 : 0),
        0.6 + random() * 0.6,
      );
      b.rotation.z = random() < 0.3 ? Math.PI / 2 : 0;
      memorial.add(b);
    }
    memorial.children.forEach((c) => (c.castShadow = true));
    memorial.rotation.y = -Math.PI / 2;
    memorial.position.y = 0;
    const holder = new Group();
    holder.add(memorial);
    memorial.position.set(0, 2.2, 0);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: MEMORIAL, x: roadHalf + 7 });
  }

  /** Fans along the road, some waving flags the mistral snaps. */
  private addFans(roadHalf: number): void {
    const random = seeded(727);
    const flagGeometry = new PlaneGeometry(1.1, 0.7);
    flagGeometry.translate(0.55, 0, 0);
    const pole = new CylinderGeometry(0.02, 0.02, 1.6, 5);
    pole.translate(0, -0.45, 0);
    this.disposables.push(flagGeometry, pole);
    const flagMaterials = [
      flagTexture('#0055a4', '#ffffff', '#ef4135'),
      flagTexture('#ffd23f', '#d62828', '#ffd23f'),
      flagTexture('#000000', '#ffd23f', '#d62828'),
    ].map((t) => this.material({ map: this.track(t), side: DoubleSide, roughness: 0.8 }));
    const wood = this.material({ color: 0xd9d2c4, roughness: 0.8 });
    for (let offset = 8; offset < LOOP; offset += 7 + random() * 14) {
      const right = random() < 0.7;
      let flag: Mesh | null = null;
      if (random() < 0.5) {
        const holder = new Group();
        flag = new Mesh(flagGeometry, flagMaterials[Math.floor(random() * 3)]!);
        holder.add(flag, new Mesh(pole, wood));
        this.group.add(holder);
        this.flags.push({ mesh: flag, phase: random() * 6 });
        this.fans.push({
          offset,
          x: right ? roadHalf + 1.6 : -roadHalf - 0.4,
          flag: holder as unknown as Mesh,
          phase: random() * 6,
        });
        continue;
      }
      this.fans.push({
        offset,
        x: right ? roadHalf + 1.6 + random() : -roadHalf - 0.4,
        flag,
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.fans.length, FAN_WEAR, 733);
  }

  /** Fellow climbers grinding up, rocking out of the saddle, and others sweeping down. */
  private addClimbers(roadHalf: number): void {
    const random = seeded(739);
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
        speed: up ? 1.8 + random() * 1.2 : -(9 + random() * 3),
        phase: random() * 6.3,
      });
    }
    this.riders = new Figures(
      this.group,
      this.disposables,
      this.climbers.length,
      CLIMBER_WEAR,
      743,
    );
  }

  /**
   * The summit ahead: the bare white cone of the mountain's top with the weather station's
   * red-and-white tower on it, and the hazy Provence hills far below on the left.
   */
  private addSummit(): void {
    const white = this.material({
      map: this.repeat(screeTexture(), 30, 30),
      color: 0xeeeae2,
      roughness: 1,
    });
    const station = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const banded = this.material({ map: this.track(bandTexture()), roughness: 0.6 });
    const hills = this.material({ color: 0x8a9aa8, roughness: 1 });
    const peak = new ConeGeometry(420, 240, 32, 1);
    peak.translate(0, 120, 0);
    const ridge = new ConeGeometry(260, 150, 24, 1);
    ridge.translate(0, 75, 0);
    const base = new CylinderGeometry(9, 10, 14, 16);
    base.translate(0, 7, 0);
    const mast = new CylinderGeometry(2.2, 3, 40, 16);
    mast.translate(0, 34, 0);
    const dome = new TorusGeometry(3.2, 0.6, 8, 16);
    dome.rotateX(Math.PI / 2);
    dome.translate(0, 50, 0);
    this.disposables.push(peak, ridge, base, mast, dome);
    const summit = new Group();
    summit.add(new Mesh(peak, white));
    const top = new Group();
    top.add(new Mesh(base, station), new Mesh(mast, banded), new Mesh(dome, station));
    top.position.y = 236;
    top.scale.setScalar(1.6);
    summit.add(top);
    summit.position.set(260, -40, -1400);
    const shoulder = new Mesh(ridge, white);
    shoulder.position.set(-260, -420, -1300);
    shoulder.scale.set(1.6, 3.2, 1.6);
    this.horizon.add(summit, shoulder);
    // Provence below on the left: low blue hills in the haze.
    const random = seeded(751);
    for (let k = 0; k < 14; k++) {
      const hill = new IcosahedronGeometry(1, 2);
      this.disposables.push(hill);
      const m = new Mesh(hill, hills);
      const a = -2.6 + random() * 1.6;
      const d = 1800 + random() * 1200;
      m.scale.set(300 + random() * 300, 90 + random() * 80, 300 + random() * 300);
      m.position.set(Math.cos(a) * d, -620, Math.sin(a) * d);
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

/** White limestone scree: pale grey-white chips and their shadows. */
function screeTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#e4e0d8', 757);
    const random = seeded(761);
    for (let i = 0; i < 500; i++) {
      const x = random() * 256;
      const y = random() * 256;
      const s = 2 + random() * 6;
      g.fillStyle = `rgba(120,115,105,${0.15 + random() * 0.25})`;
      g.fillRect(x + 1, y + 1, s, s * 0.7);
      g.fillStyle = `rgba(255,255,252,${0.3 + random() * 0.4})`;
      g.fillRect(x, y, s, s * 0.7);
    }
  });
}

/** A dry-stone wall of pale limestone. */
function wallTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#cfc8bb', 769);
    const random = seeded(773);
    g.strokeStyle = 'rgba(70,60,50,0.55)';
    g.lineWidth = 3;
    for (let y = 0; y < 256; y += 28 + random() * 10) {
      for (let x = random() * 30; x < 256; x += 30 + random() * 30)
        g.strokeRect(x, y, 30 + random() * 20, 26);
    }
  });
}

/** Polished dark granite. */
function graniteTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#4a4a50', 787));
}

/** The memorial's plaque: a rider's silhouette and its words. */
function plaqueTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    g.fillStyle = '#2e2e34';
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#d9c47a';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(40, 120, 22, 0, Math.PI * 2);
    g.arc(92, 120, 22, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(40, 120);
    g.lineTo(62, 90);
    g.lineTo(92, 120);
    g.moveTo(62, 90);
    g.lineTo(70, 62);
    g.stroke();
    g.beginPath();
    g.arc(74, 50, 9, 0, Math.PI * 2);
    g.fillStyle = '#d9c47a';
    g.fill();
    g.font = 'bold 15px serif';
    g.textAlign = 'center';
    g.fillText('IN MEMORY', 64, 180);
    g.fillText('OF A RIDER', 64, 200);
  });
}

/** A borne's white face with the distance to the summit and the gradient. */
function borneTexture(km: number): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#f5f5f0';
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = '#1b1b1f';
    g.textAlign = 'center';
    g.font = 'bold 13px sans-serif';
    g.fillText('SOMMET', 32, 40);
    g.font = 'bold 24px sans-serif';
    g.fillText(`${km} km`, 32, 72);
    g.font = 'bold 14px sans-serif';
    g.fillText('9 %', 32, 100);
  });
}

/** A word painted on the road in rough white letters, on clear ground. */
function paintTexture(word: string): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = 'rgba(250,250,245,0.9)';
    g.font = 'bold 84px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(word, 256, 66);
  });
}

/** A flag of three bands. */
function flagTexture(a: string, b: string, c: string): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    [a, b, c].forEach((colour, k) => {
      g.fillStyle = colour;
      g.fillRect(k * 32, 0, 32, 64);
    });
  });
}

/** The weather tower's red and white bands. */
function bandTexture(): CanvasTexture {
  return canvasTexture(16, 128, (g) => {
    for (let y = 0; y < 128; y += 16) {
      g.fillStyle = (y / 16) % 2 ? '#f5f5f0' : '#d62828';
      g.fillRect(0, y, 16, 16);
    }
  });
}
