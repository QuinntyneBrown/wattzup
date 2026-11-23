// The Isle of Skye's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Glen
// Brittle on a soft, grey morning with the mist down. The rider follows the single-track road
// over the moor, wet and shining, its white diamond passing-place signs on their posts. Heather
// and rust-brown bracken roll away either side, black peat banks are cut into the slope, a burn
// tumbles in little falls over the rocks to a still lochan, blackface sheep wander the verges
// and a shaggy Highland cow stands in the grass. A white croft and its byre sit by the road
// with peat smoke at the chimney. Banks of mist drift across the glen, and through them the
// black, jagged ridge of the Cuillin appears and vanishes. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
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
const LOOP = 360;
const BEHIND = 24;

const WALKER_WEAR = {
  tops: ['#d8442a', '#2a6a9a', '#e8c040', '#3a8a5a', '#1d1f24', '#c8102e'],
  bottoms: ['#2f3e5c', '#1d1f24', '#5a5f69', '#3a3e44'],
  skins: ['#f0c8a0', '#f5d3b5', '#e2b48c', '#c48a5f'],
};

interface Bank {
  readonly mesh: Mesh;
  readonly x: number;
  readonly z: number;
  readonly speed: number;
  readonly phase: number;
}

export class SkyeStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly sheep: { mesh: Group; phase: number }[] = [];
  private readonly smoke: Mesh[] = [];
  private readonly falls: Texture[] = [];
  private readonly banks: Bank[] = [];
  private cuillin: MeshStandardMaterial | null = null;
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
    this.addMoor(roadHalf, points);
    this.addPassingPlaces(roadHalf);
    this.addHeather(roadHalf);
    this.addBurn(roadHalf);
    this.addCroft(roadHalf);
    this.addAnimals(roadHalf);
    this.addWalkers(roadHalf);
    this.addCuillin();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The mist drifts across the glen, and the Cuillin come and go behind it.
    for (const b of this.banks) {
      const t = ((seconds * b.speed + b.phase) % 1200) - 600;
      b.mesh.position.set(b.x + t, b.mesh.position.y, b.z);
    }
    if (this.cuillin) this.cuillin.opacity = 0.6 + Math.sin(seconds * 0.12) * 0.3;
    for (const t of this.falls) t.offset.y = seconds * 0.6;
    this.smoke.forEach((p, i) => {
      const t = (((seconds * 0.15 + i / this.smoke.length) % 1) + 1) % 1;
      p.position.set(1.2 + t * 3, 6.5 + t * 6, t * 1.5);
      p.scale.setScalar(0.5 + t * 1.6);
      (p.material as MeshStandardMaterial).opacity = 0.5 * (1 - t);
    });
    for (const s of this.sheep)
      s.mesh.children[1]!.rotation.x = 0.5 + Math.sin(seconds * 0.9 + s.phase) * 0.5;
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
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04;
        crowd.set(i, w.x, heightAt(metres) + step, -metres, w.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The moor: the grass verges and the heather and bracken rolling away either side. */
  private addMoor(roadHalf: number, points: number): void {
    const r = roadHalf;
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const moor = this.material({ map: this.repeat(moorTexture(), 3, 3), roughness: 1 });
    this.ribbons.add(points, verge, [
      [r + 2, 0.05],
      [r, 0.01],
    ]);
    this.ribbons.add(points, moor, [
      [r + 300, 40],
      [r + 40, 4],
      [r + 2, 0.05],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.01],
      [-r - 2, 0.05],
    ]);
    this.ribbons.add(points, moor, [
      [-r - 2, 0.05],
      [-r - 40, 2],
      [-r - 300, 18],
    ]);
  }

  /** The white diamond passing-place signs on their posts. */
  private addPassingPlaces(roadHalf: number): void {
    const post = this.material({ color: 0x3a3e44, roughness: 0.6 });
    const face = this.material({ map: this.track(passingTexture()), roughness: 0.5 });
    for (let offset = 30; offset < LOOP; offset += 90) {
      const sign = new Group();
      const pole = new Mesh(this.unit, post);
      pole.scale.set(0.08, 2.2, 0.08);
      pole.position.y = 1.1;
      const diamond = new Mesh(this.unit, face);
      diamond.scale.set(0.9, 0.9, 0.04);
      diamond.position.y = 2.2;
      diamond.rotation.z = Math.PI / 4;
      sign.add(pole, diamond);
      const holder = new Group();
      holder.add(sign);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset,
        x: (offset % 180 === 30 ? 1 : -1) * (roadHalf + 1.3),
      });
    }
  }

  /** Heather in purple clumps, rust-brown bracken, grey boulders and the black peat banks. */
  private addHeather(roadHalf: number): void {
    const random = seeded(3801);
    const heathers = [0x7a4a6a, 0x8a5a7a, 0x6a4a5a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const bracken = [0x9a5a2a, 0xa86a34, 0x7a4a24].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const rock = this.material({ color: 0x6a6a68, roughness: 1, flatShading: true });
    const peat = this.material({ map: this.repeat(peatTexture(), 1, 1), roughness: 1 });
    const clump = new DodecahedronGeometry(0.6, 0);
    clump.scale(1.3, 0.55, 1.3);
    const frond = new ConeGeometry(0.5, 0.9, 5);
    frond.translate(0, 0.45, 0);
    const stone = new DodecahedronGeometry(1, 0);
    this.disposables.push(clump, frond, stone);
    for (let offset = 0; offset < LOOP; offset += 0.7 + random() * 1.3) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 2.2 + random() * 32;
      const kind = random();
      let mesh: Mesh;
      if (kind < 0.5) mesh = new Mesh(clump, heathers[Math.floor(random() * heathers.length)]!);
      else if (kind < 0.88) mesh = new Mesh(frond, bracken[Math.floor(random() * bracken.length)]!);
      else {
        mesh = new Mesh(stone, rock);
        mesh.scale.set(0.5 + random(), 0.4 + random() * 0.6, 0.5 + random());
        mesh.rotation.set(random(), random() * 6, random());
      }
      if (kind < 0.88) mesh.scale.multiplyScalar(0.7 + random() * 0.7);
      mesh.castShadow = true;
      mesh.position.y = side > 0 ? 0.05 + (d / 40) * 3.95 : 0.05 + (d / 40) * 1.95;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
    // The peat banks, cut in steps into the slope with stacks drying beside them.
    for (const offset of [80, 250]) {
      const bank = new Group();
      for (let k = 0; k < 3; k++) {
        const step = new Mesh(this.unit, peat);
        step.scale.set(1.2, 0.8, 14);
        step.position.set(k * 1.4, 0.4 + k * 0.5, 0);
        bank.add(step);
      }
      for (let k = 0; k < 4; k++) {
        const stack = new Mesh(new ConeGeometry(0.6, 1, 6), peat);
        stack.position.set(-2, 0.5, -5 + k * 3);
        this.disposables.push(stack.geometry);
        bank.add(stack);
      }
      bank.position.y = 1.0;
      const holder = new Group();
      holder.add(bank);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 12 });
    }
  }

  /** The burn tumbling over its rocks in little falls to a still lochan. */
  private addBurn(roadHalf: number): void {
    const rock = this.material({ color: 0x4a4a4a, roughness: 0.9, flatShading: true });
    const pool = this.material({
      color: 0x4a6a78,
      roughness: 0.05,
      metalness: 0.5,
      emissive: 0x1a2a34,
      emissiveIntensity: 0.3,
    });
    const stone = new DodecahedronGeometry(1, 0);
    this.disposables.push(stone);
    for (const offset of [140, 320]) {
      const burn = new Group();
      for (let k = 0; k < 3; k++) {
        const pour = this.track(fallTexture());
        pour.wrapS = RepeatWrapping;
        pour.wrapT = RepeatWrapping;
        this.falls.push(pour);
        const fall = new Mesh(
          new PlaneGeometry(1.6, 1.4),
          this.material({
            map: pour,
            transparent: true,
            depthWrite: false,
            emissive: 0xc8d8e0,
            emissiveIntensity: 0.3,
          }),
        );
        fall.position.set(-6 - k * 4, 1.2 + k * 1.2, 0);
        fall.rotation.y = Math.PI / 2;
        this.disposables.push(fall.geometry);
        for (const z of [-1.4, 1.4]) {
          const r = new Mesh(stone, rock);
          r.scale.set(1.2, 1 + k * 0.6, 0.9);
          r.position.set(-6 - k * 4, 1 + k * 0.6, z);
          burn.add(r);
        }
        burn.add(fall);
      }
      const lochan = new Mesh(new SphereGeometry(1, 16, 4, 0, Math.PI * 2, 0, 0.3), pool);
      lochan.scale.set(7, 0.05, 9);
      lochan.position.set(-1, 0.1, 0);
      burn.add(lochan);
      const holder = new Group();
      holder.add(burn);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 6 });
    }
  }

  /** A white croft and its byre by the road, peat smoke at the chimney. */
  private addCroft(roadHalf: number): void {
    const white = this.material({ map: this.track(croftTexture()), roughness: 0.9 });
    const slate = this.material({ color: 0x3a3e44, roughness: 0.7 });
    const stone = this.material({ color: 0x7a7670, roughness: 1 });
    const iron = this.material({ color: 0x8a3a2a, roughness: 0.8 });
    const croft = new Group();
    const body = new Mesh(this.unit, white);
    body.scale.set(6, 4, 11);
    body.position.y = 2;
    for (const side of [-1, 1]) {
      const pitch = new Mesh(this.unit, slate);
      pitch.scale.set(3.9, 0.2, 11.6);
      pitch.position.set(side * 1.55, 5.0, 0);
      pitch.rotation.z = side * -0.68;
      croft.add(pitch);
    }
    for (const z of [-5.3, 5.3]) {
      const chimney = new Mesh(this.unit, stone);
      chimney.scale.set(0.8, 1.4, 0.8);
      chimney.position.set(0, 6.2, z);
      croft.add(chimney);
    }
    const byre = new Mesh(this.unit, stone);
    byre.scale.set(4.5, 2.6, 7);
    byre.position.set(1, 1.3, -11);
    const tin = new Mesh(this.unit, iron);
    tin.scale.set(5, 0.15, 7.4);
    tin.position.set(1, 2.75, -11);
    tin.rotation.z = 0.15;
    croft.add(body, byre, tin);
    croft.children.forEach((c) => (c.castShadow = true));
    const puff = new SphereGeometry(1, 8, 6);
    this.disposables.push(puff);
    for (let k = 0; k < 6; k++) {
      const p = new Mesh(
        puff,
        this.material({ color: 0xc8c4c0, transparent: true, opacity: 0.4, depthWrite: false }),
      );
      this.smoke.push(p);
      const chimney = new Group();
      chimney.position.set(-1.2, 0, 5.3);
      chimney.add(p);
      croft.add(chimney);
    }
    croft.position.y = 1.4;
    const holder = new Group();
    holder.add(croft);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 120, x: roadHalf + 16 });
  }

  /** Blackface sheep on the verges and a shaggy Highland cow in the grass. */
  private addAnimals(roadHalf: number): void {
    const random = seeded(3811);
    const fleece = this.material({ color: 0xe8e2d4, roughness: 1, flatShading: true });
    const black = this.material({ color: 0x1d1d1d, roughness: 1 });
    const ginger = this.material({ color: 0xb8622a, roughness: 1, flatShading: true });
    const horn = this.material({ color: 0xe8dcc0, roughness: 0.6 });
    const body = new DodecahedronGeometry(0.5, 1);
    body.scale(0.9, 0.8, 1.4);
    const head = new BoxGeometry(0.25, 0.3, 0.4);
    head.translate(0, 0, -0.2);
    const leg = new CylinderGeometry(0.05, 0.05, 0.5, 4);
    leg.translate(0, -0.25, 0);
    this.disposables.push(body, head, leg);
    for (let offset = 15; offset < LOOP; offset += 25 + random() * 30) {
      const sheep = new Group();
      const b = new Mesh(body, fleece);
      b.position.y = 0.75;
      const neck = new Group();
      neck.position.set(0, 0.85, -0.65);
      neck.add(new Mesh(head, black));
      sheep.add(b, neck);
      for (const [x, z] of [
        [-0.2, -0.4],
        [0.2, -0.4],
        [-0.2, 0.4],
        [0.2, 0.4],
      ] as const) {
        const l = new Mesh(leg, black);
        l.position.set(x, 0.5, z);
        sheep.add(l);
      }
      sheep.rotation.y = random() * 6;
      sheep.children.forEach((c) => (c.castShadow = true));
      this.sheep.push({ mesh: sheep, phase: random() * 6 });
      const holder = new Group();
      holder.add(sheep);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.8 + random() * 5),
      });
    }
    // The Highland cow: long ginger coat, the fringe over its eyes, the wide horns.
    const cow = new Group();
    const coat = new Mesh(new DodecahedronGeometry(1, 1), ginger);
    coat.scale.set(0.9, 0.85, 1.6);
    coat.position.y = 1.2;
    const face = new Mesh(new DodecahedronGeometry(0.45, 1), ginger);
    face.position.set(0, 1.3, -1.6);
    const horns = new Mesh(new CylinderGeometry(0.06, 0.12, 1.8, 6), horn);
    horns.rotation.z = Math.PI / 2;
    horns.position.set(0, 1.6, -1.6);
    cow.add(coat, face, horns);
    for (const [x, z] of [
      [-0.45, -0.9],
      [0.45, -0.9],
      [-0.45, 0.9],
      [0.45, 0.9],
    ] as const) {
      const l = new Mesh(leg, ginger);
      l.scale.set(2.4, 1.8, 2.4);
      l.position.set(x, 0.9, z);
      cow.add(l);
    }
    this.disposables.push(coat.geometry, face.geometry, horns.geometry);
    cow.rotation.y = 0.9;
    cow.children.forEach((c) => (c.castShadow = true));
    const holder = new Group();
    holder.add(cow);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 45, x: roadHalf + 7 });
  }

  /** Walkers in bright waterproofs on the road's edge. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(3821);
    for (let offset = 10; offset < LOOP; offset += 30 + random() * 30)
      this.walkers.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.4),
        speed: (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.3),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.walkers.length, WALKER_WEAR, 3827);
  }

  /** The Cuillin's black, jagged ridge through the mist, the moorland hills, and the mist banks. */
  private addCuillin(): void {
    const random = seeded(3831);
    const gabbro = this.material({
      color: 0x2a2c30,
      roughness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0.7,
    });
    this.cuillin = gabbro;
    const hills = this.material({
      map: this.repeat(moorTexture(), 30, 30),
      color: 0x8a8070,
      roughness: 1,
      flatShading: true,
    });
    const cone = new ConeGeometry(1, 1, 5);
    this.disposables.push(cone);
    // The ridge: a long row of sharp black peaks, notched and pinnacled.
    for (let k = 0; k < 18; k++) {
      const peak = new Mesh(cone, gabbro);
      const h = 110 + random() * 130;
      peak.scale.set(70 + random() * 70, h, 70 + random() * 50);
      peak.position.set(-700 + k * 85 + random() * 30, h / 2 + 120, -1000 - random() * 60);
      peak.rotation.y = random() * 3;
      this.horizon.add(peak);
    }
    const shoulder = new Mesh(cone, gabbro);
    shoulder.scale.set(1900, 300, 300);
    shoulder.position.set(0, 140, -1050);
    this.horizon.add(shoulder);
    // The moorland's lower hills nearer by.
    for (const [x, z, w, h] of [
      [-320, -380, 400, 70],
      [340, -420, 460, 90],
      [-500, -100, 300, 60],
      [520, -150, 360, 80],
    ] as const) {
      const hill = new Mesh(new SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), hills);
      hill.scale.set(w, h, w * 0.6);
      hill.position.set(x, 0, z);
      this.disposables.push(hill.geometry);
      this.horizon.add(hill);
    }
    // The low grey overcast closing the sky over the glen.
    const overcast = new Mesh(
      new PlaneGeometry(9000, 9000),
      this.material({
        color: 0xb4bac0,
        emissive: 0xa8aeb4,
        emissiveIntensity: 0.8,
        roughness: 1,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      }),
    );
    overcast.rotation.x = Math.PI / 2;
    overcast.position.set(0, 420, -2000);
    this.disposables.push(overcast.geometry);
    this.horizon.add(overcast);
    // The mist banks drifting across the glen.
    const mist = this.material({
      map: this.track(mistTexture()),
      transparent: true,
      depthWrite: false,
      roughness: 1,
      emissive: 0xc8ccd0,
      emissiveIntensity: 0.5,
    });
    const sheet = new PlaneGeometry(1, 1);
    this.disposables.push(sheet);
    for (let k = 0; k < 9; k++) {
      const bank = new Mesh(sheet, mist);
      const z = -60 - k * 70;
      bank.scale.set(260 + random() * 200, 40 + k * 8, 1);
      bank.position.y = 10 + k * 9;
      this.banks.push({ mesh: bank, x: 0, z, speed: 3 + random() * 4, phase: random() * 1200 });
      this.horizon.add(bank);
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

/** The road's wet grass verge. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#5a7a3a', 3841));
}

/** The moor: heather purple, bracken rust and sedge green in patches. */
function moorTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a6a3e', 3851);
    const random = seeded(3853);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = ['#7a4a6a', '#9a5a2a', '#5a7a3a', '#4a4a3a'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.ellipse(
        random() * 128,
        random() * 128,
        3 + random() * 8,
        2 + random() * 4,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}

/** Black peat, cut and drying. */
function peatTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#2a221c', 3861);
    g.fillStyle = 'rgba(80,64,48,0.5)';
    for (let y = 4; y < 64; y += 10) g.fillRect(0, y, 64, 2);
  });
}

