// Mount Teide's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Tenerife's
// volcano on a cloudless high-altitude morning. The rider climbs the road above the sea of
// clouds: on the left the slope falls away to the white cloud layer lying flat to the horizon,
// the island of La Palma's peaks breaking through it far off; on the right the old caldera's
// cliffs rise in bands of ochre, rust and cream. The verges are pale pumice and black lava,
// round retama bushes grow there, and the red spires of tajinaste flowers stand up from the
// rock; Canary pines cling on lower down. The tall eroded spires of the Roques de García stand
// beside the road, and ahead Teide's great cone fills the sky, brown and ochre with its pale
// summit and Pico Viejo's dark shoulder, the cable car's line climbing it. Built on the shared
// kit (world-kit.ts) on the pattern of Old Town's street.
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
const LOOP = 400;
const BEHIND = 24;
/** The sea of clouds lies CLOUDS metres below the road. */
const CLOUDS = 260;

const VISITOR_WEAR = {
  tops: ['#ffffff', '#d8442a', '#2a6a9a', '#e8c040', '#1d1f24', '#f15bb5'],
  bottoms: ['#2f3e5c', '#1d1f24', '#e8d8b0', '#8a7a64'],
  skins: ['#f0c8a0', '#c48a5f', '#e2b48c', '#f5d3b5'],
};

