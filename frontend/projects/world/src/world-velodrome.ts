// Lee Valley Velodrome, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// London's Olympic track, indoors under bright arena lights. The rider rides the home straight on
// pale pine boards, the blue côte d'azur and the safety zone on the left with the infield and its
// team pens beyond, the black, red and blue lines underfoot, and the banking rising on the right
// to the fence and its advertising boards, the stands packed above it. Across the infield the back
// straight runs the other way under its own stands, and ahead the boards sweep up into the steep
// banked bend under the scoreboard, the curved timber roof over all of it.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared figures, barrier banners,
// cloth banners, feather flags, road paint and box builder of world-kit.ts.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  type CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  type Texture,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  type BannerPanel,
  barrierBannerTexture,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  FeatherFlags,
  type FeatherWord,
  Figures,
  haloTexture,
  loopMetres,
  paintedRows,
  Ribbons,
  type SceneStreet,
  seeded,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The track is 250 m round, and so is the loop; its parts run from BEHIND metres behind. */
const LOOP = 250;
const BEHIND = 30;
/** The track's inner edge on the left, its outer edge and the fence on the right, RISE up. */
const INNER = 4;
const OUTER = 8;
const RISE = 1;
/** The bend's inner and outer radii, its centre left of the inner edge, and its banking. */
const R_IN = 22;
const R_OUT = R_IN + OUTER + INNER;
const BEND_X = -INNER - R_IN;
const BANK = 10;
/** The stands: rows deep, each row this deep and this much higher, from the walkway behind the fence. */
const ROWS = 14;
const ROW_DEPTH = 0.85;
const ROW_RISE = 0.5;
const STAND_CHUNK = 50;
/** A gantry of arena lights crosses the hall every RIG metres. */
const RIG = 25;
/** The scoreboard hangs over the track's inner edge where the bend begins. */
const SCORE_X = -INNER;
/** The roof's height over the infield, and the hall's side walls. */
const ROOF = 24;
const WALL_RIGHT = OUTER + 1.6 + ROWS * ROW_DEPTH + 2.5;
const WALL_LEFT = 2 * BEND_X - WALL_RIGHT;
/** The bend stands this far ahead, closing the hall. */
const AHEAD = 110;
/** The roof's height at x: highest at the side walls, sagging over the infield. */
const roofAt = (x: number) => ROOF + 0.0035 * (x - BEND_X) ** 2;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** The crowd: GB red, white and blue among the colours of every club in the country. */
const STANDS: Wardrobe = {
  tops: [
    '#c8102e',
    '#ffffff',
    '#012169',
    '#d8283a',
    '#1d3c8f',
    '#f2c230',
    '#1f8a5a',
    '#2a2a2e',
    '#e8a0c0',
    '#3ac8e8',
  ],
  bottoms: ['#20242b', '#3a5a8a', '#2a2a2e', '#5a4a3a'],
  skins: SKINS,
};
const FENCE_PANELS: readonly BannerPanel[] = [
  { fill: '#012169', ink: '#ffffff', text: 'LEE VALLEY VELOPARK' },
  { fill: '#ffffff', ink: '#c8102e', text: 'SPIN TO WIN' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#c8102e', ink: '#ffffff', text: 'LONDON' },
  { fill: '#1b1e24', ink: '#ffffff', text: 'TRACK CYCLING' },
  { fill: '#ffffff', ink: '#012169', text: 'GB' },
];
const HANGING: readonly (readonly [string, string, string, number])[] = [
  ['LEE VALLEY VELOPARK', '#012169', '#ffffff', 40],
  ['SPIN TO WIN · WATTZUP', '#1b1e24', '#d7ff3a', 120],
  ['LONDON 2012 · TRACK', '#c8102e', '#ffffff', 200],
];
const TEAMS: readonly FeatherWord[] = [
  ['GB', '#012169', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['LONDON', '#c8102e', '#ffffff'],
  ['TRACK', '#1b1e24', '#ffffff'],
];
/** The names and sponsors painted on the boards. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['GO MAYA', '#ffffff'],
  ['ALLEZ JONAS', '#1b1e24'],
  ['ANA!', '#c8102e'],
  ['SOPHIE', '#012169'],
  ['KENJI', '#ffffff'],
  ['RAVI!', '#1b1e24'],
  ['SPIN', '#c8102e'],
  ['LONDON', '#012169'],
];
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['LEE VALLEY', '#012169'],
  ['SPIN TO WIN', '#c8102e'],
  ['WATTZUP', '#1b1e24'],
];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
}

export class VelodromeStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  /** A fan's flag draped over the fence, and the flags and banners the fans bring. */
  private readonly drape = new PlaneGeometry(1.8, 1.1);
  private flags: MeshStandardMaterial[] = [];
  /** The roof's and the walls' textures, slid along as the rider rides. */
  private readonly sliding: { texture: Texture; every: number }[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.drape);
    this.flags = FAN_FLAGS.map((draw) => {
      const map = this.track(canvasTexture(240, 150, draw));
      return this.material({ map, roughness: 0.85, side: DoubleSide });
    });
    this.addTrack(roadHalf, points);
    this.addStands();
    this.addBackStraight();
    this.addInfield();
    this.addHanging();
    this.addRoadPaint();
    this.addHall();
    this.addRigs();
    this.addBend();
  }

  /** The hall has no clock of its own: the crowd sits still. */
  setTime(): void {
    // Nothing moves but the riders.
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number) => loopMetres(offset, s, LOOP, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset);
      prop.mesh.visible = metres < AHEAD + 20;
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const { texture, every } of this.sliding) texture.offset.y = (s % every) / every;
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The home straight: the pine boards from the inner edge to the outer, flat where the riders
   * ride and rising RISE to the fence, the black, red and blue lines, the blue côte d'azur and
   * the safety zone inside it, and the fence with its advertising boards.
   */
  private addTrack(roadHalf: number, points: number): void {
    const boards = this.track(boardTexture());
    boards.wrapS = RepeatWrapping;
    boards.wrapT = RepeatWrapping;
    boards.repeat.set(1 / 2, 1 / 4);
    const pine = this.material({
      map: boards,
      roughness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, pine, [
      [OUTER, RISE],
      [roadHalf, 0.006],
      [-INNER, 0.006],
    ]);
    const paint = (colour: number) =>
      this.material({
        color: colour,
        roughness: 0.6,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
    this.ribbons.add(points, paint(0x1d5fb4), [
      [-INNER, 0.006],
      [-INNER - 1.2, 0.006],
    ]);
    this.ribbons.add(points, paint(0x34404e), [
      [-INNER - 1.2, 0.004],
      [-INNER - 4.4, 0.004],
    ]);
    // The measurement line in black, the sprinters' line in red, the stayers' line in blue.
    for (const [at, colour] of [
      [0.2, 0x111111],
      [0.85, 0xd8283a],
      [2.5, 0x2a6ad8],
    ] as const) {
      const x = -INNER + at;
      this.ribbons.add(points, paint(colour), [
        [x + 0.03, 0.01],
        [x - 0.03, 0.01],
      ]);
    }
    const texture = this.track(barrierBannerTexture(FENCE_PANELS));
    texture.repeat.set(-1, -1 / 24);
    const boardsMat = this.material({
      map: texture,
      alphaTest: 0.5,
      roughness: 0.5,
      side: DoubleSide,
    });
    this.ribbons.add(points, boardsMat, [
      [OUTER, RISE + 0.05],
      [OUTER, RISE + 1.0],
    ]);
    const rail = this.material({ color: 0xe8e8e8, metalness: 0.5, roughness: 0.4 });
    this.ribbons.add(points, rail, [
      [OUTER, RISE + 1.0],
      [OUTER + 0.05, RISE + 1.08],
      [OUTER - 0.05, RISE + 1.08],
      [OUTER, RISE + 1.0],
    ]);
    // The walkway behind the fence, under the front row.
    const walk = this.material({ color: 0x4a4e56, roughness: 0.9 });
    this.ribbons.add(points, walk, [
      [OUTER + 1.6, RISE + 0.6],
      [OUTER, RISE + 0.6],
    ]);
  }

  /** The stands over the home straight, in chunks of STAND_CHUNK metres, every seat taken. */
  private addStands(): void {
    for (let offset = 0, k = 0; offset < LOOP; offset += STAND_CHUNK, k++) {
      const holder = this.stand(1, 7211 + k);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + STAND_CHUNK / 2, x: OUTER + 1.6 });
    }
  }

  /**
   * One chunk of stand, STAND_CHUNK metres long, its front row at x = 0 rising away from the
   * track on `side`: stepped concrete rows of dark seats, a spectator in nearly every one, facing
   * the boards.
   */
  private stand(side: -1 | 1, seed: number): Group {
    const holder = new Group();
    const b = new BoxBuilder();
    const concrete = this.material({ color: 0x5a5e66, roughness: 0.9 });
    const seats = this.material({ color: 0x2a2e36, roughness: 0.7 });
    for (let r = 0; r < ROWS; r++) {
      const x = side * (r + 0.5) * ROW_DEPTH;
      const y = RISE + 0.6 + (r + 1) * ROW_RISE;
      b.box(concrete, [ROW_DEPTH, y, STAND_CHUNK], [x, y / 2, 0]);
      b.box(seats, [0.45, 0.42, STAND_CHUNK - 0.2], [x + side * 0.15, y + 0.21, 0]);
    }
    holder.add(b.build(this.disposables));
    const random = seeded(seed);
    const spots: [number, number, number][] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let z = -STAND_CHUNK / 2 + 0.3; z < STAND_CHUNK / 2; z += 0.6) {
        if (random() < 0.08) continue;
        spots.push([side * (r + 0.5) * ROW_DEPTH, RISE + 0.6 + (r + 1) * ROW_RISE - 0.35, z]);
      }
    }
    const figures = new Figures(holder, this.disposables, spots.length, STANDS, seed + 1);
    spots.forEach(([x, y, z], i) =>
      figures.set(i, x, y, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0.8 + random() * 0.12),
    );
    figures.commit();
    // The fans' flags draped over the fence from its rail, on the track's side.
    const top = RISE + 1.1;
    for (
      let z = -STAND_CHUNK / 2 + 4 + random() * 4;
      z < STAND_CHUNK / 2 - 3;
      z += 7 + random() * 6
    ) {
      const flag = new Mesh(this.drape, this.flags[Math.floor(random() * this.flags.length)]!);
      flag.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      flag.position.set(-side * 1.66, top - 0.55, z);
      holder.add(flag);
    }
    return holder;
  }

  /** The back straight across the infield: its banked boards, its fence and its stands. */
  private addBackStraight(): void {
    const inner = 2 * BEND_X + INNER;
    const outer = 2 * BEND_X - OUTER;
    const boards = this.track(boardTexture());
    boards.wrapS = RepeatWrapping;
    boards.wrapT = RepeatWrapping;
    boards.repeat.set(6, STAND_CHUNK / 4);
    const pine = this.material({ map: boards, roughness: 0.45 });
    const blue = this.material({ color: 0x1d5fb4, roughness: 0.6 });
    const fence = this.material({
      map: this.track(fenceTexture()),
      roughness: 0.5,
      side: DoubleSide,
    });
    const L = STAND_CHUNK;
    for (let offset = 0; offset < LOOP; offset += L) {
      const holder = new Group();
      holder.add(
        new Mesh(this.quad([inner, 0], [outer, RISE], L), pine),
        new Mesh(this.quad([inner + 1.2, 0.01], [inner, 0.01], L), blue),
      );
      const board = new Mesh(new PlaneGeometry(L, 1), fence);
      this.disposables.push(board.geometry);
      board.rotation.y = Math.PI / 2;
      board.position.set(outer, RISE + 0.5, 0);
      holder.add(board);
      const stand = this.stand(-1, 7311 + offset);
      stand.position.x = outer - 1.6;
      holder.add(stand);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + L / 2, x: 0 });
    }
  }

  /** A flat quad across from [x, y] to [x, y], `length` metres along, its texture tiled. */
  private quad(a: [number, number], b: [number, number], length: number): BufferGeometry {
    const g = new BufferGeometry();
    const h = length / 2;
    g.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([a[0], a[1], h, b[0], b[1], h, a[0], a[1], -h, b[0], b[1], -h]),
        3,
      ),
    );
    g.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
    g.setIndex([0, 2, 1, 1, 2, 3]);
    g.computeVertexNormals();
    this.disposables.push(g);
    return g;
  }

  /**
   * The infield inside the safety zone: the teams' pens, a low rail round each, bikes on their
   * stands and spare wheels, the staff and the riders between efforts, and the teams' flags.
   */
  private addInfield(): void {
    const flags = new FeatherFlags(this.disposables, this.track, TEAMS);
    const frame = this.material({ color: 0x1b1e24, metalness: 0.4, roughness: 0.4 });
    const tyre = this.material({ color: 0x111111, roughness: 0.8 });
    const railing = this.material({ color: 0xe8e8e8, metalness: 0.4, roughness: 0.5 });
    const floor = this.material({ color: 0x2a6ad8, roughness: 0.8 });
    const wheel = new TorusGeometry(0.34, 0.025, 6, 20);
    this.disposables.push(wheel);
    const random = seeded(7411);
    let k = 0;
    for (let offset = 10; offset < LOOP; offset += 42, k++) {
      const pen = new Group();
      const b = new BoxBuilder();
      const x0 = -INNER - 6;
      b.box(floor, [7, 0.04, 10], [x0 - 3.5, 0.02, 0]);
      for (const z of [-5, 5]) b.box(railing, [7, 0.06, 0.06], [x0 - 3.5, 1, z]);
      b.box(railing, [0.06, 0.06, 10], [x0, 1, 0]);
      for (let n = 0; n < 4; n++) {
        const z = -3.5 + n * 2.2;
        const x = x0 - 1.2 - random() * 4;
        b.box(frame, [0.04, 0.5, 0.9], [x, 0.7, z], 0);
        b.box(frame, [0.04, 0.04, 1], [x, 0.95, z]);
        for (const dz of [-0.5, 0.5]) {
          const w = new Mesh(wheel, tyre);
          w.rotation.y = Math.PI / 2;
          w.position.set(x, 0.36, z + dz);
          pen.add(w);
        }
      }
      pen.add(b.build(this.disposables));
      const people = new Figures(pen, this.disposables, 5, STANDS, 7421 + k);
      for (let i = 0; i < 5; i++) {
        people.set(i, x0 - 1 - random() * 5, 0, -4 + random() * 8, Math.PI / 2 + random(), 1);
      }
      people.commit();
      const flag = flags.make(k);
      flag.position.set(x0 - 0.5, 0, 5.2);
      pen.add(flag);
      this.group.add(pen);
      this.props.push({ mesh: pen, offset, x: 0 });
    }
  }

  /** Banners hung from the roof over the infield, facing the riders on the home straight. */
  private addHanging(): void {
    const cloth = new PlaneGeometry(14, 3);
    const wire = new CylinderGeometry(0.02, 0.02, 8, 4);
    this.disposables.push(cloth, wire);
    const steel = this.material({ color: 0x8a8e96 });
    for (const [text, fill, ink, offset] of HANGING) {
      const holder = new Group();
      const map = this.track(clothBannerTexture(text, fill, ink));
      const banner = new Mesh(
        cloth,
        this.material({
          map,
          emissive: 0xffffff,
          emissiveMap: map,
          emissiveIntensity: 0.35,
          side: DoubleSide,
        }),
      );
      banner.position.set(-16, 13, 0);
      holder.add(banner);
      for (const dx of [-6.5, 6.5]) {
        const w = new Mesh(wire, steel);
        w.position.set(-16 + dx, 18.5, 0);
        holder.add(w);
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  private addRoadPaint(): void {
    const rows = paintedRows(
      { loop: LOOP, every: 9, start: 14, kerb: 0, names: ROAD_PAINT, slogans: ROAD_SLOGANS },
      this.disposables,
      this.track,
    );
    for (const row of rows) {
      this.group.add(row.mesh);
      this.props.push(row);
    }
  }

  /**
   * The hall: the curved timber roof over everything, sagging over the infield and rising to the
   * side walls, rows of arena lights along it, and the walls behind the stands with the glazed
   * band of the concourse, all slid along as the rider rides so the hall goes by.
   */
  private addHall(): void {
    const length = AHEAD + 160;
    const ceilingMap = this.slide(ceilingTexture(), 1, length / 24, 24);
    const span = WALL_RIGHT - WALL_LEFT;
    const roof = new PlaneGeometry(span, length, 40, 1);
    roof.rotateX(Math.PI / 2);
    const position = roof.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i) + (WALL_LEFT + WALL_RIGHT) / 2;
      position.setXYZ(i, x, roofAt(x), position.getZ(i) - length / 2 + 40);
    }
    roof.computeVertexNormals();
    this.disposables.push(roof);
    this.group.add(
      new Mesh(
        roof,
        this.material({
          map: ceilingMap,
          emissive: 0xffffff,
          emissiveMap: ceilingMap,
          emissiveIntensity: 0.4,
          roughness: 0.8,
          side: DoubleSide,
        }),
      ),
    );
    for (const x of [WALL_RIGHT, WALL_LEFT]) {
      const tall = roofAt(x) + 2;
      const wall = new PlaneGeometry(length, tall);
      wall.rotateY(x > 0 ? -Math.PI / 2 : Math.PI / 2);
      wall.translate(x, tall / 2, -length / 2 + 40);
      this.disposables.push(wall);
      const map = this.slide(wallTexture(tall), length / 20, 1, 20);
      this.group.add(
        new Mesh(
          wall,
          this.material({
            map,
            emissive: 0xffffff,
            emissiveMap: map,
            emissiveIntensity: 0.25,
            roughness: 0.9,
          }),
        ),
      );
    }
  }

  /**
   * The arena's lights: a steel gantry across the hall under the roof every RIG metres, a bright
   * lamp every 5 m along it, each with its halo and a faint beam falling through the hall's haze
   * onto the boards and the infield.
   */
  private addRigs(): void {
    const steel = this.material({ color: 0x2a2c32, metalness: 0.5, roughness: 0.5 });
    const lamp = new MeshBasicMaterial({ color: 0xfffaf0, toneMapped: false });
    const glow = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      color: 0xfff0d8,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const haze = new MeshBasicMaterial({
      color: 0xfff0d8,
      transparent: true,
      opacity: 0.012,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: false,
    });
    this.disposables.push(lamp, glow, haze);
    const b = new BoxBuilder();
    const halos: BufferGeometry[] = [];
    const beams: BufferGeometry[] = [];
    const lamps: BufferGeometry[] = [];
    for (let x = WALL_LEFT + 6; x < WALL_RIGHT - 3; x += 5) {
      const y = roofAt(x) - 1.6;
      b.box(steel, [5, 0.5, 0.5], [x, y + 0.5, 0]);
      const panel = new BoxGeometry(1.6, 0.2, 1);
      panel.translate(x, y, 0);
      lamps.push(panel);
      const halo = new PlaneGeometry(5, 5);
      halo.translate(x, y - 0.3, 0.6);
      halos.push(halo);
      if (x > 2 * BEND_X - OUTER && x < OUTER + 2 && halos.length % 2 === 0) {
        const beam = new CylinderGeometry(0.7, 4.5, y, 12, 1, true);
        beam.translate(x, y / 2, 0);
        beams.push(beam);
      }
    }
    const merge = (parts: BufferGeometry[]) => {
      const g = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(g);
      return g;
    };
    const gantry = b.build(this.disposables).children as Mesh[];
    const lampGeometry = merge(lamps);
    const haloGeometry = merge(halos);
    const beamGeometry = merge(beams);
    for (let offset = 0; offset < LOOP; offset += RIG) {
      const rig = new Group();
      rig.add(
        ...gantry.map((m) => new Mesh(m.geometry, m.material)),
        new Mesh(lampGeometry, lamp),
        new Mesh(haloGeometry, glow),
        new Mesh(beamGeometry, haze),
      );
      this.group.add(rig);
      this.props.push({ mesh: rig, offset, x: 0 });
    }
  }

  /** A texture tiled `x` by `y` times and slid along every `every` metres by `place`. */
  private slide(texture: CanvasTexture, x: number, y: number, every: number): CanvasTexture {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(x, y);
    this.sliding.push({ texture, every: every * y });
    return this.track(texture);
  }

  /**
   * The bend ahead, closing the hall: the boards sweeping round to the left and up from RISE on
   * the straight to BANK at the apex, the blue band and the lines round its foot, the fence and
   * its boards round its top, the stands rising behind it to the roof, packed, and the
   * scoreboard hung over the infield before it.
   */
  private addBend(): void {
    const h = this.horizon;
    const boards = this.track(boardTexture());
    boards.wrapS = RepeatWrapping;
    boards.wrapT = RepeatWrapping;
    boards.repeat.set(1 / 2, 1 / 4);
    const top = (phi: number) => RISE + (BANK - RISE) * Math.sin(phi);
    // The height of the boards `r` from the bend's centre, at angle `phi`.
    const bank = (r: number, phi: number) => ((r - R_IN) / (R_OUT - R_IN)) * top(phi);
    h.add(
      new Mesh(
        this.arc((phi) =>
          [R_OUT, R_OUT - 3, R_OUT - 6, R_OUT - 9, R_IN].map((r) => [r, bank(r, phi)]),
        ),
        this.material({ map: boards, roughness: 0.45, side: DoubleSide }),
      ),
    );
    const paint = (colour: number) =>
      this.material({
        color: colour,
        roughness: 0.6,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
    h.add(
      new Mesh(
        this.arc(() => [
          [R_IN, 0.01],
          [R_IN - 1.2, 0.01],
        ]),
        paint(0x1d5fb4),
      ),
    );
    for (const [at, colour] of [
      [0.2, 0x111111],
      [0.85, 0xd8283a],
      [2.5, 0x2a6ad8],
    ] as const) {
      const r = R_IN + at;
      h.add(
        new Mesh(
          this.arc((phi) => [
            [r + 0.04, bank(r + 0.04, phi) + 0.02],
            [r - 0.04, bank(r - 0.04, phi) + 0.02],
          ]),
          paint(colour),
        ),
      );
    }
    const fence = this.track(barrierBannerTexture(FENCE_PANELS));
    fence.wrapS = RepeatWrapping;
    fence.repeat.set(-1, -1 / 24);
    h.add(
      new Mesh(
        this.arc((phi) => [
          [R_OUT, top(phi) + 1],
          [R_OUT, top(phi)],
        ]),
        this.material({ map: fence, roughness: 0.5, side: DoubleSide }),
      ),
    );
    // The stands round the bend, stepped up behind the fence to the roof.
    const concrete = this.material({ color: 0x5a5e66, roughness: 0.9, side: DoubleSide });
    const BEND_ROWS = 22;
    h.add(
      new Mesh(
        this.arc((phi) => {
          const steps: [number, number][] = [[R_OUT, top(phi) + 0.6]];
          for (let r = 0; r < BEND_ROWS; r++) {
            const radius = R_OUT + 1.6 + r * ROW_DEPTH;
            const y = top(phi) + 0.6 + (r + 1) * ROW_RISE;
            steps.push([radius, y], [radius + ROW_DEPTH, y]);
          }
          return steps;
        }),
        concrete,
      ),
    );
    const random = seeded(7511);
    const spots: [number, number, number, number][] = [];
    for (let r = 0; r < BEND_ROWS; r++) {
      const radius = R_OUT + 1.6 + (r + 0.5) * ROW_DEPTH;
      for (let phi = 0.02; phi < Math.PI; phi += 0.6 / radius) {
        if (random() < 0.07) continue;
        spots.push([radius, phi, top(phi) + 0.6 + (r + 1) * ROW_RISE - 0.35, 0]);
      }
    }
    const figures = new Figures(h, this.disposables, spots.length, STANDS, 7521);
    spots.forEach(([radius, phi, y], i) => {
      const x = BEND_X + radius * Math.cos(phi);
      const z = -radius * Math.sin(phi);
      // Facing the bend's centre.
      const heading = Math.atan2(x - BEND_X, z) + Math.PI;
      figures.set(i, x, y, z, heading, 0.8 + random() * 0.12);
    });
    figures.commit();
    // The fans' flags draped over the bend's fence, facing the infield.
    for (let phi = 0.15; phi < Math.PI - 0.1; phi += 0.11 + random() * 0.08) {
      const radius = R_OUT - 0.06;
      const flag = new Mesh(this.drape, this.flags[Math.floor(random() * this.flags.length)]!);
      flag.position.set(
        BEND_X + radius * Math.cos(phi),
        top(phi) + 1.1 - 0.55,
        -radius * Math.sin(phi),
      );
      flag.rotation.y = Math.atan2(BEND_X - flag.position.x, -flag.position.z);
      h.add(flag);
    }
    // The wall behind the stands, up to the roof.
    const back = R_OUT + 1.6 + BEND_ROWS * ROW_DEPTH + 1;
    const wallMap = this.track(wallTexture(roofAt(BEND_X)));
    wallMap.wrapS = RepeatWrapping;
    wallMap.repeat.set(8, 1);
    h.add(
      new Mesh(
        this.arc(() => [
          [back, roofAt(BEND_X) + 14],
          [back, 0],
        ]),
        this.material({
          map: wallMap,
          emissive: 0xffffff,
          emissiveMap: wallMap,
          emissiveIntensity: 0.25,
          roughness: 0.9,
          side: DoubleSide,
        }),
      ),
    );
    // The scoreboard hung over the infield before the bend.
    const b = new BoxBuilder();
    const steel = this.material({ color: 0x2a2e36, metalness: 0.5, roughness: 0.4 });
    b.box(steel, [16, 6, 1.2], [SCORE_X, 18, -14]);
    for (const dx of [-6, 6]) b.box(steel, [0.15, 6, 0.15], [SCORE_X + dx, 24, -14]);
    h.add(b.build(this.disposables));
    const screen = this.track(scoreboardTexture());
    const face = new Mesh(
      new PlaneGeometry(15, 5.2),
      this.material({ map: screen, emissive: 0xffffff, emissiveMap: screen, emissiveIntensity: 1 }),
    );
    this.disposables.push(face.geometry);
    face.position.set(SCORE_X, 18, -13.38);
    h.add(face);
  }

  /**
   * A strip round the bend from angle 0 (the end of the home straight) to π (the back straight),
   * its cross-section at each angle given by `profile` as [radius, height] pairs.
   */
  private arc(profile: (phi: number) => [number, number][]): BufferGeometry {
    const STEPS = 48;
    const n = profile(0).length;
    const position = new Float32Array((STEPS + 1) * n * 3);
    const uv = new Float32Array((STEPS + 1) * n * 2);
    const index: number[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const phi = (i / STEPS) * Math.PI;
      let across = 0;
      profile(phi).forEach(([r, y], j) => {
        const k = i * n + j;
        position.set([BEND_X + r * Math.cos(phi), y, -r * Math.sin(phi)], k * 3);
        if (j > 0) across += Math.abs(r - profile(phi)[j - 1]![0]) + 0.001;
        uv.set([across, phi * r], k * 2);
      });
      if (i < STEPS) {
        for (let j = 0; j < n - 1; j++) {
          const a = i * n + j;
          index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(position, 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    g.setIndex(index);
    g.computeVertexNormals();
    this.disposables.push(g);
    return g;
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial({ roughness: 0.9, ...options });
    this.disposables.push(material);
    return material;
  }
}

/** The fans' flags: the Union flag, England's cross, and banners for the riders and the track. */
const FAN_FLAGS: readonly ((g: CanvasRenderingContext2D) => void)[] = [
  (g) => {
    // The Union flag.
    g.fillStyle = '#012169';
    g.fillRect(0, 0, 240, 150);
    g.lineCap = 'butt';
    for (const [w, colour] of [
      [30, '#ffffff'],
      [10, '#c8102e'],
    ] as const) {
      g.strokeStyle = colour;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(240, 150);
      g.moveTo(240, 0);
      g.lineTo(0, 150);
      g.stroke();
    }
    g.fillStyle = '#ffffff';
    g.fillRect(100, 0, 40, 150);
    g.fillRect(0, 55, 240, 40);
    g.fillStyle = '#c8102e';
    g.fillRect(108, 0, 24, 150);
    g.fillRect(0, 63, 240, 24);
  },
  (g) => {
    // England's cross of St George.
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 240, 150);
    g.fillStyle = '#c8102e';
    g.fillRect(104, 0, 32, 150);
    g.fillRect(0, 59, 240, 32);
  },
  (g) => banner(g, '#d7ff3a', '#1b1e24', 'GO MAYA!'),
  (g) => banner(g, '#012169', '#ffffff', 'COME ON GB'),
  (g) => banner(g, '#c8102e', '#ffffff', 'ALLEZ JONAS'),
];

/** A fan's hand-made banner: big letters on a bright sheet. */
function banner(g: CanvasRenderingContext2D, fill: string, ink: string, text: string): void {
  g.fillStyle = fill;
  g.fillRect(0, 0, 240, 150);
  g.fillStyle = ink;
  g.font = 'bold 40px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 120, 78, 224);
}

/**
 * Two metres across and four along of the track's Siberian pine: narrow boards laid along the
 * track in pale honey tones, their seams and their staggered butt joints.
 */
function boardTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const random = seeded(7611);
    const tones = ['#e2b67c', '#d8a86c', '#e8c08a', '#dcae74', '#d2a268'];
    const w = 256 / 40;
    for (let k = 0; k < 40; k++) {
      let y = -random() * 256;
      while (y < 256) {
        const len = 90 + random() * 120;
        g.fillStyle = tones[Math.floor(random() * tones.length)]!;
        g.fillRect(k * w, y, w, len);
        g.fillStyle = 'rgba(90,60,30,0.35)';
        g.fillRect(k * w, y, w, 1);
        y += len;
      }
      g.fillStyle = 'rgba(90,60,30,0.3)';
      g.fillRect(k * w, 0, 1, 256);
    }
  });
}

/** The back straight's fence boards, seen across the infield: a run of sponsors' panels. */
function fenceTexture(): CanvasTexture {
  return canvasTexture(512, 16, (g) => {
    const colours = ['#012169', '#ffffff', '#d7ff3a', '#c8102e', '#1b1e24'];
    for (let k = 0; k < 16; k++) {
      g.fillStyle = colours[k % colours.length]!;
      g.fillRect(k * 32, 0, 32, 16);
    }
  });
}

/** The underside of the roof, 24 m along: timber slats running across the hall. */
function ceilingTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.fillStyle = '#8a6a48';
    g.fillRect(0, 0, 512, 128);
    for (let y = 0; y < 128; y += 6) {
      g.fillStyle = y % 12 ? 'rgba(60,40,20,0.35)' : 'rgba(200,160,110,0.25)';
      g.fillRect(0, y, 512, 2);
    }
  });
}

