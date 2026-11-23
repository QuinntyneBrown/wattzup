// Notting Hill Carnival's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// Ladbroke Grove on carnival Monday. Pastel stucco terraces line both sides behind the crowd
// barriers, the pavements packed and bouncing; bunting in the islands' colours zigzags across the
// road. Sound systems stack their speakers at the kerb and the bass pulses through their cones,
// jerk chicken smokes on the stalls, and mas bands dance up the road in feathered backpieces for
// the rider to push through. The Westway crosses overhead once a lap and Trellick Tower stands on
// the skyline ahead. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  buntingGeometry,
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** Ladbroke Grove repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 320;
const BEHIND = 24;
const KERB = 0.13;
/** The pavement runs PAVEMENT metres from the kerb to the terraces' fronts. */
const PAVEMENT = 5.5;
const TERRACE_HEIGHT = 13;
/** Bunting crosses every BUNTING metres; a sound system plays every SOUND metres each side. */
const BUNTING = 12;
const SOUND = 80;
/** Jerk chicken stalls stand every STALL metres, between the sound systems. */
const STALL = 80;
/** The Westway crosses overhead this far round each lap. */
const WESTWAY_AT = 230;
const WESTWAY_HEIGHT = 15;
/** Trellick Tower stands this far ahead, left of the Grove. */
const TRELLICK_AHEAD = 900;
const TRELLICK_X = -110;

/** The islands' colours: Trinidad, Jamaica, Barbados, Grenada, Guyana, St Lucia. */
const ISLANDS = [
  '#ce1126',
  '#111111',
  '#ffffff',
  '#009b3a',
  '#fed100',
  '#00267f',
  '#ffc726',
  '#66ccff',
];

