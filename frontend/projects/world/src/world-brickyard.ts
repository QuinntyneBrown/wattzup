// Indianapolis Brickyard's straight, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the oval on race day in May under a hot blue sky. The rider runs the front straight with the
// outside wall's white SAFER barrier and its catch fence on the right, and behind them the
// grandstands climbing in tier on tier of colourful crowd under their roofs with flags along the
// top; on the left the pit wall, the pit lane with its crews and the pace car, and the infield's
// green beyond. Once a lap the yard of bricks crosses the track at the start-finish line under
// the starter's stand, the scoring pylon stands tall beside it, the glass pagoda rises over the
// infield, and far ahead the straight runs on into the banking of turn one. Built on the shared
// kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
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
import type { StreetPoint } from './world-oldtown';

/** The straight repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The yard of bricks and the start-finish line, once a lap. */
const BRICKS = 40;
/** The pit lane's width beyond the pit wall on the left. */
const PITS = 14;

const CREW_WEAR = {
  tops: ['#c8102e', '#1d1f24', '#ffd23f', '#2a7ad8', '#ffffff', '#ff9f1c'],
  bottoms: ['#1d1f24', '#c8102e', '#2a7ad8', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class BrickyardStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly crew: { offset: number; x: number; heading: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private readonly chequered: Mesh[] = [];
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
    this.addOutside(roadHalf, points);
    this.addInside(roadHalf, points);
    this.addBricks(roadHalf);
    this.addStandFlags(roadHalf);
    this.addPits(roadHalf);
    this.addInfield();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 3 + k * 0.6) * 0.5));
    // The starter waves the chequered flag.
    this.chequered.forEach((f) => (f.rotation.z = Math.sin(seconds * 6) * 0.9));
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
      this.crew.forEach((c, i) => {
        const metres = loopMetres(c.offset, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 2 + c.phase)) * 0.03;
        crowd.set(i, c.x, heightAt(metres) + step, -metres, c.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The outside wall and catch fence, the walkway, and the grandstands climbing tier on tier. */
  private addOutside(roadHalf: number, points: number): void {
    const r = roadHalf;
    const apron = this.material({ map: this.repeat(apronTexture(), 2, 2), roughness: 0.9 });
    const safer = this.material({ map: this.repeat(saferTexture(), 1, 1), roughness: 0.6 });
    const fence = this.material({
      map: this.repeat(fenceTexture(), 1, 1),
      transparent: true,
      depthWrite: false,
      roughness: 0.5,
      side: 2,
    });
    const concrete = this.material({ color: 0xc8c4bc, roughness: 0.9 });
    const stands = this.material({ map: this.repeat(standTexture(), 6, 30), roughness: 0.9 });
    const roof = this.material({ color: 0xe8e8e4, roughness: 0.6, side: 2 });
    this.ribbons.add(points, apron, [
      [r + 1.6, 0.01],
      [r, 0.004],
    ]);
    this.ribbons.add(points, safer, [
      [r + 1.6, 1.2],
      [r + 1.6, 0.01],
    ]);
    this.ribbons.add(points, concrete, [
      [r + 2.2, 1.2],
      [r + 1.6, 1.2],
    ]);
    this.ribbons.add(points, fence, [
      [r + 1.9, 5.5],
      [r + 1.9, 1.2],
    ]);
    this.ribbons.add(points, concrete, [
      [r + 10, 1.4],
      [r + 2.2, 1.2],
    ]);
    this.ribbons.add(points, stands, [
      [r + 70, 34],
      [r + 10, 4],
      [r + 10, 1.4],
    ]);
    this.ribbons.add(points, roof, [
      [r + 76, 44],
      [r + 40, 42],
    ]);
    this.ribbons.add(points, concrete, [
      [r + 76, 44],
      [r + 76, 34],
      [r + 70, 34],
    ]);
  }

  /** The inside: apron, the pit wall, and the pit lane's asphalt and the infield grass beyond. */
  private addInside(roadHalf: number, points: number): void {
    const r = roadHalf;
    const apron = this.material({ map: this.repeat(apronTexture(), 2, 2), roughness: 0.9 });
    const wall = this.material({ map: this.repeat(saferTexture(), 1, 1), roughness: 0.6 });
    const lane = this.material({ color: 0x5a5c62, roughness: 0.85 });
    const grass = this.material({ map: this.repeat(grassTexture(), 8, 8), roughness: 1 });
    this.ribbons.add(points, apron, [
      [-r, 0.004],
      [-r - 1.4, 0.01],
    ]);
    this.ribbons.add(points, wall, [
      [-r - 1.4, 0.01],
      [-r - 1.4, 1.1],
      [-r - 1.8, 1.1],
      [-r - 1.8, 0.02],
    ]);
    this.ribbons.add(points, lane, [
      [-r - 1.8, 0.02],
      [-r - PITS, 0.02],
    ]);
    this.ribbons.add(points, grass, [
      [-r - PITS, 0.02],
      [-r - 900, 0.4],
    ]);
  }

  /** The yard of bricks across the track at the start-finish line, the starter's stand over it, and the scoring pylon. */
  private addBricks(roadHalf: number): void {
    const line = new Group();
    const yard = new Mesh(
      new PlaneGeometry(roadHalf * 2 + 3, 0.95),
      this.material({ map: this.track(brickTexture(roadHalf)), roughness: 0.9 }),
    );
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(0.8, 0.02, 0);
    const stripe = new Mesh(
      new PlaneGeometry(roadHalf * 2, 0.3),
      this.material({ color: 0xffffff, roughness: 0.6 }),
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.021, -0.7);
    this.disposables.push(yard.geometry, stripe.geometry);
    line.add(yard, stripe);
    // The starter's stand, reaching out over the track from the outside wall.
    const white = this.material({ color: 0xf4f4f0, roughness: 0.6 });
    const post = new Mesh(this.unit, white);
    post.scale.set(0.5, 8, 0.5);
    post.position.set(roadHalf + 2.6, 4, 0);
    const deck = new Mesh(this.unit, white);
    deck.scale.set(6, 1.1, 2.2);
    deck.position.set(roadHalf - 0.2, 8.2, 0);
    const flag = new Mesh(
      new PlaneGeometry(1.4, 1),
      this.material({ map: this.track(chequerTexture()), side: 2 }),
    );
    flag.geometry.translate(0.7, 0.5, 0);
    this.disposables.push(flag.geometry);
    const arm = new Group();
    arm.position.set(roadHalf - 2.6, 9, 0);
    arm.add(flag);
    this.chequered.push(flag);
    line.add(post, deck, arm);
    // The scoring pylon: a tall tower of running positions.
    const pylon = new Mesh(
      this.unit,
      this.material({
        map: this.track(pylonTexture()),
        emissive: 0xffffff,
        emissiveMap: this.track(pylonTexture()),
        emissiveIntensity: 0.4,
      }),
    );
    pylon.scale.set(4, 40, 4);
    pylon.position.set(-roadHalf - PITS - 10, 20, 10);
    line.add(pylon);
    line.children.forEach((c) => (c.castShadow = true));
    this.group.add(line);
    this.props.push({ mesh: line, offset: BRICKS, x: 0 });
  }

  /** Flags along the top of the grandstands. */
  private addStandFlags(roadHalf: number): void {
    const cloth = new PlaneGeometry(2.4, 1.5);
    cloth.translate(1.2, 0, 0);
    const pole = new CylinderGeometry(0.06, 0.06, 6, 5);
    pole.translate(0, 3, 0);
    this.disposables.push(cloth, pole);
    const designs = [
      chequerTexture(),
      starsTexture(),
      flagStripeTexture('#c8102e', '#ffffff'),
      flagStripeTexture('#ffd23f', '#1d1f24'),
    ].map((t) => this.material({ map: this.track(t), side: 2, roughness: 0.8 }));
    const steel = this.material({ color: 0xb8b8b4, metalness: 0.5, roughness: 0.4 });
    for (let offset = 0, k = 0; offset < LOOP; offset += 12, k++) {
      const holder = new Group();
      const f = new Mesh(cloth, designs[k % designs.length]!);
      f.position.y = 5.2;
      this.flags.push(f);
      holder.add(new Mesh(pole, steel), f);
      holder.position.set(0, 44, 0);
      const outer = new Group();
      outer.add(holder);
      this.group.add(outer);
      this.props.push({ mesh: outer, offset, x: roadHalf + 74 });
    }
  }

  /** The pit lane: garages, crews at work and the pace car waiting with its light bar. */
  private addPits(roadHalf: number): void {
    const random = seeded(2901);
    const garages = this.material({ map: this.track(garageTexture()), roughness: 0.7 });
    for (let offset = 0; offset < LOOP; offset += 24) {
      const g = new Group();
      const block = new Mesh(this.unit, garages);
      block.scale.set(8, 5, 24);
      block.position.y = 2.5;
      block.receiveShadow = true;
      g.add(block);
      this.group.add(g);
      this.props.push({ mesh: g, offset, x: -roadHalf - PITS - 4 });
    }
    for (let offset = 6; offset < LOOP; offset += 12 + random() * 14) {
      const n = 2 + Math.floor(random() * 4);
      for (let k = 0; k < n; k++)
        this.crew.push({
          offset: offset + random() * 4,
          x: -roadHalf - 4 - random() * (PITS - 6),
          heading: random() * 6,
          phase: random() * 6,
        });
    }
    this.crowd = new Figures(this.group, this.disposables, this.crew.length, CREW_WEAR, 2907);
    // The pace car.
    const car = new Group();
    const body = new Mesh(
      this.unit,
      this.material({ color: 0xf4f4f0, metalness: 0.4, roughness: 0.3 }),
    );
    body.scale.set(1.9, 0.7, 4.6);
    body.position.y = 0.55;
    const cabin = new Mesh(this.unit, this.material({ color: 0x2a3440, roughness: 0.2 }));
    cabin.scale.set(1.6, 0.5, 2);
    cabin.position.set(0, 1.1, 0.3);
    const stripe = new Mesh(this.unit, this.material({ color: 0xc8102e }));
    stripe.scale.set(0.5, 0.72, 4.62);
    stripe.position.y = 0.56;
    const bar = new Mesh(
      this.unit,
      this.material({ color: 0xffb020, emissive: 0xffa000, emissiveIntensity: 1.5 }),
    );
    bar.scale.set(1.2, 0.12, 0.3);
    bar.position.set(0, 1.42, 0.3);
    car.add(body, cabin, stripe, bar);
    car.children.forEach((c) => (c.castShadow = true));
    this.group.add(car);
    this.props.push({ mesh: car, offset: BRICKS + 30, x: -roadHalf - 6 });
  }

  /**
   * The infield: the glass pagoda over the start-finish, the grandstands sweeping on round turn
   * one far ahead, and the city's towers beyond the oval.
   */
  private addInfield(): void {
    const random = seeded(2911);
    const pagoda = new Group();
    const glass = this.material({
      color: 0x8ab0c8,
      metalness: 0.5,
      roughness: 0.15,
      emissive: 0x2a4a5a,
      emissiveIntensity: 0.3,
    });
    const frame = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    for (let k = 0; k < 9; k++) {
      const w = 26 - k * 2.2;
      const tier = new Mesh(this.unit, glass);
      tier.scale.set(w, 4.4, w * 0.6);
      tier.position.y = 2.2 + k * 5;
      const eave = new Mesh(this.unit, frame);
      eave.scale.set(w + 3, 0.5, w * 0.6 + 3);
      eave.position.y = 4.6 + k * 5;
      pagoda.add(tier, eave);
    }
    pagoda.position.set(-90, 0, -170);
    this.horizon.add(pagoda);
    // The grandstands sweeping round turn one, far ahead, and across the oval on the left.
    const stands = this.material({ map: this.repeat(standTexture(), 4, 4), roughness: 0.9 });
    for (const [x, z, w, d, ry] of [
      [120, -900, 400, 60, -0.2],
      [-260, -1050, 500, 60, 0.4],
      [-700, -500, 900, 50, Math.PI / 2],
    ] as const) {
      const s = new Mesh(this.unit, stands);
      s.scale.set(w, 30, d);
      s.position.set(x, 15, z);
      s.rotation.y = ry;
      this.horizon.add(s);
    }
    const tower = this.material({ map: this.track(cityTexture()), roughness: 0.4, metalness: 0.3 });
    for (let k = 0; k < 14; k++) {
      const b = new Mesh(this.unit, tower);
      const h = 50 + random() * 140;
      b.scale.set(25 + random() * 25, h, 25 + random() * 25);
      b.position.set(-500 + random() * 700, h / 2, -2200 - random() * 300);
      this.horizon.add(b);
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

/** The pale concrete apron. */
function apronTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#a8a49c', 2921));
}

/** The SAFER barrier: white foam panels with dark seams and rubber marks. */
function saferTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(40,40,44,0.5)';
    for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 64, 2);
    g.fillStyle = 'rgba(30,30,30,0.25)';
    g.fillRect(48, 0, 16, 128);
  });
}

