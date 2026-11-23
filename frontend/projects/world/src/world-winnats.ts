// Winnats Pass, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Peak District's
// limestone gorge on a bright, breezy summer morning, clouds sailing over its rim. The rider grinds
// up the narrow road between steep grassy walls that rise on either side, broken by grey limestone
// crags and pinnacles and fans of pale scree. Sheep graze the slopes and wander onto the road, a
// lone hawthorn leans out of the wall, and a drystone wall runs along the foot of the slope with
// its field gate. A red-bordered sign warns of the 20% gradient, the road rattles over a cattle
// grid, and walkers with their packs climb the verge. Ahead the gorge narrows and steepens to the
// rim where the moor's skyline meets the sky. Built on the shared kit (world-kit.ts) on the
// pattern of Old Town's street.
import {
  BoxGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
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

/** The gorge repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;

/** The gorge's walls: the height of the slope at a distance d beyond the verge. */
function wall(d: number): number {
  if (d <= 3) return d * 0.12;
  if (d <= 30) return 0.36 + (d - 3) * 1.05;
  return 28.7 + (d - 30) * 0.75;
}

const WALKER_WEAR = {
  tops: ['#c8102e', '#2a6a9a', '#3a8a5a', '#e8c040', '#1d1f24', '#ff6b3a'],
  bottoms: ['#2f3e5c', '#1d1f24', '#5a5f69', '#3a4a2a'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class WinnatsStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly sheep: { neck: Group; phase: number }[] = [];
  private readonly clouds: { mesh: Mesh; x: number; speed: number }[] = [];
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
    this.addGorge(roadHalf, points);
    this.addCrags(roadHalf);
    this.addWall(roadHalf);
    this.addRoadside(roadHalf);
    this.addSheep(roadHalf);
    this.addWalkers(roadHalf);
    this.addSky();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    for (const s of this.sheep) s.neck.rotation.x = 0.5 + Math.sin(seconds * 0.8 + s.phase) * 0.45;
    for (const c of this.clouds) c.mesh.position.x = ((c.x + seconds * c.speed) % 3000) - 1500;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 3.6 + p.phase)) * 0.04;
        crowd.set(i, p.x, heightAt(metres) + step, -metres, p.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The narrow road, its verges, and the gorge's steep grassy walls rising on either side. */
  private addGorge(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.9 });
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const slope = this.material({
      map: this.repeat(slopeTexture(), 8, 8),
      roughness: 1,
      flatShading: true,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    const profile = [3, 12, 30, 60, 140, 260];
    this.ribbons.add(points, verge, [
      [r + 3, wall(3)],
      [r, 0.01],
    ]);
    this.ribbons.add(
      points,
      slope,
      [...profile].reverse().map((d) => [r + d, wall(d)] as [number, number]),
    );
    this.ribbons.add(points, verge, [
      [-r, 0.01],
      [-r - 3, wall(3)],
    ]);
    this.ribbons.add(
      points,
      slope,
      profile.map((d) => [-r - d, wall(d)] as [number, number]),
    );
  }

  /** Grey limestone crags, pinnacles and scree fans breaking through the grassy walls. */
  private addCrags(roadHalf: number): void {
    const random = seeded(5101);
    const stones = ['#9a968a', '#8a867a', '#a8a498', '#7a766c'].map((c, k) =>
      this.material({ map: this.track(limestoneTexture(c, k)), roughness: 1, flatShading: true }),
    );
    const scree = this.material({ map: this.track(screeTexture()), roughness: 1 });
    const block = new DodecahedronGeometry(1, 0);
    const pinnacle = new ConeGeometry(1, 1, 5);
    const fan = new ConeGeometry(1, 1, 7, 1, false, 0, Math.PI);
    this.disposables.push(block, pinnacle, fan);
    for (let offset = 0; offset < LOOP; offset += 6 + random() * 10) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 12 + random() * 70;
      const crag = new Group();
      const kind = random();
      if (kind < 0.3) {
        const p = new Mesh(pinnacle, stones[Math.floor(random() * stones.length)]!);
        const h = 6 + random() * 10;
        p.scale.set(2 + random() * 2, h, 2 + random() * 2);
        p.position.y = h / 2 - 1;
        crag.add(p);
      } else {
        for (let k = 0; k < 3; k++) {
          const b = new Mesh(block, stones[Math.floor(random() * stones.length)]!);
          b.scale.set(2 + random() * 4, 1.5 + random() * 3, 2 + random() * 4);
          b.position.set((random() - 0.5) * 5, random() * 2, (random() - 0.5) * 5);
          b.rotation.y = random() * 3;
          crag.add(b);
        }
      }
      // A fan of pale scree spilling down the slope below the crag.
      if (random() < 0.5) {
        const f = new Mesh(fan, scree);
        f.scale.set(5 + random() * 4, 0.6, 8 + random() * 6);
        f.rotation.set(0, side > 0 ? Math.PI / 2 : -Math.PI / 2, side > 0 ? 0.8 : -0.8);
        f.position.set(-side * 4, -3, 0);
        crag.add(f);
      }
      crag.children.forEach((c) => (c.castShadow = true));
      crag.position.y = wall(d) - 0.5;
      const holder = new Group();
      holder.add(crag);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
    // Loose rocks on the verges.
    for (let offset = 2; offset < LOOP; offset += 4 + random() * 6) {
      const side = random() < 0.5 ? -1 : 1;
      const b = new Mesh(block, stones[Math.floor(random() * stones.length)]!);
      const s = 0.2 + random() * 0.4;
      b.scale.set(s * 1.4, s, s * 1.2);
      b.position.y = 0.2 + s * 0.3;
      b.castShadow = true;
      const holder = new Group();
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + 1 + random() * 1.8) });
    }
  }

  /** The drystone wall along the foot of the left-hand slope, with its field gate and a hawthorn. */
  private addWall(roadHalf: number): void {
    const stone = this.material({ map: this.repeat(drystoneTexture(), 0.25, 1), roughness: 1 });
    const cope = this.material({ color: 0x8a867c, roughness: 1 });
    const timber = this.material({ color: 0x8a7a5a, roughness: 0.9 });
    for (let offset = 0; offset < LOOP; offset += 10) {
      const run = new Group();
      if (offset % 120 === 60) {
        // The field gate's posts and its five bars.
        for (const z of [-4.8, 4.8]) {
          const post = new Mesh(this.unit, stone);
          post.scale.set(0.5, 1.4, 0.5);
          post.position.set(0, 0.7, z);
          run.add(post);
        }
        for (let b = 0; b < 5; b++) {
          const bar = new Mesh(this.unit, timber);
          bar.scale.set(0.06, 0.08, 3.4);
          bar.position.set(0, 0.25 + b * 0.22, -2.8);
          run.add(bar);
        }
      } else {
        const body = new Mesh(this.unit, stone);
        body.scale.set(0.6, 1.1, 10);
        body.position.y = 0.55;
        const top = new Mesh(this.unit, cope);
        top.scale.set(0.4, 0.22, 10);
        top.position.y = 1.2;
        run.add(body, top);
      }
      run.children.forEach((c) => (c.castShadow = true));
      run.position.y = wall(3.4);
      const holder = new Group();
      holder.add(run);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 5, x: -roadHalf - 3.4 });
    }
    // The wind-bent hawthorns leaning out of the slope.
    const random = seeded(5111);
    const bark = this.material({ color: 0x4a3a30, roughness: 1 });
    const leaves = this.material({ color: 0x3a5a2a, roughness: 1, flatShading: true });
    const trunk = new CylinderGeometry(0.15, 0.25, 3, 6);
    trunk.translate(0, 1.5, 0);
    const crown = new DodecahedronGeometry(1.6, 0);
    crown.scale(1.4, 0.7, 1);
    this.disposables.push(trunk, crown);
    for (const offset of [35, 150, 270]) {
      const tree = new Group();
      const t = new Mesh(trunk, bark);
      t.rotation.z = 0.35;
      const c = new Mesh(crown, leaves);
      c.position.set(-1, 3, 0);
      tree.add(t, c);
      tree.children.forEach((m) => (m.castShadow = true));
      const d = 6 + random() * 6;
      tree.position.y = wall(d);
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + d });
    }
  }

  /** The 20% gradient sign, the cattle grid across the road and the white edge posts. */
  private addRoadside(roadHalf: number): void {
    const post = this.material({ color: 0x8a8c90, roughness: 0.6 });
    const sign = this.material({
      map: this.track(gradientSignTexture()),
      roughness: 0.6,
      transparent: true,
      alphaTest: 0.5,
    });
    for (const offset of [30, 210]) {
      const s = new Group();
      const pole = new Mesh(this.unit, post);
      pole.scale.set(0.08, 2.2, 0.08);
      pole.position.y = 1.1;
      const plate = new Mesh(this.unit, sign);
      plate.scale.set(1, 0.9, 0.03);
      plate.position.y = 2.5;
      s.add(pole, plate);
      s.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(s);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 1.2 });
    }
    // The cattle grid's steel bars across the road.
    const steel = this.material({ color: 0x5a5c60, roughness: 0.5, metalness: 0.6 });
    const pit = this.material({ color: 0x1a1a1a, roughness: 1 });
    const grid = new Group();
    const hole = new Mesh(this.unit, pit);
    hole.scale.set(roadHalf * 2, 0.02, 2.6);
    hole.position.y = 0.015;
    grid.add(hole);
    for (let b = 0; b < 12; b++) {
      const bar = new Mesh(this.unit, steel);
      bar.scale.set(roadHalf * 2, 0.06, 0.08);
      bar.position.set(0, 0.04, -1.2 + b * 0.22);
      grid.add(bar);
    }
    const holder = new Group();
    holder.add(grid);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 95, x: 0 });
  }

  /** Sheep grazing the gorge's slopes, a few wandering onto the road. */
  private addSheep(roadHalf: number): void {
    const random = seeded(5121);
    const fleeces = [0xeae4d6, 0xd8d0c0, 0xf2eee4].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const face = this.material({ color: 0x2a2420, roughness: 1 });
    const body = new SphereGeometry(0.45, 8, 6);
    body.scale(0.85, 0.8, 1.35);
    const head = new SphereGeometry(0.16, 6, 5);
    head.scale(0.8, 0.9, 1.4);
    this.disposables.push(body, head);
    for (let k = 0; k < 22; k++) {
      const sheep = new Group();
      const b = new Mesh(body, fleeces[k % fleeces.length]!);
      b.position.y = 0.6;
      const neck = new Group();
      neck.position.set(0, 0.7, -0.55);
      const h = new Mesh(head, face);
      h.position.set(0, 0, -0.15);
      neck.add(h);
      sheep.add(b, neck);
      for (const [x, z] of [
        [-0.18, -0.3],
        [0.18, -0.3],
        [-0.18, 0.3],
        [0.18, 0.3],
      ] as const) {
        const leg = new Mesh(this.unit, face);
        leg.scale.set(0.07, 0.4, 0.07);
        leg.position.set(x, 0.2, z);
        sheep.add(leg);
      }
      sheep.children.forEach((c) => (c.castShadow = true));
      sheep.rotation.y = random() * 6;
      const onRoad = k % 7 === 3;
      const side = random() < 0.5 ? -1 : 1;
      const d = onRoad ? 0 : 4 + random() * 40;
      sheep.position.y = onRoad ? 0 : wall(d);
      const holder = new Group();
      holder.add(sheep);
      this.group.add(holder);
      this.sheep.push({ neck, phase: random() * 6 });
      this.props.push({
        mesh: holder,
        offset: 8 + k * 16 + random() * 8,
        x: onRoad ? side * (roadHalf - 0.6) : side * (roadHalf + d),
      });
    }
  }

  /** Walkers with their packs climbing the verge and coming down. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(5131);
    for (let offset = 12; offset < LOOP; offset += 24 + random() * 30)
      this.people.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 1.2),
        speed: (random() < 0.6 ? 1 : -1) * (0.9 + random() * 0.3),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, WALKER_WEAR, 5137);
  }

  /** The gorge head's moorland skyline ahead, and the clouds sailing over the rim. */
  private addSky(): void {
    const random = seeded(5141);
    const moor = this.material({
      map: this.repeat(slopeTexture(), 30, 30),
      color: 0x9aa070,
      roughness: 1,
      flatShading: true,
    });
    const dome = new SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(dome);
    for (let k = 0; k < 6; k++) {
      const hill = new Mesh(dome, moor);
      const h = 120 + random() * 80;
      hill.scale.set(500 + random() * 400, h, 300 + random() * 200);
      hill.position.set(-700 + k * 280 + random() * 80, 0, -700 - random() * 300);
      this.horizon.add(hill);
    }
    const cloud = this.material({
      color: 0xffffff,
      emissive: 0xdde4ea,
      emissiveIntensity: 0.5,
      roughness: 1,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const puff = new SphereGeometry(1, 10, 8);
    this.disposables.push(puff);
    for (let k = 0; k < 9; k++) {
      const c = new Mesh(puff, cloud);
      c.scale.set(120 + random() * 160, 30 + random() * 25, 70 + random() * 60);
      c.position.set(0, 360 + random() * 220, -500 - random() * 1500);
      this.clouds.push({ mesh: c, x: random() * 3000, speed: 6 + random() * 6 });
      this.horizon.add(c);
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

/** The narrow road's patched tarmac with its white edge lines. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#58585a', 5151);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
    g.fillStyle = 'rgba(30,30,32,0.35)';
    g.fillRect(40, 30, 30, 18);
  });
}

/** The verge's rough grass and nettles. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#5a7a34', 5161));
}

/** The gorge walls' short sheep-cropped turf with limestone showing through. */
function slopeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a8a3a', 5171);
    const random = seeded(5173);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = ['#8aa04a', '#4a6a2a', '#a8a490', '#7a8a44'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 8, 2 + random() * 3);
    }
  });
}

