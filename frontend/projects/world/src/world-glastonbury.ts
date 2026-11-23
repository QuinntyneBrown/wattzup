// Glastonbury Fields' trackway, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Worthy
// Farm in festival week on a warm June evening. The rider takes the metal trackway laid across
// the trampled grass between the campsites; dome tents in every colour crowd the slopes both
// sides, festival flags of all shapes fly on tall poles over them, and the crowd wanders between
// the stages with their wellies and bunting. Food stalls and bar tents line the way once a lap,
// and ahead the Pyramid Stage rises with its lit frame over the crowd, the Ribbon Tower stands
// on the hill, and Glastonbury Tor with St Michael's tower closes the view. Built on the shared
// kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
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

/** The trackway repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
/** The trampled grass either side of the trackway, before the campsites begin. */
const PATH = 5;
/** The stalls once a lap. */
const STALLS = 120;

const FESTIVAL_WEAR = {
  tops: [
    '#ff2d78',
    '#ffd23f',
    '#2dd4ff',
    '#30ff9a',
    '#ffffff',
    '#9b5cff',
    '#ff9f1c',
    '#1d1f24',
    '#2a7a4a',
  ],
  bottoms: ['#2f3e5c', '#1d1f24', '#3a6a3a', '#e8c9a0'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly heading: number;
  readonly phase: number;
}

export class GlastonburyStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: Walker[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private readonly stageLights: MeshStandardMaterial[] = [];
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
    this.addGround(roadHalf, points);
    this.addTents(roadHalf);
    this.addFlags(roadHalf);
    this.addStalls(roadHalf);
    this.addWalkers(roadHalf);
    this.addFarm();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 2.6 + k * 0.7) * 0.5));
    // The Pyramid's lights sweep through the colours on the beat.
    this.stageLights.forEach((m, k) =>
      m.emissive.setHSL((seconds * 0.08 + k * 0.33) % 1, 0.9, 0.55),
    );
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
        const step = w.speed
          ? Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04
          : Math.max(0, Math.sin(this.time * 4.2 + w.phase)) * 0.06;
        crowd.set(i, w.x, heightAt(metres) + step, -metres, w.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The trampled grass along the trackway, and the campsites' fields rising gently away. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const trampled = this.material({ map: this.repeat(trampledTexture(), 3, 3), roughness: 1 });
    const field = this.material({ map: this.repeat(fieldTexture(), 10, 10), roughness: 1 });
    for (const side of [-1, 1] as const) {
      const lay = (profile: [number, number][], material: MeshStandardMaterial) => {
        const mirrored = profile.map(([x, y]) => [side * x, y] as [number, number]);
        this.ribbons.add(points, material, side > 0 ? [...mirrored].reverse() : mirrored);
      };
      lay(
        [
          [r, 0.006],
          [r + PATH, 0.05],
        ],
        trampled,
      );
      lay(
        [
          [r + PATH, 0.05],
          [r + 120, 6],
          [r + 1200, 40],
        ],
        field,
      );
    }
  }

  /** The campsites: dome and tunnel tents packed close in every colour, guy lines and all. */
  private addTents(roadHalf: number): void {
    const random = seeded(2001);
    const colours = [
      0xff6b5a, 0x2ec4b6, 0xffd23f, 0x3a86ff, 0x2a7a4a, 0xff9f1c, 0x9b5cff, 0xf15bb5, 0x5a6a3a,
      0xe8e4dc,
    ];
    const materials = colours.map((c) => this.material({ color: c, roughness: 0.7 }));
    const dome = new SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const tunnel = new CylinderGeometry(1, 1, 1, 10, 1, false, 0, Math.PI);
    tunnel.rotateZ(Math.PI / 2);
    tunnel.rotateY(Math.PI / 2);
    this.disposables.push(dome, tunnel);
    const tiles = [0, 1, 2].map(() => {
      const byColour = new Map<number, BufferGeometry[]>();
      for (let k = 0; k < 90; k++) {
        const d = PATH + 0.8 + random() ** 0.8 * 60;
        const big = random() < 0.3;
        const g = (big ? tunnel : dome).clone();
        const w = big ? 1.6 + random() * 0.6 : 1.1 + random() * 0.6;
        g.scale(w, big ? 1.3 : 1 + random() * 0.3, big ? 2.4 + random() : w * 1.1);
        g.rotateY(random() * 6);
        g.translate(d, d * 0.05 + (big ? 0 : 0), -random() * 60);
        const c = Math.floor(random() * colours.length);
        const list = byColour.get(c) ?? [];
        list.push(g.index ? g.toNonIndexed() : g);
        byColour.set(c, list);
      }
      return [...byColour.entries()].map(([c, list]) => {
        const merged = mergeGeometries(list)!;
        list.forEach((p) => p.dispose());
        this.disposables.push(merged);
        return [c, merged] as const;
      });
    });
    for (let offset = 0, k = 0; offset < LOOP; offset += 60, k++) {
      for (const side of [-1, 1] as const) {
        const site = new Group();
        for (const [c, geometry] of tiles[(k + (side > 0 ? 1 : 0)) % 3]!) {
          const mesh = new Mesh(geometry, materials[c]!);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          site.add(mesh);
        }
        site.scale.x = side;
        site.position.x = side * roadHalf;
        const holder = new Group();
        holder.add(site);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: 0 });
      }
    }
  }

  /** The festival's flags: tall poles over the tents, flying banners, pennants and patterns. */
  private addFlags(roadHalf: number): void {
    const random = seeded(2011);
    const pole = new CylinderGeometry(0.05, 0.07, 9, 6);
    pole.translate(0, 4.5, 0);
    const banner = new PlaneGeometry(1.4, 2.4);
    banner.translate(0.7, 0, 0);
    this.disposables.push(pole, banner);
    const wood = this.material({ color: 0x8a7a64, roughness: 0.9 });
    const designs = [0, 1, 2, 3, 4, 5].map((k) =>
      this.material({ map: this.track(festivalFlagTexture(k)), roughness: 0.8, side: 2 }),
    );
    for (let offset = 4; offset < LOOP; offset += 6 + random() * 10) {
      const side = random() < 0.5 ? -1 : 1;
      const holder = new Group();
      const flag = new Mesh(banner, designs[Math.floor(random() * designs.length)]!);
      flag.position.y = 7.6;
      this.flags.push(flag);
      holder.add(new Mesh(pole, wood), flag);
      holder.scale.setScalar(1.5 + random() * 0.8);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + PATH + 1 + random() * 30) });
    }
  }

  /** Food stalls and a bar tent along the trackway once a lap, their signs lit. */
  private addStalls(roadHalf: number): void {
    const names = ['NOODLES', 'PIZZA', 'CIDER BUS', 'FALAFEL', 'COFFEE', 'PIES'];
    const canvas = this.material({ color: 0xf4f2ec, roughness: 0.8 });
    const stripes = this.material({ map: this.track(stripeTexture()), roughness: 0.8 });
    const roof = new ConeGeometry(1, 1, 4);
    roof.rotateY(Math.PI / 4);
    const sign = new PlaneGeometry(2.6, 0.7);
    this.disposables.push(roof, sign);
    names.forEach((name, k) => {
      const side = k % 2 ? 1 : -1;
      const stall = new Group();
      const body = new Mesh(this.unit, k === 2 ? stripes : canvas);
      body.scale.set(3.2, 2.6, 3.6);
      body.position.y = 1.3;
      const top = new Mesh(roof, stripes);
      top.scale.set(2.8, 1.4, 3.2);
      top.position.y = 3.3;
      const board = new Mesh(
        sign,
        this.material({
          map: this.track(signTexture(name)),
          emissive: 0xffffff,
          emissiveIntensity: 0.25,
          roughness: 0.6,
        }),
      );
      board.position.set(-side * 1.65, 2.3, 0);
      board.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      stall.add(body, top, board);
      stall.children.forEach((c) => (c.castShadow = true));
      this.group.add(stall);
      this.props.push({ mesh: stall, offset: STALLS + k * 9, x: side * (roadHalf + PATH - 1) });
    });
  }

  /** The crowd: festival-goers wandering the trackway's edges both ways, and groups standing chatting. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(2017);
    for (let offset = 0; offset < LOOP; offset += 0.8 + random() * 1.6) {
      const side = random() < 0.5 ? -1 : 1;
      const standing = random() < 0.35;
      const speed = standing ? 0 : (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5);
      this.walkers.push({
        offset,
        x: side * (roadHalf + 0.5 + random() * (PATH - 0.8)),
        speed,
        heading: standing ? random() * 6 : speed > 0 ? 0 : Math.PI,
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.walkers.length,
      FESTIVAL_WEAR,
      2027,
    );
  }

  /**
   * Worthy Farm ahead: the Pyramid Stage's frame over its crowd with lights sweeping, the Ribbon
   * Tower on the hill, and Glastonbury Tor with St Michael's tower beyond.
   */
  private addFarm(): void {
    const steel = this.material({ color: 0xc8ccd4, metalness: 0.6, roughness: 0.35 });
    const dark = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const pyramid = new Group();
    // The pyramid: its silver frame of ribs, the stage box under it and the screens either side.
    const frame = new ConeGeometry(30, 40, 4, 1, true);
    frame.rotateY(Math.PI / 4);
    const skin = new Mesh(
      frame,
      this.material({
        color: 0x8a8e96,
        metalness: 0.5,
        roughness: 0.4,
        side: 2,
        transparent: true,
        opacity: 0.55,
      }),
    );
    skin.position.y = 20;
    const edges = new CylinderGeometry(0.3, 0.3, 46, 5);
    this.disposables.push(frame, edges);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const rib = new Mesh(edges, steel);
      rib.position.set(Math.cos(a) * 15, 20, Math.sin(a) * 15);
      rib.lookAt(0, 40 + 20, 0);
      rib.rotateX(Math.PI / 2);
      pyramid.add(rib);
    }
    const stage = new Mesh(this.unit, dark);
    stage.scale.set(34, 4, 16);
    stage.position.set(0, 2, 0);
    for (let k = 0; k < 3; k++) {
      const light = this.material({ color: 0x1d1f24, emissive: 0xff2d78, emissiveIntensity: 2 });
      this.stageLights.push(light);
      const beam = new Mesh(new ConeGeometry(2.4, 26, 10, 1, true), light);
      beam.position.set(-12 + k * 12, 20, 6);
      beam.rotation.z = (k - 1) * 0.4;
      beam.material.transparent = true;
      beam.material.opacity = 0.35;
      this.disposables.push(beam.geometry);
      pyramid.add(beam);
    }
    const screens = this.material({ color: 0x1d1f24, emissive: 0x2dd4ff, emissiveIntensity: 0.8 });
    this.stageLights.push(screens);
    for (const x of [-26, 26]) {
      const screen = new Mesh(this.unit, screens);
      screen.scale.set(12, 8, 0.6);
      screen.position.set(x, 12, 6);
      pyramid.add(screen);
    }
    pyramid.add(skin, stage);
    pyramid.position.set(30, 4, -420);
    pyramid.scale.setScalar(1.4);
    this.horizon.add(pyramid);
    // The Ribbon Tower: a tall lattice spire wound with coloured ribbons.
    const tower = new Group();
    const mast = new Mesh(new CylinderGeometry(0.6, 2.4, 40, 6, 1, true), steel);
    mast.position.y = 20;
    tower.add(mast);
    this.disposables.push(mast.geometry);
    ['#ff2d78', '#ffd23f', '#2dd4ff', '#30ff9a', '#9b5cff', '#ff9f1c'].forEach((c, k) => {
      const ribbon = new Mesh(new PlaneGeometry(0.8, 6), this.material({ color: c, side: 2 }));
      this.disposables.push(ribbon.geometry);
      ribbon.position.set(Math.cos(k) * 1.6, 8 + k * 5, Math.sin(k) * 1.6);
      ribbon.rotation.set(0.3, k, 0.4);
      tower.add(ribbon);
    });
    tower.position.set(-140, 14, -560);
    tower.scale.setScalar(1.3);
    this.horizon.add(tower);
    // Glastonbury Tor: the conical green hill, its terraces, and St Michael's tower on top.
    const tor = new Mesh(
      new ConeGeometry(260, 150, 24),
      this.material({ map: this.repeat(fieldTexture(), 40, 40), color: 0x7a9a5a, roughness: 1 }),
    );
    this.disposables.push(tor.geometry);
    tor.position.set(-260, 60, -1500);
    tor.scale.set(1, 1, 0.7);
    const church = new Mesh(this.unit, this.material({ color: 0xb8a888, roughness: 0.9 }));
    church.scale.set(9, 26, 9);
    church.position.set(-260, 148, -1500);
    this.horizon.add(tor, church);
    // The farm's green hills closing the valley.
    const hill = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(hill);
    const green = this.material({
      map: this.repeat(fieldTexture(), 40, 40),
      color: 0x6a8a4a,
      roughness: 1,
    });
    for (const [x, z, sx, sy] of [
      [-700, -1300, 600, 90],
      [500, -1400, 700, 110],
      [100, -1900, 900, 130],
    ] as const) {
      const h = new Mesh(hill, green);
      h.scale.set(sx, sy, 300);
      h.position.set(x, 10, z);
      this.horizon.add(h);
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

/** The trackway's edges: trampled grass worn to mud in patches, with straw. */
function trampledTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a7a3a', 2029);
    const random = seeded(2039);
    for (let i = 0; i < 50; i++) {
      g.fillStyle = random() < 0.6 ? 'rgba(90,70,40,0.5)' : 'rgba(220,200,120,0.5)';
      g.fillRect(random() * 128, random() * 128, 4 + random() * 16, 2 + random() * 8);
    }
  });
}

