// Hoover Dam, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the road over the
// dam's crest in the blazing desert sun. The rider rides between the dam's cream concrete
// parapets with their art deco lamp standards, visitors leaning on the wall to look down. On the
// right Lake Mead lies blue and still below the crest, the white "bathtub ring" left by the
// falling water banded along the canyon walls, and the four intake towers rise out of it, the
// Nevada pair carrying their clocks. On the left the dam's face falls two hundred metres into
// the Black Canyon to the green Colorado below, and downstream the concrete arch of the bypass
// bridge leaps the canyon high above the river. Beside the road the Winged Figures of the
// Republic sit on their black base. Dark volcanic canyon walls close in on both sides.
// Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  type Texture,
} from 'three/webgpu';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import { clockTexture, damFaceTexture, terrazzoTexture } from './hoover-textures';
import type { StreetPoint } from './world-oldtown';

/** The crest repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
/** The sidewalk's width, outside the road on each side, and the parapet beyond it. */
const WALK = 2.2;
const PARAPET = 0.5;
/** Lake Mead lies LAKE metres below the crest on the right. */
const LAKE = 14;
/** The Colorado runs RIVER metres below the crest on the left, at the foot of the dam's face. */
const RIVER = 200;

const VISITOR_WEAR = {
  tops: ['#f4f4f0', '#e85a3a', '#3a7ac8', '#f2c14e', '#6aa84f', '#d9d2c5', '#1d1f24'],
  bottoms: ['#2f3e5c', '#c9b48a', '#1d1f24', '#6b6f78'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class HooverStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly visitors: { offset: number; x: number; heading: number; scale: number }[] = [];
  private crowd: Figures | null = null;
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addCrest(roadHalf, points);
    this.addCanyon(roadHalf, points);
    this.addLamps(roadHalf);
    this.addTowers(roadHalf);
    this.addWingedFigures(roadHalf);
    this.addVisitors(roadHalf);
    this.addBridge();
  }

  setTime(): void {
    // Nothing on the crest moves on its own: the visitors stand at the wall, the lake is still.
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground drops into the canyon, so the river shows far below the crest. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - RIVER - 4);
      position.setY(i * 2 + 1, p.height - RIVER - 4);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.visitors.forEach((v, i) => {
        const metres = loopMetres(v.offset, s, LOOP, BEHIND);
        crowd.set(i, v.x, heightAt(metres) + 0.18, -metres, v.heading, v.scale, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The crest road, its raised sidewalks and the cream parapets on both sides. */
  private addCrest(roadHalf: number, points: number): void {
    const r = roadHalf;
    const w = r + WALK;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 8), roughness: 0.85 });
    const walk = this.material({ map: this.repeat(concreteTexture(), 2, 2), roughness: 0.9 });
    const parapet = this.material({
      map: this.repeat(parapetTexture(), 1, 3),
      roughness: 0.85,
      side: DoubleSide,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    // Each sidewalk: its kerb face, then its top out to the parapet.
    this.ribbons.add(points, walk, [
      [w, 0.18],
      [r, 0.18],
      [r, 0.012],
    ]);
    this.ribbons.add(points, walk, [
      [-r, 0.012],
      [-r, 0.18],
      [-w, 0.18],
    ]);
    // The parapets: inner face, coping and outer face, a little over a metre high.
    this.ribbons.add(points, parapet, [
      [w + PARAPET, -0.6],
      [w + PARAPET, 1.25],
      [w, 1.25],
      [w, 0.18],
    ]);
    this.ribbons.add(points, parapet, [
      [-w, 0.18],
      [-w, 1.25],
      [-w - PARAPET, 1.25],
      [-w - PARAPET, -0.6],
    ]);
  }

  /**
   * Lake Mead on the right, below the dam's upstream face, with the bathtub ring on the canyon
   * walls beyond; on the left the dam's face falls to the Colorado in the Black Canyon.
   */
  private addCanyon(roadHalf: number, points: number): void {
    const out = roadHalf + WALK + PARAPET;
    const face = this.material({ map: this.repeat(damFaceTexture(), 8, 40), roughness: 0.9 });
    const water = this.material({
      // Plain deep blue: any pattern, seen this edge-on, reads as rows.
      color: 0x2a5f8f,
      roughness: 0.55,
      metalness: 0.1,
    });
    const ring = this.material({
      map: this.repeat(bathtubTexture(), 40, 36),
      roughness: 1,
      flatShading: true,
    });
    const rock = this.material({
      map: this.repeat(rockTexture(), 30, 30),
      roughness: 1,
      flatShading: true,
    });
    const river = this.material({ color: 0x2f6a5a, roughness: 0.2, metalness: 0.2 });
    // Upstream: the face down to the water, the lake, and the ringed walls rising beyond it.
    // Kept narrow: on the inside of a bend the ribbons squeeze, and a wide lake folds.
    this.ribbons.add(points, rock, [
      [out + 130, 110],
      [out + 90, 22],
    ]);
    this.ribbons.add(points, ring, [
      [out + 90, 22],
      [out + 70, -LAKE + 0.2],
    ]);
    // Seen almost edge-on from the crest, the water takes no shadow, or it streaks.
    this.ribbons.add(points, water, [
      [out + 70, -LAKE],
      [out + 2, -LAKE],
    ]).receiveShadow = false;
    this.ribbons.add(points, face, [
      [out + 2, -LAKE - 0.5],
      [out, -0.6],
    ]);
    // Downstream: the dam's face sweeping down to the river, and the canyon's far wall.
    this.ribbons.add(points, face, [
      [-out, -0.6],
      [-out - 30, -RIVER * 0.45],
      [-out - 90, -RIVER],
    ]);
    this.ribbons.add(points, river, [
      [-out - 90, -RIVER],
      [-out - 150, -RIVER],
    ]);
    this.ribbons.add(points, rock, [
      [-out - 150, -RIVER],
      [-out - 260, -40],
      [-out - 420, 160],
    ]);
  }

  /** The art deco lamp standards on both parapets, every 24 m. */
  private addLamps(roadHalf: number): void {
    const bronze = this.material({ color: 0x5a4a32, roughness: 0.45, metalness: 0.7 });
    const glass = this.material({
      color: 0xf4ead0,
      emissive: 0xf4e2b0,
      emissiveIntensity: 0.25,
      roughness: 0.3,
    });
    const shaft = new CylinderGeometry(0.09, 0.14, 1, 8);
    const globe = new CylinderGeometry(0.22, 0.16, 0.6, 8);
    this.disposables.push(shaft, globe);
    const x = roadHalf + WALK + PARAPET / 2;
    for (let offset = 0; offset < LOOP; offset += 24)
      for (const side of [-1, 1]) {
        const lamp = new Group();
        const pole = new Mesh(shaft, bronze);
        pole.scale.y = 3.2;
        pole.position.y = 1.25 + 1.6;
        const head = new Mesh(globe, glass);
        head.position.y = 1.25 + 3.5;
        const cap = new Mesh(this.unit, bronze);
        cap.scale.set(0.5, 0.12, 0.5);
        cap.position.y = 1.25 + 3.86;
        lamp.add(pole, head, cap);
        lamp.children.forEach((m) => (m.castShadow = true));
        this.prop(lamp, offset + (side > 0 ? 0 : 12), side * x);
      }
  }

  /**
   * The four intake towers standing in the lake: tall fluted shafts with art deco crowns, the
   * Nevada pair carrying clock faces.
   */
  private addTowers(roadHalf: number): void {
    const concrete = this.material({ map: this.repeat(towerTexture(), 1, 2), roughness: 0.85 });
    const clock = this.material({ map: this.track(clockTexture()), roughness: 0.5 });
    const height = LAKE + 26;
    const place = (offset: number, x: number, clocks: boolean) => {
      const tower = new Group();
      const shaft = new Mesh(this.unit, concrete);
      shaft.scale.set(9, height, 9);
      shaft.position.y = -LAKE + height / 2;
      tower.add(shaft);
      // Buttress fins up each face, stepping in at the crown.
      for (const [fx, fz, sx, sz] of [
        [4.8, 0, 1.2, 2.4],
        [-4.8, 0, 1.2, 2.4],
        [0, 4.8, 2.4, 1.2],
        [0, -4.8, 2.4, 1.2],
      ] as const) {
        const fin = new Mesh(this.unit, concrete);
        fin.scale.set(sx, height - 4, sz);
        fin.position.set(fx, -LAKE + (height - 4) / 2, fz);
        tower.add(fin);
      }
      const crown = new Mesh(this.unit, concrete);
      crown.scale.set(7, 4, 7);
      crown.position.y = -LAKE + height + 2;
      const top = new Mesh(this.unit, concrete);
      top.scale.set(4.6, 2.4, 4.6);
      top.position.y = -LAKE + height + 5.2;
      tower.add(crown, top);
      if (clocks) {
        // Facing the road, so the rider reads the time as they pass.
        const face = new Mesh(this.unit, clock);
        face.scale.set(0.1, 3.6, 3.6);
        face.position.set(-5.5, -LAKE + height - 6, 0);
        tower.add(face);
      }
      tower.children.forEach((m) => (m.castShadow = true));
      this.prop(tower, offset, x);
    };
    const near = roadHalf + WALK + PARAPET + 22;
    place(60, near, true);
    place(100, near + 16, true);
    place(250, near + 4, false);
    place(290, near + 20, false);
  }

  /** The Winged Figures of the Republic: two bronze seated figures on a black diorite base. */
  private addWingedFigures(roadHalf: number): void {
    const diorite = this.material({ color: 0x1a1a1e, roughness: 0.25, metalness: 0.2 });
    const bronze = this.material({ color: 0x4a3a22, roughness: 0.4, metalness: 0.8 });
    const terrazzo = this.material({ map: this.track(terrazzoTexture()), roughness: 0.6 });
    const m = new Group();
    const plaza = new Mesh(this.unit, terrazzo);
    plaza.scale.set(9, 0.05, 9);
    plaza.position.y = 0.2;
    // The terrace the plaza stands on, built out from the crest over the dam's face.
    const terrace = this.material({ map: this.repeat(damFaceTexture(), 9, 40), roughness: 0.9 });
    const plinth = new Mesh(this.unit, terrace);
    plinth.scale.set(9, 40, 9);
    plinth.position.y = 0.17 - 20;
    m.add(plinth);
    const base = new Mesh(this.unit, diorite);
    base.scale.set(2.4, 3.2, 5);
    base.position.y = 1.8;
    m.add(plaza, base);
    for (const z of [-1.2, 1.2]) {
      const body = new Mesh(this.unit, bronze);
      body.scale.set(0.9, 2.4, 0.8);
      body.position.set(0, 4.6, z);
      const head = new Mesh(this.unit, bronze);
      head.scale.set(0.45, 0.5, 0.45);
      head.position.set(0, 6.05, z);
      // The wings sweep straight up behind each figure, far taller than the figure itself.
      const wing = new Mesh(this.unit, bronze);
      wing.scale.set(0.12, 7.5, 1.1);
      wing.position.set(0.3, 7.4, z * 1.35);
      m.add(body, head, wing);
    }
    const flagpole = new Mesh(this.unit, diorite);
    flagpole.scale.set(0.16, 14, 0.16);
    flagpole.position.set(-1.8, 7.2, 0);
    m.add(flagpole);
    m.children.forEach((c) => (c.castShadow = true));
    this.prop(m, 180, -(roadHalf + WALK + 5));
  }

  /** Visitors leaning on the parapets, most looking down into the canyon, some at the lake. */
  private addVisitors(roadHalf: number): void {
    const random = seeded(9401);
    const x = roadHalf + WALK - 0.45;
    for (let offset = 6; offset < LOOP; offset += 5 + random() * 14) {
      const side = random() < 0.6 ? -1 : 1;
      this.visitors.push({
        offset,
        x: side * x,
        // Facing the wall on their side, out over the drop or the water.
        heading: side > 0 ? -Math.PI / 2 : Math.PI / 2,
        scale: 0.9 + random() * 0.15,
      });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.visitors.length,
      VISITOR_WEAR,
      9407,
    );
  }

  /**
   * Downstream, the bypass bridge's twin concrete arch leaping the canyon high above the river,
   * its deck on slender columns, keeping its bearing ahead and to the left.
   */
  private addBridge(): void {
    const concrete = this.material({ color: 0xd8cfc0, roughness: 0.9 });
    const rock = this.material({ color: 0x5a3e30, roughness: 1, flatShading: true });
    const span = 320;
    const rise = 85;
    const deck = 70;
    const bridge = new Group();
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * 2 - 1;
      const b = ((i + 1) / segments) * 2 - 1;
      const ya = rise * (1 - a * a);
      const yb = rise * (1 - b * b);
      const xa = (a * span) / 2;
      const xb = (b * span) / 2;
      const rib = new Mesh(this.unit, concrete);
      const length = Math.hypot(xb - xa, yb - ya);
      rib.scale.set(length + 0.6, 7, 14);
      rib.position.set((xa + xb) / 2, (ya + yb) / 2 - RIVER + 40, 0);
      rib.rotation.z = Math.atan2(yb - ya, xb - xa);
      bridge.add(rib);
      // A column from the arch up to the deck every other segment.
      if (i % 2 === 0) {
        const top = deck;
        const foot = ya - RIVER + 40;
        const column = new Mesh(this.unit, concrete);
        column.scale.set(4, top - foot, 10);
        column.position.set(xa, (top + foot) / 2, 0);
        bridge.add(column);
      }
    }
    const road = new Mesh(this.unit, concrete);
    road.scale.set(span * 1.5, 5, 24);
    road.position.y = deck + 2.5;
    bridge.add(road);
    // The canyon's shoulders the arch springs from.
    for (const side of [-1, 1]) {
      const cliff = new Mesh(this.unit, rock);
      cliff.scale.set(260, RIVER + deck, 120);
      cliff.position.set((side * (span + 260)) / 2, (deck - RIVER) / 2, 0);
      bridge.add(cliff);
    }
    // Across the canyon ahead, turned so its span crosses the rider's view.
    bridge.position.set(-160, 0, -1000);
    bridge.rotation.y = 0.25;
    this.horizon.add(bridge);
    // Dark volcanic peaks closing the canyon in beyond, jagged and bare.
    const random = seeded(9411);
    const peak = new ConeGeometry(1, 1, 6, 2);
    this.disposables.push(peak);
    const shades = [0x5a3e30, 0x4a3428, 0x6a4a38].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    for (let k = 0; k < 14; k++) {
      const ridge = new Mesh(peak, shades[k % shades.length]!);
      const w = 260 + random() * 360;
      const h = 180 + random() * 260;
      ridge.scale.set(w, h, w * 0.8);
      ridge.position.set(-2400 + k * 380 + random() * 140, h / 2 - 80, -2300 - random() * 1200);
      ridge.rotation.y = random() * 3;
      this.horizon.add(ridge);
    }
    this.group.add(this.horizon);
  }

  private prop(mesh: Group, offset: number, x: number): void {
    const holder = new Group();
    holder.add(mesh);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset, x });
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

/** The crest road's sun-bleached asphalt, double yellow down the middle. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#55524e', 9421);
    g.fillStyle = 'rgba(230,180,40,0.9)';
    g.fillRect(58, 0, 3, 128);
    g.fillRect(67, 0, 3, 128);
    g.fillStyle = 'rgba(240,238,230,0.85)';
    g.fillRect(4, 0, 3, 128);
    g.fillRect(121, 0, 3, 128);
  });
}

/** The sidewalk's pale concrete, scored into slabs. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#d8cdb8', 9431);
    g.fillStyle = 'rgba(90,80,60,0.35)';
    g.fillRect(0, 62, 64, 2);
  });
}

/** The parapet's cream concrete, its panels framed by shallow art deco reveals. */
function parapetTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#e2d6bc', 9441);
    g.fillStyle = 'rgba(120,100,70,0.3)';
    g.fillRect(0, 0, 3, 128);
    g.fillRect(61, 0, 3, 128);
    g.fillRect(0, 20, 64, 2);
  });
}

