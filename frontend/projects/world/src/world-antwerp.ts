// The Antwerp Port Sprint, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): a flat, fast
// road through Europe's second port on a bright, breezy spring afternoon, clouds racing in off the
// North Sea. The rider sprints along the dead-straight quay road beside a dock basin where barges
// and a container ship lie moored, bollards and rail tracks on the quay. On the other side
// containers are stacked high in every colour, and blue and red gantry cranes stride over them.
// The finish is set up for the bunch sprint: the red kite of the flamme rouge, banners on the
// barriers, the crowd thick behind them banging on the boards, and the finish gantry ahead. Beyond,
// the Port House's glass diamond sits on its old fire station, wind turbines turn along the
// Scheldt, and the cathedral's spire rises over the city. Built on the shared kit (world-kit.ts) on
// the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
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

/** The port repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 420;
const BEHIND = 24;
/** The dock's water lies DOCK metres below the quay, from QUAY metres beyond the verge. */
const DOCK = 3;
const QUAY = 14;

/** The colours of the containers. */
const BOXES = [
  '#c8302a',
  '#1d5aa8',
  '#2a8a5a',
  '#e8a020',
  '#8a8a8a',
  '#f0f0ec',
  '#5a3a8a',
  '#d86a2a',
  '#2ab0c8',
];