const CROWD_WEAR = {
  tops: ['#ffd23f', '#009b3a', '#ce1126', '#f5f5f0', '#111318', '#00267f', '#ff7a00', '#66ccff'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#c9b8a0'],
  skins: ['#5a3a29', '#3f2a1f', '#8d5a3b', '#c48a5f', '#e2b48c', '#f0c8a0'],
};

const MAS_WEAR = {
  tops: ['#ffd23f', '#ff3b8a', '#14d4c4', '#ffffff', '#ff7a00', '#b14bff'],
  bottoms: ['#ffd23f', '#ff3b8a', '#14d4c4', '#ffffff'],
  skins: ['#5a3a29', '#3f2a1f', '#8d5a3b', '#c48a5f'],
};

/** Each mas band's feathers. */
const BANDS = [
  ['#ffd23f', '#ff7a00', '#ce1126', '#ffe9a0'],
  ['#14d4c4', '#ffffff', '#2c7be5', '#a0f0ff'],
  ['#ff3b8a', '#b14bff', '#ffd1ec', '#ff7ac0'],
];

interface Reveller {
  readonly offset: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly scale: number;
  readonly phase: number;
}

interface Dancer {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
  readonly back: Mesh;
}

export class NottingHillStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly revellers: Reveller[] = [];
  private crowd: Figures | null = null;
  private readonly dancers: Dancer[] = [];
  private mas: Figures | null = null;
  private readonly cones: Mesh[] = [];
  private readonly smoke: { mesh: Mesh; phase: number }[] = [];
  private readonly trellick = new Group();
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
    this.addTerraces(roadHalf, points);
    this.addBunting(roadHalf);
    this.addBarriers(roadHalf, points);
    this.addSoundSystems(roadHalf);
    this.addStalls(roadHalf);
    this.addCrowd(roadHalf);
    this.addMasBands(roadHalf);
    this.addWestway();
    this.addTrellick();
  }

  /** The bass thumps through the cones; smoke rises from the grills. */
  setTime(seconds: number): void {
    this.time = seconds;
    const beat = Math.pow(Math.max(0, Math.sin(seconds * Math.PI * 2.1)), 6);
    for (const cone of this.cones) cone.scale.setScalar(1 + beat * 0.12);
    for (const puff of this.smoke) {
      const u = (seconds * 0.25 + puff.phase) % 1;
      puff.mesh.position.y = 2.4 + u * 6;
      puff.mesh.scale.setScalar(0.4 + u * 1.6);
      (puff.mesh.material as MeshStandardMaterial).opacity = 0.4 * (1 - u);
    }
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
      this.revellers.forEach((r, i) => {
        const metres = loopMetres(r.offset, s, LOOP, BEHIND);
        const jump = Math.max(0, Math.sin(this.time * 6.6 + r.phase)) * 0.12;
        crowd.set(i, r.x, heightAt(metres) + r.y, -metres, r.heading, r.scale, jump);
      });
      crowd.commit();
    }
    const mas = this.mas;
    if (mas) {
      this.dancers.forEach((d, i) => {
        const metres = loopMetres(d.offset + d.speed * this.time, s, LOOP, BEHIND);
        const sway = Math.sin(this.time * 3.3 + d.phase);
        const y = heightAt(metres);
        const bob = Math.abs(sway) * 0.08;
        mas.set(i, d.x + sway * 0.15, y, -metres, sway * 0.25, 1, bob);
        d.back.position.set(d.x + sway * 0.15, y + bob + 1.15, -metres + 0.28);
        d.back.rotation.z = sway * 0.12;
      });
      mas.commit();
    }
    this.trellick.position.set(TRELLICK_X, heightAt(TRELLICK_AHEAD), -TRELLICK_AHEAD);
  }

  /** The kerbs and the pavements, paved in London's grey flags. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const flags = this.material({ map: this.repeat(flagsTexture(), 3, 3), roughness: 0.85 });
    const kerb = this.material({ color: 0xb9b6ae, roughness: 0.9 });
    for (const side of [-1, 1] as const) {
      const profile: [number, number][] = [
        [side * r, 0],
        [side * (r + 0.04), KERB],
        [side * (r + 0.25), KERB],
      ];
      this.ribbons.add(points, kerb, side < 0 ? profile : [...profile].reverse());
      const walk: [number, number][] = [
        [side * (r + 0.25), KERB],
        [side * (r + PAVEMENT + 1), KERB],
      ];
      this.ribbons.add(points, flags, side < 0 ? walk : [...walk].reverse());
    }
  }

  /** The terraces: four storeys of pastel stucco, sash windows and balconies, both sides. */
  private addTerraces(roadHalf: number, points: number): void {
    const front = this.material({
      map: this.repeat(terraceTexture(), TERRACE_HEIGHT, 18),
      roughness: 0.85,
    });
    const roofs = this.material({ color: 0x4a4a50, roughness: 0.9 });
    const x = roadHalf + PAVEMENT;
    this.ribbons.add(points, front, [
      [-x, KERB],
      [-x, TERRACE_HEIGHT],
    ]);
    this.ribbons.add(points, roofs, [
      [-x, TERRACE_HEIGHT],
      [-x - 18, TERRACE_HEIGHT],
    ]);
    this.ribbons.add(points, front, [
      [x, TERRACE_HEIGHT],
      [x, KERB],
    ]);
    this.ribbons.add(points, roofs, [
      [x + 18, TERRACE_HEIGHT],
      [x, TERRACE_HEIGHT],
    ]);
  }

  /** Bunting zigzagging across the Grove from terrace to terrace, flags in the islands' colours. */
  private addBunting(roadHalf: number): void {
    const span = roadHalf + PAVEMENT;
    const pennant = this.material({ vertexColors: true, side: DoubleSide, roughness: 0.8 });
    const geometry = buntingGeometry(span, ISLANDS, [
      [8.5, 0],
      [7.2, 3],
    ]);
    this.disposables.push(geometry);
    for (let offset = 0; offset < LOOP; offset += BUNTING) {
      if (Math.abs(offset - WESTWAY_AT) < 16) continue;
      const bunting = new Group();
      bunting.add(new Mesh(geometry, pennant));
      this.group.add(bunting);
      this.props.push({ mesh: bunting, offset, x: 0 });
    }
  }

  /** Steel crowd barriers along both kerbs, panel after panel, cut out against the crowd. */
  private addBarriers(roadHalf: number, points: number): void {
    const steel = this.material({
      map: this.repeat(barrierTexture(), 1.1, 2.3),
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0xc9ccd2,
      metalness: 0.6,
      roughness: 0.4,
    });
    const x = roadHalf + 0.5;
    this.ribbons.add(points, steel, [
      [-x, KERB],
      [-x, KERB + 1.1],
    ]);
    this.ribbons.add(points, steel, [
      [x, KERB + 1.1],
      [x, KERB],
    ]);
  }

  /** Sound systems at the kerb: walls of speaker boxes, cones pulsing, a banner over the decks. */
  private addSoundSystems(roadHalf: number): void {
    const box = this.material({ color: 0x141416, roughness: 0.7 });
    const cone = this.material({ map: this.track(coneTexture()), roughness: 0.6 });
    const names = ['ROOTS HI-FI', 'GROVE SOUND', 'BASS LINE', 'SUNSHINE SOUND'];
    const banners = names.map((name, k) =>
      this.material({
        map: this.track(bannerTexture(name, ISLANDS[[0, 3, 5, 4][k]!]!)),
        side: DoubleSide,
        roughness: 0.8,
      }),
    );
    const disc = new CircleGeometry(0.36, 20);
    const sheet = new PlaneGeometry(5, 1);
    this.disposables.push(disc, sheet);
    for (const side of [-1, 1] as const) {
      for (let offset = side < 0 ? 30 : 70, k = 0; offset < LOOP; offset += SOUND, k++) {
        const system = new Group();
        // The stack faces the road: its front at local +x, turned on the right.
        for (let col = 0; col < 3; col++) {
          for (let row = 0; row < 3; row++) {
            const z = (col - 1) * 0.95;
            const y = KERB + 0.5 + row * 0.95;
            const b = new Mesh(this.unit, box);
            b.scale.set(0.8, 0.9, 0.9);
            b.position.set(0, y, z);
            b.castShadow = true;
            const c = new Mesh(disc, cone);
            c.position.set(0.41, y, z);
            c.rotation.y = Math.PI / 2;
            system.add(b, c);
            this.cones.push(c);
          }
        }
        // The gazebo over the decks, behind the stack, and the system's banner on its front.
        for (const [x, z] of [
          [-1.2, -2.6],
          [-1.2, 2.6],
          [-4, -2.6],
          [-4, 2.6],
        ] as const) {
          const leg = new Mesh(this.unit, box);
          leg.scale.set(0.08, 3.2, 0.08);
          leg.position.set(x, KERB + 1.6, z);
          system.add(leg);
        }
        const canopy = new Mesh(this.unit, banners[k % banners.length]!);
        canopy.scale.set(3, 0.12, 5.4);
        canopy.position.set(-2.6, KERB + 3.25, 0);
        const banner = new Mesh(sheet, banners[k % banners.length]!);
        banner.rotation.y = Math.PI / 2;
        banner.position.set(-1.15, KERB + 3.8, 0);
        system.add(canopy, banner);
        if (side > 0) system.rotation.y = Math.PI;
        this.group.add(system);
        this.props.push({ mesh: system, offset, x: side * (roadHalf + 1.2) });
      }
    }
  }

  /** Jerk chicken stalls: a gazebo, an oil-drum grill and its smoke rising. */
  private addStalls(roadHalf: number): void {
    const canvas = this.material({
      map: this.track(stallTexture()),
      side: DoubleSide,
      roughness: 0.8,
    });
    const drum = this.material({ color: 0x2a2a2c, metalness: 0.6, roughness: 0.5 });
    const ember = new MeshBasicMaterial({ color: 0xff6a1f });
    const barrel = new CylinderGeometry(0.4, 0.4, 0.9, 14);
    barrel.rotateZ(Math.PI / 2);
    const puff = new SphereGeometry(0.6, 10, 8);
    this.disposables.push(ember, barrel, puff);
    for (const side of [-1, 1] as const) {
      for (let offset = side < 0 ? 70 : 30; offset < LOOP; offset += STALL) {
        const stall = new Group();
        const roof = new Mesh(this.unit, canvas);
        roof.scale.set(3, 0.1, 3);
        roof.position.y = KERB + 2.6;
        stall.add(roof);
        for (const [x, z] of [
          [-1.4, -1.4],
          [-1.4, 1.4],
          [1.4, -1.4],
          [1.4, 1.4],
        ] as const) {
          const leg = new Mesh(this.unit, drum);
          leg.scale.set(0.06, 2.6, 0.06);
          leg.position.set(x, KERB + 1.3, z);
          stall.add(leg);
        }
        const grill = new Mesh(barrel, drum);
        grill.position.set(0.6, KERB + 0.9, 0);
        const coals = new Mesh(this.unit, ember);
        coals.scale.set(0.7, 0.04, 0.5);
        coals.position.set(0.6, KERB + 1.33, 0);
        stall.add(grill, coals);
        for (let k = 0; k < 4; k++) {
          const material = new MeshStandardMaterial({
            color: 0xd9d4cc,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
          });
          this.disposables.push(material);
          const p = new Mesh(puff, material);
          p.position.set(0.6, 3, 0);
          stall.add(p);
          this.smoke.push({ mesh: p, phase: k / 4 });
        }
        this.group.add(stall);
        this.props.push({ mesh: stall, offset, x: side * (roadHalf + PAVEMENT - 2) });
      }
    }
  }

  /** The crowd packing both pavements behind the barriers, jumping to the sound systems. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(211);
    const busy = (offset: number, side: number) => {
      const sound = (offset - (side < 0 ? 30 : 70) + LOOP) % SOUND;
      const stall = (offset - (side < 0 ? 70 : 30) + LOOP) % STALL;
      return Math.min(sound, SOUND - sound) < 3.5 || Math.min(stall, STALL - stall) < 2.2;
    };
    for (const side of [-1, 1] as const) {
      for (let row = 0; row < 4; row++) {
        for (let offset = 0; offset < LOOP; offset += 0.7 + random() * 0.4) {
          if (busy(offset, side)) continue;
          if (row === 3 && random() < 0.5) continue;
          this.revellers.push({
            offset,
            x: side * (roadHalf + 0.95 + row * 0.75 + random() * 0.2),
            y: KERB,
            heading: (side < 0 ? -Math.PI / 2 : Math.PI / 2) + (random() - 0.5) * 1.2,
            scale: 0.88 + random() * 0.18,
            phase: random() * 6.3,
          });
        }
      }
    }
    this.crowd = new Figures(this.group, this.disposables, this.revellers.length, CROWD_WEAR, 223);
  }

  /** Mas bands dancing up the road in their backpieces, slower than the rider. */
  private addMasBands(roadHalf: number): void {
    const random = seeded(227);
    const backs = BANDS.map((palette) => {
      const geometry = backpiece(palette);
      this.disposables.push(geometry);
      return geometry;
    });
    const feathers = this.material({
      vertexColors: true,
      side: DoubleSide,
      roughness: 0.5,
      emissive: 0x222222,
    });
    for (let band = 0; band < 3; band++) {
      const start = band * (LOOP / 3) + 40;
      for (let k = 0; k < 14; k++) {
        const back = new Mesh(backs[band]!, feathers);
        back.castShadow = true;
        this.group.add(back);
        const lane = random() < 0.5 ? -1 : 1;
        this.dancers.push({
          offset: start + k * 1.8 + random() * 1.5,
          x: lane * (1.5 + random() * (roadHalf - 1.9)),
          speed: 0.9 + random() * 0.3,
          phase: random() * 6.3,
          back,
        });
      }
    }
    this.mas = new Figures(this.group, this.disposables, this.dancers.length, MAS_WEAR, 229);
  }

  /** The Westway: the motorway's concrete deck on its piers, crossing overhead once a lap. */
  private addWestway(): void {
    const concrete = this.material({ map: this.repeat(concreteTexture(), 6, 6), roughness: 0.95 });
    const westway = new Group();
    const deck = new Mesh(this.unit, concrete);
    deck.scale.set(900, 1.6, 26);
    deck.position.y = WESTWAY_HEIGHT;
    deck.castShadow = true;
    const parapet = new Mesh(this.unit, concrete);
    parapet.scale.set(900, 1.1, 0.4);
    parapet.position.set(0, WESTWAY_HEIGHT + 1.3, 12.8);
    const back = parapet.clone();
    back.position.z = -12.8;
    westway.add(deck, parapet, back);
    for (const x of [-26, -12, 12, 26, -60, 60, -100, 100]) {
      const pier = new Mesh(this.unit, concrete);
      pier.scale.set(2.2, WESTWAY_HEIGHT, 6);
      pier.position.set(x, WESTWAY_HEIGHT / 2, 0);
      westway.add(pier);
    }
    this.group.add(westway);
    this.props.push({ mesh: westway, offset: WESTWAY_AT, x: 0 });
  }

  /** Trellick Tower: the slab, its separate service tower, the bridges every third floor and the
   * boiler house cantilevered over the top. */
  private addTrellick(): void {
    const slab = this.material({ map: this.track(trellickTexture()), roughness: 0.9 });
    const concrete = this.material({ color: 0x9a968c, roughness: 0.95 });
    const main = new Mesh(this.unit, slab);
    main.scale.set(34, 92, 16);
    main.position.y = 46;
    const service = new Mesh(this.unit, concrete);
    service.scale.set(8, 100, 8);
    service.position.set(24, 50, 0);
    const boiler = new Mesh(this.unit, concrete);
    boiler.scale.set(12, 7, 9);
    boiler.position.set(26, 103, 0);
    this.trellick.add(main, service, boiler);
    for (let y = 10; y < 92; y += 9) {
      const bridge = new Mesh(this.unit, concrete);
      bridge.scale.set(8, 2, 4);
      bridge.position.set(18, y, 0);
      this.trellick.add(bridge);
    }
    this.trellick.rotation.y = 0.5;
    this.group.add(this.trellick);
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

/** A mas backpiece: a fan of long feathers spread behind the dancer, coloured by the band. */
function backpiece(palette: readonly string[]): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const count = 15;
  for (let k = 0; k < count; k++) {
    const angle = ((k / (count - 1)) * 2 - 1) * 1.35;
    const feather = new PlaneGeometry(0.32, 1.9 - Math.abs(angle) * 0.35);
    const position = feather.getAttribute('position');
    // Taper each feather to a point at its tip.
    position.setX(0, 0);
    position.setX(1, 0);
    feather.translate(0, 0.95 + 0.2, 0);
    feather.rotateZ(angle);
    const colour = new Color(palette[k % palette.length]!);
    const colours = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) colour.toArray(colours, i * 3);
    feather.setAttribute('color', new Float32BufferAttribute(colours, 3));
    parts.push(feather);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** London's grey paving flags. */
function flagsTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#a19d96', 233);
    g.strokeStyle = 'rgba(50,48,45,0.45)';
    g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 128) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.moveTo(0, i);
      g.lineTo(256, i);
      g.stroke();
    }
  });
}

