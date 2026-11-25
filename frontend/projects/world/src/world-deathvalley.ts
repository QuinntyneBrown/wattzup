// Death Valley, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Badwater Road on the
// valley floor at midday, closed for the ride, 282 feet below sea level. The sun-bleached asphalt
// runs between the event's barriers with its yellow centre lines. On the left the white salt
// crust of Badwater Basin glares out across the valley to the Panamint Range, Telescope Peak
// still capped with snow. On the right the gravel fans climb to the dark, banded walls of the
// Black Mountains. Ahead the golden dunes rise out of the heat, and the road shimmers with a
// mirage before them. The giant thermometer reads the heat, the park's sign the depth, and the
// aid tents hand out water and ice.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, pop-up tents, salt crust, road paint and box builder of world-kit.ts.
import type { Course, CoursePlace } from './course';
import {
  AdditiveBlending,
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  type CanvasTexture,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  ease,
  hazedMaterial,
  heightfield,
  loopMetres,
  paintedRows,
  PopupTents,
  Ribbons,
  saltCrustTexture,
  type SceneStreet,
  seeded,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
const KERB = 0.05;
const BARRIER = 4.2;
const CROWD_NEAR = 4.7;
const CROWD_FAR = 6.8;
/** The horizon this far ahead. */
const AHEAD = 230;
const HAZE = 0xf2e2c8;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** Dressed for the heat: white, khaki and hi-vis, long sleeves and wide hats. */
const DESERT: Wardrobe = {
  tops: ['#ffffff', '#f4ecd8', '#c8b48a', '#ff8a1a', '#d7ff3a', '#3ac8e8', '#d8283a', '#f2c230'],
  bottoms: ['#c8b48a', '#8a7a5a', '#3a3a40', '#ffffff', '#5a6a7a'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#c8501a', ink: '#ffffff', text: 'DEATH VALLEY' },
  { fill: '#1b1e24', ink: '#ff8a1a', text: 'SUFFERFEST' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#ffffff', ink: '#c8501a', text: 'BADWATER' },
  { fill: '#f2c230', ink: '#1b1e24', text: '-282 FT' },
  { fill: '#8a3a1a', ink: '#ffffff', text: 'FEEL THE HEAT' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['SUFFERFEST · DEATH VALLEY', '#c8501a', '#ffffff', 300],
  ['WATTZUP · BADWATER -282 FT', '#1b1e24', '#ff8a1a', 440],
];
const FEATHERS: readonly FeatherWord[] = [
  ['DEATH VALLEY', '#c8501a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['SUFFERFEST', '#1b1e24', '#ff8a1a'],
  ['BADWATER', '#ffffff', '#c8501a'],
];
const FEATHER_EVERY = 24;
/** The aid tents on the salt side: what each hands out, its fill and ink. */
const AID: readonly (readonly [string, string, string])[] = [
  ['WATER', '#3ac8e8', '#ffffff'],
  ['ICE', '#ffffff', '#1d4f8f'],
  ['SUFFERFEST', '#1b1e24', '#ff8a1a'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
const AID_EVERY = 120;
/** The names and cries chalked on the road. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['GO MAYA', '#ffffff'],
  ['ALLEZ JONAS', '#f2c230'],
  ['ANA!', '#ffffff'],
  ['SOPHIE', '#ff9ec9'],
  ['KENJI', '#3ac8e8'],
  ['RAVI!', '#d7ff3a'],
  ['HYDRATE', '#ffffff'],
  ['SUFFER', '#ff8a1a'],
];
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['DEATH VALLEY', '#ffffff'],
  ['-282 FT', '#f2c230'],
  ['SUFFERFEST', '#ff8a1a'],
];
/** Where the roadside icons stand along the loop. */
const THERMOMETER = 150;
const PARK_SIGN = 118;

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
}

export class DeathValleyStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private mirage: MeshBasicMaterial | null = null;
  private readonly ravens: Group[] = [];
  private time = 0;
  private readonly flagMaterials = ['#c8501a', '#ffffff', '#1b1e24', '#f2c230'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Knots of fans along the barriers, braving the heat, with open desert between them.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.75,
      wardrobe: DESERT,
      flags: this.flagMaterials,
      flagShare: 0.24,
      seeds: [6411, 6417],
      skip: (_side, offset) => offset % 40 > 31,
      armsUp: 0.24,
    });
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addBrush();
    this.addParasols();
    this.addRavens();
    this.addAid();
    this.addThermometer();
    this.addParkSign();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addValley();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The mirage wavers in the heat.
    if (this.mirage) this.mirage.opacity = 0.5 + 0.12 * Math.sin(seconds * 2.3);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the salt, so the crust shows out across the basin. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position');
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 2);
      position.setY(i * 2 + 1, p.height - 2);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(Math.max(metres, 0));
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, ground(metres) + KERB, -metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.placeRavens(heightAt);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  private placeRavens(heightAt: (metres: number) => number): void {
    // Ravens wheel in slow circles over the road ahead, riding the heat, wings beating now and then.
    this.ravens.forEach((bird, i) => {
      const turn = this.time * (0.22 + (i % 3) * 0.05) + i * 1.9;
      const radius = 9 + (i % 4) * 4;
      const metres = 40 + (i % 3) * 22 + Math.sin(turn) * radius;
      bird.position.set(
        (i % 2 ? 6 : -8) + Math.cos(turn) * radius,
        heightAt(metres) + 14 + (i % 4) * 4 + Math.sin(turn * 2) * 1.2,
        -metres,
      );
      bird.rotation.y = -turn + Math.PI;
      const beat = Math.max(0, Math.sin(this.time * 5 + i * 2)) * 0.5;
      bird.children[1]!.rotation.z = 0.15 + beat;
      bird.children[2]!.rotation.z = -0.15 - beat;
    });
  }

  private readonly basinBirds = new Group();
  private readonly aidSpectators = new Group();
  private readonly sample: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private brushCount = 0;
  private readonly basinSurfaces: Mesh[] = [];

  /** Lay metre-scaled crust, washes and patched tarmac along the actual bends. */
  private addBasinSurfaces(course: Course): void {
    const asphalt = this.material({ map: this.repeat(asphaltTexture(), 5, 5) });
    const wash = this.material({ map: this.repeat(gravelTexture(), 5, 5) });
    const salt = this.material({ map: this.repeat(saltCrustTexture(), 14, 14) });
    const brine = this.material({ color: 0x91a9ab, roughness: 0.22, metalness: 0.12 });
    for (let start = -60; start < course.length + 90; start += 160) {
      for (const [inner, outer, material] of [
        [-3.72, 3.72, asphalt],
        [-13, -3.72, wash],
        [3.72, 44, wash],
        [-275, -13, salt],
        ...(start >= 580 && start < 1230 ? [[-66, -20, brine] as const] : []),
      ] as const) {
        const positions: number[] = [],
          uv: number[] = [],
          indices: number[] = [];
        for (let i = 0; i <= 16; i++) {
          const d = start + i * 10;
          for (const lane of [inner, outer]) {
            const edge =
              material === brine ? lane + 4.5 * Math.sin(d / 38) + 1.6 * Math.cos(d / 11) : lane;
            const at = course.place(d, edge, this.sample);
            const up = material === asphalt ? 0.013 : material === brine ? 0.047 : 0.015;
            positions.push(at.x, at.y + up, at.z);
            uv.push(edge, d);
          }
          if (i < 16) {
            const n = i * 2;
            indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
          }
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        this.disposables.push(geometry);
        const mesh = new Mesh(geometry, material);
        mesh.userData['station'] = start + 80;
        this.basinSurfaces.push(mesh);
        this.group.add(mesh);
      }
    }
  }

  /** Reuse the authored desert details at locations on the native course. */
  buildBasin(course: Course): void {
    this.disposables.push(...this.flagMaterials);
    this.addBasinSurfaces(course);
    this.addBrush();
    this.brushCount = this.props.length;
    this.addParkSign();
    this.addThermometer();
    this.addAid();
    for (let i = this.brushCount; i < this.props.length; i++) {
      const prop = this.props[i]!;
      const index = i - this.brushCount;
      const station = index === 0 ? 920 : index === 1 ? 9102 : 9110 + index * 14;
      const at = course.place(station, prop.x);
      prop.mesh.position.set(at.x, at.y, at.z);
      prop.mesh.rotation.y = at.heading + (index === 0 ? -0.99 : index === 1 ? 1.09 : 0);
    }
    this.addRavens();
    this.basinBirds.add(...this.ravens);
    this.group.add(this.basinBirds);
    const existing = this.group.children.length;
    this.crowd.build();
    this.aidSpectators.add(...this.group.children.slice(existing));
    this.group.add(this.aidSpectators);
    const aid = course.place(9175);
    this.aidSpectators.position.set(aid.x, aid.y, aid.z);
    this.aidSpectators.rotation.y = aid.heading;
    this.addMirage();
  }

  get ravenHeading() {
    return this.ravens[0]?.rotation.y ?? null;
  }

  private panamints: Mesh | null = null;

  async loadPanamints(stillOpen: () => boolean): Promise<void> {
    const texture = await new TextureLoader().loadAsync('courses/deathvalley-panamint.webp');
    if (!stillOpen()) {
      texture.dispose();
      return;
    }
    texture.colorSpace = SRGBColorSpace;
    const material = new MeshBasicMaterial({
      map: texture,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      opacity: 0.81,
      fog: false,
      color: 0xe5dfd4,
    });
    const positions: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 96; i++) {
      const angle = (i * Math.PI) / 48;
      const x = 2050 * Math.sin(angle),
        z = 2050 * Math.cos(angle);
      positions.push(x, -72, z, x, 245, z);
      const u = Math.floor(i / 24) % 2 ? 1 - (i % 24) / 24 : (i % 24) / 24;
      uv.push(u, 0, u, 1);
      if (i < 96) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    this.disposables.push(texture, material, geometry);
    this.panamints = new Mesh(geometry, material);
    this.group.add(this.panamints);
  }

  get mirageOpacity() {
    return this.mirage?.opacity ?? null;
  }

  private readonly flat = () => 0;
  private readonly stationOffset = (offset: number, every: number) =>
    loopMetres(offset, 0, every, BEHIND);

  followBasin(course: Course, distance: number, seconds: number): void {
    this.setTime(seconds);
    for (const mesh of this.basinSurfaces)
      mesh.visible = Math.abs(distance - Number(mesh.userData['station'])) < 640;
    for (let i = 0; i < this.brushCount; i++) {
      const prop = this.props[i]!;
      const station = distance + loopMetres(prop.offset, distance, LOOP, BEHIND);
      const at = course.place(station, prop.x, this.sample);
      prop.mesh.position.set(at.x, at.y, at.z);
      prop.mesh.rotation.y = at.heading;
    }
    this.aidSpectators.visible = Math.abs(9175 - distance) < 360;
    if (this.aidSpectators.visible) this.crowd.place(seconds, this.flat, this.stationOffset, KERB);
    const at = course.place(distance, 0, this.sample);
    this.panamints?.position.set(at.x, at.y, at.z);
    this.basinBirds.position.set(at.x, at.y, at.z);
    this.basinBirds.rotation.y = at.heading;
    this.placeRavens(this.flat);
    const shimmer = course.place(distance + 135, 0, this.sample);
    this.horizon.position.set(shimmer.x, shimmer.y + 0.13, shimmer.z);
    this.horizon.rotation.set(shimmer.pitch, shimmer.heading, 0, 'YXZ');
  }

  /**
   * The road: sun-bleached asphalt, its white edge lines and double yellow centre line, the
   * gravel shoulders; on the left the salt crust out across the basin; on the right the gravel
   * fans climbing toward the mountains; and the barriers.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({
      map: this.repeat(asphaltTexture(), 4, 4),
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, asphalt, [
      [r + 0.4, 0.006],
      [-r - 0.4, 0.006],
    ]);
    const paint = (colour: number, from: number, to: number) =>
      this.ribbons.add(
        points,
        this.material({
          color: colour,
          roughness: 0.6,
          polygonOffset: true,
          polygonOffsetFactor: -4,
        }),
        [
          [from, 0.012],
          [to, 0.012],
        ],
      );
    paint(0xf2f0e8, r + 0.1, r - 0.05);
    paint(0xf2f0e8, -r + 0.05, -r - 0.1);
    paint(0xe8b830, 0.2, 0.08);
    paint(0xe8b830, -0.08, -0.2);
    const gravel = this.material({ map: this.repeat(gravelTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, gravel, [
      [BARRIER + 3, KERB],
      [r + 0.4, KERB - 0.02],
    ]);
    this.ribbons.add(points, gravel, [
      [-r - 0.4, KERB - 0.02],
      [-BARRIER - 3, KERB],
    ]);
    // The alluvial fans on the right, climbing gently toward the mountains.
    this.ribbons.add(points, gravel, [
      [600, 80],
      [240, 22],
      [90, 5],
      [30, 0.8],
      [BARRIER + 3, KERB],
    ]);
    // The crust glares in the overhead sun.
    const crust = this.material({
      map: this.repeat(saltCrustTexture(), 9, 9),
      emissive: 0x4a4846,
      roughness: 0.9,
    });
    this.ribbons.add(points, crust, [
      [-BARRIER - 3, KERB - 0.05],
      [-40, -0.25],
      [-2600, -0.3],
    ]);
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({ map: texture, alphaTest: 0.5, roughness: 0.5 });
      const x = side * BARRIER;
      this.ribbons.add(points, banner, [
        [x, KERB + 0.08],
        [x, KERB + 1.0],
      ]);
      const rail = this.material({ color: 0xe8e8e8, metalness: 0.5, roughness: 0.4 });
      this.ribbons.add(points, rail, [
        [x, KERB + 1.0],
        [x + 0.05, KERB + 1.08],
        [x - 0.05, KERB + 1.08],
        [x, KERB + 1.0],
      ]);
    }
  }

  /** Creosote bushes scattered over the fans on the right, dark green clumps on the gravel. */
  private addBrush(): void {
    const random = seeded(6421);
    const scrub = this.material({ color: 0x5a6a3a, roughness: 1, flatShading: true });
    const CHUNK = 60;
    for (let offset = 0; offset < LOOP; offset += CHUNK) {
      const clumps: BufferGeometry[] = [];
      for (let n = 0; n < 26; n++) {
        const x = BARRIER + 4 + random() ** 1.4 * 70;
        const clump = new IcosahedronGeometry(1, 0);
        const size = 0.4 + random() * 0.6;
        clump.scale(size * 1.4, size, size * 1.3);
        clump.translate(x, size * 0.5 + (x > 30 ? (x - 30) * 0.07 : 0), -random() * CHUNK);
        clumps.push(clump);
      }
      const merged = mergeGeometries(clumps)!;
      clumps.forEach((c) => c.dispose());
      this.disposables.push(merged);
      const holder = new Group();
      holder.add(new Mesh(merged, scrub));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /**
   * Sun umbrellas over the knots of fans, white, orange and yellow, the only shade along the road.
   */
  private addParasols(): void {
    const random = seeded(6471);
    const pole = new CylinderGeometry(0.03, 0.03, 2.3, 5);
    pole.translate(0, 1.15, 0);
    const canopy = new ConeGeometry(1.1, 0.45, 8, 1, true);
    canopy.translate(0, 2.3, 0);
    this.disposables.push(pole, canopy);
    const white = this.material({ color: 0xf4f4f0, roughness: 0.7 });
    const cloths = ['#ffffff', '#ff8a1a', '#f2c230', '#c8501a', '#3ac8e8'].map((c) =>
      this.material({ color: c, roughness: 0.8, side: DoubleSide }),
    );
    for (let offset = 0; offset < LOOP; offset += 40) {
      const holder = new Group();
      for (const side of [-1, 1]) {
        for (let n = 0; n < 4; n++) {
          const z = -random() * 30;
          const x = side * (CROWD_NEAR + 0.6 + random() * (CROWD_FAR - CROWD_NEAR - 0.6));
          const u = new Mesh(canopy, cloths[Math.floor(random() * cloths.length)]!);
          u.rotation.z = (random() - 0.5) * 0.3;
          const p = new Mesh(pole, white);
          for (const m of [u, p]) {
            m.position.set(x, 0, z);
            holder.add(m);
          }
        }
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /** The valley's ravens: black, broad-winged, wheeling over the road. */
  private addRavens(): void {
    const body = new CapsuleGeometry(0.16, 0.6, 4, 8);
    body.rotateX(Math.PI / 2);
    const wing = new BoxGeometry(1.1, 0.04, 0.38);
    wing.translate(0.55, 0, 0);
    this.disposables.push(body, wing);
    const feathers = this.material({ color: 0x141418, roughness: 0.6 });
    for (let i = 0; i < 8; i++) {
      const bird = new Group();
      const left = new Mesh(wing, feathers);
      left.rotation.y = Math.PI;
      bird.add(new Mesh(body, feathers), left, new Mesh(wing, feathers));
      bird.scale.setScalar(1.3);
      this.ravens.push(bird);
      this.group.add(bird);
    }
  }

  /** The aid stations on the salt side: a pop-up tent with water and ice every AID_EVERY metres. */
  private addAid(): void {
    const tents = new PopupTents(this.disposables, this.track);
    AID.forEach(([text, fill, ink], k) => {
      const holder = new Group();
      const tent = tents.make(text, fill, ink);
      tent.rotation.y = -Math.PI / 2;
      holder.add(tent);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 70 + k * AID_EVERY, x: -BARRIER - 2.4 });
    });
  }

  /**
   * The giant thermometer on the right: a white pillar twelve metres tall, DEATH VALLEY across its
   * head, the red column rising up its face to the reading in big red figures.
   */
  private addThermometer(): void {
    const face = this.track(thermometerTexture());
    const b = new BoxBuilder();
    const white = this.material({ color: 0xf6f4ee, roughness: 0.6 });
    b.box(white, [1.2, 12, 3], [0.6, 6, 0]);
    b.box(white, [0.6, 0.6, 3.6], [0.6, 12.2, 0]);
    const holder = b.build(this.disposables);
    const plane = new PlaneGeometry(2.8, 11.4);
    plane.rotateY(-Math.PI / 2);
    plane.translate(-0.02, 6, 0);
    this.disposables.push(plane);
    holder.add(
      new Mesh(
        plane,
        this.material({
          map: face,
          emissiveMap: face,
          emissive: new Color(0xffffff),
          emissiveIntensity: 0.2,
          roughness: 0.5,
        }),
      ),
    );
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: THERMOMETER, x: BARRIER + 5 });
  }

  /** The park's brown sign on the left: BADWATER BASIN and its depth below sea level. */
  private addParkSign(): void {
    const b = new BoxBuilder();
    const timber = this.material({ color: 0x4a3424, roughness: 0.9 });
    b.box(timber, [0.25, 2.2, 0.25], [0, 1.1, -1.6]);
    b.box(timber, [0.25, 2.2, 0.25], [0, 1.1, 1.6]);
    const holder = b.build(this.disposables);
    const plane = new PlaneGeometry(4.2, 1.7);
    plane.rotateY(Math.PI / 2);
    plane.translate(0.15, 1.9, 0);
    this.disposables.push(plane);
    holder.add(
      new Mesh(plane, this.material({ map: this.track(parkSignTexture()), roughness: 0.7 })),
    );
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: PARK_SIGN, x: -BARRIER - 2 });
  }

  private addStreetBanners(roadHalf: number): void {
    const b = new BoxBuilder();
    const steel = this.material({ color: 0xe8e8e8, metalness: 0.4, roughness: 0.5 });
    for (const x of [-roadHalf - 0.7, roadHalf + 0.7]) b.box(steel, [0.2, 6.4, 0.2], [x, 3.2, 0]);
    const posts = b.build(this.disposables).children as Mesh[];
    const cloth = new PlaneGeometry(2 * roadHalf + 1.2, 2);
    this.disposables.push(cloth);
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      banner.add(...posts.map((m) => new Mesh(m.geometry, m.material)));
      const c = new Mesh(
        cloth,
        this.material({ map: this.track(clothBannerTexture(text, fill, ink)), side: DoubleSide }),
      );
      c.position.y = 5.6;
      banner.add(c);
      this.group.add(banner);
      this.props.push({ mesh: banner, offset, x: 0 });
    }
  }

  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 10; offset < LOOP; offset += FEATHER_EVERY) {
        const holder = new Group();
        holder.add(feathers.make(k++));
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? FEATHER_EVERY / 2 : 0),
          x: side * (BARRIER + 0.15),
        });
      }
    }
  }

  private addRoadPaint(): void {
    const rows = paintedRows(
      { loop: LOOP, every: 8, start: 12, kerb: KERB, names: ROAD_PAINT, slogans: ROAD_SLOGANS },
      this.disposables,
      this.track,
    );
    for (const row of rows) {
      this.group.add(row.mesh);
      this.props.push(row);
    }
  }

  /**
   * The valley, hazed by hand: the dark, banded walls of the Black Mountains along the right; the
   * Panamint Range across the salt on the left, Telescope Peak capped with snow; the golden dunes
   * rising ahead, crest behind crest; and the mirage shimmering on the road before them.
   */
  private addValley(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const random = seeded(6431);
    const range = (from: number, to: number, base: number, rough: number, peak?: number) => {
      const shape = new Shape();
      shape.moveTo(from, -20);
      let y: number = base;
      for (let x = from; x <= to; x += 90) {
        y = y * 0.55 + 0.45 * (base + rough * (0.5 + 0.5 * Math.sin(x / 310)));
        const lift = peak === undefined ? 0 : 900 * Math.exp(-(((x - peak) / 500) ** 2));
        shape.lineTo(x, y + lift + (random() - 0.45) * rough * 0.18);
      }
      shape.lineTo(to, -20);
      return new ShapeGeometry(shape);
    };
    // The Black Mountains along the right: a steep front climbing from the fans to ridges near
    // 1,000 m, cut by canyons, its rock banded in charcoal, rust, ochre and the odd green.
    const strata = [
      '#3a3230',
      '#5a3a2a',
      '#7a5a3a',
      '#4a4038',
      '#8a6a48',
      '#5a6a58',
      '#6a4a34',
    ].map((hex) => new Color(hex));
    const black = heightfield(
      this.disposables,
      [980, -1300],
      [1600, 4200, 110, 210],
      (x, z) => {
        const front = ease((x - 180) / 560);
        const ridge = 0.62 + 0.22 * Math.sin(z / 410) + 0.16 * Math.sin(z / 137 + 1.3);
        const canyon = (1 - Math.abs(Math.sin(z / 95 + Math.sin(x / 140) * 0.9))) ** 6;
        const rough = 0.04 * Math.sin(x / 23 + z / 31) + 0.03 * Math.sin(z / 17 - x / 41);
        return front * 1050 * (ridge - 0.45 * canyon * (1 - front * 0.5) + rough);
      },
      (y, z) => strata[Math.floor((y + 40 * Math.sin(z / 230) + 400) / 55) % strata.length]!,
    );
    // A second, higher wall behind, paler for its distance.
    const back = range(-1200, 6200, 1300, 520);
    back.rotateY(Math.PI / 2);
    back.translate(2400, -4, 800);
    this.disposables.push(back);
    h.add(
      new Mesh(
        black,
        hazedMaterial(this.disposables, haze, 0xffffff, 0.12, { vertexColors: true }),
      ),
      new Mesh(back, this.distant(haze, 0x8a7a78, 0.5)),
    );
    // The Panamint Range across the basin on the left: fans rising to a long crest, Telescope
    // Peak lifted above it, its summit snowfields white.
    const rock = new Color(0x9a8a8e);
    const scree = new Color(0xb8a48a);
    const snow = new Color(0xffffff);
    const panamint = heightfield(
      this.disposables,
      [-4600, -2000],
      [2600, 7000, 120, 220],
      (x, z) => {
        const rise = ease((-x - 3000) / 1400);
        const crest = 1050 + 200 * Math.sin(z / 620) + 90 * Math.sin(z / 210 + 2);
        const peak = 700 * Math.exp(-(((z + 900) / 650) ** 2)) * ease((-x - 3700) / 700);
        const canyon = (1 - Math.abs(Math.sin(z / 160 + Math.sin(x / 210)))) ** 6;
        return rise * (crest - 380 * canyon * (1 - rise * 0.6)) + peak;
      },
      (y, z) => {
        if (y > 1480 + 50 * Math.sin(z / 47)) return snow;
        return y < 260 ? scree : rock;
      },
    );
    h.add(
      new Mesh(
        panamint,
        hazedMaterial(this.disposables, haze, 0xffffff, 0.4, { vertexColors: true }),
      ),
    );
    // The dunes ahead, rising out of the heat at the end of the road: transverse ridges driven by
    // the wind, each a long gentle windward slope up to a knife-edge crest and a steep slip face
    // falling away beyond it, heaped into great mounds. The slip faces lie in shade, the crests
    // catch the light, so the field reads ridge behind ridge.
    const dunes = new PlaneGeometry(1000, 800, 200, 160);
    dunes.rotateX(-Math.PI / 2);
    const position = dunes.getAttribute('position');
    const shade = new Float32Array(position.count * 3);
    const sand = new Color(0xffffff);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const wave = (x * 0.8 + z * 0.6) / 70 + 0.7 * Math.sin(z / 130) + 0.4 * Math.sin(x / 85);
      const u = wave - Math.floor(wave);
      const slip = u > 0.78;
      const profile = slip ? (1 - u) / 0.22 : u / 0.78;
      const mound = 0.5 + 0.5 * Math.sin(x / 190 - z / 230 + 1.2);
      const edge = Math.max(0, Math.min(1, (z + 400) / 200, (300 - Math.abs(x)) / 140));
      position.setY(i, edge * (8 + 100 * mound * (0.3 + 0.7 * profile)) - 3);
      const tone = slip ? 0.66 : 0.88 + 0.16 * profile;
      sand.setRGB(tone, tone * 0.97, tone * 0.93);
      sand.toArray(shade, i * 3);
    }
    dunes.setAttribute('color', new BufferAttribute(shade, 3));
    dunes.computeVertexNormals();
    dunes.translate(-10, 0, -520);
    this.disposables.push(dunes);
    h.add(
      new Mesh(
        dunes,
        hazedMaterial(this.disposables, haze, 0xf0be7a, 0.12, {
          roughness: 1,
          vertexColors: true,
        }),
      ),
    );
    this.addMirage();
  }

  private addMirage(): void {
    const h = this.horizon;
    // The mirage on the road ahead: a pale sheen of the sky lying on the asphalt, wavering.
    const sheen = new PlaneGeometry(26, 150);
    sheen.rotateX(-Math.PI / 2);
    sheen.translate(0, 0.06, -10);
    this.mirage = new MeshBasicMaterial({
      color: 0xd8e8f4,
      map: this.track(mirageTexture()),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    this.disposables.push(sheen, this.mirage);
    h.add(new Mesh(sheen, this.mirage));
  }

  /** A far range's silhouette: its colour hazed by distance, lit evenly so no face falls dark. */
  private distant(haze: Color, hex: number, amount: number): MeshStandardMaterial {
    const material = hazedMaterial(this.disposables, haze, hex, amount, { side: DoubleSide });
    material.emissive.copy(material.color).multiplyScalar(0.55);
    return material;
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

/** Four metres of Badwater Road: grey asphalt bleached by the sun, its cracks sealed in black. */
function asphaltTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a6662', 6441);
    g.strokeStyle = 'rgba(20,20,22,0.6)';
    g.lineWidth = 1.5;
    const random = seeded(6443);
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      let x = random() * 128;
      let y = random() * 128;
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (random() - 0.5) * 30;
        y += random() * 20;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

/** Desert gravel: tan, with darker stones and pale pebbles. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b89a76', 6451);
    const random = seeded(6453);
    for (let i = 0; i < 220; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(70,50,36,0.55)' : 'rgba(240,226,200,0.6)';
      const r = 1 + random() * 2.5;
      g.fillRect(random() * 128, random() * 128, r, r * 0.8);
    }
  });
}

/** The thermometer's face: DEATH VALLEY at its head, the red column and its bulb, the reading. */
function thermometerTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 512);
    g.fillStyle = '#c8501a';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#ffffff';
    g.font = 'bold 22px sans-serif';
    g.textAlign = 'center';
    g.fillText('DEATH', 64, 28);
    g.fillText('VALLEY', 64, 54);
    g.fillStyle = '#e8e4dc';
    g.fillRect(52, 90, 24, 300);
    g.fillStyle = '#d8283a';
    g.fillRect(56, 150, 16, 250);
    g.beginPath();
    g.arc(64, 406, 22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1b1e24';
    for (let y = 100; y < 390; y += 20) g.fillRect(80, y, 10, 2);
    g.fillStyle = '#d8283a';
    g.font = 'bold 50px sans-serif';
    g.fillText('120°', 64, 478);
    g.font = 'bold 18px sans-serif';
    g.fillText('F · 49°C', 64, 502);
  });
}