/**
 * Twenty metres of the hall's wall behind the stands, `tall` metres high: dark cladding with the
 * concourse's glazed band at the stands' back, light from the park outside coming through it.
 */
function wallTexture(tall: number): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    g.fillStyle = '#2a2c32';
    g.fillRect(0, 0, 128, 256);
    const band = (y: number) => 256 - (y / tall) * 256;
    const glass = g.createLinearGradient(0, band(13), 0, band(9.5));
    glass.addColorStop(0, '#b8c8d8');
    glass.addColorStop(1, '#e8d8c0');
    g.fillStyle = glass;
    g.fillRect(0, band(13), 128, band(9.5) - band(13));
    g.fillStyle = '#1a1c20';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, band(13), 2, band(9.5) - band(13));
  });
}

/** The scoreboard: the event, the class and the riders' laps, in lights. */
function scoreboardTexture(): CanvasTexture {
  return canvasTexture(768, 256, (g) => {
    g.fillStyle = '#0a0c10';
    g.fillRect(0, 0, 768, 256);
    g.fillStyle = '#d7ff3a';
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.fillText('LEE VALLEY VELODROME', 384, 70);
    g.fillStyle = '#ffffff';
    g.font = 'bold 40px sans-serif';
    g.fillText('SPIN TO WIN · CADENCE', 384, 130);
    g.fillStyle = '#ffcf60';
    g.font = '32px monospace';
    g.fillText('MAYA 1:04.2   JONAS 1:04.9   ANA 1:05.3', 384, 200);
  });
}