/**
 * The terraces, 13 m tall over 18 m of street: three houses per tile in pastel stucco, a raised
 * ground floor with its steps and bay, three floors of sash windows, a balcony on the first and
 * a cornice. The picture is drawn upright and turned onto the ribbon, whose across runs up.
 */
function terraceTexture(): CanvasTexture {
  const stuccos = ['#f4c6d0', '#cfe8d8', '#fbe7a6', '#c6dcf0', '#ddcdea', '#f5f1e8'];
  return canvasTexture(512, 1024, (g) => {
    g.setTransform(0, -1, -1, 0, 512, 1024);
    const random = seeded(239);
    const width = 1024 / 3;
    for (let h = 0; h < 3; h++) {
      const left = h * width;
      g.fillStyle = stuccos[(h * 2 + Math.floor(random() * 2)) % stuccos.length]!;
      g.fillRect(left, 0, width, 512);
      // The cornice and parapet.
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(left, 22, width, 12);
      g.fillStyle = 'rgba(0,0,0,0.15)';
      g.fillRect(left, 34, width, 4);
      g.fillRect(left, 0, 3, 512);
      // Three floors of sash windows, white frames, dark glass.
      for (const [y, tall] of [
        [70, 70],
        [170, 80],
        [280, 100],
      ] as const) {
        for (const x of [left + 50, left + 150, left + 250]) {
          g.fillStyle = '#ffffff';
          g.fillRect(x - 4, y - 4, 50, tall + 8);
          g.fillStyle = random() < 0.2 ? '#6a5a48' : '#2e3542';
          g.fillRect(x, y, 42, tall);
          g.fillStyle = '#ffffff';
          g.fillRect(x, y + tall / 2 - 2, 42, 4);
        }
      }
      // The first-floor balcony's black railing.
      g.fillStyle = '#1b1b1f';
      g.fillRect(left + 36, 368, width - 70, 5);
      for (let x = left + 36; x < left + width - 34; x += 9) g.fillRect(x, 368, 2, 26);
      g.fillRect(left + 36, 392, width - 70, 4);
      // The ground floor: the bay, the front door at the top of its steps, the area railings.
      g.fillStyle = '#ffffff';
      g.fillRect(left + 30, 404, 140, 108);
      g.fillStyle = '#2e3542';
      g.fillRect(left + 42, 414, 116, 80);
      g.fillStyle = ['#111318', '#1b3a5c', '#7a1424', '#1f4d36'][h % 4]!;
      g.fillRect(left + 220, 410, 50, 92);
      g.fillStyle = '#d9d4cc';
      g.fillRect(left + 205, 500, 80, 12);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
}

/** A crowd barrier's panel: across runs up it, along runs with the street. Cut out. */
function barrierTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    g.clearRect(0, 0, 128, 256);
    g.fillStyle = '#ffffff';
    g.fillRect(4, 0, 10, 256);
    g.fillRect(114, 0, 10, 256);
    g.fillRect(0, 0, 128, 10);
    for (let y = 22; y < 256; y += 16) g.fillRect(14, y, 100, 4);
  });
}

