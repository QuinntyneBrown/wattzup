// The Col du Galibier, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the last
// kilometres to the pass early in the summer, 2,600 metres up and far above the trees. The rider
// climbs the narrow road between banks of old snow cut back by the ploughs, their walls dirty and
// melting, meltwater trickling over the black slate scree. Riders' names are painted on the tarmac,
// red and white kilometre posts count down to the summit, and fans in team jerseys wave flags from
// the snow banks. On the right the shattered grey slate slopes climb to the jagged ridge of the pass;
// on the left the valley falls away to the Col du Lautaret, and across it the glaciers of La Meije
// hang white over the dark rock. Beside the road stands the stone monument to Henri Desgrange, the
// Tour's founder. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
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

/** The pass road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The valley falls VALLEY metres below the road on the left. */
const VALLEY = 260;

const FAN_WEAR = {
  tops: ['#ffd23f', '#ffffff', '#d8102e', '#1d5aa8', '#2a8a4a', '#f4f4f0', '#1d1f24'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f'],
};

/** The riders' names the fans have painted on the road. */
const NAMES = ['ALLEZ', 'VAS-Y', 'PANTANI', 'GO GO', 'TADEJ', 'JONAS'];

export class GalibierStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number; y: number }[] = [];
  private crowd: Figures | null = null;
  private readonly flags: { mesh: Mesh; phase: number }[] = [];
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
    this.addSnowBanks(roadHalf);
    this.addNames(roadHalf);
    this.addPosts(roadHalf);
    this.addFans(roadHalf);
    this.addMonument(roadHalf);
    this.addMeije();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    for (const f of this.flags) f.mesh.rotation.y = Math.sin(seconds * 3 + f.phase) * 0.5;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops into the valley, so the far side shows. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - VALLEY - 20);
      position.setY(i * 2 + 1, p.height - VALLEY - 20);
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
        const jump = Math.max(0, Math.sin(this.time * 4 + p.phase)) * 0.12;
        const heading = p.x > 0 ? -Math.PI / 2 : Math.PI / 2;
        crowd.set(i, p.x, heightAt(metres) + p.y + jump, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The pass road, the slate scree climbing on the right and the slope falling to the valley on the left. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.85 });
    const slate = this.material({
      map: this.repeat(slateTexture(), 8, 8),
      roughness: 1,
      flatShading: true,
    });
    const turf = this.material({
      map: this.repeat(turfTexture(), 8, 8),
      roughness: 1,
      flatShading: true,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, slate, [
      [r + 260, 150],
      [r + 60, 30],
      [r + 4, 1],
      [r, 0.02],
    ]);
    this.ribbons.add(points, slate, [
      [-r, 0.02],
      [-r - 4, -0.8],
      [-r - 40, -16],
    ]);
    this.ribbons.add(points, turf, [
      [-r - 40, -16],
      [-r - 300, -120],
      [-r - 900, -VALLEY],
    ]);
  }

  /** The banks of old snow cut back by the ploughs, dirty and melting, on both sides of the road. */
  private addSnowBanks(roadHalf: number): void {
    const random = seeded(7501);
    const snow = this.material({
      map: this.track(snowTexture()),
      roughness: 0.75,
      flatShading: true,
    });
    const lump = new DodecahedronGeometry(1, 1);
    this.disposables.push(lump);
    for (let offset = 0; offset < LOOP; offset += 2.4 + random() * 1.6)
      for (const side of [-1, 1]) {
        // The banks are higher on the uphill side, broken where the fans have trodden them.
        if (random() < (side > 0 ? 0.12 : 0.35)) continue;
        const bank = new Group();
        // The ploughed face: a sheer wall facing the road, the top rounded and lumpy.
        const h = side > 0 ? 0.9 + random() * 0.9 : 0.5 + random() * 0.5;
        // Rounded heaps of ploughed snow, their faces cut back steep toward the road.
        const heap = new Mesh(lump, snow);
        heap.scale.set(1.6, h, 2 + random() * 0.8);
        heap.position.set(side * 1.5, h * 0.35, 0);
        const back = new Mesh(lump, snow);
        back.scale.set(2.2, h * 0.7, 2.2);
        back.position.set(side * 3.2, h * 0.25, (random() - 0.5) * 1.2);
        bank.add(heap, back);
        bank.children.forEach((m) => (m.castShadow = true));
        const holder = new Group();
        holder.add(bank);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + 0.9) });
      }
    // Snowfields lying further up the scree.
    for (let k = 0; k < 12; k++) {
      const field = new Mesh(lump, snow);
      field.scale.set(8 + random() * 12, 0.8, 5 + random() * 8);
      field.rotation.y = random() * 3;
      const d = 14 + random() * 120;
      field.position.y = d < 60 ? 1 + ((d - 4) * 29) / 56 : 30 + ((d - 60) * 120) / 200;
      const holder = new Group();
      holder.add(field);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: random() * LOOP, x: roadHalf + d });
    }
  }

  /** The riders' names painted in white on the tarmac by the fans. */
  private addNames(roadHalf: number): void {
    NAMES.forEach((name, k) => {
      const paint = this.material({
        map: this.track(nameTexture(name)),
        transparent: true,
        depthWrite: false,
        roughness: 0.8,
      });
      const panel = new Mesh(this.unit, paint);
      panel.scale.set(roadHalf * 1.4, 0.01, 4.4);
      panel.position.y = 0.03;
      const holder = new Group();
      holder.add(panel);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 30 + k * 55, x: 0 });
    });
  }

  /** The red-and-white kilometre posts counting down to the summit. */
  private addPosts(roadHalf: number): void {
    const white = this.material({ color: 0xf4f4f0, roughness: 0.6 });
    const sign = this.material({ map: this.track(postTexture()), roughness: 0.6 });
    for (const offset of [80, 260]) {
      const post = new Group();
      const body = new Mesh(this.unit, white);
      body.scale.set(0.3, 1.2, 0.5);
      body.position.y = 0.6;
      const face = new Mesh(this.unit, sign);
      face.scale.set(0.32, 0.9, 0.52);
      face.position.y = 0.75;
      post.add(body, face);
      const holder = new Group();
      holder.add(post);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 0.6 });
    }
  }

  /** Fans in team jerseys standing on the snow banks, waving their flags. */
  private addFans(roadHalf: number): void {
    const random = seeded(7511);
    const flagColours = [0xffd23f, 0xd8102e, 0x1d5aa8, 0xf4f4f0, 0x2a8a4a].map((c) =>
      this.material({ color: c, roughness: 0.7 }),
    );
    const pole = this.material({ color: 0x3a3a3a, roughness: 0.6 });
    for (let k = 0; k < 40; k++) {
      const side = random() < 0.65 ? 1 : -1;
      const offset = 12 + random() * (LOOP - 24);
      const x = side * (roadHalf + 0.6 + random() * 0.4);
      this.people.push({ offset, x, phase: random() * 6, y: 0 });
      if (random() < 0.4) {
        const f = new Group();
        const stick = new Mesh(this.unit, pole);
        stick.scale.set(0.04, 2.6, 0.04);
        stick.position.y = 2.2;
        const cloth = new Mesh(this.unit, flagColours[k % flagColours.length]!);
        cloth.scale.set(0.02, 0.7, 1.1);
        cloth.position.set(0, 3.1, 0.55);
        f.add(stick, cloth);
        f.position.set(0.3, 0, 0);
        this.flags.push({ mesh: cloth, phase: random() * 6 });
        const holder = new Group();
        holder.add(f);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x });
      }
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, FAN_WEAR, 7517);
  }

  /** The stone monument to Henri Desgrange, beside the road below the pass. */
  private addMonument(roadHalf: number): void {
    const stone = this.material({
      map: this.track(stoneTexture()),
      roughness: 0.95,
      flatShading: true,
    });
    const plaque = this.material({
      map: this.track(plaqueTexture()),
      roughness: 0.4,
      metalness: 0.5,
    });
    const m = new Group();
    const base = new Mesh(this.unit, stone);
    base.scale.set(3, 0.8, 3);
    base.position.y = 0.4;
    const shaft = new Mesh(this.unit, stone);
    shaft.scale.set(1.6, 4.6, 1.2);
    shaft.position.y = 3.1;
    const cap = new Mesh(this.unit, stone);
    cap.scale.set(1.9, 0.4, 1.5);
    cap.position.y = 5.6;
    const face = new Mesh(this.unit, plaque);
    face.scale.set(0.05, 1.4, 0.9);
    face.position.set(-0.82, 3.6, 0);
    m.add(base, shaft, cap, face);
    m.children.forEach((c) => (c.castShadow = true));
    const holder = new Group();
    holder.add(m);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 160, x: roadHalf + 5 });
  }

  /** The jagged ridge of the pass ahead, and La Meije's glaciers across the valley. */
  private addMeije(): void {
    const random = seeded(7521);
    const rock = [0x4a4a52, 0x5a5a62, 0x3a3a44].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const ice = this.material({ color: 0xf4f8ff, roughness: 0.6, flatShading: true });
    const peak = new ConeGeometry(1, 1, 7, 3);
    this.disposables.push(peak);
    const mountain = (x: number, z: number, h: number, w: number, snowLine: number) => {
      const p = new Mesh(peak, rock[Math.floor(random() * rock.length)]!);
      p.scale.set(w, h, w * 0.7);
      p.position.set(x, h / 2 - 40, z);
      p.rotation.y = random() * 3;
      this.horizon.add(p);
      if (snowLine < 1) {
        // The snow sits a touch proud of the rock, so the two faces never fight.
        const cap = new Mesh(peak, ice);
        const t = 1 - snowLine;
        cap.scale.set(w * t * 1.1, h * t, w * 0.7 * t * 1.1);
        cap.position.set(x, h - 40 - (h * t) / 2 + 8, z);
        cap.rotation.y = p.rotation.y;
        this.horizon.add(cap);
      }
    };
    // La Meije and its neighbours, glaciated, far across the valley on the left.
    for (let k = 0; k < 7; k++)
      mountain(
        -3400 + k * 700 + random() * 200,
        -4400 - random() * 1200,
        900 + random() * 1100,
        800 + random() * 500,
        0.6 + random() * 0.12,
      );
    // The pass's own shattered ridge ahead and to the right.
    for (let k = 0; k < 6; k++)
      mountain(
        300 + k * 300,
        -1500 - random() * 400,
        220 + random() * 160,
        300 + random() * 120,
        random() < 0.5 ? 0.82 : 1,
      );
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

/** The pass road's patched grey tarmac, wet at the edges with meltwater. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a4a4c', 7531);
    g.fillStyle = 'rgba(20,20,24,0.35)';
    g.fillRect(0, 0, 12, 128);
    g.fillRect(116, 0, 12, 128);
    g.fillStyle = 'rgba(240,240,236,0.8)';
    g.fillRect(62, 0, 3, 40);
    g.fillRect(62, 64, 3, 40);
  });
}

/** The black slate scree, shattered into flakes. */
function slateTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a4a50', 7541);
    const random = seeded(7543);
    for (let i = 0; i < 140; i++) {
      g.fillStyle = ['#2a2a30', '#6a6a72', '#3a3a3e'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 5, 1 + random() * 2);
    }
  });
}

