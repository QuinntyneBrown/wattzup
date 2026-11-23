// Koppenberg Cobbles' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): a
// Flemish farm lane on a misty spring morning that tips up into the Koppenberg's slick cobbles.
// Grass banks rise from the lane's muddy edges, packed with fans waving Flanders' lion; behind
// them whitewashed farmhouses and brick barns under steep red roofs, hedged fields of young wheat
// and ploughed earth, rows of poplars and pollard willows, cows grazing and a tractor parked by a
// gate; ahead, Melden's church tower stands on the wooded hill the cobbles climb.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners
// and road paint of world-kit.ts. The cobbles themselves are Old Town's road (world-renderer.ts).
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  hazedMaterial,
  loopMetres,
  Mist,
  type MistCurtain,
  paintTexture,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
/** The fans stand on the grass, a hand's height above the cobbles. */
const KERB = 0.15;
/** Low race barriers hold the fans off the cobbles; the banks rise behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.3;
const CROWD_FAR = 7.4;
/** Hedges line the fields; farms and trees stand back in them. */
const HEDGE = 12;
/** A hamlet of brick houses lines the lane between these offsets, where the hedges stop. */
const HAMLET: readonly [number, number] = [262, 318];
/** The hill the cobbles climb, its church on the crest ahead, hazed by hand. */
const HILL_AHEAD = 560;
/** Melden's church on its knoll just left of the cobbles, in front of the mist's mid curtain. */
const CHURCH_AHEAD = 400;
const MIST = 0xc9cec4;
/**
 * The spring mist, the street's own since the physical sky takes no fog: curtains across the
 * horizon, one behind the hill so the church rises out of it and a thinner one veiling the hill,
 * and banks lying low over the fields, drifting on the street's clock.
 */
const CURTAINS: readonly MistCurtain[] = [
  { ahead: 1100, height: 900, opacity: 1 },
  { ahead: 520, height: 220, opacity: 0.7 },
  { ahead: 290, height: 50, opacity: 0.3 },
];
const MIST_BANKS = 10;