/** Grey limestone, cracked and lichen-spotted. */
function limestoneTexture(base: string, k: number): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, base, 5181 + k);
    const random = seeded(5191 + k);
    g.fillStyle = 'rgba(60,58,52,0.4)';
    for (let i = 0; i < 8; i++) g.fillRect(random() * 64, random() * 64, 14 + random() * 20, 1);
    g.fillStyle = 'rgba(200,200,120,0.5)';
    for (let i = 0; i < 10; i++) g.fillRect(random() * 64, random() * 64, 2, 2);
  });
}

/** Pale broken scree. */
function screeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#aca898', 5201);
    const random = seeded(5203);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = random() < 0.5 ? '#8a867c' : '#e0dcd0';
      g.fillRect(random() * 64, random() * 64, 3, 2);
    }
  });
}

/** The drystone wall's grey limestone, laid in rough courses. */
function drystoneTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#a49c88', 5211);
    g.strokeStyle = 'rgba(50,48,42,0.6)';
    const random = seeded(5213);
    for (let y = 0; y < 64; y += 12)
      for (let x = (y / 12) % 2 ? -6 : 0; x < 128; x += 12 + random() * 8)
        g.strokeRect(x, y, 12 + random() * 6, 12);
  });
}

/** The red-bordered warning triangle: a 20% climb. */
function gradientSignTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#d8102e';
    g.beginPath();
    g.moveTo(32, 2);
    g.lineTo(62, 58);
    g.lineTo(2, 58);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(32, 14);
    g.lineTo(52, 52);
    g.lineTo(12, 52);
    g.closePath();
    g.fill();
    g.fillStyle = '#111111';
    g.font = 'bold 13px sans-serif';
    g.textAlign = 'center';
    g.fillText('20%', 32, 48);
  });
}