/** The catch fence: steel mesh with cables. */
function fenceTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(180,184,190,0.7)';
    g.lineWidth = 1;
    for (let k = -64; k < 128; k += 8) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + 64, 64);
      g.moveTo(k + 64, 0);
      g.lineTo(k, 64);
      g.stroke();
    }
    g.fillStyle = 'rgba(90,94,100,0.9)';
    for (const x of [0, 21, 42]) g.fillRect(x, 0, 2, 64);
  });
}

/** Grandstand rows packed with the crowd in every colour, aisles between. */
function standTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#8a8e96';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(2931);
    const colours = [
      '#c8102e',
      '#ffffff',
      '#2a7ad8',
      '#ffd23f',
      '#1d1f24',
      '#ff9f1c',
      '#2a8a4a',
      '#f0c8a0',
      '#e2b48c',
    ];
    for (let x = 0; x < 256; x += 8) {
      for (let y = 0; y < 256; y += 5) {
        if (y % 64 < 5) continue;
        g.fillStyle = colours[Math.floor(random() * colours.length)]!;
        g.fillRect(x + 1, y, 5, 4);
      }
      g.fillStyle = '#5a5e66';
      g.fillRect(x + 6, 0, 2, 256);
    }
  });
}

/** The infield's mown grass. */
function grassTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a8a3a', 2941);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 16, 128);
  });
}