export class TeideStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly visitors: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly cabins: Mesh[] = [];
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
    this.addSlopes(roadHalf, points);
    this.addRocks(roadHalf);
    this.addPlants(roadHalf);
    this.addRoques(roadHalf);
    this.addVisitors(roadHalf);
    this.addVolcano();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The sea of clouds drifts slowly; the cable car's cabins climb and descend.
    if (this.cloudSea) this.cloudSea.offset.x = seconds * 0.002;
    this.cabins.forEach((c, i) => {
      const t = (((seconds / 240 + i * 0.5) % 1) + 1) % 1;
      const u = i % 2 ? 1 - t : t;
      c.position.set(1100 - u * 700, 300 + u * 1300, -4000 - u * 1000);
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops away below the slope falling to the clouds on the left. */
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
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.visitors.forEach((v, i) => {
        const metres = loopMetres(v.offset + v.speed * this.time, s, LOOP, BEHIND);
        const step = v.speed ? Math.abs(Math.sin(this.time * 4 + v.phase)) * 0.04 : 0;
        crowd.set(
          i,
          v.x,
          heightAt(metres) + step,
          -metres,
          v.speed > 0 ? 0 : v.speed < 0 ? Math.PI : -Math.PI / 2,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** Pumice verges; the caldera's banded cliffs rising on the right; the slope falling on the left. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const pumice = this.material({ map: this.repeat(pumiceTexture(), 2, 2), roughness: 1 });
    const lava = this.material({ map: this.repeat(lavaTexture(), 8, 8), roughness: 1 });
    const cliff = this.material({ map: this.repeat(cliffTexture(), 60, 1), roughness: 1 });
    this.ribbons.add(points, pumice, [
      [r + 6, 0.2],
      [r, 0.02],
    ]);
    this.ribbons.add(points, lava, [
      [r + 50, 6],
      [r + 6, 0.2],
    ]);
    this.ribbons.add(points, cliff, [
      [r + 140, 160],
      [r + 90, 120],
      [r + 50, 6],
    ]);
    this.ribbons.add(points, pumice, [
      [-r, 0.02],
      [-r - 5, -0.3],
    ]);
    this.ribbons.add(points, lava, [
      [-r - 5, -0.3],
      [-r - 60, -20],
      [-r - 600, -CLOUDS - 10],
    ]);
  }

  /** Blocks of black lava and red scoria on the verges. */
  private addRocks(roadHalf: number): void {
    const random = seeded(3501);
    const black = this.material({
      map: this.track(lavaTexture()),
      roughness: 1,
      flatShading: true,
    });
    const red = this.material({ color: 0x8a4a30, roughness: 1, flatShading: true });
    const rock = new DodecahedronGeometry(1, 0);
    this.disposables.push(rock);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 4) {
      const side = random() < 0.55 ? 1 : -1;
      const d = 3 + random() * 40;
      const b = new Mesh(rock, random() < 0.75 ? black : red);
      b.scale.set(0.6 + random() * 2.2, 0.4 + random() * 1.3, 0.6 + random() * 2.2);
      b.rotation.set(random(), random() * 6, random());
      b.castShadow = true;
      b.position.y =
        side > 0
          ? d < 6
            ? 0.1
            : 0.2 + ((d - 6) / 44) * 5.8
          : -0.3 - (Math.max(d - 5, 0) / 55) * 19.7;
      const holder = new Group();
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** Round retama bushes, the red spires of tajinaste, and Canary pines on the falling slope. */
  private addPlants(roadHalf: number): void {
    const random = seeded(3511);
    const retama = this.material({ color: 0xb8b890, roughness: 1, flatShading: true });
    const flower = this.material({ color: 0xd82a3a, roughness: 0.8, flatShading: true });
    const leaves = this.material({ color: 0x8a9a6a, roughness: 1 });
    const pine = this.material({ color: 0x3a5a2a, roughness: 1, flatShading: true });
    const bark = this.material({ color: 0x6a4a34, roughness: 1 });
    const bush = new SphereGeometry(1, 8, 6);
    bush.scale(1, 0.7, 1);
    const spire = new ConeGeometry(0.35, 2.6, 7);
    spire.translate(0, 1.6, 0);
    const rosette = new SphereGeometry(0.5, 6, 4);
    rosette.scale(1, 0.4, 1);
    const crown = new SphereGeometry(2.2, 8, 6);
    crown.scale(1, 1.4, 1);
    const trunk = new CylinderGeometry(0.15, 0.3, 8, 5);
    trunk.translate(0, 4, 0);
    this.disposables.push(bush, spire, rosette, crown, trunk);
    for (let offset = 0; offset < LOOP; offset += 1.4 + random() * 2.6) {
      const side = random() < 0.5 ? 1 : -1;
      const d = 1.5 + random() * 30;
      const plant = new Group();
      const kind = random();
      if (kind < 0.6) {
        const b = new Mesh(bush, retama);
        b.scale.setScalar(0.6 + random() * 0.8);
        b.position.y = 0.3;
        plant.add(b);
      } else if (kind < 0.88 || side > 0) {
        plant.add(new Mesh(rosette, leaves), new Mesh(spire, flower));
        plant.scale.setScalar(0.8 + random() * 0.7);
      } else {
        const c = new Mesh(crown, pine);
        c.position.y = 9;
        plant.add(new Mesh(trunk, bark), c);
      }
      plant.children.forEach((c) => (c.castShadow = true));
      plant.position.y =
        side > 0
          ? d < 6
            ? 0.1
            : 0.2 + ((d - 6) / 44) * 5.8
          : -0.3 - (Math.max(d - 5, 0) / 55) * 19.7;
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** The Roques de García: tall eroded spires of banded rock, the Cinchado on its narrow neck. */
  private addRoques(roadHalf: number): void {
    const rock = this.material({
      map: this.repeat(cliffTexture(), 2, 2),
      roughness: 1,
      flatShading: true,
    });
    const column = new CylinderGeometry(0.9, 1.1, 1, 11);
    this.disposables.push(column);
    for (const [offset, x, scale] of [
      [150, 1, 1],
      [300, -1, 0.8],
    ] as const) {
      const roque = new Group();
      // The Cinchado: a narrow neck under a broad, heavy cap.
      const base = new Mesh(column, rock);
      base.scale.set(7, 10, 7);
      base.position.y = 5;
      const neck = new Mesh(column, rock);
      neck.scale.set(3.5, 12, 3.5);
      neck.position.y = 16;
      const cap = new Mesh(column, rock);
      cap.scale.set(9, 14, 8);
      cap.position.y = 29;
      cap.rotation.z = 0.08;
      roque.add(base, neck, cap);
      // Lesser spires behind it.
      for (let k = 0; k < 4; k++) {
        const s = new Mesh(column, rock);
        const h = 18 + k * 7;
        s.scale.set(6 + k, h, 6);
        s.position.set(14 + k * 9, h / 2, -6 - k * 8);
        roque.add(s);
      }
      roque.children.forEach((c) => (c.castShadow = true));
      roque.scale.setScalar(scale);
      roque.position.y = x > 0 ? 3 : -8;
      const holder = new Group();
      holder.add(roque);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: x * (roadHalf + 40) });
    }
  }

  /** Visitors at the viewpoints and walking the verges in sun hats. */
  private addVisitors(roadHalf: number): void {
    const random = seeded(3521);
    for (let offset = 6; offset < LOOP; offset += 12 + random() * 18) {
      const looking = random() < 0.3;
      this.visitors.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.7 + random() * 1.2),
        speed: looking ? 0 : (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.visitors.length,
      VISITOR_WEAR,
      3527,
    );
  }

  /**
   * Ahead: Teide's cone with its pale summit and Pico Viejo's dark shoulder, the cable car
   * climbing it; the caldera's walls; and the sea of clouds below with La Palma rising from it.
   */
  private addVolcano(): void {
    const random = seeded(3531);
    const flank = this.material({ map: this.repeat(flankTexture(), 1, 1), roughness: 1 });
    const dark = this.material({
      map: this.repeat(lavaTexture(), 30, 30),
      roughness: 1,
      flatShading: true,
    });
    const cliff = this.material({
      map: this.repeat(cliffTexture(), 8, 1),
      roughness: 1,
      flatShading: true,
    });
    const cone = new ConeGeometry(1, 1, 32, 1, true);
    this.disposables.push(cone);
    const teide = new Mesh(cone, flank);
    teide.scale.set(3000, 1900, 3000);
    teide.position.set(300, 950 - 160, -5200);
    const pilon = new Mesh(new ConeGeometry(1, 1, 16), flank);
    pilon.scale.set(380, 300, 380);
    pilon.position.set(300, 1620, -5200);
    this.disposables.push(pilon.geometry);
    const viejo = new Mesh(cone, dark);
    viejo.scale.set(2400, 1300, 2000);
    viejo.position.set(-2000, 650 - 160, -5600);
    this.horizon.add(teide, pilon, viejo);
    // The cable car's line and its two cabins.
    const cable = new Mesh(this.unit, this.material({ color: 0x2a2a2a }));
    cable.scale.set(3, 3, Math.hypot(700, 1300, 1000));
    cable.position.set(750, 950, -4500);
    cable.lookAt(400, 1600, -5000);
    this.horizon.add(cable);
    const red = this.material({ color: 0xd82a2a, roughness: 0.5 });
    for (let k = 0; k < 2; k++) {
      const cabin = new Mesh(this.unit, red);
      cabin.scale.setScalar(30);
      this.cabins.push(cabin);
      this.horizon.add(cabin);
    }
    // The caldera's walls on the right, running round behind.
    for (let k = 0; k < 6; k++) {
      const wall = new Mesh(this.unit, cliff);
      const h = 220 + random() * 120;
      wall.scale.set(400, h, 300);
      wall.position.set(500 + k * 60, h / 2 - 20, -400 - k * 350);
      wall.rotation.y = 0.3 + random() * 0.2;
      this.horizon.add(wall);
    }
    // The sea of clouds, and La Palma's peaks breaking through it.
    const puff = this.track(cloudTexture());
    puff.wrapS = RepeatWrapping;
    puff.wrapT = RepeatWrapping;
    puff.repeat.set(40, 40);
    this.cloudSea = puff;
    const sea = new Mesh(
      new PlaneGeometry(30000, 30000),
      this.material({ map: puff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-15000, -CLOUDS, -5000);
    this.disposables.push(sea.geometry);
    this.horizon.add(sea);
    const palma = this.material({ color: 0x6a7a9a, roughness: 1, flatShading: true });
    for (const [x, z, w, h] of [
      [-9000, -6000, 3000, 900],
      [-11000, -3000, 2400, 700],
    ] as const) {
      const p = new Mesh(cone, palma);
      p.scale.set(w, h, w);
      p.position.set(x, -CLOUDS + h / 2 - 100, z);
      this.horizon.add(p);
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

/** Pale cream pumice gravel. */
function pumiceTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#c8b89a', 3541));
}

/** Black and dark brown lava clinker. */
function lavaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a322e', 3551);
    const random = seeded(3553);
    for (let i = 0; i < 220; i++) {
      g.fillStyle = ['#1e1a18', '#5a4a3e', '#6a3a2a', '#2a2422'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 1 + random() * 4, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The caldera's cliffs in bands of ochre, rust, cream and grey. */
function cliffTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const bands = ['#a8743e', '#8a4a30', '#d8c09a', '#6a5a4e', '#b8885a', '#7a3e2a'];
    for (let y = 0; y < 128; y += 8) {
      g.fillStyle = bands[(y / 8) % bands.length]!;
      g.fillRect(0, y, 128, 8);
    }
    const random = seeded(3561);
    g.fillStyle = 'rgba(40,30,24,0.3)';
    for (let i = 0; i < 40; i++)
      g.fillRect(random() * 128, random() * 128, 1 + random() * 2, 6 + random() * 20);
  });
}

/** Teide's flanks: brown and ochre lava streams down a pale pumice summit. */
function flankTexture(): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    speckle(g, 512, 256, '#7a5a42', 3571);
    const random = seeded(3573);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = ['#3a2e28', '#a87a50', '#5a3a2a'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 512, 30 + random() * 60, 4 + random() * 10, 80 + random() * 140);
    }
    const top = g.createLinearGradient(0, 0, 0, 60);
    top.addColorStop(0, '#e8dcc8');
    top.addColorStop(1, 'rgba(200,180,150,0)');
    g.fillStyle = top;
    g.fillRect(0, 0, 512, 60);
  });
}

/** The sea of clouds' tops: white billows with soft grey hollows. */
function cloudTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#f2f4f6';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(3581);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(190,200,212,${0.15 + random() * 0.25})`;
      g.beginPath();
      g.ellipse(
        random() * 128,
        random() * 128,
        6 + random() * 14,
        3 + random() * 6,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}
