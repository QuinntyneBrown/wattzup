// Mount Etna's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the volcano's
// south face on a clear, windy afternoon. The rider climbs the road to the Rifugio Sapienza
// through the black lava fields: old flows lie heaped in jagged black ridges either side, the
// cinder verges are bare but for yellow broom and the odd stunted birch, snow lies in the
// hollows, and a house half-swallowed by a flow shows its roof above the rock. The rust-red
// cinder cones of the Silvestri craters rise beside the road with walkers on their rims, white
// 4x4 buses grind up to the summit tracks, and above it all the summit cone stands dark against
// the sky, its plume of white steam and grey ash drifting away on the wind. Behind and below,
// the slopes fall to the Ionian Sea. Built on the shared kit (world-kit.ts) on the pattern of
// Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
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

const WALKER_WEAR = {
  tops: ['#d8442a', '#2a6a9a', '#e8c040', '#1d1f24', '#f4f0e8', '#3a8a5a'],
  bottoms: ['#2f3e5c', '#1d1f24', '#5a5f69', '#8a7a64'],
  skins: ['#f0c8a0', '#c48a5f', '#e2b48c', '#f5d3b5'],
};

interface Puff {
  readonly mesh: Mesh;
  readonly phase: number;
  readonly drift: number;
}

export class EtnaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly buses: { mesh: Group; offset: number; speed: number }[] = [];
  private readonly puffs: Puff[] = [];
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
    this.addLavaFields(roadHalf, points);
    this.addFlows(roadHalf);
    this.addBroom(roadHalf);
    this.addBuriedHouse(roadHalf);
    this.addCraters(roadHalf);
    this.addBuses(roadHalf);
    this.addWalkers(roadHalf);
    this.addSummit();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The summit's plume rises, swells and drifts away east on the wind.
    for (const p of this.puffs) {
      const t = (((seconds * 0.02 + p.phase) % 1) + 1) % 1;
      p.mesh.position.set(
        -200 + t * 1400 * p.drift,
        1640 + t * 600 * (2 - p.drift),
        -4600 + t * 400,
      );
      p.mesh.scale.setScalar(90 + t * 260);
      (p.mesh.material as MeshStandardMaterial).opacity = 0.75 * (1 - t);
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops away below the lava fields, which fall towards the sea on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 90);
      position.setY(i * 2 + 1, p.height - 90);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    for (const b of this.buses) {
      const metres = loopMetres(b.offset + b.speed * this.time, s, LOOP, BEHIND);
      b.mesh.position.set(b.mesh.position.x, heightAt(metres), -metres);
      // Up or down, a bus sits on its four wheels on the ramp, not level through it.
      b.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04;
        crowd.set(i, w.x, heightAt(metres) + step, -metres, w.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The black cinder verges and the lava fields: rising to the right, falling away on the left. */
  private addLavaFields(roadHalf: number, points: number): void {
    const r = roadHalf;
    const cinder = this.material({ map: this.repeat(cinderTexture(), 2, 2), roughness: 1 });
    const lava = this.material({
      map: this.repeat(lavaTexture(), 10, 10),
      color: 0x8a8480,
      roughness: 1,
    });
    this.ribbons.add(points, cinder, [
      [r + 4, 0.1],
      [r, 0.02],
    ]);
    this.ribbons.add(points, lava, [
      [r + 400, 60],
      [r + 60, 7],
      [r + 4, 0.1],
    ]);
    this.ribbons.add(points, cinder, [
      [-r, 0.02],
      [-r - 4, 0.0],
    ]);
    this.ribbons.add(points, lava, [
      [-r - 4, 0.0],
      [-r - 60, -6],
      [-r - 500, -80],
    ]);
  }

  /** Old flows heaped in jagged black ridges and blocks, snow lying in the hollows between. */
  private addFlows(roadHalf: number): void {
    const random = seeded(3301);
    const rock = this.material({
      map: this.track(lavaTexture()),
      color: 0x5a5450,
      roughness: 1,
      flatShading: true,
    });
    const snow = this.material({ color: 0xf4f6f8, roughness: 0.8 });
    const block = new DodecahedronGeometry(1, 0);
    const drift = new SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(block, drift);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 4) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 4.5 + random() * 40;
      const heap = new Group();
      for (let k = 0; k < 3; k++) {
        const b = new Mesh(block, rock);
        b.scale.set(1 + random() * 2.5, 0.6 + random() * 1.4, 1 + random() * 2.5);
        b.position.set((random() - 0.5) * 3, 0.2, (random() - 0.5) * 3);
        b.rotation.set(random() * 3, random() * 3, random() * 3);
        b.castShadow = true;
        heap.add(b);
      }
      if (random() < 0.3) {
        const s = new Mesh(drift, snow);
        s.scale.set(2 + random() * 3, 0.4, 1.5 + random() * 2);
        s.position.set(2.5, -0.1, 0);
        heap.add(s);
      }
      heap.position.y = side > 0 ? (d / 56) * 7 : -(d / 56) * 6;
      const holder = new Group();
      holder.add(heap);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** Yellow-flowering broom and the odd stunted birch on the cinder. */
  private addBroom(roadHalf: number): void {
    const random = seeded(3311);
    const yellow = this.material({ color: 0xf0c020, roughness: 0.9, flatShading: true });
    const green = this.material({ color: 0x5a7a2a, roughness: 1, flatShading: true });
    const white = this.material({ color: 0xe8e4dc, roughness: 0.9 });
    const leaves = this.material({ color: 0x8aa040, roughness: 1, flatShading: true });
    const bush = new DodecahedronGeometry(0.7, 0);
    const stem = new CylinderGeometry(0.08, 0.14, 4, 5);
    stem.translate(0, 2, 0);
    const crown = new DodecahedronGeometry(1.4, 0);
    this.disposables.push(bush, stem, crown);
    for (let offset = 0; offset < LOOP; offset += 1.5 + random() * 3) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 1 + random() * 14;
      const plant = new Group();
      if (random() < 0.88) {
        const b = new Mesh(bush, random() < 0.7 ? yellow : green);
        b.scale.set(1 + random(), 0.6 + random() * 0.5, 1 + random());
        b.position.y = 0.3;
        plant.add(b);
      } else {
        const c = new Mesh(crown, leaves);
        c.position.y = 4.2;
        plant.add(new Mesh(stem, white), c);
      }
      plant.children.forEach((c) => (c.castShadow = true));
      plant.position.y = side > 0 ? (d / 56) * 7 : -(d / 56) * 6;
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** A house swallowed by an old flow, its upper storey and roof above the rock. */
  private addBuriedHouse(roadHalf: number): void {
    const wall = this.material({ color: 0xe8d8b8, roughness: 0.9 });
    const tiles = this.material({ color: 0x9a4a2a, roughness: 0.8 });
    const dark = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const rock = this.material({
      map: this.track(lavaTexture()),
      color: 0x4a4440,
      roughness: 1,
      flatShading: true,
    });
    const hip = new ConeGeometry(1, 1, 4);
    hip.rotateY(Math.PI / 4);
    const block = new DodecahedronGeometry(1, 0);
    this.disposables.push(hip, block);
    for (const offset of [70, 270]) {
      const house = new Group();
      const body = new Mesh(this.unit, wall);
      body.scale.set(8, 3, 10);
      body.position.y = 1.5;
      const roof = new Mesh(hip, tiles);
      roof.scale.set(6.4, 2.4, 7.8);
      roof.position.y = 4.2;
      roof.rotation.z = 0.12;
      for (const z of [-2.5, 2.5]) {
        const window = new Mesh(this.unit, dark);
        window.scale.set(0.2, 1.2, 1);
        window.position.set(-4, 1.8, z);
        house.add(window);
      }
      house.add(body, roof);
      for (let k = 0; k < 7; k++) {
        const b = new Mesh(block, rock);
        b.scale.set(3 + k * 0.3, 1.6, 3);
        b.position.set(-5 + (k % 3) * 4, 0.2, -6 + Math.floor(k / 3) * 6);
        b.rotation.set(k, k * 2, k * 3);
        house.add(b);
      }
      house.children.forEach((c) => (c.castShadow = true));
      house.position.y = 1.6;
      house.rotation.y = 0.2;
      const holder = new Group();
      holder.add(house);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 15 });
    }
  }

  /** The Silvestri craters: rust-red cinder cones with hollow tops beside the road. */
  private addCraters(roadHalf: number): void {
    const rust = this.material({ map: this.repeat(scoriaTexture(), 4, 4), roughness: 1 });
    const rim = this.material({ color: 0x3a2a24, roughness: 1 });
    const cone = new CylinderGeometry(0.42, 1, 1, 24, 1, true);
    const pit = new CylinderGeometry(0.42, 0.42, 0.02, 24);
    this.disposables.push(cone, pit);
    for (const [offset, x, w, h] of [
      [150, -1, 70, 30],
      [330, 1, 90, 38],
    ] as const) {
      const crater = new Group();
      const c = new Mesh(cone, rust);
      c.scale.set(w, h, w);
      c.position.y = h / 2 - 4;
      const p = new Mesh(pit, rim);
      p.scale.set(w * 0.98, 1, w * 0.98);
      p.position.y = h - 4.5;
      crater.add(c, p);
      const holder = new Group();
      holder.add(crater);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: x * (roadHalf + 14 + w) });
    }
  }

  /** The white 4x4 buses grinding up the road to the summit tracks. */
  private addBuses(roadHalf: number): void {
    const white = this.material({ color: 0xf2f2ee, roughness: 0.5 });
    const glass = this.material({ color: 0x2a3440, roughness: 0.2, metalness: 0.4 });
    const tyre = this.material({ color: 0x1a1a1a, roughness: 0.9 });
    const stripe = this.material({ color: 0xd8442a, roughness: 0.6 });
    const wheel = new CylinderGeometry(0.55, 0.55, 0.4, 10);
    wheel.rotateZ(Math.PI / 2);
    this.disposables.push(wheel);
    for (const [offset, speed, x] of [
      [60, 4, 1],
      [240, -6, -1],
    ] as const) {
      const bus = new Group();
      const body = new Mesh(this.unit, white);
      body.scale.set(2.4, 2.4, 6.5);
      body.position.y = 1.9;
      const band = new Mesh(this.unit, stripe);
      band.scale.set(2.42, 0.3, 6.52);
      band.position.y = 1.3;
      const windows = new Mesh(this.unit, glass);
      windows.scale.set(2.44, 0.8, 5.6);
      windows.position.y = 2.4;
      bus.add(body, band, windows);
      for (const [wx, wz] of [
        [-1.2, -2.2],
        [1.2, -2.2],
        [-1.2, 2.2],
        [1.2, 2.2],
      ] as const) {
        const w = new Mesh(wheel, tyre);
        w.position.set(wx, 0.55, wz);
        bus.add(w);
      }
      bus.children.forEach((c) => (c.castShadow = true));
      bus.position.x = x * (roadHalf - 1.6);
      bus.rotation.y = speed > 0 ? 0 : Math.PI;
      this.group.add(bus);
      this.buses.push({ mesh: bus, offset, speed });
    }
  }

  /** Walkers in bright jackets on the verges. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(3321);
    for (let offset = 8; offset < LOOP; offset += 14 + random() * 20)
      this.walkers.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.7 + random() * 0.8),
        speed: (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.walkers.length, WALKER_WEAR, 3327);
  }

  /**
   * Ahead: the volcano's upper slopes in black and snow-streaked grey, the summit cone with its
   * drifting plume, the lesser cones on its flanks; behind and below, the Ionian Sea.
   */
  private addSummit(): void {
    const random = seeded(3331);
    const slope = this.material({ map: this.repeat(summitTexture(), 1, 1), roughness: 1 });
    const dark = this.material({
      map: this.repeat(lavaTexture(), 30, 30),
      color: 0x6a6460,
      roughness: 1,
      flatShading: true,
    });
    const rust = this.material({
      map: this.repeat(scoriaTexture(), 10, 10),
      roughness: 1,
      flatShading: true,
    });
    const cone = new ConeGeometry(1, 1, 32, 1, true);
    this.disposables.push(cone);
    const mountain = new Mesh(cone, slope);
    mountain.scale.set(3800, 1700, 3800);
    mountain.position.set(-200, 850 - 120, -4600);
    const crater = new Mesh(new ConeGeometry(1, 1, 16, 1, true), dark);
    crater.scale.set(520, 380, 520);
    crater.position.set(-200, 1450, -4600);
    this.disposables.push(crater.geometry);
    this.horizon.add(mountain, crater);
    for (let k = 0; k < 10; k++) {
      const c = new Mesh(cone, k % 3 ? dark : rust);
      const w = 120 + random() * 200;
      const h = w * 0.4;
      c.scale.set(w, h, w);
      const a = -Math.PI / 2 + (random() - 0.5) * 2.2;
      const d = 900 + random() * 1600;
      c.position.set(Math.cos(a) * d * 0.9, h / 2 - 20 + d * 0.12, Math.sin(a) * d);
      this.horizon.add(c);
    }
    // The plume.
    const ball = new SphereGeometry(1, 10, 8);
    this.disposables.push(ball);
    for (let k = 0; k < 28; k++) {
      const steam = this.material({
        color: k % 3 ? 0xf2f2f0 : 0x9a968e,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        roughness: 1,
        emissive: 0x6a6a6a,
        emissiveIntensity: 0.3,
      });
      const puff = new Mesh(ball, steam);
      this.puffs.push({ mesh: puff, phase: k / 28 + random() * 0.02, drift: 0.7 + random() * 0.6 });
      this.horizon.add(puff);
    }
    // The Ionian Sea far below behind and to the left.
    const sea = new Mesh(
      new PlaneGeometry(20000, 12000),
      this.material({
        color: 0x3a6a9a,
        roughness: 0.3,
        metalness: 0.3,
        emissive: 0x1a3050,
        emissiveIntensity: 0.4,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-10000, -800, 2000);
    this.disposables.push(sea.geometry);
    this.horizon.add(sea);
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

/** Black volcanic cinder, fine and grainy. */
function cinderTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#2e2c2c', 3341));
}

/** Old lava: black and charcoal clinker with rusty glints. */
function lavaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a3634', 3351);
    const random = seeded(3353);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = ['#1a1818', '#4a4442', '#5a3a2e', '#2a2626'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 1 + random() * 4, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Rust-red scoria of the cinder cones. */
function scoriaTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#7a3e2a', 3361);
    const random = seeded(3363);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = ['#5a2a1e', '#9a5a3a', '#3a2420'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 64, random() * 64, 2, 2);
    }
  });
}

/** The upper slopes: dark rock streaked with snow running down from the summit. */
function summitTexture(): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    speckle(g, 512, 256, '#4a4644', 3371);
    const random = seeded(3373);
    for (let i = 0; i < 160; i++) {
      const x = random() * 512;
      const top = random() * 60;
      g.fillStyle = `rgba(240,242,245,${0.4 + random() * 0.5})`;
      g.fillRect(x, top, 1 + random() * 4, 20 + random() * 80);
    }
    g.fillStyle = 'rgba(240,242,245,0.75)';
    g.fillRect(0, 0, 512, 18);
  });
}