const SKINS = ['#f3cfb3', '#e8b896', '#d9a17c', '#b67a55', '#8a5a3c'];
const SUPPORTERS: Wardrobe = {
  tops: [
    '#ffd200',
    '#ffd200',
    '#111111',
    '#2f3b4c',
    '#7a1f2b',
    '#f2efe6',
    '#3a6b4a',
    '#d8283a',
    '#4f86c6',
    '#8a8f96',
  ],
  bottoms: ['#2a3140', '#1e2530', '#3b4a5c', '#4a4038', '#20242b'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#ffd200', ink: '#111111', text: 'KOPPENBERG' },
  { fill: '#111111', ink: '#ffd200', text: 'VLAANDEREN' },
  { fill: '#d8283a', ink: '#ffffff', text: 'LOW CADENCE' },
  { fill: '#f2efe6', ink: '#111111', text: 'KASSEIEN' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#2f3b4c', ink: '#ffffff', text: 'STRENGTH BUILDER' },
];
/** What the fans paint on the cobbles, its colour and how far off the crown. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['ALLEZ', '#ffffff', -1.8],
  ['HUP HUP', '#ffd200', 1.8],
  ['KOPPENBERG', '#ffffff', -1.8],
  ['FLANDRIEN', '#ffd200', 1.8],
  ['KASSEI', '#ffffff', -1.8],
  ['WATTZUP', '#d7ff3a', 1.8],
];
/** Flat paint reads only in the first 25 m or so ahead, so some must always be that close. */
const ROAD_PAINT_EVERY = 25;
/** Farmhouses' walls: whitewash, cream render and red brick, under red tile or dark slate. */
const FARMS: readonly { wall: string; roof: string; shutter: string }[] = [
  { wall: '#f1eee6', roof: '#a8432f', shutter: '#2f5d3a' },
  { wall: '#f4ecd8', roof: '#8e3a2a', shutter: '#7a1f2b' },
  { wall: '#9a4a35', roof: '#3a3c40', shutter: '#f1eee6' },
  { wall: '#efe9dc', roof: '#4a4c52', shutter: '#2f3b4c' },
  { wall: '#b0583e', roof: '#a8432f', shutter: '#f4ecd8' },
];

interface Spot {
  readonly x: number;
  readonly offset: number;
}

export class KoppenbergStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  /** Props along the road; one that `lies` on it, as paint does, takes its slope. */
  private readonly props: {
    mesh: Group;
    offset: number;
    every: number;
    x: number;
    lies?: boolean;
  }[] = [];
  private readonly grazing: { mesh: Group; spot: Spot; heading: number }[] = [];
  private readonly hill = new Group();
  private readonly church = new Group();
  private readonly mist: Mist;
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly lion = new MeshStandardMaterial({ side: DoubleSide, roughness: 0.8 });
  private readonly flagMaterials: MeshStandardMaterial[];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.lion.map = this.track(lionFlagTexture());
    this.flagMaterials = [
      this.lion,
      this.lion,
      new MeshStandardMaterial({ color: '#d7ff3a', side: DoubleSide, roughness: 0.8 }),
      new MeshStandardMaterial({ color: '#d8283a', side: DoubleSide, roughness: 0.8 }),
    ];
    this.ribbons = new Ribbons(this.group, disposables);
    this.mist = new Mist(this.group, disposables, track, {
      colour: MIST,
      loop: LOOP,
      curtains: CURTAINS,
      banks: MIST_BANKS,
      bankX: (k) => (k % 2 ? 1 : -1) * (62 + (k % 3) * 25),
    });
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.62,
      wardrobe: SUPPORTERS,
      flags: this.flagMaterials,
      flagShare: 0.3,
      seeds: [337, 347],
      // The fans pack the banks thickest where the cobbles climb and thin out between, so the
      // farmland shows through the gaps.
      skip: (_side, offset, x) => x > CROWD_NEAR + 1.6 && offset % 60 > 38,
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addHedges();
    this.addFarms();
    this.addTrees();
    this.addPoleFlags();
    this.addSummitArch(roadHalf);
    this.addGradeSign();
    this.addRoadPaint();
    this.addCows();
    this.addTractor();
    this.addHill();
    this.addChurch();
    this.mist.build();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  /** Lays the banks, the verges, the fields and the barriers over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the street with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(metres) + bankAt(prop.x), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    // Cows graze slowly round their spot, heads down.
    this.grazing.forEach((cow, i) => {
      const metres = along(cow.spot.offset, LOOP);
      const drift = Math.sin(this.time * 0.05 + i) * 1.5;
      cow.mesh.position.set(cow.spot.x + drift, heightAt(metres) + bankAt(cow.spot.x), -metres);
      cow.mesh.rotation.y = cow.heading + Math.sin(this.time * 0.03 + i) * 0.3;
    });
    this.hill.position.set(0, heightAt(HILL_AHEAD), -HILL_AHEAD);
    this.church.position.set(0, heightAt(CHURCH_AHEAD), -CHURCH_AHEAD);
    this.mist.place(this.time, heightAt, along, bankAt);
  }

  /** The lane's muddy edges, the grass banks, the fields beyond and the barriers. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const mud = this.material({ map: this.repeat(mudTexture(), 2, 2), roughness: 0.6 });
    const grass = this.material({ map: this.repeat(grassTexture(), 6, 6), roughness: 1 });
    const fields = this.material({ map: this.repeat(fieldTexture(), 80, 80), roughness: 1 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, mud, order([at(r + 0.7, 0.1), at(r, 0.004)]));
      this.ribbons.add(
        points,
        grass,
        order([at(60, bankAt(60)), at(14, bankAt(14)), at(8, bankAt(8)), at(r + 0.7, 0.1)]),
      );
      this.ribbons.add(points, fields, order([at(900, bankAt(60)), at(60, bankAt(60))]));
    }
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({ map: texture, alphaTest: 0.5, roughness: 0.5 });
      const x = side * BARRIER;
      const foot = 0.06;
      this.ribbons.add(points, banner, [
        [x, foot + 0.08],
        [x, foot + 0.95],
      ]);
      const rail = this.material({ color: 0xc9ccd0, metalness: 0.6, roughness: 0.4 });
      this.ribbons.add(points, rail, [
        [x, foot + 0.95],
        [x + 0.04, foot + 1.0],
        [x - 0.04, foot + 1.0],
        [x, foot + 0.95],
      ]);
    }
  }

  /** Hawthorn hedges along the fields, broken by gates. */
  private addHedges(): void {
    const hedge = this.material({ map: this.track(leafTexture('#4f7a3a', 349)), roughness: 1 });
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 30) {
        const at = offset + (side > 0 ? 0 : 15);
        if (at + 12 > HAMLET[0] && at - 12 < HAMLET[1]) continue;
        const holder = new Group();
        const mesh = new Mesh(this.unit, hedge);
        mesh.scale.set(1.4, 1.5, 24);
        mesh.position.y = 0.7;
        mesh.castShadow = true;
        holder.add(mesh);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: at, every: LOOP, x: side * HEDGE });
      }
    }
  }

  /**
   * Flemish farms in the fields: long low houses, whitewashed or red brick under steep tile or
   * slate roofs with shuttered windows and a chimney, and brick barns with tarred roofs.
   */
  private addFarms(): void {
    const random = seeded(353);
    const prism = new CylinderGeometry(1, 1, 1, 3, 1);
    // Its axis along x, then turned so one edge points up as the ridge.
    prism.rotateZ(Math.PI / 2);
    prism.rotateX(-Math.PI / 2);
    this.disposables.push(prism);
    const looks = FARMS.map((f, i) => ({
      front: this.material({ map: this.track(farmFrontTexture(f.wall, f.shutter, 359 + i)) }),
      wall: this.material({ color: f.wall, roughness: 0.95 }),
      roof: this.material({ map: this.track(tileTexture(f.roof, 367 + i)), roughness: 0.9 }),
    }));
    const brick = this.material({ map: this.track(brickTexture()), roughness: 0.95 });
    const tar = this.material({ color: 0x2c2d31, roughness: 0.9 });
    const door = this.material({ color: 0x3b2a20, roughness: 0.9 });
    const building = (
      length: number,
      height: number,
      depth: number,
      front: Material,
      wall: Material,
      roof: Material,
    ) => {
      const house = new Group();
      const geometry = new BoxGeometry(length, height, depth);
      scaleFaceUv(geometry, 4, length / 4, 1);
      scaleFaceUv(geometry, 5, length / 4, 1);
      this.disposables.push(geometry);
      const body = new Mesh(geometry, [wall, wall, wall, wall, front, front]);
      body.position.y = height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      // A steep roof: a triangular prism along the ridge, its ends the gables.
      const radius = (depth + 0.6) / Math.sqrt(3);
      const top = new Mesh(prism, [roof, wall, wall]);
      top.scale.set(length + 0.6, radius, radius);
      top.position.y = height + radius / 2;
      top.castShadow = true;
      house.add(body, top);
      return { house, ridge: height + radius * 1.5 };
    };
    for (let offset = 20, k = 0; offset < LOOP; offset += 55 + random() * 40, k++) {
      const side = k % 2 === 0 ? 1 : -1;
      const farm = new Group();
      const look = looks[k % looks.length]!;
      const length = 12 + random() * 6;
      const { house, ridge } = building(length, 3.6, 7, look.front, look.wall, look.roof);
      const chimney = new Mesh(this.unit, brick);
      chimney.scale.set(0.7, 1.8, 0.7);
      chimney.position.set(length / 2 - 1.6, ridge - 0.6, 0);
      house.add(chimney);
      farm.add(house);
      // The barn across the yard, end on to the house.
      if (random() < 0.7) {
        const barnLength = 14 + random() * 8;
        const barn = building(barnLength, 5, 10, brick, brick, tar).house;
        const gate = new Mesh(this.unit, door);
        gate.scale.set(4, 4, 0.1);
        gate.position.set(0, 2, 5.06);
        barn.add(gate);
        barn.rotation.y = Math.PI / 2;
        barn.position.set(side * -(length / 2 + 8), 0, -8);
        farm.add(barn);
      }
      farm.rotation.y = (side > 0 ? -Math.PI / 2 : Math.PI / 2) + (random() - 0.5) * 0.5;
      this.group.add(farm);
      this.props.push({ mesh: farm, offset, every: LOOP, x: side * (24 + random() * 30) });
    }
    // The hamlet: two-storey houses in a row on each side of the lane, fronts to the cobbles,
    // in brick, whitewash and cream, their ridges stepping with each house's height.
    for (const side of [-1, 1] as const) {
      let offset = HAMLET[0] + (side > 0 ? 0 : 4);
      let k = side > 0 ? 0 : 2;
      while (offset < HAMLET[1] - 6) {
        const width = 7 + random() * 3;
        const look = looks[k % looks.length]!;
        const height = 5.4 + random() * 1.6;
        const brickFront = k % 3 === 1;
        const { house, ridge } = building(
          width,
          height,
          8,
          brickFront ? brick : look.front,
          brickFront ? brick : look.wall,
          look.roof,
        );
        const chimney = new Mesh(this.unit, brick);
        chimney.scale.set(0.6, 1.4, 0.6);
        chimney.position.set(width / 2 - 1, ridge - 0.9, -1.5);
        house.add(chimney);
        house.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.group.add(house);
        this.props.push({ mesh: house, offset: offset + width / 2, every: LOOP, x: side * 13.5 });
        offset += width + (random() < 0.25 ? 3 : 0.1);
        k++;
      }
    }
  }

  /** Lombardy poplars in rows along the field edges, pollard willows and blossom by the lane. */
  private addTrees(): void {
    const random = seeded(373);
    const trunk = new CylinderGeometry(0.18, 0.3, 1, 7);
    trunk.translate(0, 0.5, 0);
    const spire = new SphereGeometry(1, 10, 10);
    const ball = new SphereGeometry(1, 10, 8);
    this.disposables.push(trunk, spire, ball);
    const bark = this.material({ color: 0x5a5048, roughness: 1 });
    const willowBark = this.material({ color: 0x6b6152, roughness: 1 });
    const poplar = this.material({ map: this.track(leafTexture('#7fa34a', 379)), roughness: 1 });
    const willow = this.material({ map: this.track(leafTexture('#a8bf6a', 383)), roughness: 1 });
    const blossom = this.material({ map: this.track(leafTexture('#f4e6ea', 389)), roughness: 1 });
    const plant = (x: number, offset: number, kind: 'poplar' | 'willow' | 'blossom') => {
      const tree = new Group();
      const height = kind === 'poplar' ? 16 + random() * 6 : kind === 'willow' ? 2.4 : 3;
      const t = new Mesh(trunk, kind === 'willow' ? willowBark : bark);
      t.scale.set(kind === 'willow' ? 2.2 : 1, height, kind === 'willow' ? 2.2 : 1);
      t.castShadow = true;
      tree.add(t);
      const crown = new Mesh(
        kind === 'poplar' ? spire : ball,
        kind === 'poplar' ? poplar : kind === 'willow' ? willow : blossom,
      );
      if (kind === 'poplar') {
        crown.scale.set(1.8, height * 0.48, 1.8);
        crown.position.y = height * 0.55;
      } else {
        const size = kind === 'willow' ? 2.2 : 2.6;
        crown.scale.set(size, size * 0.9, size);
        crown.position.y = height + size * 0.5;
      }
      crown.castShadow = true;
      tree.add(crown);
      this.group.add(tree);
      this.props.push({ mesh: tree, offset, every: LOOP, x });
    };
    for (const side of [-1, 1] as const) {
      for (let offset = side > 0 ? 4 : 10; offset < LOOP; offset += 9) {
        if (offset % 160 > 100) continue;
        plant(side * (HEDGE + 3 + random()), offset, 'poplar');
      }
      for (let offset = side > 0 ? 60 : 130; offset < LOOP; offset += 28 + random() * 30) {
        plant(side * (9.5 + random() * 1.5), offset, random() < 0.6 ? 'willow' : 'blossom');
      }
    }
  }

  /** Flanders' lion on tall poles stuck in the banks above the fans. */
  private addPoleFlags(): void {
    const pole = new CylinderGeometry(0.03, 0.04, 5, 6);
    pole.translate(0, 2.5, 0);
    const cloth = new PlaneGeometry(1.8, 1.2, 6, 1);
    cloth.translate(0.92, 4.3, 0);
    this.disposables.push(pole, cloth);
    const wood = this.material({ color: 0x8a7a64, roughness: 1 });
    for (const side of [-1, 1] as const) {
      for (let offset = side > 0 ? 8 : 26; offset < LOOP; offset += 36) {
        const flag = new Group();
        const c = new Mesh(cloth, this.lion);
        c.rotation.y = Math.PI / 2 + side * 0.4;
        flag.add(new Mesh(pole, wood), c);
        flag.rotation.z = side * 0.08;
        this.group.add(flag);
        this.props.push({ mesh: flag, offset, every: LOOP, x: side * (CROWD_FAR + 0.6) });
      }
    }
  }

  /** The summit arch: an inflatable span over the cobbles with KOPPENBERG across it. */
  private addSummitArch(roadHalf: number): void {
    const arch = new Group();
    const span = roadHalf + 1.4;
    const tube = new TorusGeometry(span, 0.75, 10, 32, Math.PI);
    const banner = new PlaneGeometry(2 * span - 1.6, 1.4);
    this.disposables.push(tube, banner);
    const air = this.material({ color: 0xd8283a, roughness: 0.6 });
    arch.add(new Mesh(tube, air));
    const front = new Mesh(
      banner,
      this.material({
        map: this.track(clothBannerTexture('KOPPENBERG', '#ffd200', '#111111')),
        side: DoubleSide,
      }),
    );
    front.position.set(0, span - 0.2, 0.8);
    arch.add(front);
    this.group.add(arch);
    this.props.push({ mesh: arch, offset: 420, every: LOOP, x: 0 });
  }

  /** The climb's warning sign: a red-edged triangle with its steepest grade. */
  private addGradeSign(): void {
    const sign = new Group();
    const post = new Mesh(this.unit, this.material({ color: 0x9aa0a6, metalness: 0.5 }));
    post.scale.set(0.08, 2.6, 0.08);
    post.position.y = 1.3;
    const plate = new Mesh(
      new PlaneGeometry(1.3, 1.3),
      this.material({ map: this.track(gradeSignTexture()), alphaTest: 0.5, side: DoubleSide }),
    );
    this.disposables.push(plate.geometry);
    plate.position.y = 2.9;
    sign.add(post, plate);
    this.group.add(sign);
    this.props.push({ mesh: sign, offset: 140, every: LOOP, x: BARRIER + 0.5 });
  }

  /** What the fans have painted on the cobbles. */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.4, 8.5);
    this.disposables.push(plane);
    [...ROAD_PAINT, ...ROAD_PAINT, ...ROAD_PAINT].forEach(([text, colour, x], i) => {
      const mesh = new Mesh(
        plane,
        this.material({
          map: this.track(paintTexture(text, colour)),
          alphaTest: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          roughness: 0.6,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.03;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 22 + i * ROAD_PAINT_EVERY,
        every: LOOP,
        x,
        lies: true,
      });
    });
  }

  /** Black-and-white cows grazing in the fields. */
  private addCows(): void {
    const hide = this.material({ map: this.track(hideTexture()), roughness: 0.9 });
    const dark = this.material({ color: 0x1e1e20, roughness: 0.9 });
    const random = seeded(397);
    for (let k = 0; k < 14; k++) {
      const cow = new Group();
      const part = (
        m: Material,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        cow.add(mesh);
      };
      part(hide, 0.7, 0.75, 1.7, 0, 1.05, 0);
      part(dark, 0.36, 0.4, 0.55, 0, 0.75, -1.05);
      for (const x of [-0.24, 0.24])
        for (const z of [-0.65, 0.65]) part(dark, 0.14, 0.7, 0.14, x, 0.35, z);
      this.group.add(cow);
      const side = k % 2 === 0 ? 1 : -1;
      this.grazing.push({
        mesh: cow,
        spot: { x: side * (20 + random() * 50), offset: random() * LOOP },
        heading: random() * Math.PI * 2,
      });
    }
  }

  /** A tractor parked by a field gate. */
  private addTractor(): void {
    const tractor = new Group();
    const green = this.material({ color: 0x2f7a3a, roughness: 0.6 });
    const black = this.material({ color: 0x1b1c1f, roughness: 0.8 });
    const glass = this.material({ color: 0x9cb6c4, roughness: 0.2, metalness: 0.3 });
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      tractor.add(mesh);
    };
    box(green, 1.2, 1.0, 2.6, 0, 1.3, -0.4);
    box(glass, 1.3, 1.3, 1.3, 0, 2.4, 0.4);
    box(green, 1.4, 0.1, 1.5, 0, 3.1, 0.4);
    const wheel = (radius: number, x: number, z: number) => {
      const geometry: BufferGeometry = new CylinderGeometry(radius, radius, 0.5, 16);
      geometry.rotateZ(Math.PI / 2);
      this.disposables.push(geometry);
      const w = new Mesh(geometry, black);
      w.position.set(x, radius, z);
      tractor.add(w);
    };
    for (const x of [-0.9, 0.9]) {
      wheel(0.85, x, 0.6);
      wheel(0.5, x, -1.4);
    }
    tractor.rotation.y = 0.9;
    this.group.add(tractor);
    this.props.push({ mesh: tractor, offset: 250, every: LOOP, x: -15.5 });
  }

  /** The hill ahead: a wooded crest above the mist, hazed by hand so it reads through the fog. */
  private addHill(): void {
    const haze = new Color(MIST);
    const woods = hazedMaterial(this.disposables, haze, 0x4f6a3e, 0.5);
    const field = hazedMaterial(this.disposables, haze, 0x7d9a52, 0.45);
    const h = this.hill;
    const mound = new SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(mound);
    const add = (
      m: Material,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
    ) => {
      const mesh = new Mesh(mound, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      h.add(mesh);
    };
    add(field, 0, -6, -120, 420, 70, 160);
    add(woods, -60, 30, -150, 160, 48, 90);
    add(woods, 120, 26, -170, 140, 38, 80);
    this.group.add(h);
  }

  /**
   * Melden's church, Sint-Martinus, on its knoll above the cobbles: a grey stone nave under a
   * slate roof and, at its west end facing the riders, a buttressed tower with louvred belfry
   * openings, a clock and a tall slate spire with a gilt cross, hazed lightly by hand.
   */
  private addChurch(): void {
    const haze = new Color(MIST);
    const grass = hazedMaterial(this.disposables, haze, 0x6f9248, 0.3);
    const stone = hazedMaterial(this.disposables, haze, 0x9c968a, 0.18, {
      map: this.track(stoneTexture()),
    });
    const slate = hazedMaterial(this.disposables, haze, 0x3a3e46, 0.18);
    const louvre = hazedMaterial(this.disposables, haze, 0x24262a, 0.15);
    const clock = hazedMaterial(this.disposables, haze, 0xffffff, 0.1, {
      map: this.track(clockTexture()),
    });
    const gilt = hazedMaterial(this.disposables, haze, 0xd9b44a, 0.1, {
      emissive: new Color(0xd9b44a),
      emissiveIntensity: 0.3,
      metalness: 0.6,
    });
    const c = this.church;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      c.add(mesh);
      return mesh;
    };
    const knoll = new Mesh(new SphereGeometry(1, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), grass);
    this.disposables.push(knoll.geometry);
    knoll.scale.set(60, 10, 50);
    knoll.position.set(-30, -2, -20);
    c.add(knoll);
    const x = -20;
    const base = 6;
    // The nave runs away from the riders behind the tower, its roof a steep slate prism.
    box(stone, 14, 13, 34, x, base, -25);
    const roof = new Mesh(new CylinderGeometry(1, 1, 1, 3, 1), slate);
    this.disposables.push(roof.geometry);
    roof.rotation.set(Math.PI / 2, 0, 0);
    roof.rotation.z = Math.PI;
    roof.scale.set(8.6, 34, 8.6);
    roof.position.set(x, base + 13 + 4.3, -25);
    c.add(roof);
    // The tower, its buttresses stepping in, the belfry, the clock and the spire.
    box(stone, 11, 36, 11, x, base, 0);
    for (const bx of [-6, 6]) for (const bz of [-6, 6]) box(stone, 1.8, 18, 1.8, x + bx, base, bz);
    for (const side of [-1, 1]) {
      box(louvre, 0.4, 7, 2.4, x + side * 5.6, base + 25, -2.4);
      box(louvre, 0.4, 7, 2.4, x + side * 5.6, base + 25, 2.4);
    }
    for (const bx of [-2.4, 2.4]) box(louvre, 2.4, 7, 0.4, x + bx, base + 25, 5.6);
    const dial = new Mesh(new PlaneGeometry(4.6, 4.6), clock);
    this.disposables.push(dial.geometry);
    dial.position.set(x, base + 19.5, 5.55);
    c.add(dial);
    box(slate, 12, 1.2, 12, x, base + 36, 0);
    const spire = new Mesh(new ConeGeometry(7.4, 34, 8), slate);
    this.disposables.push(spire.geometry);
    spire.position.set(x, base + 37.2 + 17, 0);
    c.add(spire);
    box(gilt, 0.35, 4, 0.35, x, base + 71, 0);
    box(gilt, 2.2, 0.35, 0.35, x, base + 73, 0);
    this.group.add(c);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial({ roughness: 0.9, ...options });
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number): CanvasTexture {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** The banks' height `x` metres off the crown: flat where the fans stand, rising behind. */
function bankAt(x: number): number {
  const d = Math.abs(x);
  if (d <= 3.5) return 0;
  if (d <= 4.2) return 0.1;
  if (d <= 8) return 0.1 + ((d - 4.2) / 3.8) * 0.15;
  if (d <= 14) return 0.25 + ((d - 8) / 6) * 0.9;
  if (d <= 60) return 1.15 + ((d - 14) / 46) * 1.2;
  return 2.35;
}

/** Grey Balegem stone in courses. */
function stoneTexture(): CanvasTexture {
  const texture = canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c9c3b6', 443);
    g.fillStyle = 'rgba(60,55,50,0.3)';
    for (let row = 0; row < 8; row++) {
      g.fillRect(0, row * 16, 128, 1);
      for (let x = (row % 2) * 20; x < 128; x += 40) g.fillRect(x, row * 16, 1, 16);
    }
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 6);
  return texture;
}

