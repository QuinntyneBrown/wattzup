// Haleakalā, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the last switchbacks
// of Maui's sea-level-to-summit climb, high above the clouds in the clear early morning. The
// rider climbs the summit road with its double yellow centre line and white reflector posts
// through the volcano's bare cinder: rust-red, ochre and charcoal ash, lava rubble, and the
// silverswords' spiky silver globes, a few sending up their tall flowering spikes. A nēnē
// crossing sign warns of the Hawaiian geese walking the verge, and visitors wrapped in
// blankets stand at the pull-outs where their cars are parked. On the left the sea of clouds
// stretches to the horizon, gold where the low sun lights it, and far off across it the Big
// Island's Mauna Kea and Mauna Loa rise above the cloud. On the right the cinder slope climbs to
// the crater's rim and its cinder cones, and ahead on the summit the white domes of the
// observatories catch the sun. Built on the shared kit (world-kit.ts) on the pattern of Old
// Town's street.
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
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
/** The sea of clouds lies CLOUDS metres below the road. */
const CLOUDS = 220;

const VISITOR_WEAR = {
  tops: ['#c8102e', '#1d3a8a', '#f0e8d8', '#2a6a5a', '#ffd23f', '#5a3a6a', '#e86a2a'],
  bottoms: ['#2f3e5c', '#1d1f24', '#5a5f69', '#8a7a64'],
  skins: ['#f0c8a0', '#c48a5f', '#8d5a3b', '#e2b48c', '#f5d3b5', '#a86a48'],
};

