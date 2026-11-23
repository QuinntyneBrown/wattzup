// Trollstigen's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Troll's
// Ladder in Norway's Romsdal on a cool, bright summer morning. The rider climbs the narrow road
// between its granite guard stones; on the right the cliff rises sheer, wet and streaked, with
// waterfalls pouring down it in white ribbons, and on the left the ground drops past the parapet
// into the green valley of Isterdalen with its river, the far walls rising just as steep. The
// red-bordered troll sign stands by the road, mist hangs on the ledges, and ahead the ladder's
// hairpins climb the headwall beside the great fall of Stigfossen to the snow-streaked peaks —
// the King, the Queen and the Bishop. Built on the shared kit (world-kit.ts) on the pattern of
// Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  DodecahedronGeometry,
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

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The troll sign stands once a lap. */
const SIGN = 45;

const VISITOR_WEAR = {
  tops: ['#c8302a', '#2f5a8a', '#ffd23f', '#2a6a4a', '#e8e4dc', '#ff9f1c', '#1d1f24'],
  bottoms: ['#1d1f24', '#3a3a3e', '#2f3e5c', '#5a4a3a'],
  skins: ['#f0c8a0', '#f5d3b5', '#e2b48c', '#c48a5f'],
};

export class TrollstigenStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly falls: Texture[] = [];
  private readonly visitors: { offset: number; x: number; heading: number }[] = [];
  private crowd: Figures | null = null;
  private readonly mists: Mesh[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addValley(roadHalf, points);
    this.addGuardStones(roadHalf);
    this.addWaterfalls(roadHalf);
    this.addSign(roadHalf);
    this.addBoulders(roadHalf);
    this.addVisitors(roadHalf);
    this.addHeadwall();
  }

  setTime(seconds: number): void {
    // The falls pour, their white water streaming down the rock.
    this.falls.forEach((t, k) => (t.offset.y = seconds * (0.9 + k * 0.15)));
    // Mist drifts along the ledges.
    this.mists.forEach((m, k) => (m.position.x = ((seconds * (4 + k) + k * 500) % 2000) - 1000));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, so the valley falls away past the parapet. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 160);
      position.setY(i * 2 + 1, p.height - 160);
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
        const metres = loopMetres(v.offset, s, LOOP, BEHIND);
        crowd.set(i, v.x, heightAt(metres), -metres, v.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The cliff rising sheer on the right; the verge, the drop past the parapet and the valley on the left. */
  private addValley(roadHalf: number, points: number): void {
    const r = roadHalf;
    const cliff = this.material({ map: this.repeat(cliffTexture(), 14, 14), roughness: 0.85 });
    const turf = this.material({ map: this.repeat(turfTexture(), 3, 3), roughness: 1 });
    const meadow = this.material({
      map: this.repeat(turfTexture(), 30, 30),
      color: 0x9ab07a,
      roughness: 1,
    });
    const river = this.material({
      color: 0x8ab8c0,
      roughness: 0.15,
      metalness: 0.3,
      emissive: 0x2a4a50,
      emissiveIntensity: 0.3,
    });
    this.ribbons.add(points, cliff, [
      [r + 260, 420],
      [r + 40, 62],
      [r + 8, 5],
    ]);
    this.ribbons.add(points, turf, [
      [r + 8, 5],
      [r + 3, 0.6],
      [r, 0.004],
    ]);
    this.ribbons.add(points, turf, [
      [-r, 0.004],
      [-r - 1.6, 0.02],
    ]);
    this.ribbons.add(points, turf, [
      [-r - 1.6, 0.02],
      [-r - 30, -40],
      [-r - 110, -120],
    ]);
    this.ribbons.add(points, meadow, [
      [-r - 110, -120],
      [-r - 240, -150],
    ]);
    this.ribbons.add(points, river, [
      [-r - 240, -150],
      [-r - 262, -150.3],
    ]);
    this.ribbons.add(points, meadow, [
      [-r - 262, -150.3],
      [-r - 380, -140],
    ]);
    this.ribbons.add(points, cliff, [
      [-r - 380, -140],
      [-r - 520, 120],
      [-r - 700, 480],
    ]);
  }

  /** The granite guard stones along the edge of the drop, set apart like teeth. */
  private addGuardStones(roadHalf: number): void {
    const random = seeded(2501);
    const granite = this.material({ map: this.repeat(stoneTexture(), 1, 1), roughness: 0.9 });
    for (let offset = 0; offset < LOOP; offset += 2.4) {
      const holder = new Group();
      const stone = new Mesh(this.unit, granite);
      stone.scale.set(0.5, 0.7 + random() * 0.15, 1.2 + random() * 0.3);
      stone.position.y = 0.38;
      stone.rotation.y = (random() - 0.5) * 0.1;
      stone.castShadow = true;
      holder.add(stone);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 0.9 });
    }
  }

  /** White falls streaming down the cliff face on the right, leaning with the rock. */
  private addWaterfalls(roadHalf: number): void {
    const random = seeded(2511);
    const lean = Math.atan2(40 - 8, 62 - 5);
    for (let offset = 30, k = 0; offset < LOOP; offset += 70 + random() * 60, k++) {
      const flow = this.track(fallTexture());
      flow.wrapS = RepeatWrapping;
      flow.wrapT = RepeatWrapping;
      flow.repeat.set(3, 3);
      this.falls.push(flow);
      const water = this.material({
        map: flow,
        emissive: 0xffffff,
        emissiveMap: flow,
        emissiveIntensity: 0.9,
        color: 0xffffff,
        transparent: true,
        side: 2,
        depthWrite: false,
        roughness: 0.3,
      });
      const width = 16 + random() * 10;
      const sheet = new PlaneGeometry(width, 68);
      sheet.rotateY(-Math.PI / 2);
      sheet.rotateZ(-lean);
      sheet.translate(roadHalf + 24 - 1.5, 34, 0);
      this.disposables.push(sheet);
      const holder = new Group();
      holder.add(new Mesh(sheet, water));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /** The red-bordered troll warning sign at the roadside. */
  private addSign(roadHalf: number): void {
    const sign = new Group();
    const post = new Mesh(
      this.unit,
      this.material({ color: 0x9a9a98, metalness: 0.4, roughness: 0.5 }),
    );
    post.scale.set(0.08, 2.2, 0.08);
    post.position.y = 1.1;
    const plate = new Mesh(
      new PlaneGeometry(1.3, 1.15),
      this.material({ map: this.track(trollSignTexture()), transparent: true, roughness: 0.5 }),
    );
    plate.position.y = 2.5;
    this.disposables.push(plate.geometry);
    sign.add(post, plate);
    sign.rotation.y = -0.3;
    this.group.add(sign);
    this.props.push({ mesh: sign, offset: SIGN, x: roadHalf + 1.4 });
  }

  /** Fallen granite boulders and scree at the cliff's foot. */
  private addBoulders(roadHalf: number): void {
    const random = seeded(2521);
    const rock = this.material({
      map: this.repeat(stoneTexture(), 1, 1),
      color: 0x9a9a98,
      roughness: 1,
      flatShading: true,
    });
    const shape = new DodecahedronGeometry(1, 0);
    this.disposables.push(shape);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 7) {
      const d = 3 + random() * 4.5;
      const holder = new Group();
      const b = new Mesh(shape, rock);
      const size = 0.3 + random() ** 2 * 1.4;
      b.scale.set(size * (1 + random()), size * 0.8, size);
      b.rotation.set(random(), random() * 6, random());
      b.position.y = d < 3 ? (d / 3) * 0.6 : 0.6 + ((d - 3) / 5) * 4.4;
      b.castShadow = true;
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + d });
    }
  }

  /** Visitors stopped by the guard stones to look down the valley. */
  private addVisitors(roadHalf: number): void {
    const random = seeded(2531);
    for (let offset = 20; offset < LOOP; offset += 30 + random() * 40) {
      const n = 1 + Math.floor(random() * 3);
      for (let k = 0; k < n; k++)
        this.visitors.push({
          offset: offset + k * 0.8,
          x: -roadHalf - 0.2,
          heading: Math.PI / 2 + (random() - 0.5),
        });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.visitors.length,
      VISITOR_WEAR,
      2537,
    );
  }

  /**
   * The headwall ahead: the ladder's hairpins climbing it beside Stigfossen's long fall, the
   * snow-streaked peaks of the King, the Queen and the Bishop above, and mist on the ledges.
   */
  private addHeadwall(): void {
    const random = seeded(2541);
    const wall = new Mesh(
      new PlaneGeometry(2200, 400),
      this.material({ map: this.track(headwallTexture()), roughness: 1 }),
    );
    this.disposables.push(wall.geometry);
    wall.position.set(0, 120, -1100);
    wall.rotation.x = -0.12;
    this.horizon.add(wall);
    const snowy = this.material({
      map: this.track(peakTexture()),
      roughness: 1,
      flatShading: true,
    });
    const peak = new ConeGeometry(1, 1, 5);
    this.disposables.push(peak);
    for (let k = 0; k < 7; k++) {
      const m = new Mesh(peak, snowy);
      const h = 300 + random() * 260;
      m.scale.set(200 + random() * 160, h, 180);
      m.position.set(-900 + k * 300 + random() * 60, 300 + h / 2 - 80, -1250);
      m.rotation.y = random();
      this.horizon.add(m);
    }
    const mist = new PlaneGeometry(900, 110);
    this.disposables.push(mist);
    for (let k = 0; k < 3; k++) {
      const cloud = new Mesh(
        mist,
        this.material({
          map: this.track(mistTexture()),
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.6,
        }),
      );
      cloud.position.set(0, 150 + k * 90, -1000 - k * 40);
      this.mists.push(cloud);
      this.horizon.add(cloud);
    }
    // The valley's far walls across Isterdalen on the left, closing the view down the valley.
    const hump = new ConeGeometry(1, 1, 12);
    this.disposables.push(hump);
    const side = this.material({
      map: this.repeat(cliffTexture(), 30, 30),
      color: 0xa8b4a0,
      roughness: 1,
      flatShading: true,
    });
    for (const [z, sx, sy] of [
      [-150, 200, 420],
      [-650, 240, 520],
      [-1150, 220, 480],
      [350, 200, 400],
    ] as const) {
      const h = new Mesh(hump, side);
      h.scale.set(sx, sy, 420);
      h.position.set(-420 - sx / 2, -160 + sy / 2, z);
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

/** Wet grey granite, streaked dark by runoff, with ledges of green. */
function cliffTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#7a7e80', 2551);
    const random = seeded(2553);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(30,34,36,${0.15 + random() * 0.25})`;
      g.fillRect(random() * 256, random() * 256, 2 + random() * 4, 20 + random() * 60);
    }
    for (let i = 0; i < 50; i++) {
      g.fillStyle = 'rgba(80,120,60,0.45)';
      g.fillRect(random() * 256, random() * 256, 10 + random() * 30, 3 + random() * 6);
    }
  });
}

/** Short green turf with small flowers. */
function turfTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a8a3a', 2561);
    const random = seeded(2563);
    for (let i = 0; i < 50; i++) {
      g.fillStyle = ['#ffffff', '#ffd23f', '#9b7acf'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 2, 2);
    }
  });
}

/** Rough-hewn grey granite. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#8a8a86', 2571));
}

/** White water: streaks and foam that scroll down the fall. */
function fallTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.clearRect(0, 0, 64, 128);
    const random = seeded(2581);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(${random() < 0.7 ? '245,250,255' : '190,215,225'},${0.35 + random() * 0.5})`;
      g.fillRect(4 + random() * 56, random() * 128, 1 + random() * 4, 6 + random() * 20);
    }
  });
}

