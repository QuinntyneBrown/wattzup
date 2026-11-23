// Ghent Six-Day's track, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Kuipke,
// Ghent's indoor velodrome, on a six-day night. The rider races the home straight's pine boards
// over the blue côte d'azur and its black, red and blue lines. The banking rises steeply on the
// right to the advertising boards and a packed, standing crowd; across the infield, with its
// riders' cabins and the lap board counting every lap ridden, lies the back straight under its own
// stand. Trusses and floodlights close the roof. Built on the shared kit (world-kit.ts) on the
// pattern of Old Town's street; the straight repeats once a lap of the 166 m track.
import {
  BoxGeometry,
  type CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
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

/** The Kuipke is 166 m round; its parts repeat once a lap and run from BEHIND behind the rider. */
const LAP = 166;
const BEHIND = 24;
/** The boards run from the côte d'azur on the left to the foot of the banking on the right. */
const INSIDE = -4.6;
const BANK_FOOT = 5.4;
/** The banking climbs to the boards at the top, the stand rises behind them. */
const BANK_TOP_X = 10.5;
const BANK_TOP_Y = 4.6;
/** The back straight lies across the infield, mirrored. */
const BACK = -46;
/** The roof's tie beams. */
const ROOF = 21;
/** The lap board stands on the infield this far ahead. */
const BOARD_AHEAD = 70;
/** The end wall stands just inside the far end of the boards laid ahead. */
const END_WALL = 290;

const FANS = {
  tops: ['#e8133c', '#ffd23f', '#111318', '#f5f5f0', '#2c7be5', '#ff7a00', '#3b4a3a', '#7a1424'],
  bottoms: ['#1d1f24', '#2f3e5c', '#24262b', '#3a3a3a'],
  skins: ['#e2b48c', '#f0c8a0', '#c48a5f', '#8d5a3b', '#5a3a29'],
};

interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly scale: number;
  readonly phase: number;
}