const FAN_WEAR = {
  tops: ['#ffd23f', '#1d1f24', '#d8102e', '#ffffff', '#1d5aa8', '#f08a2a', '#3a8a5a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a6a9a'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class AntwerpStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly rotors: Group[] = [];
  private readonly flags: Mesh[] = [];
  private water: Texture | null = null;
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
    this.addQuay(roadHalf, points);
    this.addDock(roadHalf);
    this.addContainers(roadHalf);
    this.addCranes(roadHalf);
    this.addFinish(roadHalf);
    this.addCrowd(roadHalf);
    this.addSkyline();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.water) this.water.offset.set(seconds * 0.004, seconds * 0.002);
    this.rotors.forEach((r, k) => (r.rotation.z = seconds * (0.9 + k * 0.05)));
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 4 + k * 1.3) * 0.5));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the dock's water. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - DOCK - 1);
      position.setY(i * 2 + 1, p.height - DOCK - 1);
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
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        // The fans bang on the boards and jump as the bunch comes through.
        const jump = Math.max(0, Math.sin(this.time * 5 + p.phase)) * 0.12;
        const heading =
          (p.x < 0 ? -Math.PI / 2 : Math.PI / 2) + Math.sin(this.time * 0.7 + p.phase) * 0.5;
        crowd.set(i, p.x, heightAt(metres) + jump, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The wide quay road, its kerbs, the concrete quay and the dock's water on the left. */
  private addQuay(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.8 });
    const quay = this.material({ map: this.repeat(quayTexture(), 4, 4), roughness: 0.95 });
    const water = this.track(waterTexture());
    water.wrapS = RepeatWrapping;
    water.wrapT = RepeatWrapping;
    water.repeat.set(1 / 8, 1 / 8);
    this.water = water;
    const dock = this.material({ map: water, color: 0x5a7a8a, roughness: 0.2, metalness: 0.3 });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, quay, [
      [r + 200, 0.05],
      [r, 0.04],
    ]);
    this.ribbons.add(points, quay, [
      [-r, 0.04],
      [-r - QUAY, 0.05],
    ]);
    this.ribbons.add(points, quay, [
      [-r - QUAY, 0.05],
      [-r - QUAY - 0.2, -DOCK],
    ]);
    this.ribbons.add(points, dock, [
      [-r - QUAY - 0.2, -DOCK + 0.6],
      [-r - 400, -DOCK + 0.6],
    ]);
  }

  /** The bollards and rails on the quay, and the barges and container ship moored in the dock. */
  private addDock(roadHalf: number): void {
    const random = seeded(6501);
    const iron = this.material({ color: 0x1d1f24, roughness: 0.6, metalness: 0.5 });
    const rail = this.material({ color: 0x6a5a4a, roughness: 0.6, metalness: 0.6 });
    const bollard = new CylinderGeometry(0.25, 0.3, 0.7, 8);
    bollard.translate(0, 0.35, 0);
    this.disposables.push(bollard);
    for (let offset = 0; offset < LOOP; offset += 15) {
      const b = new Group();
      b.add(new Mesh(bollard, iron));
      const h = new Group();
      h.add(b);
      this.group.add(h);
      this.props.push({ mesh: h, offset, x: -roadHalf - QUAY + 0.8 });
    }
    for (let offset = 0; offset < LOOP; offset += 20)
      for (const x of [-roadHalf - 5, -roadHalf - 6.4]) {
        const r = new Mesh(this.unit, rail);
        r.scale.set(0.1, 0.08, 20);
        r.position.y = 0.08;
        const h = new Group();
        h.add(r);
        this.group.add(h);
        this.props.push({ mesh: h, offset: offset + 10, x });
      }
    // The barges, low in the water, and the container ship's high hull.
    const hulls = [0x1d1f24, 0x2a4a6a, 0x6a2a24].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const white = this.material({ map: this.track(bridgeTexture()), roughness: 0.6 });
    const boxes = BOXES.map((c) =>
      this.material({ map: this.track(containerTexture(c)), roughness: 0.7 }),
    );
    for (const [offset, kind] of [
      [40, 0],
      [150, 1],
      [300, 0],
    ] as const) {
      const vessel = new Group();
      const big = kind === 1;
      const hull = new Mesh(this.unit, hulls[offset % 3]!);
      hull.scale.set(big ? 26 : 10, big ? 14 : 3, big ? 140 : 60);
      hull.position.y = big ? 3 : -1.6;
      vessel.add(hull);
      const bridge = new Mesh(this.unit, white);
      bridge.scale.set(big ? 22 : 8, big ? 12 : 3, big ? 10 : 6);
      bridge.position.set(0, big ? 16 : 1.3, big ? 60 : 26);
      vessel.add(bridge);
      if (big) {
        for (let row = 0; row < 8; row++)
          for (let tier = 0; tier < 3; tier++)
            for (let col = 0; col < 3; col++) {
              const c = new Mesh(this.unit, boxes[Math.floor(random() * boxes.length)]!);
              c.scale.set(7.6, 2.6, 12);
              c.position.set(-8 + col * 8, 11.3 + tier * 2.6, 40 - row * 13);
              vessel.add(c);
            }
      }
      vessel.children.forEach((c) => (c.castShadow = true));
      vessel.position.y = -DOCK + 0.6;
      const h = new Group();
      h.add(vessel);
      this.group.add(h);
      this.props.push({ mesh: h, offset, x: -roadHalf - QUAY - (big ? 16 : 7) });
    }
  }

  /** The containers stacked high beyond the fence on the right, in every colour. */
  private addContainers(roadHalf: number): void {
    const random = seeded(6511);
    const boxes = BOXES.map((c) =>
      this.material({ map: this.track(containerTexture(c)), roughness: 0.7 }),
    );
    const fence = this.material({
      map: this.track(fenceTexture()),
      transparent: true,
      alphaTest: 0.4,
      roughness: 0.6,
    });
    for (let offset = 0; offset < LOOP; offset += 13) {
      const stack = new Group();
      for (let col = 0; col < 6; col++) {
        const tiers = 1 + Math.floor(random() * 5);
        for (let tier = 0; tier < tiers; tier++) {
          const c = new Mesh(this.unit, boxes[Math.floor(random() * boxes.length)]!);
          c.scale.set(2.44, 2.6, 12.2);
          c.position.set(col * 2.6, 1.3 + tier * 2.6, 0);
          c.castShadow = true;
          stack.add(c);
        }
      }
      const panel = new Mesh(this.unit, fence);
      panel.scale.set(0.05, 2.4, 13);
      panel.position.set(-3, 1.2, 0);
      stack.add(panel);
      const h = new Group();
      h.add(stack);
      this.group.add(h);
      this.props.push({ mesh: h, offset: offset + 6.5, x: roadHalf + 9 });
    }
  }

  /** The blue and red gantry cranes striding over the stacks. */
  private addCranes(roadHalf: number): void {
    const colours = [0x1d5aa8, 0xc8302a].map((c) =>
      this.material({ color: c, roughness: 0.5, metalness: 0.4 }),
    );
    const cab = this.material({ color: 0xf0f0ec, roughness: 0.5 });
    [60, 200, 330].forEach((offset, k) => {
      const crane = new Group();
      const m = colours[k % 2]!;
      for (const x of [0, 22])
        for (const z of [-6, 6]) {
          const leg = new Mesh(this.unit, m);
          leg.scale.set(1, 34, 1);
          leg.position.set(x, 17, z);
          crane.add(leg);
        }
      const beam = new Mesh(this.unit, m);
      beam.scale.set(56, 2.4, 2.4);
      beam.position.set(11 - 12, 34, 0);
      const box = new Mesh(this.unit, cab);
      box.scale.set(3, 3, 3);
      box.position.set(-6, 31, 0);
      const cable = new Mesh(this.unit, cab);
      cable.scale.set(0.1, 14, 0.1);
      cable.position.set(-6, 22.5, 0);
      crane.add(beam, box, cable);
      crane.children.forEach((c) => (c.castShadow = true));
      const h = new Group();
      h.add(crane);
      this.group.add(h);
      this.props.push({ mesh: h, offset, x: roadHalf + 10 });
    });
  }

  /** The flamme rouge, the barriers with their banners, the finish gantry and the flags. */
  private addFinish(roadHalf: number): void {
    const steel = this.material({ color: 0xc8cacc, roughness: 0.4, metalness: 0.7 });
    const banners = [0, 1, 2].map((k) =>
      this.material({ map: this.track(bannerTexture(k)), roughness: 0.7 }),
    );
    for (let offset = 0; offset < LOOP; offset += 2.5)
      for (const side of [-1, 1]) {
        if (offset % 140 > 100) continue;
        const barrier = new Group();
        const top = new Mesh(this.unit, steel);
        top.scale.set(0.05, 0.05, 2.4);
        top.position.y = 1.05;
        const board = new Mesh(this.unit, banners[Math.floor(offset / 7.5) % 3]!);
        board.scale.set(0.03, 0.85, 2.4);
        board.position.y = 0.55;
        barrier.add(top, board);
        const h = new Group();
        h.add(barrier);
        this.group.add(h);
        this.props.push({ mesh: h, offset, x: side * (roadHalf + 0.3) });
      }
    // The flamme rouge's red kite and the finish gantry across the road.
    const kite = this.material({ map: this.track(kiteTexture()), roughness: 0.6, side: 2 });
    const gantry = this.material({ map: this.track(finishTexture()), roughness: 0.6 });
    for (const [offset, mat, h] of [
      [90, kite, 2.2],
      [280, gantry, 2.6],
    ] as const) {
      const arch = new Group();
      for (const side of [-1, 1]) {
        const post = new Mesh(this.unit, steel);
        post.scale.set(0.4, 7, 0.4);
        post.position.set(side * (roadHalf + 0.6), 3.5, 0);
        arch.add(post);
      }
      const span = new Mesh(this.unit, mat);
      span.scale.set(roadHalf * 2 + 1.6, h, 0.3);
      span.position.y = 7 - h / 2 + 0.6;
      arch.add(span);
      arch.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(arch);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
    // Flags on poles behind the crowd.
    const flag = this.material({ map: this.track(antwerpFlagTexture()), roughness: 0.8, side: 2 });
    const cloth = new PlaneGeometry(1.6, 1);
    cloth.translate(0.8, 0, 0);
    this.disposables.push(cloth);
    for (let offset = 15; offset < LOOP; offset += 35) {
      const pole = new Group();
      const p = new Mesh(this.unit, steel);
      p.scale.set(0.08, 6, 0.08);
      p.position.y = 3;
      const f = new Mesh(cloth, flag);
      f.position.y = 5.4;
      pole.add(p, f);
      this.flags.push(f);
      const h = new Group();
      h.add(pole);
      this.group.add(h);
      this.props.push({ mesh: h, offset, x: (offset % 70 < 35 ? -1 : 1) * (roadHalf + 3.6) });
    }
  }

  /** The crowd thick behind the barriers on both sides. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(6521);
    for (let offset = 1; offset < LOOP; offset += 0.7 + random() * 1.1) {
      if (offset % 140 > 100) continue;
      const side = random() < 0.5 ? -1 : 1;
      this.people.push({
        offset,
        x: side * (roadHalf + 0.9 + random() * 1.6),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, FAN_WEAR, 6527);
  }

  /** The Port House's glass diamond, the cathedral's spire and the wind turbines along the Scheldt. */
  private addSkyline(): void {
    const random = seeded(6531);
    const brick = this.material({ map: this.track(fireStationTexture()), roughness: 0.9 });
    const glass = this.material({
      map: this.track(facetTexture()),
      color: 0xd8e4ee,
      roughness: 0.1,
      metalness: 0.6,
      flatShading: true,
    });
    const portHouse = new Group();
    const station = new Mesh(this.unit, brick);
    station.scale.set(60, 26, 40);
    station.position.y = 13;
    const diamond = new Mesh(new OctahedronGeometry(1, 0), glass);
    diamond.scale.set(70, 22, 22);
    diamond.position.set(10, 42, 0);
    diamond.rotation.y = 0.3;
    this.disposables.push(diamond.geometry);
    const struts = new Mesh(this.unit, brick);
    struts.scale.set(4, 20, 4);
    struts.position.set(10, 28, 0);
    portHouse.add(station, diamond, struts);
    portHouse.position.set(-220, -DOCK, -700);
    this.horizon.add(portHouse);
    // The cathedral's Gothic spire rising over the city's roofs.
    const stone = this.material({ color: 0xc8c0b0, roughness: 0.9 });
    const tower = new Mesh(this.unit, stone);
    tower.scale.set(14, 90, 14);
    tower.position.set(160, 45, -1500);
    const spire = new Mesh(new ConeGeometry(7, 40, 8), stone);
    spire.position.set(160, 110, -1500);
    this.disposables.push(spire.geometry);
    this.horizon.add(tower, spire);
    const roofs = [0x8a6a5a, 0xa8988a, 0x6a6a74].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    for (let k = 0; k < 22; k++) {
      const h = 12 + random() * 26;
      const b = new Mesh(this.unit, roofs[k % roofs.length]!);
      b.scale.set(20 + random() * 20, h, 20);
      b.position.set(-100 + k * 25 + random() * 10, h / 2, -1420 - random() * 200);
      this.horizon.add(b);
    }
    // The wind turbines along the Scheldt.
    const white = this.material({ color: 0xf4f6f8, roughness: 0.5 });
    const mast = new CylinderGeometry(1.2, 2, 90, 8);
    mast.translate(0, 45, 0);
    const blade = new BoxGeometry(2.4, 40, 0.6);
    blade.translate(0, 20, 0);
    this.disposables.push(mast, blade);
    for (let k = 0; k < 6; k++) {
      const turbine = new Group();
      turbine.add(new Mesh(mast, white));
      const rotor = new Group();
      rotor.position.set(0, 90, 3);
      for (let b = 0; b < 3; b++) {
        const bl = new Mesh(blade, white);
        bl.rotation.z = (b * Math.PI * 2) / 3;
        rotor.add(bl);
      }
      turbine.add(rotor);
      this.rotors.push(rotor);
      turbine.position.set(-900 + k * 160 + random() * 40, -DOCK, -2100 - random() * 300);
      this.horizon.add(turbine);
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

/** The quay road's smooth tarmac, its white edge lines and dashed lanes. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4c4c4e', 6541);
    g.fillStyle = 'rgba(245,245,240,0.9)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
    g.fillRect(63, 0, 2, 56);
  });
}

/** The quay's concrete slabs, stained by the port's traffic. */
function quayTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#9a9890', 6551);
    g.strokeStyle = 'rgba(60,60,60,0.4)';
    for (let y = 0; y < 128; y += 32) for (let x = 0; x < 128; x += 32) g.strokeRect(x, y, 32, 32);
    const random = seeded(6553);
    g.fillStyle = 'rgba(50,40,30,0.2)';
    for (let i = 0; i < 12; i++) g.fillRect(random() * 128, random() * 128, 10 + random() * 14, 6);
  });
}