/** The tower clock: a white dial, black numerals as bars and hands at ten past nine. */
function clockTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#2a2c30';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#f4f1e8';
    g.beginPath();
    g.arc(64, 64, 56, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1b1c1f';
    g.lineCap = 'round';
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
      g.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52);
      g.stroke();
    }
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(64, 64);
    g.lineTo(34, 64);
    g.moveTo(64, 64);
    g.lineTo(84, 52);
    g.stroke();
  });
}

/** Flanders' flag: a black lion rampant on yellow, its claws and tongue red. */
function lionFlagTexture(): CanvasTexture {
  return canvasTexture(192, 128, (g) => {
    g.fillStyle = '#ffd200';
    g.fillRect(0, 0, 192, 128);
    g.fillStyle = '#111111';
    g.beginPath();
    g.ellipse(96, 72, 26, 34, -0.3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(110, 34, 15, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 9;
    g.strokeStyle = '#111111';
    g.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [
      [110, 60, 140, 40],
      [104, 76, 136, 74],
      [86, 100, 74, 122],
      [104, 100, 116, 122],
      [74, 70, 46, 42],
    ] as const) {
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    }
    g.fillStyle = '#d8283a';
    g.fillRect(123, 34, 9, 4);
    g.fillRect(138, 36, 6, 6);
    g.fillRect(134, 70, 6, 6);
  });
}

/** A farmhouse's front, one 4 m bay: a sash window between painted shutters. */
function farmFrontTexture(wall: string, shutter: string, seed: number): CanvasTexture {
  const texture = canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, wall, seed);
    g.fillStyle = shutter;
    g.fillRect(48, 70, 30, 110);
    g.fillRect(178, 70, 30, 110);
    g.fillStyle = '#f4f1e8';
    g.fillRect(80, 66, 96, 118);
    g.fillStyle = '#3a4650';
    g.fillRect(88, 74, 36, 48);
    g.fillRect(132, 74, 36, 48);
    g.fillRect(88, 128, 36, 48);
    g.fillRect(132, 128, 36, 48);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 236, 256, 20);
  });
  texture.wrapS = RepeatWrapping;
  return texture;
}