export class HaleakalaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly geese: { neck: Group; body: Group; phase: number }[] = [];
  private readonly puffs: { mesh: Mesh; x: number; speed: number }[] = [];
  private cloudSea: Texture | null = null;
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
    this.addRoad(roadHalf, points);
    this.addReflectors(roadHalf);
    this.addCinder(roadHalf);
    this.addSilverswords(roadHalf);
    this.addNene(roadHalf);
    this.addPullOuts(roadHalf);
    this.addSummit();
    this.addCloudSea();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    for (const g of this.geese) {
      g.neck.rotation.x = Math.max(0, Math.sin(seconds * 0.7 + g.phase)) * 0.9;
      g.body.position.y = Math.abs(Math.sin(seconds * 2 + g.phase)) * 0.02;
    }
    for (const p of this.puffs) {
      const x = ((p.x + seconds * p.speed) % 4000) - 2000;
      p.mesh.position.x = x;
    }
    if (this.cloudSea) this.cloudSea.offset.set(seconds * 0.0006, 0);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the cinder slope falling to the clouds on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - CLOUDS - 30);
      position.setY(i * 2 + 1, p.height - CLOUDS - 30);
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
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        crowd.set(
          i,
          p.x,
          heightAt(metres),
          -metres,
          -Math.PI / 2 + Math.sin(this.time * 0.2 + p.phase) * 0.3,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The summit road with its centre lines, the cinder shoulders and the slope down to the clouds. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(roadTexture(), r * 2, 8), roughness: 0.9 });
    const cinder = this.material({ map: this.repeat(cinderTexture(), 5, 5), roughness: 1 });
    const rust = this.material({
      map: this.repeat(rustTexture(), 8, 8),
      roughness: 1,
      flatShading: true,
    });
    this.ribbons.add(points, asphalt, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, cinder, [
      [r + 3, 0.15],
      [r, 0.01],
    ]);
    this.ribbons.add(points, rust, [
      [r + 300, 150],
      [r + 60, 26],
      [r + 3, 0.15],
    ]);
    this.ribbons.add(points, cinder, [
      [-r, 0.01],
      [-r - 3, 0.05],
    ]);
    this.ribbons.add(points, rust, [
      [-r - 3, 0.05],
      [-r - 25, -8],
      [-r - 160, -90],
      [-r - 500, -CLOUDS - 20],
    ]);
  }

  /** The white reflector posts marking the road's edges up the volcano. */
  private addReflectors(roadHalf: number): void {
    const white = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const amber = this.material({ color: 0xffa020, emissive: 0xff8000, emissiveIntensity: 0.4 });
    for (let offset = 0; offset < LOOP; offset += 16)
      for (const side of [-1, 1]) {
        const post = new Group();
        const p = new Mesh(this.unit, white);
        p.scale.set(0.1, 1, 0.1);
        p.position.y = 0.5;
        const eye = new Mesh(this.unit, amber);
        eye.scale.set(0.06, 0.14, 0.11);
        eye.position.y = 0.85;
        post.add(p, eye);
        post.children.forEach((c) => (c.castShadow = true));
        const holder = new Group();
        holder.add(post);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? 8 : 0),
          x: side * (roadHalf + 1),
        });
      }
  }

  /** Lava rubble and little cinder mounds scattered over the bare slopes. */
  private addCinder(roadHalf: number): void {
    const random = seeded(4701);
    const rocks = [0x3a3230, 0x5a3a2e, 0x2a2624, 0x7a4a34].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const block = new DodecahedronGeometry(1, 0);
    const mound = new ConeGeometry(1, 0.6, 7);
    this.disposables.push(block, mound);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 3)
      for (const side of [-1, 1]) {
        if (random() < 0.4) continue;
        const d = 3 + random() * 30;
        const r =
          random() < 0.85
            ? new Mesh(block, rocks[Math.floor(random() * rocks.length)]!)
            : new Mesh(mound, rocks[3]!);
        const s = 0.2 + random() * (d > 10 ? 1.4 : 0.6);
        r.scale.set(s * (1 + random()), s, s * (1 + random()));
        r.rotation.y = random() * 3;
        r.position.y = s * 0.3;
        r.castShadow = true;
        const holder = new Group();
        holder.add(r);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset,
          x: side * (roadHalf + Math.min(d, side < 0 ? 18 : 30)),
        });
        if (side < 0) r.position.y -= Math.max(0, Math.min(d, 18) - 3) * (8 / 22);
        else r.position.y += Math.max(0, Math.min(d, 30) - 3) * (26 / 57);
      }
  }

  /** The silverswords: spiky silver globes in the cinder, some with tall flowering spikes. */
  private addSilverswords(roadHalf: number): void {
    const random = seeded(4711);
    const silver = this.material({
      color: 0xd8dcd8,
      roughness: 0.5,
      metalness: 0.3,
      flatShading: true,
    });
    const bloom = this.material({ color: 0x8a3a5a, roughness: 0.8, flatShading: true });
    const blade = new ConeGeometry(0.035, 0.45, 3);
    blade.translate(0, 0.22, 0);
    const spike = new ConeGeometry(0.22, 1.8, 6);
    spike.translate(0, 0.9, 0);
    this.disposables.push(blade, spike);
    for (let offset = 2; offset < LOOP; offset += 3 + random() * 5) {
      const right = random() < 0.65;
      const d = 2 + random() * 9;
      const plant = new Group();
      // The rosette's swords radiating out and up from its heart.
      for (let k = 0; k < 26; k++) {
        const b = new Mesh(blade, silver);
        const a = (k / 26) * Math.PI * 2 + random() * 0.2;
        const up = 0.25 + (k % 3) * 0.35;
        b.rotation.set(Math.cos(a) * (Math.PI / 2 - up), 0, -Math.sin(a) * (Math.PI / 2 - up));
        b.rotation.order = 'YXZ';
        b.position.y = 0.12;
        plant.add(b);
      }
      if (random() < 0.25) {
        const s = new Mesh(spike, bloom);
        s.position.y = 0.2;
        plant.add(s);
      }
      plant.scale.setScalar(1.6 + random() * 0.8);
      plant.children.forEach((c) => (c.castShadow = true));
      plant.position.y = right
        ? (d - 3 > 0 ? (d - 3) * 0.43 : 0) + 0.15
        : -(d > 3 ? (d - 3) * 0.36 : 0);
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: right ? roadHalf + d : -roadHalf - d });
    }
  }

  /** The nēnē crossing sign, and the Hawaiian geese walking the verge. */
  private addNene(roadHalf: number): void {
    const random = seeded(4721);
    const sign = this.material({ map: this.track(neneSignTexture()), roughness: 0.6 });
    const post = this.material({ color: 0x8a8c90, roughness: 0.6 });
    for (const offset of [40, 230]) {
      const s = new Group();
      const pole = new Mesh(this.unit, post);
      pole.scale.set(0.08, 2.4, 0.08);
      pole.position.y = 1.2;
      const plate = new Mesh(this.unit, sign);
      plate.scale.set(0.9, 0.9, 0.04);
      plate.rotation.z = Math.PI / 4;
      plate.position.y = 2.5;
      s.add(pole, plate);
      s.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(s);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 1.8 });
    }
    const buff = this.material({ color: 0xb8a888, roughness: 1 });
    const black = this.material({ color: 0x1d1d1d, roughness: 1 });
    const body = new SphereGeometry(0.22, 8, 6);
    body.scale(0.85, 0.8, 1.5);
    const head = new SphereGeometry(0.08, 6, 5);
    this.disposables.push(body, head);
    for (let k = 0; k < 6; k++) {
      const goose = new Group();
      const b = new Group();
      const torso = new Mesh(body, buff);
      torso.position.y = 0.42;
      b.add(torso);
      const neck = new Group();
      neck.position.set(0, 0.5, -0.25);
      const n = new Mesh(this.unit, black);
      n.scale.set(0.05, 0.3, 0.05);
      n.position.y = 0.13;
      const h = new Mesh(head, black);
      h.position.set(0, 0.3, -0.04);
      neck.add(n, h);
      b.add(neck);
      for (const x of [-0.07, 0.07]) {
        const leg = new Mesh(this.unit, black);
        leg.scale.set(0.03, 0.26, 0.03);
        leg.position.set(x, 0.13, 0);
        goose.add(leg);
      }
      goose.add(b);
      goose.children.forEach((c) => (c.castShadow = true));
      goose.rotation.y = random() * 6;
      const holder = new Group();
      holder.add(goose);
      this.group.add(holder);
      this.geese.push({ neck, body: b, phase: random() * 6 });
      this.props.push({
        mesh: holder,
        offset: 46 + (k % 3) * 1.2 + Math.floor(k / 3) * 190,
        x: roadHalf + 2.2 + (k % 3) * 0.6,
      });
    }
  }

  /** The pull-outs: parked cars, and visitors wrapped in blankets watching the clouds. */
  private addPullOuts(roadHalf: number): void {
    const random = seeded(4731);
    const cinder = this.material({ map: this.repeat(cinderTexture(), 2, 2), roughness: 1 });
    const paints = [0xe8e8e4, 0xc8102e, 0x2a2a2a, 0x2a5a9a, 0x9a9a9a].map((c) =>
      this.material({ color: c, roughness: 0.35, metalness: 0.4 }),
    );
    const glass = this.material({ color: 0x1d2630, roughness: 0.1, metalness: 0.6 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    for (const offset of [90, 280]) {
      const lot = new Group();
      const pad = new Mesh(this.unit, cinder);
      pad.scale.set(8, 0.2, 40);
      pad.position.set(-4, -0.05, 0);
      lot.add(pad);
      for (let k = 0; k < 4; k++) {
        const car = new Group();
        const body = new Mesh(this.unit, paints[Math.floor(random() * paints.length)]!);
        body.scale.set(4.2, 0.8, 1.8);
        body.position.y = 0.7;
        const cabin = new Mesh(this.unit, glass);
        cabin.scale.set(2.2, 0.6, 1.6);
        cabin.position.set(0.2, 1.35, 0);
        const wheels = new Mesh(this.unit, tyre);
        wheels.scale.set(3, 0.6, 1.9);
        wheels.position.y = 0.3;
        car.add(body, cabin, wheels);
        car.children.forEach((c) => (c.castShadow = true));
        car.position.set(-3, 0, -14 + k * 6);
        car.rotation.y = 0.15;
        lot.add(car);
      }
      const holder = new Group();
      holder.add(lot);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.4 });
      // The visitors at the lot's edge, looking out over the clouds.
      for (let k = 0; k < 6; k++)
        this.people.push({
          offset: offset - 16 + k * 5 + random() * 2,
          x: -roadHalf - 8.6,
          speed: 0,
          phase: random() * 6,
        });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, VISITOR_WEAR, 4737);
  }

  /** Ahead and to the right: the crater rim's cinder cones and the observatories' white domes on the summit. */
  private addSummit(): void {
    const random = seeded(4741);
    const rusts = [0x8a4a30, 0x6a3a2a, 0xa86a40, 0x4a3430].map((c) =>
      this.material({
        map: this.repeat(rustTexture(), 30, 30),
        color: c,
        roughness: 1,
        flatShading: true,
      }),
    );
    const cone = new ConeGeometry(1, 1, 18, 1, true);
    this.disposables.push(cone);
    // The summit massif rising ahead.
    const massif = new Mesh(
      new SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      rusts[0]!,
    );
    massif.scale.set(1400, 200, 900);
    massif.position.set(60, -40, -1600);
    this.disposables.push(massif.geometry);
    this.horizon.add(massif);
    for (let k = 0; k < 7; k++) {
      const c = new Mesh(cone, rusts[k % rusts.length]!);
      const h = 50 + random() * 70;
      c.scale.set(140 + random() * 100, h, 140 + random() * 100);
      c.position.set(
        -300 + k * 140 + random() * 60,
        90 + h / 2 + random() * 30,
        -1200 - random() * 300,
      );
      this.horizon.add(c);
    }
    // Science City's observatories: white domes and towers on the summit.
    const white = this.material({ color: 0xf8f8f6, roughness: 0.3, metalness: 0.3 });
    const dome = new SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(dome);
    for (let k = 0; k < 6; k++) {
      const obs = new Group();
      const h = 10 + random() * 14;
      const drum = new Mesh(new CylinderGeometry(8, 8, h, 16), white);
      drum.position.y = h / 2;
      const top = new Mesh(dome, white);
      top.scale.setScalar(8);
      top.position.y = h;
      obs.add(drum, top);
      this.disposables.push(drum.geometry);
      obs.scale.setScalar(1.4 + random() * 0.8);
      obs.position.set(-120 + k * 45 + random() * 15, 120, -1100 - random() * 30);
      this.horizon.add(obs);
    }
    // The summit's square white tower.
    const tower = new Mesh(this.unit, white);
    tower.scale.set(14, 50, 14);
    tower.position.set(170, 140, -1110);
    this.horizon.add(tower);
  }

  /** The sea of clouds stretching to the horizon, its drifting billows, and the Big Island's peaks across it. */
  private addCloudSea(): void {
    const random = seeded(4751);
    const texture = this.track(cloudSeaTexture());
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(30, 30);
    this.cloudSea = texture;
    const sea = new Mesh(
      new PlaneGeometry(14000, 14000),
      this.material({
        map: texture,
        color: 0xffffff,
        emissive: 0xf0e4d4,
        emissiveIntensity: 0.55,
        roughness: 1,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-4000, -CLOUDS, -2000);
    this.disposables.push(sea.geometry);
    this.horizon.add(sea);
    // The billows rising from the cloud deck, gold-edged by the low sun.
    const billow = this.material({
      color: 0xffffff,
      emissive: 0xffe8c8,
      emissiveIntensity: 0.5,
      roughness: 1,
      flatShading: true,
    });
    const puff = new SphereGeometry(1, 10, 7);
    this.disposables.push(puff);
    for (let k = 0; k < 40; k++) {
      const p = new Mesh(puff, billow);
      p.scale.set(60 + random() * 120, 18 + random() * 30, 50 + random() * 90);
      p.position.set(0, -CLOUDS + 4, -200 - random() * 2600);
      const x = -300 - random() * 3200;
      p.position.x = x;
      this.puffs.push({ mesh: p, x: x + 2000, speed: 1 + random() * 2 });
      this.horizon.add(p);
    }
    // Mauna Kea, snow on its summit, and Mauna Loa's long shield, far off above the cloud.
    const slate = this.material({ color: 0x5a6070, roughness: 1, flatShading: true });
    const snow = this.material({ color: 0xf4f6fa, roughness: 0.8, flatShading: true });
    const kea = new Mesh(new ConeGeometry(1300, 420, 10), slate);
    kea.position.set(-4200, -CLOUDS + 190, -4600);
    const cap = new Mesh(new ConeGeometry(420, 136, 10), snow);
    cap.position.set(-4200, -CLOUDS + 334, -4600);
    const loa = new Mesh(new SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), slate);
    loa.scale.set(2600, 300, 1400);
    loa.position.set(-1800, -CLOUDS, -5400);
    this.disposables.push(kea.geometry, cap.geometry, loa.geometry);
    this.horizon.add(kea, cap, loa);
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

/** The summit road's dark asphalt with its double yellow centre line and white edge lines. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3e3c3c', 4761);
    g.fillStyle = '#f0c020';
    g.fillRect(59, 0, 3, 128);
    g.fillRect(66, 0, 3, 128);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
  });
}

/** Loose black and red cinder on the road's shoulders. */
function cinderTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#6a4438', 4771);
    const random = seeded(4773);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = ['#1d1a1a', '#7a3a2a', '#5a4a44'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 64, random() * 64, 2, 2);
    }
  });
}