/** The dock's grey-green water, rippled by the breeze. */
function waterTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a6a78', 6561);
    const random = seeded(6563);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(220,235,245,${0.15 + random() * 0.25})`;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 8, 1);
    }
  });
}

/** A container's corrugated side. */
function containerTexture(colour: string): CanvasTexture {
  return canvasTexture(64, 32, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 1, 32);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(0, 0, 64, 2);
    g.fillRect(0, 30, 64, 2);
  });
}

/** The terminal's wire fence. */
function fenceTexture(): CanvasTexture {
  return canvasTexture(64, 32, (g) => {
    g.clearRect(0, 0, 64, 32);
    g.strokeStyle = 'rgba(80,90,90,0.9)';
    for (let x = -32; x < 64; x += 6) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 32, 32);
      g.moveTo(x + 32, 0);
      g.lineTo(x, 32);
      g.stroke();
    }
  });
}

/** A sponsor's banner on the barriers. */
function bannerTexture(k: number): CanvasTexture {
  const [bg, fg, word] = [
    ['#d8102e', '#ffffff', 'ANTWERPEN'],
    ['#1d1f24', '#ffd23f', 'SPRINT'],
    ['#1d5aa8', '#ffffff', 'HAVEN'],
  ][k]!;
  return canvasTexture(128, 32, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 128, 32);
    g.fillStyle = fg;
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.fillText(word, 64, 23);
  });
}

/** The flamme rouge: the red banner of the last kilometre. */
function kiteTexture(): CanvasTexture {
  return canvasTexture(256, 32, (g) => {
    g.fillStyle = '#d8102e';
    g.fillRect(0, 0, 256, 32);
    g.fillStyle = '#ffffff';
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.fillText('1 KM', 128, 24);
  });
}

/** The finish gantry's banner. */
function finishTexture(): CanvasTexture {
  return canvasTexture(256, 32, (g) => {
    g.fillStyle = '#1d1f24';
    g.fillRect(0, 0, 256, 32);
    for (let x = 0; x < 256; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#ffffff' : '#1d1f24';
      g.fillRect(x, 0, 16, 6);
      g.fillStyle = (x / 16) % 2 ? '#1d1f24' : '#ffffff';
      g.fillRect(x, 26, 16, 6);
    }
    g.fillStyle = '#ffd23f';
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.fillText('FINISH', 128, 22);
  });
}

/** Antwerp's flag: the castle on red. */
function antwerpFlagTexture(): CanvasTexture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = '#d8102e';
    g.fillRect(0, 0, 48, 32);
    g.fillStyle = '#ffffff';
    g.fillRect(14, 12, 20, 14);
    g.fillRect(14, 8, 4, 4);
    g.fillRect(22, 6, 4, 6);
    g.fillRect(30, 8, 4, 4);
  });
}

/** The old fire station's brick and its tall windows. */
function fireStationTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#c8b8a0', 6571);
    g.fillStyle = '#3a3a40';
    for (let x = 8; x < 128; x += 14) g.fillRect(x, 12, 6, 30);
  });
}

/** The Port House's faceted glass. */
function facetTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#c8d8e4';
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    for (let x = -64; x < 64; x += 8) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 64, 64);
      g.stroke();
    }
  });
}

/** A ship's bridge: white superstructure with its rows of windows. */
function bridgeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#f0f0ec';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#2a3440';
    for (let y = 6; y < 64; y += 14) for (let x = 4; x < 64; x += 10) g.fillRect(x, y, 6, 5);
  });
}