/**
 * The canyon wall above the lake: the white mineral "bathtub ring" the falling water left,
 * banded above the waterline, darkening into the brown volcanic rock above it.
 */
function bathtubTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    const band = g.createLinearGradient(0, 0, 0, 128);
    band.addColorStop(0, '#6a4a38');
    band.addColorStop(0.45, '#8a6a52');
    band.addColorStop(0.55, '#e8e2d4');
    band.addColorStop(1, '#f4f0e6');
    g.fillStyle = band;
    g.fillRect(0, 0, 64, 128);
    const random = seeded(9471);
    g.fillStyle = 'rgba(160,150,135,0.35)';
    for (let y = 70; y < 128; y += 6 + random() * 6) g.fillRect(0, y, 64, 1);
  });
}

/** The Black Canyon's dark, rust-stained volcanic rock. */
function rockTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a3e30', 9481);
    const random = seeded(9483);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = ['#3a2820', '#7a5240', '#4a3a34'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 2 + random() * 6, 2 + random() * 4);
    }
  });
}

/** An intake tower's fluted concrete, its vertical reeds catching the sun. */
function towerTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#ddd1b6', 9491);
    g.fillStyle = 'rgba(110,95,70,0.3)';
    for (let x = 4; x < 64; x += 8) g.fillRect(x, 0, 2, 128);
  });
}