/** The volcano's ash slopes: rust-red, ochre and charcoal in streaks down the fall line. */
function rustTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b0663e', 4781);
    const random = seeded(4783);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = ['rgba(200,140,70,0.45)', 'rgba(40,30,28,0.45)', 'rgba(120,60,40,0.5)'][
        Math.floor(random() * 3)
      ]!;
      g.fillRect(random() * 128, random() * 128, 18 + random() * 30, 3 + random() * 4);
    }
  });
}

/** The yellow diamond nēnē crossing sign: a goose in black. */
function neneSignTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#f8d020';
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#111111';
    g.lineWidth = 3;
    g.strokeRect(4, 4, 56, 56);
    g.fillStyle = '#111111';
    g.save();
    g.translate(32, 32);
    g.rotate(-Math.PI / 4);
    g.beginPath();
    g.ellipse(2, 6, 12, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-12, -10, 3, 14);
    g.beginPath();
    g.arc(-11, -12, 3.5, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-1, 12, 2, 7);
    g.fillRect(5, 12, 2, 7);
    g.restore();
  });
}

/** The cloud deck's top: soft white billows with gold light and blue shade between. */
function cloudSeaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#f2eee8';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(4791);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(200,210,228,0.5)' : 'rgba(255,236,200,0.5)';
      g.beginPath();
      g.arc(random() * 128, random() * 128, 4 + random() * 12, 0, Math.PI * 2);
      g.fill();
    }
  });
}