/** The Somerset fields, green under the tents. */
function fieldTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#5a8a3a', 2053));
}

/** A festival flag: one of six designs in bright stripes, chevrons, sun and spirals. */
function festivalFlagTexture(k: number): CanvasTexture {
  const palettes = [
    ['#ff2d78', '#ffd23f', '#2dd4ff'],
    ['#30ff9a', '#9b5cff', '#ffffff'],
    ['#ff9f1c', '#1d1f24', '#ffd23f'],
    ['#3a86ff', '#ff6b5a', '#ffffff'],
    ['#2a7a4a', '#ffd23f', '#c8102e'],
    ['#f15bb5', '#2ec4b6', '#ffd23f'],
  ];
  const [a, b, c] = palettes[k]!;
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = a!;
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = b!;
    if (k % 3 === 0) for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 64, 16);
    else if (k % 3 === 1) {
      for (let y = 0; y < 128; y += 32) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(32, y + 16);
        g.lineTo(64, y);
        g.lineTo(64, y + 10);
        g.lineTo(32, y + 26);
        g.lineTo(0, y + 10);
        g.fill();
      }
    } else {
      g.beginPath();
      g.arc(32, 50, 22, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = c!;
    g.fillRect(0, 110, 64, 18);
  });
}

/** Red and white stall stripes. */
function stripeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    for (let x = 0; x < 64; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#ffffff' : '#c8302a';
      g.fillRect(x, 0, 16, 64);
    }
  });
}

/** A stall's painted sign. */
function signTexture(name: string): CanvasTexture {
  return canvasTexture(260, 70, (g) => {
    g.fillStyle = '#1d1f24';
    g.fillRect(0, 0, 260, 70);
    g.fillStyle = '#ffd23f';
    g.font = 'bold 40px sans-serif';
    g.textAlign = 'center';
    g.fillText(name, 130, 50, 240);
  });
}