/** The passing-place sign: PASSING PLACE in black on its white diamond. */
function passingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, 128, 128);
    g.save();
    g.translate(64, 64);
    g.rotate(-Math.PI / 4);
    g.fillStyle = '#111111';
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('PASSING', 0, -12);
    g.fillText('PLACE', 0, 12);
    g.restore();
  });
}

/** The burn's white water. */
function fallTexture(): CanvasTexture {
  return canvasTexture(32, 64, (g) => {
    g.clearRect(0, 0, 32, 64);
    const random = seeded(3871);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = `rgba(255,255,255,${0.4 + random() * 0.6})`;
      g.fillRect(random() * 32, random() * 64, 1 + random() * 2, 4 + random() * 10);
    }
  });
}

/** The croft's whitewashed rubble walls with a deep-set window and the door. */
function croftTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#eae6de', 3881);
    g.fillStyle = '#2a3440';
    g.fillRect(20, 20, 16, 16);
    g.fillRect(92, 20, 16, 16);
    g.fillStyle = '#2a5a8a';
    g.fillRect(56, 24, 16, 40);
  });
}

/** A mist bank: soft white, thickest in the middle and fading at every edge. */
function mistTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    const random = seeded(3891);
    for (let i = 0; i < 40; i++) {
      const x = 30 + random() * 196;
      const y = 20 + random() * 24;
      const r = 14 + random() * 24;
      const blob = g.createRadialGradient(x, y, 0, x, y, r);
      blob.addColorStop(0, 'rgba(236,238,240,0.5)');
      blob.addColorStop(1, 'rgba(236,238,240,0)');
      g.fillStyle = blob;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}