/** A loudspeaker's cone, its dust cap and surround. */
function coneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#0c0c0e';
    g.fillRect(0, 0, 128, 128);
    const ring = g.createRadialGradient(64, 64, 8, 64, 64, 62);
    ring.addColorStop(0, '#3a3a40');
    ring.addColorStop(0.3, '#1c1c20');
    ring.addColorStop(0.85, '#2a2a30');
    ring.addColorStop(1, '#55555c');
    g.fillStyle = ring;
    g.beginPath();
    g.arc(64, 64, 62, 0, Math.PI * 2);
    g.fill();
  });
}

/** A sound system's banner. */
function bannerTexture(name: string, colour: string): CanvasTexture {
  return canvasTexture(512, 100, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 512, 100);
    g.fillStyle = '#fed100';
    g.fillRect(0, 0, 512, 10);
    g.fillRect(0, 90, 512, 10);
    g.fillStyle = colour === '#fed100' || colour === '#ffffff' ? '#111111' : '#ffffff';
    g.font = 'bold 58px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 256, 54);
  });
}

/** A stall's striped canvas. */
function stallTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    for (let x = 0; x < 128; x += 32) {
      g.fillStyle = '#ce1126';
      g.fillRect(x, 0, 16, 128);
      g.fillStyle = '#f5f1e8';
      g.fillRect(x + 16, 0, 16, 128);
    }
  });
}

/** Weathered motorway concrete. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#9c988e', 241);
    g.fillStyle = 'rgba(40,38,34,0.12)';
    for (let i = 0; i < 6; i++) g.fillRect(0, i * 44 + 10, 256, 14);
  });
}

/** Trellick's slab: its floors of balconies and windows in bands of raw concrete. */
function trellickTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#8f8b82', 251);
    const random = seeded(257);
    for (let y = 6; y < 512; y += 17) {
      for (let x = 4; x < 256; x += 21) {
        g.fillStyle = random() < 0.15 ? '#c96a3a' : '#2e3542';
        g.fillRect(x, y, 15, 9);
      }
    }
  });
}