export class GhentStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number; y: number }[] = [];
  private readonly fans: Fan[] = [];
  private figures: Figures | null = null;
  private readonly lapBoard = new Group();
  private readonly endWall = new Group();
  private lapTexture: CanvasTexture | null = null;
  private lap = -1;
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
    this.addTrack(points);
    void roadHalf;
    this.addStands(points);
    this.addCrowd();
    this.addInfield();
    this.addRoof(points);
    this.addLapBoard();
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LAP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)) + prop.y, -metres);
    }
    const figures = this.figures;
    if (figures) {
      this.fans.forEach((f, i) => {
        const metres = loopMetres(f.offset, s, LAP, BEHIND);
        // The crowd bounces to the music between the sprints.
        const bounce = Math.max(0, Math.sin(this.time * 4 + f.phase)) * 0.06;
        figures.set(
          i,
          f.x,
          heightAt(Math.max(metres, 0)) + f.y,
          -metres,
          f.heading,
          f.scale,
          bounce,
        );
      });
      figures.commit();
    }
    this.lapBoard.position.set(-14, heightAt(BOARD_AHEAD), -BOARD_AHEAD);
    this.endWall.position.set(-18, heightAt(1e6) + 10, -END_WALL);
    this.countLap(Math.floor(s / LAP) + 1);
  }

  /**
   * The home straight: the pine boards, the côte d'azur inside them, the measurement, sprinters'
   * and stayers' lines, and the banking sweeping up on the right to the boards at the top.
   */
  private addTrack(points: number): void {
    const boards = this.material({ map: this.repeat(boardsTexture(true), BANK_FOOT - INSIDE, 4) });
    const bank = this.material({ map: this.repeat(boardsTexture(false), 6.6, 4) });
    const azur = this.material({ color: 0x7fb6e0, roughness: 0.6 });
    const floor = this.material({ map: this.repeat(floorTexture(), 4, 4), roughness: 0.85 });
    const hoarding = this.material({ map: this.repeat(hoardingTexture(true), 1, 12) });
    const backHoarding = this.material({ map: this.repeat(hoardingTexture(false), 1, 12) });
    // The home straight's boards cover the road from the côte d'azur to the banking's foot.
    this.ribbons.add(points, boards, [
      [BANK_FOOT, 0.01],
      [INSIDE, 0.01],
    ]);
    this.ribbons.add(points, bank, [
      [BANK_TOP_X, BANK_TOP_Y],
      [BANK_FOOT + 1.8, 0.75],
      [BANK_FOOT, 0.01],
    ]);
    this.ribbons.add(points, hoarding, [
      [BANK_TOP_X, BANK_TOP_Y + 1.1],
      [BANK_TOP_X, BANK_TOP_Y],
    ]);
    this.ribbons.add(points, azur, [
      [INSIDE, 0.01],
      [INSIDE - 1.0, -0.05],
    ]);
    // The infield, down a step from the côte d'azur, across to the back straight.
    this.ribbons.add(points, floor, [
      [INSIDE - 1.0, -0.05],
      [INSIDE - 1.0, -0.6],
      [BACK + 11, -0.6],
      [BACK + 11, -0.05],
    ]);
    // The back straight, its côte d'azur, boards and banking, mirrored across the infield.
    this.ribbons.add(points, azur, [
      [BACK + 11, -0.05],
      [BACK + 10, 0.01],
    ]);
    this.ribbons.add(points, boards, [
      [BACK + 10, 0.01],
      [BACK, 0.01],
    ]);
    this.ribbons.add(points, bank, [
      [BACK, 0.01],
      [BACK - 1.8, 0.75],
      [BACK - 5.1, BANK_TOP_Y],
    ]);
    this.ribbons.add(points, backHoarding, [
      [BACK - 5.1, BANK_TOP_Y],
      [BACK - 5.1, BANK_TOP_Y + 1.1],
    ]);
  }

  /** The stands: steep concrete tiers behind each banking, up to the roof. */
  private addStands(points: number): void {
    const tiers = this.material({ map: this.repeat(seatsTexture(), 1, 3), roughness: 0.9 });
    const right: [number, number][] = [];
    const left: [number, number][] = [];
    for (let row = 9; row >= 0; row--) {
      const x = BANK_TOP_X + 0.6 + row * 0.9;
      const y = BANK_TOP_Y + 0.4 + row * 0.75;
      right.push([x + 0.9, y + 0.75], [x + 0.9, y], [x, y]);
    }
    for (let row = 0; row < 9; row++) {
      const x = BACK - 5.7 - row * 0.9;
      const y = BANK_TOP_Y + 0.4 + row * 0.75;
      left.push([x, y], [x, y + 0.75], [x - 0.9, y + 0.75]);
    }
    this.ribbons.add(points, tiers, right);
    this.ribbons.add(points, tiers, left);
    // The walls behind the top rows, up to the roof.
    const wall = this.material({ color: 0x2a2420, roughness: 0.9 });
    this.ribbons.add(points, wall, [
      [BANK_TOP_X + 10, ROOF],
      [BANK_TOP_X + 10, BANK_TOP_Y + 8],
    ]);
    this.ribbons.add(points, wall, [
      [BACK - 14, BANK_TOP_Y + 8],
      [BACK - 14, ROOF],
    ]);
  }

  /** A packed, standing crowd on every tier, and the infield's crowd at the bar. */
  private addCrowd(): void {
    const random = seeded(19);
    for (let row = 0; row < 8; row++) {
      for (let offset = 0; offset < LAP; offset += 0.62 + random() * 0.2) {
        this.fans.push({
          offset,
          x: BANK_TOP_X + 1.05 + row * 0.9 + random() * 0.2,
          y: BANK_TOP_Y + 0.4 + row * 0.75,
          heading: Math.PI / 2 + (random() - 0.5) * 0.6,
          scale: 0.9 + random() * 0.15,
          phase: random() * 6.3,
        });
      }
    }
    for (let row = 0; row < 6; row++) {
      for (let offset = 0; offset < LAP; offset += 0.9 + random() * 0.4) {
        this.fans.push({
          offset,
          x: BACK - 6.15 - row * 0.9 - random() * 0.2,
          y: BANK_TOP_Y + 0.4 + row * 0.75,
          heading: -Math.PI / 2 + (random() - 0.5) * 0.6,
          scale: 0.9 + random() * 0.15,
          phase: random() * 6.3,
        });
      }
    }
    // The infield: fans along the rail of the côte d'azur and round the bar.
    for (let offset = 0; offset < LAP; offset += 1.4 + random() * 2) {
      this.fans.push({
        offset,
        x: INSIDE - 2.2 - random() * 9,
        y: -0.6,
        heading: Math.PI / 2 + (random() - 0.5) * 1.2,
        scale: 0.92 + random() * 0.14,
        phase: random() * 6.3,
      });
    }
    this.figures = new Figures(this.group, this.disposables, this.fans.length, FANS, 23);
  }

  /** The infield: the riders' cabins in a row, a rail along the côte d'azur, and the bar. */
  private addInfield(): void {
    const curtains = ['#c8102e', '#1b3a8a', '#ffd23f', '#0f7a4a', '#111318', '#f2f0e8'].map(
      (colour) => this.material({ color: colour, roughness: 0.8 }),
    );
    const frame = this.material({ color: 0xd9d6cf, roughness: 0.6 });
    const rail = this.material({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 });
    const bar = this.material({ map: this.track(barTexture()), roughness: 0.6 });
    for (let k = 0; k < 10; k++) {
      const cabin = new Group();
      const box = new Mesh(this.unit, frame);
      box.scale.set(3, 2.4, 3.2);
      box.position.y = 1.2;
      const curtain = new Mesh(this.unit, curtains[k % curtains.length]!);
      curtain.scale.set(0.05, 2.0, 2.8);
      curtain.position.set(1.52, 1.1, 0);
      cabin.add(box, curtain);
      cabin.children.forEach((m) => (m.castShadow = true));
      this.group.add(cabin);
      this.props.push({ mesh: cabin, offset: k * 3.6 + 40, x: -24, y: -0.6 });
    }
    for (let offset = 0; offset < LAP; offset += 2) {
      const post = new Group();
      const p = new Mesh(this.unit, rail);
      p.scale.set(0.05, 1.0, 0.05);
      p.position.y = 0.5;
      const top = new Mesh(this.unit, rail);
      top.scale.set(0.05, 0.05, 2);
      top.position.y = 1.0;
      post.add(p, top);
      this.group.add(post);
      this.props.push({ mesh: post, offset, x: INSIDE - 1.4, y: -0.6 });
    }
    const counter = new Group();
    const front = new Mesh(this.unit, bar);
    front.scale.set(2, 1.1, 14);
    front.position.y = 0.55;
    counter.add(front);
    this.group.add(counter);
    this.props.push({ mesh: counter, offset: 110, x: -15, y: -0.6 });
  }

  /**
   * The roof: tie beams and their lattice every 8 m, rows of floodlights hanging under them, and
   * the six-day's banners strung over the infield.
   */
  private addRoof(points: number): void {
    const steel = this.material({ color: 0x3a3632, metalness: 0.5, roughness: 0.6 });
    const ceiling = this.material({ color: 0x1c1a19, roughness: 1 });
    const light = new MeshBasicMaterial({ color: 0xfff3dc });
    this.disposables.push(light);
    const banners = ['ZESDAAGSE', 'GENT', 'KUIPKE', 'WIELRENNEN'].map((word, i) =>
      this.material({
        map: this.track(bannerTexture(word, ['#c8102e', '#111318', '#ffd23f', '#1b3a8a'][i]!)),
        side: DoubleSide,
        roughness: 0.8,
      }),
    );
    const sheet = new PlaneGeometry(8, 2.2);
    this.disposables.push(sheet);
    for (let k = 0; k < LAP / 8; k++) {
      const truss = new Group();
      const beam = new Mesh(this.unit, steel);
      beam.scale.set(BANK_TOP_X - BACK + 26, 0.5, 0.4);
      beam.position.set((BANK_TOP_X + BACK) / 2, ROOF, 0);
      const chord = new Mesh(this.unit, steel);
      chord.scale.set(BANK_TOP_X - BACK + 26, 0.3, 0.3);
      chord.position.set((BANK_TOP_X + BACK) / 2, ROOF - 2.2, 0);
      truss.add(beam, chord);
      for (let x = BACK - 10; x <= BANK_TOP_X + 8; x += 6) {
        const strut = new Mesh(this.unit, steel);
        strut.scale.set(0.15, 2.9, 0.15);
        strut.position.set(x, ROOF - 1.1, 0);
        strut.rotation.z = (x / 6) % 2 === 0 ? 0.5 : -0.5;
        truss.add(strut);
        const lamp = new Mesh(this.unit, light);
        lamp.scale.set(1.4, 0.15, 0.7);
        lamp.position.set(x + 3, ROOF - 2.6, 0);
        truss.add(lamp);
      }
      const banner = new Mesh(sheet, banners[k % banners.length]!);
      banner.position.set(-20, ROOF - 4.4, 0);
      truss.add(banner);
      this.group.add(truss);
      this.props.push({ mesh: truss, offset: k * 8, x: 0, y: 0 });
    }
    // Its profile runs from smaller x to greater, so it faces down at the rider.
    this.ribbons.add(points, ceiling, [
      [BACK - 16, ROOF + 0.6],
      [BANK_TOP_X + 12, ROOF + 0.6],
    ]);
    // The far end wall closes the hall where the boards run out of view.
    const end = new MeshBasicMaterial({ color: 0x2b2622, fog: false });
    const wall = new PlaneGeometry(200, 60);
    this.disposables.push(end, wall);
    this.endWall.add(new Mesh(wall, end));
    this.group.add(this.endWall);
  }

  /** The lap board on the infield: the lap the rider is on, in lit figures. */
  private addLapBoard(): void {
    const texture = canvasTexture(512, 256, () => undefined);
    this.lapTexture = this.track(texture);
    const face = new MeshBasicMaterial({ map: texture });
    const frame = this.material({ color: 0x111111, roughness: 0.5 });
    const plane = new PlaneGeometry(6, 3);
    this.disposables.push(face, plane);
    const screen = new Mesh(plane, face);
    screen.position.set(0, 4.6, 0.31);
    const box = new Mesh(this.unit, frame);
    box.scale.set(6.4, 3.4, 0.6);
    box.position.y = 4.6;
    const leg = new Mesh(this.unit, frame);
    leg.scale.set(0.3, 3, 0.3);
    leg.position.y = 1.5;
    this.lapBoard.add(box, screen, leg);
    this.lapBoard.rotation.y = 0.35;
    this.group.add(this.lapBoard);
  }

  /** Redraws the lap board when the rider starts a new lap. */
  private countLap(lap: number): void {
    if (lap === this.lap || !this.lapTexture) return;
    this.lap = lap;
    const canvas = this.lapTexture.image as HTMLCanvasElement;
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#0b0b0c';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffb000';
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.fillText('RONDE · LAP', 256, 74);
    g.fillStyle = '#ff3b2f';
    g.font = 'bold 140px monospace';
    g.fillText(String(lap), 256, 222);
    this.lapTexture.needsUpdate = true;
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

/**
 * Siberian pine boards running with the track; the flat straight carries the black measurement
 * line, the red sprinters' line and the blue stayers' line from the inside out.
 */
function boardsTexture(lines: boolean): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    const random = seeded(lines ? 83 : 89);
    for (let x = 0; x < 512; x += 12) {
      const l = 58 + random() * 12;
      g.fillStyle = `hsl(34,48%,${l}%)`;
      g.fillRect(x, 0, 12, 512);
      g.fillStyle = 'rgba(80,50,25,0.35)';
      g.fillRect(x, 0, 1, 512);
      for (let y = random() * 200; y < 512; y += 180 + random() * 200) {
        g.fillRect(x, y, 12, 1);
      }
    }
    if (!lines) return;
    // Across runs from the banking's foot (u 0) to the côte d'azur (u 1): 10 m over 512 px.
    const at = (metresFromInside: number) => 512 - (metresFromInside / 10) * 512;
    g.fillStyle = '#111111';
    g.fillRect(at(0.2) - 3, 0, 5, 512);
    g.fillStyle = '#c8102e';
    g.fillRect(at(0.85) - 3, 0, 5, 512);
    g.fillStyle = '#1b5fc4';
    g.fillRect(at(2.5) - 3, 0, 5, 512);
  });
}