/** The park's brown sign, its letters cut and painted white. */
function parkSignTexture(): CanvasTexture {
  return canvasTexture(420, 170, (g) => {
    g.fillStyle = '#5a3a22';
    g.fillRect(0, 0, 420, 170);
    g.strokeStyle = '#f4ead8';
    g.lineWidth = 5;
    g.strokeRect(8, 8, 404, 154);
    g.fillStyle = '#f4ead8';
    g.textAlign = 'center';
    g.font = 'bold 44px serif';
    g.fillText('BADWATER BASIN', 210, 62);
    g.font = 'bold 26px serif';
    g.fillText('ELEVATION −282 FEET', 210, 108);
    g.fillText('85.5 M BELOW SEA LEVEL', 210, 144);
  });
}

/** The mirage's sheen: bright in its middle, fading out at its edges and its near end. */
function mirageTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const across = g.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(255,255,255,0)');
    across.addColorStop(0.5, 'rgba(255,255,255,1)');
    across.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = across;
    g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = 'destination-in';
    const along = g.createLinearGradient(0, 0, 0, 256);
    along.addColorStop(0, 'rgba(0,0,0,0.9)');
    along.addColorStop(0.6, 'rgba(0,0,0,0.6)');
    along.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = along;
    g.fillRect(0, 0, 64, 256);
  });
}