/** The yard of bricks: weathered red brick laid in a strip. */
function brickTexture(roadHalf: number): CanvasTexture {
  const w = Math.round((roadHalf * 2 + 3) * 40);
  return canvasTexture(w, 38, (g) => {
    g.fillStyle = '#6a4a3a';
    g.fillRect(0, 0, w, 38);
    const random = seeded(2951);
    for (let y = 0; y < 38; y += 9.5)
      for (let x = (y / 9.5) % 2 ? -10 : 0; x < w; x += 20) {
        g.fillStyle = ['#a8483a', '#9a3a2a', '#b85a44', '#8a3a30'][Math.floor(random() * 4)]!;
        g.fillRect(x + 1, y + 1, 18, 7.5);
      }
  });
}

/** The chequered flag. */
function chequerTexture(): CanvasTexture {
  return canvasTexture(64, 48, (g) => {
    for (let y = 0; y < 48; y += 8)
      for (let x = 0; x < 64; x += 8) {
        g.fillStyle = (x + y) % 16 ? '#1d1f24' : '#ffffff';
        g.fillRect(x, y, 8, 8);
      }
  });
}

/** Stars and stripes. */
function starsTexture(): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    for (let y = 0; y < 13; y++) {
      g.fillStyle = y % 2 ? '#ffffff' : '#b22234';
      g.fillRect(0, (y * 64) / 13, 96, 64 / 13 + 1);
    }
    g.fillStyle = '#3c3b6e';
    g.fillRect(0, 0, 40, 34);
    g.fillStyle = '#ffffff';
    for (let y = 4; y < 34; y += 7) for (let x = 4; x < 40; x += 7) g.fillRect(x, y, 2, 2);
  });
}