/** The thin alpine turf on the lower slopes, still brown from the snow. */
function turfTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#6a7a4a', 7551);
    const random = seeded(7553);
    g.fillStyle = 'rgba(80,70,60,0.5)';
    for (let i = 0; i < 40; i++) g.fillRect(random() * 64, random() * 64, 3, 3);
  });
}

/** Old snow, grey with grit, streaked where it melts. */
function snowTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#eef0f4', 7561);
    const random = seeded(7563);
    g.fillStyle = 'rgba(90,90,100,0.18)';
    for (let i = 0; i < 18; i++) g.fillRect(0, random() * 64, 64, 1 + random() * 2);
  });
}

/** A rider's name in rough white paint, as the rider reads it. */
function nameTexture(name: string): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.clearRect(0, 0, 512, 128);
    g.save();
    g.translate(256, 64);
    g.scale(-1, 1.8);
    g.fillStyle = 'rgba(250,250,245,0.9)';
    g.font = 'bold 72px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 0, 0);
    g.restore();
  });
}

/** The kilometre post's red band and summit countdown. */
function postTexture(): CanvasTexture {
  return canvasTexture(32, 64, (g) => {
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, 32, 64);
    g.fillStyle = '#d8102e';
    g.fillRect(0, 0, 32, 16);
    g.fillStyle = '#1d1f24';
    g.font = 'bold 14px sans-serif';
    g.textAlign = 'center';
    g.fillText('2', 16, 36);
    g.font = 'bold 8px sans-serif';
    g.fillText('km', 16, 50);
  });
}

/** The monument's grey dressed stone. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#8a8a88', 7571);
    g.strokeStyle = 'rgba(40,40,40,0.4)';
    for (let y = 0; y < 64; y += 16) g.strokeRect(0, y, 64, 16);
  });
}

/** The monument's bronze plaque. */
function plaqueTexture(): CanvasTexture {
  return canvasTexture(64, 96, (g) => {
    speckle(g, 64, 96, '#8a6a3a', 7581);
    g.fillStyle = 'rgba(40,30,10,0.6)';
    g.beginPath();
    g.arc(32, 30, 14, 0, Math.PI * 2);
    g.fill();
    for (let y = 56; y < 90; y += 8) g.fillRect(10, y, 44, 2);
  });
}
