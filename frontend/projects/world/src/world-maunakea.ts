// Mauna Kea, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the summit road of Hawaii's
// highest mountain late in the afternoon, four thousand metres up and far above a white sea of
// cloud. The rider grinds up the steep road through a bare, Mars-like land of rust-red and black
// cinder cones, loose scree and lava blocks, old snow lying in the hollows. The slope falls away on
// the left to the cloud sea that hides the island, with Mauna Loa's broad dark shield rising out of
// it across the saddle; on the right the cinder slopes climb to the summit ridge where the
// observatories' white and silver domes stand against the deep blue sky. Snow poles mark the verge,
// a support truck grinds up behind the riders, and a few stargazers wait by the road for sunset.
// Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
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
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The summit road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The mountain's flank falls DROP metres on the left; the cloud sea lies CLOUDS metres below the road. */
const DROP = 220;
const CLOUDS = 300;

const STARGAZER_WEAR = {
  tops: ['#d8102e', '#1d5aa8', '#f08a2a', '#2a2a2a', '#3a8a5a', '#ffd23f'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69'],
  skins: ['#f5d3b5', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class MaunaKeaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private clouds: Texture | null = null;
  private truck: Group | null = null;
  private readonly horizon = new Group();
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
    this.addCones(roadHalf);
    this.addRocks(roadHalf);
    this.addPoles(roadHalf);
    this.addStargazers(roadHalf);
    this.addTruck();
    this.addSummit();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.clouds) this.clouds.offset.set(seconds * 0.0015, seconds * 0.0006);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the mountain's flank, so the cloud sea shows. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - CLOUDS - 20);
      position.setY(i * 2 + 1, p.height - CLOUDS - 20);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    // The support truck grinds up behind the riders, slowly gaining.
    if (this.truck) {
      const metres = -18 + Math.sin(this.time * 0.05) * 4;
      this.truck.position.set(-1.6, heightAt(0) + metres * 0.12, -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        const heading = Math.PI / 2 + Math.sin(this.time * 0.3 + p.phase) * 0.5;
        crowd.set(i, p.x, heightAt(Math.max(metres, 0)), -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The summit road, the cinder slopes climbing on the right and the flank falling to the clouds on the left. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.9 });
    const cinder = this.material({
      map: this.repeat(cinderTexture(), 10, 10),
      roughness: 1,
      flatShading: true,
    });
    const scree = this.material({ map: this.repeat(screeTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, scree, [
      [r + 14, 3],
      [r + 1.2, 0.1],
      [r, 0.02],
    ]);
    this.ribbons.add(points, cinder, [
      [r + 300, 140],
      [r + 90, 34],
      [r + 14, 3],
    ]);
    this.ribbons.add(points, scree, [
      [-r, 0.02],
      [-r - 1.2, 0.05],
      [-r - 16, -4],
    ]);
    this.ribbons.add(points, cinder, [
      [-r - 16, -4],
      [-r - 160, -60],
      [-r - 700, -DROP],
    ]);
  }

  /** The rust-red and black cinder cones scattered over the mountain, old snow in their hollows. */
  private addCones(roadHalf: number): void {
    const random = seeded(7301);
    const reds = [0x8a3a24, 0xa04a2a, 0x5a2a20, 0x3a2a28].map((c) =>
      this.material({ map: this.track(coneTexture(c)), roughness: 1, flatShading: true }),
    );
    const snow = this.material({ color: 0xf4f6fa, roughness: 0.8, flatShading: true });
    const cone = new CylinderGeometry(0.2, 1, 1, 16, 2);
    const crater = new CylinderGeometry(1, 1, 0.05, 14);
    const patch = new DodecahedronGeometry(1, 0);
    this.disposables.push(cone, crater, patch);
    for (const [offset, x, w, h] of [
      [40, 150, 60, 40],
      [150, 120, 44, 28],
      [250, 190, 80, 50],
      [320, 110, 36, 22],
      [100, -140, 80, 40],
      [210, -200, 100, 46],
    ] as const) {
      const g = new Group();
      // A truncated cone, its summit cut by the crater.
      const c = new Mesh(cone, reds[Math.floor(random() * reds.length)]!);
      c.scale.set(w, h, w);
      c.position.y = h / 2 - 4;
      g.add(c);
      const top = new Mesh(crater, reds[3]!);
      top.scale.set(w * 0.17, 1, w * 0.17);
      top.position.y = h - 4 + 0.05;
      g.add(top);
      for (let k = 0; k < 3; k++) {
        const p = new Mesh(patch, snow);
        p.scale.set(4 + random() * 6, 0.6, 2 + random() * 3);
        const a = random() * Math.PI * 2;
        p.position.set(
          Math.cos(a) * w * 0.35,
          h * 0.2 + random() * h * 0.2,
          Math.sin(a) * w * 0.35,
        );
        g.add(p);
      }
      const holder = new Group();
      holder.position.y = 0;
      holder.add(g);
      g.position.y = x > 0 ? (x - roadHalf - 14) * 0.37 + 3 : -(Math.abs(x) * 0.3);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    }
  }

  /** The lava blocks and black rocks strewn on the scree, and snow lying in the hollows. */
  private addRocks(roadHalf: number): void {
    const random = seeded(7311);
    const rocks = [0x2a2624, 0x4a3a34, 0x6a4a3a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const snow = this.material({ color: 0xf0f2f8, roughness: 0.8, flatShading: true });
    const lump = new DodecahedronGeometry(1, 0);
    this.disposables.push(lump);
    for (let offset = 0; offset < LOOP; offset += 1.5 + random() * 3)
      for (const side of [-1, 1]) {
        if (random() < 0.35) continue;
        const d = 1.5 + random() * 30;
        const isSnow = random() < 0.08;
        const b = new Mesh(lump, isSnow ? snow : rocks[Math.floor(random() * rocks.length)]!);
        const s = isSnow ? 1.5 + random() * 2 : 0.25 + random() * 0.9;
        b.scale.set(s * 1.3, isSnow ? 0.25 : s * 0.8, s);
        b.rotation.set(random(), random() * 3, random());
        b.castShadow = !isSnow;
        const along =
          side > 0
            ? d < 14
              ? d * (3 / 14)
              : 3 + (d - 14) * 0.37
            : d < 16
              ? -d * 0.25
              : -4 - (d - 16) * 0.39;
        b.position.y = along + s * 0.2;
        const holder = new Group();
        holder.add(b);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
  }

  /** The tall orange-tipped snow poles marking the road's edge. */
  private addPoles(roadHalf: number): void {
    const white = this.material({ color: 0xf4f4f0, roughness: 0.6 });
    const orange = this.material({
      color: 0xff6a1a,
      roughness: 0.5,
      emissive: 0x6a2a00,
      emissiveIntensity: 0.3,
    });
    for (let offset = 0; offset < LOOP; offset += 18)
      for (const side of [-1, 1]) {
        const pole = new Group();
        const stick = new Mesh(this.unit, white);
        stick.scale.set(0.08, 2.2, 0.08);
        stick.position.y = 1.1;
        const tip = new Mesh(this.unit, orange);
        tip.scale.set(0.09, 0.5, 0.09);
        tip.position.y = 2.2;
        pole.add(stick, tip);
        const holder = new Group();
        holder.add(pole);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? 9 : 0),
          x: side * (roadHalf + 0.6),
        });
      }
  }

  /** Stargazers waiting by the road for sunset, their telescopes on tripods. */
  private addStargazers(roadHalf: number): void {
    const random = seeded(7321);
    const metal = this.material({ color: 0xe8e8ec, roughness: 0.3, metalness: 0.6 });
    const black = this.material({ color: 0x1d1f24, roughness: 0.5 });
    for (const offset of [70, 190, 300]) {
      for (let k = 0; k < 3; k++)
        this.people.push({
          offset: offset + k * 1.4,
          x: -roadHalf - 2.2 - random() * 1.5,
          phase: random() * 6,
        });
      const scope = new Group();
      const tube = new Mesh(this.unit, metal);
      tube.scale.set(0.25, 0.25, 1.4);
      tube.rotation.x = 0.6;
      tube.position.y = 1.5;
      scope.add(tube);
      for (let k = 0; k < 3; k++) {
        const leg = new Mesh(this.unit, black);
        leg.scale.set(0.04, 1.4, 0.04);
        const a = (k / 3) * Math.PI * 2;
        leg.position.set(Math.cos(a) * 0.25, 0.7, Math.sin(a) * 0.25);
        leg.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2);
        scope.add(leg);
      }
      const holder = new Group();
      holder.add(scope);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 2.5, x: -roadHalf - 3.4 });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.people.length,
      STARGAZER_WEAR,
      7327,
    );
  }

  /** The white four-wheel-drive support truck following the riders up. */
  private addTruck(): void {
    const white = this.material({ color: 0xf4f4f0, roughness: 0.4, metalness: 0.2 });
    const glass = this.material({ color: 0x2a3440, roughness: 0.1, metalness: 0.6 });
    const amber = this.material({ color: 0xffb020, emissive: 0xffa000, emissiveIntensity: 0.8 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const truck = new Group();
    const body = new Mesh(this.unit, white);
    body.scale.set(2, 1.2, 5);
    body.position.y = 1.1;
    const cab = new Mesh(this.unit, glass);
    cab.scale.set(1.9, 0.8, 2);
    cab.position.set(0, 2.1, -0.6);
    const beacon = new Mesh(this.unit, amber);
    beacon.scale.set(0.8, 0.15, 0.2);
    beacon.position.set(0, 2.6, -0.6);
    const wheels = new Mesh(this.unit, tyre);
    wheels.scale.set(2.1, 0.8, 3.6);
    wheels.position.y = 0.4;
    truck.add(body, cab, beacon, wheels);
    truck.children.forEach((c) => (c.castShadow = true));
    this.group.add(truck);
    this.truck = truck;
  }

  /** The summit ridge's observatory domes, Mauna Loa across the saddle and the sea of cloud below. */
  private addSummit(): void {
    const random = seeded(7331);
    // The cloud sea, a white floor reaching to the horizon far below the road.
    const sea = this.track(cloudTexture());
    sea.wrapS = RepeatWrapping;
    sea.wrapT = RepeatWrapping;
    sea.repeat.set(30, 30);
    this.clouds = sea;
    const floor = this.material({
      map: sea,
      color: 0xffffff,
      roughness: 1,
      emissive: 0xc8c8d0,
      emissiveIntensity: 0.35,
    });
    const plane = new Mesh(new PlaneGeometry(12000, 12000), floor);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(-5000, -CLOUDS, -3000);
    this.disposables.push(plane.geometry);
    this.horizon.add(plane);
    const puff = new SphereGeometry(1, 10, 7);
    this.disposables.push(puff);
    const billow = this.material({
      color: 0xffffff,
      roughness: 1,
      emissive: 0xd0d0d8,
      emissiveIntensity: 0.35,
      flatShading: true,
    });
    for (let k = 0; k < 40; k++) {
      const m = new Mesh(puff, billow);
      m.scale.set(60 + random() * 90, 14 + random() * 16, 50 + random() * 60);
      m.position.set(-400 - random() * 3200, -CLOUDS + 2, 200 - random() * 3600);
      this.horizon.add(m);
    }
    // Mauna Loa's broad, gentle shield rising out of the clouds across the saddle.
    const shield = this.material({ color: 0x6a6480, roughness: 1, flatShading: true });
    const loa = new Mesh(puff, shield);
    loa.scale.set(4200, 620, 1600);
    loa.position.set(-3600, -CLOUDS - 260, -7000);
    this.horizon.add(loa);
    // The summit ridge's domes, white and silver, and the cinder ridge they stand on.
    const ridge = this.material({ color: 0x7a3a2a, roughness: 1, flatShading: true });
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    for (let k = 0; k < 5; k++) {
      const h = new Mesh(hill, ridge);
      h.scale.set(220 + random() * 80, 110 + random() * 40, 160);
      h.position.set(60 + k * 200, 30, -700 - random() * 80);
      this.horizon.add(h);
    }
    const domes = [0xf4f4f8, 0xc8ccd4, 0xe8e8ec].map((c) =>
      this.material({ color: c, roughness: 0.4, metalness: 0.15 }),
    );
    const drum = new CylinderGeometry(1, 1, 1, 18);
    const cap = new SphereGeometry(1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(drum, cap);
    for (let k = 0; k < 8; k++) {
      const m = domes[k % domes.length]!;
      const r = 16 + random() * 12;
      const o = new Group();
      const d = new Mesh(drum, m);
      d.scale.set(r, r * 0.9, r);
      d.position.y = r * 0.45;
      const c = new Mesh(cap, m);
      c.scale.setScalar(r);
      c.position.y = r * 0.9;
      // The dome's open slit, dark against the white.
      const slit = new Mesh(this.unit, this.material({ color: 0x1d1f24, roughness: 0.5 }));
      slit.scale.set(r * 0.25, r * 0.9, 0.6);
      slit.position.set(0, r * 1.25, r * 0.86);
      slit.rotation.x = -0.6;
      o.add(d, c, slit);
      o.rotation.y = random() * 0.6 - 0.3;
      o.position.set(40 + k * 120 + random() * 30, 135 + random() * 25, -680 - random() * 60);
      this.horizon.add(o);
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

/** The summit road's dark, gritty tarmac with its yellow centre line. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a3634', 7341);
    g.fillStyle = 'rgba(255,200,40,0.85)';
    g.fillRect(61, 0, 2, 128);
    g.fillRect(65, 0, 2, 128);
    g.fillStyle = 'rgba(240,240,236,0.7)';
    g.fillRect(3, 0, 2, 128);
    g.fillRect(123, 0, 2, 128);
  });
}

/** The cinder slopes' rust-red and black ash. */
function cinderTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a4a34', 7351);
    const random = seeded(7353);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = ['#2a2220', '#b0603a', '#5a3028'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 2 + random() * 3, 2);
    }
  });
}

/** The loose grey-brown scree at the road's edge. */
function screeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#6a5048', 7361));
}

/** A cinder cone's flank, streaked where the ash has slid. */
function coneTexture(colour: number): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, `#${colour.toString(16).padStart(6, '0')}`, 7371);
    g.fillStyle = 'rgba(20,10,10,0.25)';
    const random = seeded(7373);
    for (let i = 0; i < 12; i++) g.fillRect(random() * 64, 0, 1 + random() * 2, 64);
  });
}

/** The sea of cloud's soft, lumpy top. */
function cloudTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#f4f4f8', 7381);
    const random = seeded(7383);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(200,204,220,${0.2 + random() * 0.3})`;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 4 + random() * 10, 0, Math.PI * 2);
      g.fill();
    }
  });
}