/** A two-colour striped pennant. */
function flagStripeTexture(a: string, b: string): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    for (let y = 0; y < 64; y += 16) {
      g.fillStyle = (y / 16) % 2 ? b : a;
      g.fillRect(0, y, 96, 16);
    }
  });
}

/** The scoring pylon: car numbers stacked in lit cells. */
function pylonTexture(): CanvasTexture {
  return canvasTexture(64, 512, (g) => {
    g.fillStyle = '#1d1f24';
    g.fillRect(0, 0, 64, 512);
    const random = seeded(2961);
    g.font = 'bold 22px sans-serif';
    g.textAlign = 'center';
    for (let y = 8; y < 512; y += 30) {
      g.fillStyle = '#2a2c30';
      g.fillRect(6, y, 52, 26);
      g.fillStyle = '#ffffff';
      g.fillText(String(1 + Math.floor(random() * 99)), 32, y + 21);
    }
    g.fillStyle = '#ffd23f';
    g.fillRect(6, 0, 52, 6);
  });
}

/** The pit garages' fronts: roller doors in team colours. */
function garageTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#d8d8d4';
    g.fillRect(0, 0, 256, 64);
    const colours = ['#c8102e', '#2a7ad8', '#ffd23f', '#1d1f24', '#ff9f1c', '#2a8a4a'];
    for (let x = 4, k = 0; x < 256; x += 42, k++) {
      g.fillStyle = colours[k % colours.length]!;
      g.fillRect(x, 16, 38, 48);
      g.fillStyle = 'rgba(255,255,255,0.15)';
      for (let y = 20; y < 64; y += 6) g.fillRect(x, y, 38, 1);
    }
  });
}

/** Downtown's towers. */
function cityTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#6a7a8a';
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(200,220,240,0.45)';
    for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) g.fillRect(x, y, 5, 5);
  });
}
