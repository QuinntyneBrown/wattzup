// Marina Bay Night's loop, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Singapore's
// waterfront on a warm night. The rider takes the bayfront boulevard; on the left a promenade and
// its glass railing give onto the bay, black water streaked with the skyline's reflections, and
// across it the city's towers stand lit window by window, Marina Bay Sands' three towers carry
// their ship along the sky, and the Singapore Flyer turns in its ring of light. On the right the
// Supertrees of Gardens by the Bay rise from the gardens, their canopies glowing violet and pink
// and changing colour slowly, a skyway strung between them. Lamps line the road, strollers walk
// the promenade, and once a lap the Merlion spouts into the bay. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The boulevard repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
const KERB = 0.12;
/** The bay-side promenade, the drop to the water, and the gardens' verge on the right. */
const PROMENADE = 7;
const WATER = 1.6;
const VERGE = 6;
/** The Merlion once a lap; a lamp every LAMP metres. */
const MERLION = 200;
const LAMP = 24;

const STROLLER_WEAR = {
  tops: ['#ffffff', '#ff6b5a', '#2ec4b6', '#ffd23f', '#1d1f24', '#f15bb5', '#3a86ff', '#e8e4dc'],
  bottoms: ['#1d1f24', '#2f3e5c', '#e8c9a0', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Stroller {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

export class MarinaBayStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly strollers: Stroller[] = [];
  private people: Figures | null = null;
  private readonly canopies: MeshStandardMaterial[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private wheel: Group | null = null;
  private ripples: Texture | null = null;
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
    this.addBayfront(roadHalf, points);
    this.addGardens(roadHalf, points);
    this.addSupertrees(roadHalf);
    this.addLamps(roadHalf);
    this.addMerlion(roadHalf);
    this.addStrollers(roadHalf);
    this.addSkyline();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.ripples) this.ripples.offset.y = seconds * 0.01;
    // The Supertrees' canopies drift through violet, pink and blue.
    this.canopies.forEach((m, k) => {
      const hue = 0.78 + 0.12 * Math.sin(seconds * 0.25 + k * 0.9);
      m.emissive.setHSL(hue % 1, 0.85, 0.5);
    });
    if (this.wheel) this.wheel.rotation.z = seconds * 0.02;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the bay, so the water lies over it. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - WATER - 1);
      position.setY(i * 2 + 1, p.height - WATER - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const people = this.people;
    if (people) {
      this.strollers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04;
        const heading = w.speed > 0 ? 0 : Math.PI;
        people.set(i, w.x, heightAt(metres) + KERB, -metres, heading, 0.95, step);
      });
      people.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The promenade, its glass railing, the quay's edge and the bay. */
  private addBayfront(roadHalf: number, points: number): void {
    const r = roadHalf;
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.6 });
    const glass = this.material({
      color: 0x8ad8ff,
      emissive: 0x2a6a8a,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.2,
      roughness: 0.1,
      side: 2,
    });
    const quay = this.material({ color: 0x3a3a40, roughness: 0.8 });
    const ripples = this.repeat(waterTexture(), 40, 30);
    this.ripples = ripples;
    const water = this.material({
      map: ripples,
      emissiveMap: ripples,
      emissive: 0xffffff,
      emissiveIntensity: 0.7,
      roughness: 0.08,
      metalness: 0.4,
    });
    const edge = -r - PROMENADE;
    this.ribbons.add(points, paving, [
      [-r, 0.006],
      [-r - 0.1, KERB],
      [edge, KERB],
    ]);
    this.ribbons.add(points, glass, [
      [edge, KERB],
      [edge, 1.1],
    ]);
    this.ribbons.add(points, quay, [
      [edge, KERB],
      [edge - 0.3, KERB],
      [edge - 0.3, -WATER],
    ]);
    this.ribbons.add(points, water, [
      [edge - 0.3, -WATER],
      [edge - 1500, -WATER],
    ]);
  }

  /** The right-hand pavement and the gardens' dark lawns beyond it. */
  private addGardens(roadHalf: number, points: number): void {
    const r = roadHalf;
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.6 });
    const lawn = this.material({ map: this.repeat(lawnTexture(), 4, 4), roughness: 1 });
    this.ribbons.add(points, paving, [
      [r + VERGE, KERB],
      [r + 0.1, KERB],
      [r, 0.006],
    ]);
    this.ribbons.add(points, lawn, [
      [r + 400, 2],
      [r + VERGE, KERB],
    ]);
  }

  /**
   * The Supertrees: tall steel trunks wrapped in planting, flaring to lattice canopies that glow
   * and change colour, with the skyway strung between the tallest.
   */
  private addSupertrees(roadHalf: number): void {
    const random = seeded(1601);
    const trunkMat = this.material({
      map: this.track(trunkTexture()),
      emissive: 0x3a1a5a,
      emissiveIntensity: 0.5,
      roughness: 0.8,
    });
    const steel = this.material({ color: 0x2a2a34, metalness: 0.6, roughness: 0.4 });
    const walkway = this.material({ color: 0x2a2a34, emissive: 0xffe0a0, emissiveIntensity: 0.6 });
    const trunk = new CylinderGeometry(1.2, 2.2, 1, 10, 1);
    trunk.translate(0, 0.5, 0);
    const flare = new CylinderGeometry(1, 0.15, 1, 16, 1, true);
    flare.translate(0, 0.5, 0);
    const ring = new TorusGeometry(1, 0.03, 4, 32);
    ring.rotateX(Math.PI / 2);
    this.disposables.push(trunk, flare, ring);
    const grove = new Group();
    const trees: { x: number; z: number; h: number }[] = [];
    for (let k = 0; k < 12; k++) {
      const h = 26 + random() * 24;
      const x = 30 + random() * 120;
      const z = -40 - k * 30 - random() * 20;
      trees.push({ x, z, h });
      const tree = new Group();
      const t = new Mesh(trunk, trunkMat);
      t.scale.set(1, h, 1);
      const canopyMat = this.material({
        color: 0x1a1020,
        emissive: new Color(0xb04aff),
        emissiveIntensity: 1.4,
        roughness: 0.6,
        side: 2,
      });
      this.canopies.push(canopyMat);
      const c = new Mesh(flare, canopyMat);
      const w = 6 + h * 0.18;
      c.scale.set(w, 6, w);
      c.position.y = h;
      tree.add(t, c);
      for (let j = 0; j < 3; j++) {
        const rim = new Mesh(ring, canopyMat);
        const rr = w * (0.45 + j * 0.27);
        rim.scale.set(rr, 1, rr);
        rim.position.y = h + 1.2 + j * 1.9;
        tree.add(rim);
      }
      tree.position.set(x, 0, z);
      grove.add(tree);
    }
    // The skyway: a lit walkway hung between the tallest trees.
    trees.sort((a, b) => b.h - a.h);
    const [a, b] = [trees[0]!, trees[1]!];
    const span = new Mesh(this.unit, walkway);
    const length = Math.hypot(a.x - b.x, a.z - b.z);
    span.scale.set(1.6, 0.4, length);
    span.position.set((a.x + b.x) / 2, Math.min(a.h, b.h) * 0.75, (a.z + b.z) / 2);
    span.rotation.y = Math.atan2(a.x - b.x, a.z - b.z);
    const rail = new Mesh(this.unit, steel);
    rail.scale.set(1.8, 0.1, length);
    rail.position.copy(span.position);
    rail.position.y += 1;
    rail.rotation.copy(span.rotation);
    grove.add(span, rail);
    grove.position.x = roadHalf;
    this.horizon.add(grove);
  }

  /** Lamps along both kerbs: slim posts with warm lanterns, and the trees' palms between them. */
  private addLamps(roadHalf: number): void {
    const iron = this.material({ color: 0x2a2a30, metalness: 0.5, roughness: 0.4 });
    const glow = this.material({ color: 0xfff0d0, emissive: 0xffd08a, emissiveIntensity: 2.2 });
    const bark = this.material({ color: 0x5a4a3a, roughness: 0.95 });
    const fronds = this.material({ color: 0x2a4a2a, emissive: 0x0a2a1a, emissiveIntensity: 0.4 });
    const post = new CylinderGeometry(0.07, 0.1, 6, 6);
    post.translate(0, 3, 0);
    const lantern = new SphereGeometry(0.35, 10, 8);
    lantern.translate(0, 6.2, 0);
    const trunk = new CylinderGeometry(0.15, 0.25, 8, 6);
    trunk.translate(0, 4, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 10; k++) {
      const frond = new ConeGeometry(0.35, 2.8, 4);
      frond.scale(1, 1, 0.2);
      frond.translate(0, 1.4, 0);
      frond.rotateZ(1.3 + (k % 2) * 0.3);
      frond.rotateY((k / 10) * Math.PI * 2);
      frond.translate(0, 8, 0);
      parts.push(frond);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(post, lantern, trunk, crown);
    for (let offset = 0; offset < LOOP; offset += LAMP) {
      for (const side of [-1, 1] as const) {
        const lamp = new Group();
        lamp.add(new Mesh(post, iron), new Mesh(lantern, glow));
        this.group.add(lamp);
        this.props.push({ mesh: lamp, offset, x: side * (roadHalf + 0.6) });
        const palm = new Group();
        palm.add(new Mesh(trunk, bark), new Mesh(crown, fronds));
        palm.rotation.y = offset;
        this.group.add(palm);
        this.props.push({
          mesh: palm,
          offset: offset + LAMP / 2,
          x: side * (roadHalf + (side < 0 ? 3 : 3.5)),
        });
      }
    }
  }

  /** The Merlion on the quay once a lap: lion's head, fish's body, spouting into the bay. */
  private addMerlion(roadHalf: number): void {
    const white = this.material({ color: 0xf4f2ec, emissive: 0x8aa0c0, emissiveIntensity: 0.5 });
    const spout = this.material({
      color: 0xd8f0ff,
      emissive: 0x8ad0ff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
    });
    const merlion = new Group();
    const plinth = new Mesh(this.unit, white);
    plinth.scale.set(4, 1.5, 4);
    plinth.position.y = 0.75;
    const body = new Mesh(new CylinderGeometry(0.9, 1.5, 5, 10), white);
    body.position.y = 4;
    const head = new Mesh(new SphereGeometry(1.4, 12, 10), white);
    head.position.y = 7.4;
    const mane = new Mesh(new ConeGeometry(1.7, 2, 10), white);
    mane.position.y = 6.4;
    const jet = new Mesh(new CylinderGeometry(0.15, 0.4, 9, 6), spout);
    jet.rotation.z = Math.PI / 2 - 0.3;
    jet.position.set(-4.5, 6, 0);
    this.disposables.push(body.geometry, head.geometry, mane.geometry, jet.geometry);
    merlion.add(plinth, body, head, mane, jet);
    this.group.add(merlion);
    this.props.push({ mesh: merlion, offset: MERLION, x: -roadHalf - PROMENADE + 1.5 });
  }

  /** Strollers along the promenade and the pavement, both ways. */
  private addStrollers(roadHalf: number): void {
    const random = seeded(1607);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 4) {
      const bay = random() < 0.65;
      this.strollers.push({
        offset,
        x: bay ? -roadHalf - 1.5 - random() * (PROMENADE - 2.5) : roadHalf + 1.5 + random() * 3,
        speed: (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5),
        phase: random() * 6,
      });
    }
    this.people = new Figures(
      this.group,
      this.disposables,
      this.strollers.length,
      STROLLER_WEAR,
      1609,
    );
  }

  /**
   * Across the bay: the city's towers lit window by window, Marina Bay Sands' three towers and
   * their ship, the ArtScience Museum's lotus, and the Singapore Flyer turning.
   */
  private addSkyline(): void {
    const random = seeded(1613);
    const windows = this.track(windowTexture());
    windows.wrapS = RepeatWrapping;
    windows.wrapT = RepeatWrapping;
    for (let k = 0; k < 26; k++) {
      const w = 30 + random() * 40;
      const h = 90 + random() * 180;
      const map = windows.clone();
      map.repeat.set(w / 12, h / 12);
      map.needsUpdate = true;
      this.track(map);
      const tower = new Mesh(
        this.unit,
        this.material({
          color: 0x14161e,
          emissiveMap: map,
          emissive: 0xffffff,
          emissiveIntensity: 0.9,
          roughness: 0.4,
        }),
      );
      tower.scale.set(w, h, w);
      tower.position.set(-680 - random() * 600, h / 2 - 10, -650 - k * 60 - random() * 30);
      this.horizon.add(tower);
    }
    // Marina Bay Sands: three leaning towers and the SkyPark ship across their tops.
    const sandsMap = windows.clone();
    sandsMap.repeat.set(4, 16);
    sandsMap.needsUpdate = true;
    this.track(sandsMap);
    const sands = this.material({
      color: 0x1a1c24,
      emissiveMap: sandsMap,
      emissive: 0xfff0d0,
      emissiveIntensity: 1,
    });
    const ship = this.material({ color: 0x1a1c24, emissive: 0xc8e0ff, emissiveIntensity: 0.8 });
    const mbs = new Group();
    for (let k = 0; k < 3; k++) {
      const tower = new Mesh(this.unit, sands);
      tower.scale.set(40, 190, 22);
      tower.position.set(0, 95, k * 70);
      tower.rotation.x = 0;
      const lean = new Mesh(this.unit, sands);
      lean.scale.set(30, 180, 20);
      lean.position.set(22, 90, k * 70);
      lean.rotation.z = -0.12;
      mbs.add(tower, lean);
    }
    const park = new Mesh(this.unit, ship);
    park.scale.set(44, 8, 300);
    park.position.set(8, 196, 60);
    mbs.add(park);
    mbs.rotation.y = 0.5;
    mbs.position.set(-520, -10, -980);
    this.horizon.add(mbs);
    // The ArtScience Museum's lotus petals on the water's edge.
    const petal = new ConeGeometry(10, 26, 4);
    petal.rotateZ(Math.PI);
    this.disposables.push(petal);
    const lotus = this.material({ color: 0xe8e4dc, emissive: 0xb8c8e8, emissiveIntensity: 0.4 });
    for (let k = 0; k < 6; k++) {
      const p = new Mesh(petal, lotus);
      p.position.set(-300 + Math.cos(k) * 10, 14, -520 + k * 6);
      p.rotation.z = -0.6 + k * 0.08;
      this.horizon.add(p);
    }
    // The Singapore Flyer: a great lit ring on its legs.
    const flyer = new Group();
    const rim = new Mesh(
      new TorusGeometry(75, 1.2, 6, 64),
      this.material({ color: 0x1a1c24, emissive: 0x7ac8ff, emissiveIntensity: 1.6 }),
    );
    this.disposables.push(rim.geometry);
    const pod = new SphereGeometry(2.6, 8, 6);
    this.disposables.push(pod);
    const podMat = this.material({ color: 0x1a1c24, emissive: 0xfff0d0, emissiveIntensity: 1.2 });
    const wheel = new Group();
    wheel.add(rim);
    for (let k = 0; k < 28; k++) {
      const p = new Mesh(pod, podMat);
      const a = (k / 28) * Math.PI * 2;
      p.position.set(Math.cos(a) * 75, Math.sin(a) * 75, 0);
      wheel.add(p);
    }
    wheel.position.y = 95;
    this.wheel = wheel;
    const legs = this.material({ color: 0x2a2c34, roughness: 0.5 });
    for (const x of [-20, 20]) {
      const leg = new Mesh(this.unit, legs);
      leg.scale.set(3, 100, 3);
      leg.position.set(x, 45, 0);
      leg.rotation.z = x > 0 ? 0.2 : -0.2;
      flyer.add(leg);
    }
    flyer.add(wheel);
    flyer.rotation.y = 1.1;
    flyer.position.set(-520, -10, -1300);
    this.horizon.add(flyer);
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

/** Granite pavers in a running bond. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a6a70', 1619);
    g.fillStyle = 'rgba(20,20,24,0.4)';
    for (let y = 0; y < 128; y += 32) {
      g.fillRect(0, y, 128, 2);
      for (let x = (y / 32) % 2 ? 0 : 32; x < 128; x += 64) g.fillRect(x, y, 2, 32);
    }
  });
}

/** The bay at night: black water broken by long reflections of the skyline's lights. */
function waterTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#05070e';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(1621);
    const colours = ['255,210,140', '140,200,255', '200,120,255', '255,255,255'];
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${colours[Math.floor(random() * 4)]},${0.15 + random() * 0.45})`;
      g.fillRect(random() * 256, random() * 256, 1 + random() * 3, 6 + random() * 24);
    }
  });
}

/** The gardens' lawns in the dark. */
function lawnTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#1e3020', 1627));
}

/** A Supertree's trunk: planted panels over the steel frame. */
function trunkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#3a4a30', 1631);
    g.strokeStyle = 'rgba(180,120,255,0.5)';
    g.lineWidth = 2;
    for (let y = -64; y < 128; y += 16) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(64, y + 64);
      g.stroke();
    }
  });
}

/** Lit office windows: a grid, most lit warm or cool, some dark. */
function windowTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, 64, 64);
    const random = seeded(1637);
    for (let y = 2; y < 64; y += 8) {
      for (let x = 2; x < 64; x += 8) {
        const r = random();
        g.fillStyle = r < 0.3 ? '#0a0a10' : r < 0.7 ? '#ffd890' : '#a8d0ff';
        g.fillRect(x, y, 5, 5);
      }
    }
  });
}