/** The infield's painted concrete floor. */
function floorTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#3b3f45', 97));
}

/** The tiers: rows of red seats folded up, the crowd stands. */
function seatsTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6d6862', 101);
    g.fillStyle = '#8f1d24';
    for (let x = 4; x < 256; x += 32) g.fillRect(x, 60, 24, 70);
  });
}

/** The boards at the top of the banking: sponsors' panels end to end. */
function hoardingTexture(mirror: boolean): CanvasTexture {
  const panels = [
    ['#111318', '#ffd23f', 'ZESDAAGSE'],
    ['#c8102e', '#ffffff', 'GENT'],
    ['#ffd23f', '#111318', 'KUIPKE'],
    ['#1b3a8a', '#ffffff', 'WIELERBAAN'],
  ] as const;
  return canvasTexture(128, 1024, (g) => {
    panels.forEach(([ground, ink, word], i) => {
      const y = i * 256;
      g.fillStyle = ground;
      g.fillRect(0, y, 128, 256);
      g.save();
      g.translate(64, y + 128);
      g.rotate(Math.PI / 2);
      // Seen from the home straight the panels read through the ribbon's mirrored across.
      g.scale(1, mirror ? -1 : 1);
      g.fillStyle = ink;
      g.font = 'bold 44px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(word, 0, 0);
      g.restore();
    });
  });
}

/** The infield bar's front, its taps lit. */
function barTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#3a2418';
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#ffcc4d';
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.fillText('BAR · CAFÉ', 256, 44);
  });
}

/** A banner strung from the roof. */
function bannerTexture(word: string, colour: string): CanvasTexture {
  return canvasTexture(512, 140, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 512, 140);
    g.fillStyle = new Color(colour).getHSL({ h: 0, s: 0, l: 0 }).l > 0.5 ? '#111111' : '#ffffff';
    g.font = 'bold 72px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(word, 256, 74);
  });
}