/** Roof tiles in rows, `colour` weathered. */
function tileTexture(colour: string, seed: number): CanvasTexture {
  const texture = canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, colour, seed);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 128, 2);
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 3);
  return texture;
}

/** Red brick in stretcher bond. */
function brickTexture(): CanvasTexture {
  const texture = canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#9a4a35', 401);
    g.fillStyle = 'rgba(230,220,200,0.45)';
    for (let row = 0; row < 16; row++) {
      g.fillRect(0, row * 8, 128, 1);
      for (let x = (row % 2) * 8; x < 128; x += 16) g.fillRect(x, row * 8, 1, 8);
    }
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/** Leaves in clumps of `colour`, for hedges and crowns. */
function leafTexture(colour: string, seed: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, colour, seed);
    const random = seeded(seed + 1);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '20,40,10' : '255,255,220'},${0.12 + random() * 0.15})`;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 2 + random() * 4, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The lane's wet mud edge, 2 m to the texture. */
function mudTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#5a4a3a', 409));
}

/** Spring grass on the banks, tufted. */
function grassTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5f8a3e', 419);
    const random = seeded(421);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(40,70,20,0.35)' : 'rgba(170,200,110,0.3)';
      g.fillRect(random() * 256, random() * 256, 2, 6);
    }
  });
}

/** Fields in strips 80 m wide: young wheat, ploughed earth, pasture and rapeseed. */
function fieldTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const colours = ['#6f9a45', '#5a4636', '#7fa556', '#8a9c4a', '#4f7a3a', '#6a5240', '#c9c24a'];
    const random = seeded(431);
    let x = 0;
    while (x < 256) {
      const w = 30 + random() * 60;
      const colour = colours[Math.floor(random() * colours.length)]!;
      g.fillStyle = colour;
      g.fillRect(x, 0, w, 256);
      g.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < 256; y += 6) g.fillRect(x, y, w, 2);
      x += w;
    }
  });
}

/** A cow's black-and-white hide. */
function hideTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#f2f0ea';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#1e1e20';
    const random = seeded(433);
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.ellipse(
        random() * 64,
        random() * 64,
        6 + random() * 10,
        5 + random() * 8,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}

/** A steep-hill warning: a red-edged white triangle with 22% in it. */
function gradeSignTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#d8283a';
    g.beginPath();
    g.moveTo(128, 8);
    g.lineTo(250, 236);
    g.lineTo(6, 236);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(128, 52);
    g.lineTo(212, 212);
    g.lineTo(44, 212);
    g.closePath();
    g.fill();
    g.fillStyle = '#111111';
    g.font = 'bold 64px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('22%', 128, 165);
  });
}