/** The troll warning sign: a red-bordered triangle with a lumbering troll. */
function trollSignTexture(): CanvasTexture {
  return canvasTexture(128, 116, (g) => {
    g.clearRect(0, 0, 128, 116);
    g.fillStyle = '#c8102e';
    g.beginPath();
    g.moveTo(64, 2);
    g.lineTo(126, 114);
    g.lineTo(2, 114);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd23f';
    g.beginPath();
    g.moveTo(64, 22);
    g.lineTo(110, 105);
    g.lineTo(18, 105);
    g.closePath();
    g.fill();
    g.fillStyle = '#1d1f24';
    g.beginPath();
    g.ellipse(64, 80, 16, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(64, 54, 9, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(72, 57, 8, 4, 0.3, 0, Math.PI * 2);
    g.fill();
    g.fillRect(54, 96, 6, 8);
    g.fillRect(68, 96, 6, 8);
  });
}

/** The headwall: dark rock with green ledges, Stigfossen falling white, the hairpins climbing beside it. */
function headwallTexture(): CanvasTexture {
  return canvasTexture(1024, 512, (g) => {
    const fall = g.createLinearGradient(0, 512, 0, 0);
    fall.addColorStop(0, '#4a6a3a');
    fall.addColorStop(0.35, '#5a6458');
    fall.addColorStop(1, '#6a6e72');
    g.fillStyle = fall;
    g.fillRect(0, 0, 1024, 512);
    const random = seeded(2591);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '30,34,36' : '90,130,70'},${0.1 + random() * 0.18})`;
      g.fillRect(random() * 1024, random() * 512, 6 + random() * 30, 2 + random() * 8);
    }
    // Stigfossen.
    g.fillStyle = 'rgba(240,248,255,0.9)';
    for (let y = 0; y < 512; y += 4)
      g.fillRect(560 + Math.sin(y / 30) * 10, y, 10 + (y / 512) * 10, 4);
    // The ladder's hairpins.
    let y = 500;
    let left = true;
    const path: [number, number][] = [[460, y]];
    while (y > 60) {
      y -= 38;
      path.push([left ? 540 : 360 + random() * 30, y]);
      left = !left;
    }
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const [width, colour] of [
      [9, '#a8a8a4'],
      [5, '#3a3a3e'],
    ] as const) {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.beginPath();
      path.forEach(([x, py], k) => (k ? g.lineTo(x, py) : g.moveTo(x, py)));
      g.stroke();
    }
  });
}

/** Snow-streaked granite peaks. */
function peakTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const fall = g.createLinearGradient(0, 0, 0, 128);
    fall.addColorStop(0, '#f4f6f8');
    fall.addColorStop(0.35, '#c8ccd0');
    fall.addColorStop(0.6, '#6a6e72');
    fall.addColorStop(1, '#4a4e52');
    g.fillStyle = fall;
    g.fillRect(0, 0, 128, 128);
  });
}

/** A soft bank of mist. */
function mistTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    const random = seeded(2611);
    for (let i = 0; i < 40; i++) {
      const x = 20 + random() * 216;
      const y = 22 + random() * 20;
      const fade = g.createRadialGradient(x, y, 0, x, y, 18 + random() * 14);
      fade.addColorStop(0, 'rgba(255,255,255,0.55)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fade;
      g.fillRect(0, 0, 256, 64);
    }
  });
}
