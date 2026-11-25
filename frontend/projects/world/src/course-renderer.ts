// A course drawn with Three.js (ADR 0034, L2-166): the map built in Blender from the class it is modelled after,
// loaded as glTF, with the cyclist kit's riders on its road and a chase camera behind the rider. A class's clock
// places the rider, so each hill arrives with the resistance it was laid from; a race's riders are placed by the
// metres they have ridden. `main`'s scenes are drawn by
// world-renderer.ts; map-renderer.ts picks between the two.
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import {
  AdditiveBlending,
  AgXToneMapping,
  type CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardNodeMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Node,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  RenderPipeline,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import type {
  Backend,
  SceneFrame,
  SceneRider,
  TimedSegment as Segment,
  World,
  WorldRenderer,
  WorldStartOptions,
} from '@telo/api';
import {
  Course,
  type CoursePlace,
  type CourseCableway,
  courseCableways,
  type CourseGliderOrbit,
  courseGliders,
  courseLamps,
  courseLights,
  courseLook,
  courseRain,
  courseWet,
  parseCourse,
} from './course';
import { CourseCyclistKit, type RiderModel as Cyclist } from './course-cyclist';
import { fenceMaterial } from './fence-material';
import { type CabinPose, gondolaPosition } from './gondola-flight';
import { type GliderPose, paragliderPose } from './paraglider-flight';
import { type GroundEye, groundMaterial, surfaceTexture } from './ground-material';
import { haloMaterial } from './halo-material';
import { colouredGlow, LampGlow } from './lamp-glow';
import { colourLightMap, lampLightMap } from './lamp-light-map';
import { ridersOnRoad } from './race-riders';
import { skyMaterial } from './sky-material';
import { type Rain, rain } from './rain';
import { RiderBatch } from './rider-batch';
import { RiderBody } from './rider-body';
import { bendLean } from './rider-lean';
import { type ShadowShape, shadowLength, shadowShape } from './rider-shadow-shape';
import { outOfTheSaddle } from './rider-stance';
import { endShadow, sideShadow } from './shadow-silhouette';
import { SunGlow } from './sun-glow';
import { vertexFinish } from './rider-finish';
import { RiderShadows } from './rider-shadows';
import { wallMaterial } from './wall-material';
import { waterMaterial } from './water-material';
import { windowMaterial } from './window-material';
import { heldFps } from './held-fps';
import { PROBE_KEY, readWorldRideProbe } from './world-ride-probe';

/** The chase camera: this far behind the rider and above the road, looking this far ahead. */
const CAMERA_BACK = 2.75;
const CAMERA_UP = 1.8;
/**
 * How far the picture is raised in the frame, as a share of its height: the race's panel lies over the foot of the
 * screen, and the rider's wheels and the road under them are to show above it. The lens is shifted, as a view
 * camera's is, so the camera stays where it is and nothing leans.
 */
const FRAME_RISE = 0.19;
const LOOK_AHEAD = 14;
const LOOK_UP = 1.35;
/** At the start line and the finish line the camera closes in to this, eased over these metres either side. */
const CLOSE_BACK = 2.4;
const CLOSE_UP = 1.65;
const CLOSE_START = 45;
const CLOSE_FINISH = 70;
/** Each rider's shadow: a dark blob on the road, this long down-sun and this wide, in metres. */
const SHADOW_WIDTH = 0.8;
/**
 * How far from the camera, in metres, a chunk of each group of the map is drawn: the land keeps the island's shape to
 * the haze, and what stands on it is drawn nearer, the smallest things nearest.
 */
const DRAW_DISTANCE: Readonly<Record<string, number>> = {
  Land: 950,
  Ground: 420,
  Solid: 250,
  Walls: 220,
  Windows: 160,
  Fences: 120,
  Halos: 320,
  Glow: 400,
  Beams: 460,
  Leaves: 210,
  Confetti: 300,
};
/** The start lights are drawn until the rider is this many metres up the road. */
const START_LIGHTS = 150;
/** How often, in frames, the chunks to draw are chosen. */
const CHUNK_SWEEP = 12;
/** Riders further ahead than this are not drawn, and no more than this many of the nearest. */
const FAR_RIDERS = 120;
const MOST_RIDERS = 4;
/** The most riders of a race made when it starts; any beyond them are made as they first ride into view. */
const MOST_FIELD = 12;
/** The haze the distance fades into, from these metres to these; its colour is the course's (`courseLook`). */
const FOG: readonly [number, number] = [200, 1500];
/** The material for everything of a rider that is coloured by vertex, each part with its own finish. */
function riderMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ vertexColors: true });
  vertexFinish(material);
  return material;
}

/** Shifts a camera's lens so its picture sits `FRAME_RISE` higher in the frame. */
function raised(camera: PerspectiveCamera): PerspectiveCamera {
  camera.setViewOffset(1, 1, 0, FRAME_RISE, 1, 1);
  return camera;
}

/**
 * How much of a coloured light's strength shows on a course that still has the sun: the strengths in a course file
 * are a night's, and at dusk a doorway or a string of bulbs tints the ground before it, no more.
 */
const DUSK_LIGHT = 0.16;

/** How far the map is drawn at each tier, as a share of each group's draw distance: a slower device draws less far. */
const DRAWN_FAR = [0.7, 0.8, 0.9, 1, 1] as const;

/**
 * How finely the riders are made at each tier (1 is the finest), and how much more coarsely the riders other than
 * the one the camera follows: they are seen from further off, and there may be a dozen of them.
 */
const RIDER_DETAIL = [0.6, 0.7, 0.8, 0.9, 1] as const;
const OTHERS_DETAIL = 0.6;
/** The tiers, from the lowest to this one, whose riders are the simple build: their lamps throw no pools on the road. */
const SIMPLE_RIDERS = 1;

/** How far up the road, in metres, a rider's lean into a bend is read from. */
const LEAN_AHEAD = 6;
const GHOST_OPACITY = 0.45;
/**
 * How bright the lamps' light is on what stands near the road, against the ground straight under a lamp: walls and
 * posts catch it side on, the land and the leaves as the ground does, the riders from above and beside.
 */
const LAMP_ON = { Solid: 2.4, Walls: 2.4, Land: 4.2, Leaves: 2.8, rider: 2.3 } as const;
/**
 * How the map is drawn, cheapest first: the most device pixels a CSS pixel, and whether the neon blooms. The ride
 * opens on `START`, so it never starts high and drops in front of the rider (L2-111 AC3); frames that keep the
 * display's pace step it up, and slow ones step it down, after which it never steps up again.
 */
const TIERS = [
  { ratio: 0.75, bloom: false },
  { ratio: 1, bloom: false },
  { ratio: 1.5, bloom: false },
  { ratio: 1.5, bloom: true },
  { ratio: 2, bloom: true },
] as const;
const START = 1;
/** The tier the test-only hook pins (world-ride-probe.ts): the bench reads frame times at one known tier. */
const PINNED: Readonly<Record<string, number>> = { low: 0, medium: 1, high: 3, ultra: 4 };
/** Frames judged before a step, and how their average time must compare with the display's frame period. */
const JUDGED_FRAMES = 90;
const TOO_SLOW = 1.6;
const AT_PACE = 1.1;

/** A race rider's colour, the design system's `--jersey-<jersey>`, as world-renderer.ts reads it. */
function jerseyColour(element: Element, jersey: string): Color {
  const value = getComputedStyle(element).getPropertyValue(`--jersey-${jersey}`).trim();
  const colour = new Color(0xd7ff3a);
  if (value) colour.setStyle(value);
  return colour;
}

export class CourseRenderer implements WorldRenderer {
  private boardwalk: import('./coney-boardwalk').ConeyBoardwalk | null = null;
  backend: Backend = 'webgl2';
  private renderer: WebGPURenderer | null = null;
  private course: Course | null = null;
  private disposed = false;
  private readonly scene = new Scene();
  private readonly camera = raised(new PerspectiveCamera(58, 16 / 9, 0.3, 14000));
  private readonly sun = new DirectionalLight(0xff9a5a, 2.6);
  private sky: Object3D | null = null;
  /** How long the riders' shadows in the sun lie on the road, in metres. */
  private shadowLong = 3.4;
  /** Moves the sky's cloud on to a second of the ride's clock. */
  private skyClock: ((seconds: number) => void) | null = null;
  /** Moves the sea's ripples on to a second of the ride's clock. */
  private waterClock: ((seconds: number) => void) | null = null;
  /** The rain, where it rains: it falls with the ride's clock and is not drawn with reduced motion. */
  private rain: Rain | null = null;
  /** Where the ground is seen from, for what wet ground mirrors (ground-material.ts). */
  private groundEye: GroundEye | null = null;
  /** The scene's pass with bloom over it, for the neon; null where it could not be built. */
  private pipeline: RenderPipeline | null = null;
  private map: Object3D | null = null;
  /** The map's chunks along the road, each with its centre and how near the camera must be to draw it. */
  private readonly chunks: {
    mesh: Mesh;
    group: string;
    /** Whether it is in the scene now: only the chunks near the camera are (`near`). */
    near: boolean;
    x: number;
    y: number;
    z: number;
    reach: number;
  }[] = [];
  private frames = 0;
  /** The chunks of the map that are near enough the camera to be drawn: the only ones in the scene. */
  private readonly near = new Group();
  /** What the pinned probe reports of the frame just drawn. */
  private readonly drawn = {
    tier: 0 as number,
    backend: '' as string,
    drawCalls: 0,
    triangles: 0,
    groups: {} as Record<string, number>,
  };
  private readonly chosenAt = new Vector3();
  /** The start lights: red until the ride's clock starts, green from then. */
  private startRed: Mesh | null = null;
  private startGreen: Mesh | null = null;
  private beams: MeshBasicMaterial | null = null;
  private readonly confetti: Mesh[] = [];
  private funivia: { holder: Group; span: CourseCableway; pose: CabinPose } | null = null;
  private glider: { holder: Group; orbit: CourseGliderOrbit; pose: GliderPose } | null = null;
  /** The blob every rider's shadow is drawn with, and each rider's own. */
  private blob: {
    geometry: PlaneGeometry;
    side: MeshBasicMaterial;
    end: MeshBasicMaterial;
  } | null = null;
  private readonly shape: ShadowShape = { side: false, width: 0.62, flipped: false };
  private readonly shadows = new Map<Cyclist, Mesh>();
  /** Under street lamps the riders' shadows are the lamps' instead (rider-shadows.ts), for these riders. */
  private lampShadows: RiderShadows | null = null;
  private readonly casting = new Set<Cyclist>();
  /** Draws every rider's moving parts of a plain colour in one draw call. */
  private riderBatch: RiderBatch | null = null;
  /** Set once the race's riders have been made, on its first frame. */
  private fieldMade = false;
  /** Draws everything of a rider that is coloured by vertex: the body and the bike (course-cyclist.ts). */
  private readonly plain = riderMaterial();
  private kit: CourseCyclistKit | null = null;
  /** The riders' body, loaded with the course. */
  private body: RiderBody | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private you: Cyclist | null = null;
  private readonly riders = new Map<string, Cyclist>();
  private readonly disposables: { dispose(): void }[] = [];
  private readonly frameMaterial = new MeshPhysicalMaterial({
    color: 0x15171c,
    metalness: 0.6,
    roughness: 0.35,
  });
  /** The plan's seconds for each second of the course: 1 when the plan is the class the course was built from. */
  private clockScale = 1;
  private readonly here: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly there: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  // The frame budget: the tier follows what the device can draw at the display's pace (L2-166 AC6).
  private size: readonly [number, number, number] = [0, 0, 1];
  private tier = START;
  /** Set once slow frames have stepped the tier down: it steps up no more. */
  private settled = false;
  private period: number | null = null;
  private lastFrameAt: number | null = null;
  private judged = 0;
  private spent = 0;
  /** Set by the test-only hook: the tier never steps, and each frame's cost is written to the hook. */
  private pinned = false;
  /** Set by the test-only hook: the metres up the road the bench starts its ride from. */
  private benchFrom = 0;
  /** The street lamps' light on what stands near the road, where the course has lamps; and the riders' materials lit by it. */
  private lampGlow: LampGlow | null = null;
  /** The daylight on the riders of a course without lamps (sun-glow.ts). */
  private sunGlow: SunGlow | null = null;
  private readonly lamplit = new Map<Material, Material>();

  /** `path` is where the app serves the course's `.glb` and `.course.json`. */
  constructor(private readonly path: string) {}

  async start(
    canvas: HTMLCanvasElement,
    _world: World,
    nextFrame: () => Promise<void>,
    segments: readonly Segment[] = [],
    options: WorldStartOptions = {},
  ): Promise<boolean> {
    try {
      const asked = readWorldRideProbe((globalThis as Record<string, unknown>)[PROBE_KEY]);
      const renderer = new WebGPURenderer({
        canvas,
        antialias: true,
        forceWebGL: asked?.forceWebGL === true || options.forceWebGL === true,
      });
      await renderer.init();
      this.renderer = renderer;
      if (options.tier) this.tier = PINNED[options.tier] ?? START;
      if (asked && !asked.judged) {
        this.pinned = true;
        const from = (globalThis as Record<string, unknown>)[PROBE_KEY] as { from?: unknown };
        if (typeof from.from === 'number') this.benchFrom = from.from;
        this.tier = (asked.tier && PINNED[asked.tier]) ?? START;
        renderer.info.autoReset = false;
      }
      this.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = AgXToneMapping;
      renderer.toneMappingExposure = 1.15;

      const [file, gltf, body] = await Promise.all([
        fetch(`${this.path}.course.json`).then((response) => {
          if (!response.ok) throw new Error(`The course file answered ${response.status}.`);
          return response.json() as Promise<unknown>;
        }),
        // A map's buffers are written with the meshopt codec (tools/blender/meshopt_glb.mjs); one written without
        // it loads as before.
        new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${this.path}.glb`),
        // The riders' body, built in Blender as the map is (ADR 0036).
        RiderBody.load(),
      ]);
      if (this.disposed) {
        body.dispose();
        return false;
      }
      this.body = body;
      this.disposables.push(body);
      this.course = new Course(parseCourse(file));
      const planned = segments.reduce((sum, segment) => sum + segment.duration, 0);
      this.clockScale = planned > 0 ? this.course.duration / planned : 1;
      this.canvas = canvas;
      this.build(gltf.scene, canvas);
      if (this.course.file.id === 'coney') {
        const { ConeyBoardwalk } = await import('./coney-boardwalk');
        if (this.disposed) return false;
        this.boardwalk = new ConeyBoardwalk(this.course, this.disposables);
        this.scene.add(this.boardwalk.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
      }

      // The map's programs compile while it loads, and its first picture is drawn before the ride's first frame.
      this.rehearse();
      await renderer.compileAsync(this.scene, this.camera, null, (event) =>
        options.progress?.({
          step: 'shaders',
          built: event.loaded,
          total: event.total,
          backend: this.backend,
        }),
      );
      if (this.disposed) return false;
      const tier = asked?.tier ?? options.tier ?? 'medium';
      options.progress?.({ step: 'warm-up', tier });
      this.warm(renderer);
      this.pipeline = this.glow(renderer);
      if (options.progress) {
        const times: number[] = [];
        for (let frame = 0; frame < 3; frame++) {
          this.render();
          await nextFrame();
          if (this.disposed) return false;
          times.push(performance.now());
        }
        const fps = heldFps(times);
        if (fps !== null) options.progress({ step: 'warmed', fps, tier });
      } else {
        this.render();
        await nextFrame();
      }
      return !this.disposed;
    } catch {
      return false;
    }
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (!this.renderer || width === 0 || height === 0) return;
    this.size = [width, height, pixelRatio];
    this.renderer.setPixelRatio(Math.min(pixelRatio, TIERS[this.tier]!.ratio));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  draw(frame: SceneFrame): void {
    const { renderer, course, you } = this;
    if (!renderer || !course || !you) return;
    // A race is won by distance, so its riders are placed by the metres they have ridden and cross the map's finish
    // line as the race's; a class is ridden by its clock (L2-166 AC2).
    const ridden = frame.riders
      ? Math.min(frame.s, course.end)
      : course.metresAt(frame.time * this.clockScale);
    if (this.pinned) {
      const from = ((globalThis as Record<string, unknown>)[PROBE_KEY] as { from?: unknown })?.from;
      if (typeof from === 'number') this.benchFrom = from;
    }
    const metres = Math.min(ridden + this.benchFrom, course.end);
    if (frame.riders && !this.fieldMade) this.makeField(frame.riders, metres);
    this.lampShadows?.begin();
    const standing = this.ride(you, metres, 0);
    // Every wheel on the road turns with the rider's: the riders keep much the same pace.
    this.kit?.roll(metres);
    you.pose(frame.reducedMotion ? 0 : frame.crank, standing);
    this.placeRiders(frame, metres);
    this.lampShadows?.end();
    this.riderBatch?.follow();
    this.boardwalk?.place(metres, frame.reducedMotion ? 0 : frame.time);
    this.aim(metres);
    // Chosen every few frames, and at once when the camera has jumped (a ride resumed elsewhere on the road).
    const leapt = this.camera.position.distanceToSquared(this.chosenAt) > 60 * 60;
    if (this.frames++ % CHUNK_SWEEP === 0 || leapt) this.choose();
    // The start lights: red until the clock starts, green from then, and not drawn once they are far behind.
    const lights = metres < START_LIGHTS;
    if (this.startRed) this.startRed.visible = lights && frame.time <= 0;
    if (this.startGreen) this.startGreen.visible = lights && frame.time > 0;
    if (this.rain) this.rain.mesh.visible = !frame.reducedMotion;
    if (!frame.reducedMotion) this.animate(frame.time);
    this.render();
    this.judge();
  }

  setFramePeriod(ms: number): void {
    this.period = ms;
    this.lastFrameAt = null;
    this.judged = 0;
    this.spent = 0;
  }

  pauseBudget(): void {
    this.period = null;
    this.lastFrameAt = null;
  }

  /** A course follows no real place: there is nothing to stream beside it (L2-066). */
  stream(): void {
    // Nothing to stream.
  }

  dispose(): void {
    this.disposed = true;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.map?.traverse((part) => {
      const mesh = part as Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    this.boardwalk?.group.removeFromParent();
    this.boardwalk = null;
    this.map = null;
    // The chunks were taken out of the map: their geometry is released here.
    for (const { mesh } of this.chunks) mesh.geometry.dispose();
    this.near.clear();
    this.chunks.length = 0;
    this.confetti.length = 0;
    this.funivia = null;
    this.glider = null;
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.riders.clear();
    this.lamplit.clear();
    this.lampGlow = null;
    this.sunGlow = null;
    this.groundEye = null;
    this.riderBatch = null;
    this.rain = null;
    this.shadows.clear();
    this.casting.clear();
    this.lampShadows = null;
    this.blob = null;
    this.renderer?.dispose();
    this.renderer = null;
  }

  private build(map: Object3D, canvas: HTMLCanvasElement): void {
    // The course's world: its sky, its haze and its lights (a course that names none is Ibiza's sunset).
    const look = courseLook(this.course!.file);
    this.scene.fog = new Fog(look.haze, FOG[0], FOG[1]);
    this.scene.background = new Color(look.haze);
    this.sun.color.setHex(look.light.colour);
    this.sun.intensity = look.light.intensity;
    // The map comes as a few groups of meshes, coloured by vertex and cut into chunks along the road (ADR 0034).
    // Each group is drawn with one cheap material: no texture, no PBR, shaded flat.
    const lit = { vertexColors: true, flatShading: true } as const;
    const glow = { vertexColors: true, toneMapped: false } as const;
    const materials: Record<string, Material> = {
      Land: new MeshLambertMaterial(lit),
      Solid: new MeshLambertMaterial(lit),
      Leaves: new MeshLambertMaterial({ ...lit, side: DoubleSide }),
      Sea: new MeshLambertMaterial(lit),
      Conillera: new MeshLambertMaterial({ ...lit, fog: false }),
      Peaks: new MeshLambertMaterial({ ...lit, fog: false }),
      Funivia: new MeshLambertMaterial({ ...lit, fog: false }),
      Glider: new MeshLambertMaterial({ ...lit, fog: false }),
      Glow: new MeshBasicMaterial(glow),
      Confetti: new MeshBasicMaterial({ ...glow, side: DoubleSide }),
      Sun: new MeshBasicMaterial({ ...glow, fog: false }),
      // A sky the map carries, painted in its vertices (build_sky in build_course.py).
      Sky: new MeshBasicMaterial({
        vertexColors: true,
        fog: false,
        depthWrite: false,
        side: DoubleSide,
        // Painted as it is to be seen: the tone curve would wash its reds out.
        toneMapped: false,
      }),
      StartRed: new MeshBasicMaterial(glow),
      StartGreen: new MeshBasicMaterial(glow),
      Beams: new MeshBasicMaterial({
        ...glow,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        fog: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    };
    // Where the course has street lamps, what stands near the road is lit by them (lamp-glow.ts).
    const lamps = courseLamps(this.course!.file);
    if (lamps) {
      const lights = courseLights(this.course!.file);
      const lampGlow = new LampGlow(
        lampLightMap(this.course!, lamps),
        lamps,
        lights.length ? colourLightMap(this.course!, lights) : null,
      );
      this.lampGlow = lampGlow;
      // The riders' shadows fall away from the lamps: the rider, and the riders drawn with them.
      this.lampShadows = new RiderShadows(this.course!, lamps, MOST_RIDERS + 1);
      this.scene.add(this.lampShadows.mesh);
      this.disposables.push(lampGlow, this.lampShadows);
      for (const [group, material] of [
        ['Solid', lampGlow.scenery(LAMP_ON.Solid)],
        ['Land', lampGlow.scenery(LAMP_ON.Land)],
        ['Leaves', lampGlow.scenery(LAMP_ON.Leaves, true)],
      ] as const) {
        materials[group]!.dispose();
        materials[group] = material;
      }
    }
    // A course without street lamps may still have coloured lights (a strip at dusk: lit doorways, neon, strings of
    // bulbs): their light falls on the ground, the water and the walls, under the sun that still lights the rest.
    let dusk: Node<'vec3'> | null = null;
    if (!lamps) {
      const lights = courseLights(this.course!.file);
      if (lights.length) {
        const glow = colouredGlow(colourLightMap(this.course!, lights));
        this.disposables.push(glow.texture);
        dusk = glow.light.mul(DUSK_LIGHT);
      }
    }
    const coloured = this.lampGlow?.coloured ?? dusk;
    const made = this.lampGlow?.light ?? dusk;
    this.disposables.push(...Object.values(materials));
    // The ground the road builds has its place on the road in its UV: its surface and the lamps' light are drawn
    // from that (ground-material.ts). A map built before it has no such group.
    const detail = surfaceTexture();
    const ground = groundMaterial(
      detail,
      this.course!.file.roadHalfWidth,
      lamps,
      courseWet(this.course!.file),
      new Color(look.haze),
      coloured,
    );
    materials['Ground'] = ground.material;
    this.groundEye = ground.eye;
    // Walls have their place on the wall in their UV: brick, steel and plaster are drawn from it (wall-material.ts).
    materials['Walls'] = wallMaterial(detail, made, LAMP_ON.Walls);
    // The city on the horizon is walls too, never lit by the lamps: its windows shine (wall-material.ts).
    materials['Skyline'] = wallMaterial(detail, null, 0, new Color(look.haze));
    // Rain, where it rains: it shows by the lamps' light (rain.ts).
    const raining = courseRain(this.course!.file);
    if (raining > 0) {
      this.rain = rain(raining, this.lampGlow?.light ?? null);
      this.scene.add(this.rain.mesh);
      this.disposables.push(this.rain);
    }
    // By the sea, the sheet round the land is water (water-material.ts).
    if (this.course!.file.sea === true) {
      const water = waterMaterial(
        look,
        this.course!.file.sun,
        detail,
        this.course!.file.night === true,
        coloured,
      );
      materials['Sea']!.dispose();
      materials['Sea'] = water.material;
      this.waterClock = water.at;
      this.disposables.push(water.material);
    }
    // Windows are panels with their place on the pane in their UV (window-material.ts).
    materials['Windows'] = windowMaterial(detail, new Color(look.haze), made);
    this.disposables.push(
      detail,
      materials['Ground'],
      materials['Walls'],
      materials['Skyline'],
      materials['Windows'],
    );
    // Railings are panels with their place along the railing in their UV (fence-material.ts).
    materials['Fences'] = fenceMaterial(made, LAMP_ON.Solid);
    // The glow round each light: corners the material spreads to face the eye (halo-material.ts).
    materials['Halos'] = haloMaterial(DRAW_DISTANCE['Halos']! * 0.6, DRAW_DISTANCE['Halos']!);
    this.disposables.push(materials['Fences'], materials['Halos']);
    this.beams = materials['Beams'] as MeshBasicMaterial;
    const painted: Mesh[] = [];
    map.traverse((part) => {
      const mesh = part as Mesh;
      if (!mesh.isMesh) return;
      // A chunk is named for its group and its place along the road: `Solid_012`.
      const [group = '', chunk] = mesh.name.split('_');
      const material = materials[group];
      if (!material) return;
      for (const loaded of [mesh.material].flat()) loaded.dispose();
      mesh.material = material;
      if (group === 'Sky') {
        // The map's own sky: its sectors ride with the camera, behind everything.
        mesh.renderOrder = -1;
        painted.push(mesh);
        return;
      }
      // The ground is lit smoothly: its normals are worked out here, so the map's file carries none.
      if (group === 'Ground') mesh.geometry.computeVertexNormals();
      // The map is set once and never moves: its matrices are worked out here, not every frame.
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      if (group === 'Confetti') this.confetti.push(mesh);
      if (group === 'StartRed') this.startRed = mesh;
      if (group === 'StartGreen') this.startGreen = mesh;
      if (group === 'Funivia') {
        const span = courseCableways(this.course!.file)[0];
        if (span) {
          mesh.updateMatrixWorld(true);
          mesh.matrix.copy(mesh.matrixWorld);
          mesh.matrixAutoUpdate = false;
          const holder = new Group();
          this.funivia = { holder, span, pose: { x: 0, y: 0, z: 0, sway: 0 } };
        }
      }
      if (group === 'Glider') {
        const orbit = courseGliders(this.course!.file)[0];
        if (orbit) {
          mesh.updateMatrixWorld(true);
          mesh.matrix.copy(mesh.matrixWorld);
          mesh.matrixAutoUpdate = false;
          const holder = new Group();
          this.glider = { holder, orbit, pose: { x: 0, y: 0, z: 0, heading: 0, bank: 0 } };
        }
      }
      if (chunk !== undefined) {
        mesh.geometry.computeBoundingSphere();
        const sphere = mesh.geometry.boundingSphere;
        if (sphere) {
          // A mesh's positions are steps of its own box, put back by its place and scale in the map (pack_glb.py):
          // its middle and its reach are worked out in the map's axes, not its own.
          mesh.updateMatrixWorld(true);
          // The map never moves: its place is worked out this once, not every frame.
          mesh.matrixAutoUpdate = false;
          const middle = sphere.center.clone().applyMatrix4(mesh.matrixWorld);
          this.chunks.push({
            mesh,
            group,
            near: false,
            x: middle.x,
            y: middle.y,
            z: middle.z,
            reach:
              (DRAW_DISTANCE[group] ?? 700) + sphere.radius * mesh.matrixWorld.getMaxScaleOnAxis(),
          });
        }
      }
    });
    if (this.funivia) {
      const m = map.getObjectByName('Funivia') as Mesh | undefined;
      if (m?.isMesh) {
        this.funivia.holder.add(m);
        this.disposables.push(m.geometry);
      }
      this.scene.add(this.funivia.holder);
      this.placeFunivia(0, true);
    }
    if (this.glider) {
      const m = map.getObjectByName('Glider') as Mesh | undefined;
      if (m?.isMesh) {
        this.glider.holder.add(m);
        this.disposables.push(m.geometry);
      }
      this.scene.add(this.glider.holder);
      this.placeGlider(0, true);
    }
    this.map = map;
    this.scene.add(map);
    // The map is some hundreds of chunks, and a frame draws a few dozen of them. A chunk that is only hidden is
    // still walked twice by every frame (to place it and to ask whether it is in view), so the chunks are taken out
    // of the map and only those near the camera are in the scene (`choose`). Each keeps its place in the world as
    // its own, worked out here once. The confetti moves in the map's axes and stays where it is.
    this.scene.add(this.near);
    for (const chunk of this.chunks) {
      if (chunk.group === 'Confetti') continue;
      chunk.mesh.matrix.copy(chunk.mesh.matrixWorld);
      this.near.add(chunk.mesh);
      chunk.near = true;
    }

    // The sky, worked out a pixel on a dome that rides with the camera (sky-material.ts).
    // A map that carries its own sky, painted in Blender, is drawn under that instead.
    if (painted.length) {
      const carried = new Group();
      for (const sector of painted) {
        // Its place in the map (pack_glb.py) becomes its place round the camera.
        sector.updateMatrixWorld(true);
        sector.matrix.copy(sector.matrixWorld);
        sector.matrixAutoUpdate = false;
        carried.add(sector);
        this.disposables.push(sector.geometry);
      }
      this.sky = carried;
      this.scene.add(carried);
    } else {
      const dome = new SphereGeometry(9000, 24, 12);
      const sky = skyMaterial(look, this.course!.file.sun, detail);
      this.skyClock = sky.at;
      this.sky = new Mesh(dome, sky.material);
      this.sky.renderOrder = -1;
      this.scene.add(this.sky);
      this.disposables.push(dome, sky.material);
    }

    const fill = new HemisphereLight(look.fill[0], look.fill[1], 1.5);
    // The low sun throws each rider's shadow long across the road: a soft dark blob, with no shadow map to draw.
    // Each rider's shadow in the sun: a square on the road drawn with the rider's own outline, from the side or
    // end on as the sun stands (rider-shadow-shape.ts, shadow-silhouette.ts). Along it, away from the sun, is +z.
    const square = new PlaneGeometry(1, 1);
    square.rotateX(-Math.PI / 2);
    const cast = (map: CanvasTexture) =>
      new MeshBasicMaterial({
        // A shadow in the open is lit by the sky and not black: it darkens the road and leaves its colour showing,
        // with a breath of the sky's own colour from below.
        color: new Color(look.fill[1]).multiplyScalar(0.035),
        map,
        transparent: true,
        opacity: 0.66,
        depthWrite: false,
        side: DoubleSide,
      });
    this.shadowLong = shadowLength(this.course!.file.sun[1]);
    const side = cast(sideShadow());
    const end = cast(endShadow());
    this.blob = { geometry: square, side, end };
    this.disposables.push(side.map!, end.map!, side, end);
    this.disposables.push(square);
    this.scene.add(fill, this.sun, this.sun.target);
    this.disposables.push(fill, this.sun);

    // At night the bikes' lights are on. On the two lowest tiers the bikes' lamps throw no pools on the road.
    const kit = new CourseCyclistKit(
      this.plain,
      this.body!,
      this.course!.file.night === true,
      this.tier <= SIMPLE_RIDERS,
    );
    this.kit = kit;
    // The rider wears the You jersey of the race board (L2-060).
    // The rider the camera follows is made as finely as the device's tier allows; the others, seen from further
    // off, more coarsely (RIDER_DETAIL, OTHERS_DETAIL).
    const you = kit.make(jerseyColour(canvas, 'you'), 4, true, RIDER_DETAIL[this.tier] ?? 1);
    this.you = you;
    // Every rider's moving parts of a plain colour are drawn by one batch (rider-batch.ts), in the material that
    // draws their still ones.
    // A rider is lit by the course's lamps where it has them, and by its daylight where it does not.
    if (!this.lampGlow) {
      const [x, y, z] = this.course!.file.sun;
      this.sunGlow = new SunGlow(
        new Vector3(x, y, z).normalize(),
        this.sun.color,
        new Color(courseLook(this.course!.file).fill[0]),
      );
    }
    const riderLight = this.lampGlow ?? this.sunGlow;
    let batched: Material = this.plain;
    if (riderLight) {
      batched = riderLight.rider(this.plain as unknown as MeshStandardMaterial, LAMP_ON.rider);
      this.lamplit.set(this.plain, batched);
      this.disposables.push(batched);
    }
    this.riderBatch = new RiderBatch(batched);
    this.scene.add(this.riderBatch.group);
    this.disposables.push(this.riderBatch);
    this.riderBatch.add(you);
    this.lamplight(you);
    this.shadow(you);
    this.scene.add(you.group);
    this.disposables.push(kit, ...you.owned, this.frameMaterial, this.plain);
  }

  /**
   * Sends every chunk of the map to the GPU while the map loads. A chunk's geometry is otherwise sent the first time
   * it is drawn, a frame of 40 to 80 ms each time a new stretch of the map comes into view: a stutter every few
   * seconds of the ride.
   */
  private warm(renderer: WebGPURenderer): void {
    for (const chunk of this.chunks) {
      chunk.mesh.visible = true;
      chunk.mesh.frustumCulled = false;
      if (!chunk.near && chunk.mesh.parent === null) {
        this.near.add(chunk.mesh);
        chunk.near = true;
      }
    }
    renderer.render(this.scene, this.camera);
    for (const { mesh } of this.chunks) mesh.frustumCulled = true;
    this.choose();
  }

  /** Places the scene as the ride's first frame will, so what the start shows is what compiles. */
  private rehearse(): void {
    if (!this.you) return;
    this.lampShadows?.begin();
    this.ride(this.you, 0, 0);
    this.lampShadows?.end();
    this.riderBatch?.follow();
    this.you.pose(0);
    this.aim(0);
    this.choose();
    if (this.startGreen) this.startGreen.visible = false;
  }

  /**
   * Stands a cyclist on the road `metres` from the start line, `lane` metres right of its centre, and returns how
   * far out of the saddle the gradient there has them.
   */
  private ride(cyclist: Cyclist, metres: number, lane: number): number {
    // The rider leans into a bend: by how far the road turns over the next few metres.
    const ahead = this.course!.place(metres + LEAN_AHEAD, lane, this.here).heading;
    const at = this.course!.place(metres, lane, this.here);
    cyclist.group.position.set(at.x, at.y + 0.02, at.z);
    cyclist.group.rotation.set(
      at.pitch,
      at.heading,
      bendLean(at.heading, ahead, LEAN_AHEAD),
      'YXZ',
    );
    if (this.casting.has(cyclist) && cyclist.group.visible) this.lampShadows?.add(metres, lane);
    // The shadow lies on the road, stretched away from the sun.
    const shadow = this.shadows.get(cyclist);
    if (shadow) {
      const [sx, , sz] = this.course!.file.sun;
      // As long as the sun is low (rider-shadow-shape.ts), from the wheels away from the sun.
      const far = this.shadowLong * 0.46;
      shadow.position.set(at.x - sx * far, at.y + 0.05, at.z - sz * far);
      shadow.rotation.set(at.pitch, Math.atan2(-sx, -sz), 0, 'YXZ');
      // The rider as the sun sees them: from the side or end on, and as wide as that is.
      const shape = shadowShape(at.heading, sx, sz, this.shape);
      shadow.material = shape.side ? this.blob!.side : this.blob!.end;
      shadow.scale.x = shape.flipped ? -shape.width : shape.width;
      shadow.visible = cyclist.group.visible;
    }
    return outOfTheSaddle(Math.tan(at.pitch) * 100);
  }

  /** The chase camera behind the rider, looking up the road, with the sky and the sun's light around it. */
  private aim(metres: number): void {
    const course = this.course!;
    // Close in on the rider at the start line and at the finish line.
    const near = Math.max(
      1 - Math.abs(metres) / CLOSE_START,
      1 - Math.abs(metres - course.length) / CLOSE_FINISH,
      0,
    );
    const close = near * near * (3 - 2 * near);
    const behind = this.boardwalk ? 5.0 : CAMERA_BACK + (CLOSE_BACK - CAMERA_BACK) * close;
    const up = this.boardwalk ? 2.35 : CAMERA_UP + (CLOSE_UP - CAMERA_UP) * close;
    const back = course.place(metres - behind, 0, this.here);
    this.camera.position.set(back.x, back.y + up, back.z);
    this.groundEye?.at(metres - behind, 0, up);
    const ahead = course.place(metres + LOOK_AHEAD, 0, this.there);
    this.camera.lookAt(ahead.x, ahead.y + LOOK_UP, ahead.z);
    this.sky?.position.copy(this.camera.position);
    const [x, , z] = course.file.sun;
    this.sun.target.position.set(ahead.x, ahead.y, ahead.z);
    this.sun.position.set(ahead.x + x * 70, ahead.y + 34, ahead.z + z * 70);
    this.sun.target.updateMatrixWorld();
  }

  /** The race's other riders at their places, each on a line of their own (L2-064 AC3). */
  private placeRiders(frame: SceneFrame, metres: number): void {
    for (const rider of this.riders.values()) {
      rider.group.visible = false;
      const shadow = this.shadows.get(rider);
      if (shadow) shadow.visible = false;
    }
    if (!frame.riders) return;
    const nearest = ridersOnRoad(frame.riders, FAR_RIDERS)
      .sort((a, b) => Math.abs(a.metres) - Math.abs(b.metres))
      .slice(0, MOST_RIDERS);
    for (const rider of nearest) {
      const cyclist = this.rider(rider.jersey);
      if (!cyclist) continue;
      cyclist.group.visible = true;
      const standing = this.ride(cyclist, metres + rider.metres, rider.lane);
      cyclist.pose(frame.reducedMotion ? 0 : frame.crank + rider.lane, standing);
    }
  }

  /**
   * Makes every rider of the race on the ride's first frame, and draws them once where the rider is, so each one's
   * geometry, textures and programs are ready: a rider made later, when they first rode into view, cost a frame of
   * 75 ms in the middle of the ride. The frame drawn here is drawn over before it is shown.
   */
  private makeField(riders: readonly SceneRider[], metres: number): void {
    this.fieldMade = true;
    for (const [order, rider] of riders.slice(0, MOST_FIELD).entries()) {
      const cyclist = this.rider(rider.jersey);
      if (!cyclist) continue;
      cyclist.group.visible = true;
      this.ride(cyclist, metres + 6 + order, 0);
      cyclist.pose(0);
    }
    this.riderBatch?.follow();
    this.aim(metres);
    this.render();
  }

  /** A race rider in their jersey, made the first time they ride into view; the ghost in translucent gold. */
  private rider(jersey: string): Cyclist | null {
    const made = this.riders.get(jersey);
    if (made) return made;
    if (!this.kit || !this.canvas) return null;
    const colour = jerseyColour(this.canvas, jersey);
    // The ghost is a figure of glass: it carries no light.
    const cyclist = this.kit.make(
      colour,
      this.riders.size + 1,
      jersey !== 'ghost',
      (RIDER_DETAIL[this.tier] ?? 1) * OTHERS_DETAIL,
    );
    this.disposables.push(...cyclist.owned);
    if (jersey === 'ghost') {
      const glass = new MeshStandardMaterial({
        color: colour,
        roughness: 0.4,
        transparent: true,
        opacity: GHOST_OPACITY,
        depthWrite: false,
      });
      this.disposables.push(glass);
      cyclist.group.traverse((part) => {
        const mesh = part as Mesh;
        if (mesh.isMesh) mesh.material = glass;
      });
    }
    if (jersey !== 'ghost') {
      this.riderBatch?.add(cyclist);
      this.lamplight(cyclist);
    }
    if (jersey !== 'ghost') this.shadow(cyclist);
    this.riders.set(jersey, cyclist);
    this.scene.add(cyclist.group);
    return cyclist;
  }

  /** Gives a rider's lit materials the course's own light: its lamps' where it has them, its daylight where not. */
  private lamplight(cyclist: Cyclist): void {
    const lampGlow = this.lampGlow ?? this.sunGlow;
    if (!lampGlow) return;
    cyclist.group.traverse((part) => {
      const mesh = part as Mesh;
      const own = mesh.material as MeshStandardMaterial;
      if (
        !mesh.isMesh ||
        Array.isArray(own) ||
        !(own.isMeshStandardMaterial || (own as Material) === this.plain)
      )
        return;
      let lit = this.lamplit.get(own);
      if (!lit) {
        lit = lampGlow.rider(own, LAMP_ON.rider);
        this.lamplit.set(own, lit);
        this.disposables.push(lit);
      }
      mesh.material = lit;
    });
  }

  /** What moves on the map: the light beams breathe and the confetti flutters. Two numbers a frame. */
  private animate(time: number): void {
    if (this.beams) this.beams.opacity = 0.17 + 0.06 * Math.sin(time * 1.7);
    this.skyClock?.(time);
    this.waterClock?.(time);
    this.rain?.at(time);
    for (const confetti of this.confetti) {
      confetti.position.y = 0.45 * Math.sin(time * 1.3);
      confetti.rotation.y = 0.012 * Math.sin(time * 0.9);
      confetti.updateMatrix();
    }
    this.placeFunivia(time, false);
    this.placeGlider(time, false);
  }

  private placeFunivia(time: number, reducedMotion: boolean): void {
    if (!this.funivia) return;
    const { holder, span, pose } = this.funivia;
    gondolaPosition(span, time, 0.35, reducedMotion, pose);
    holder.position.set(pose.x, pose.y, pose.z);
    holder.rotation.set(pose.sway, -span.yaw, 0, 'YXZ');
  }

  private placeGlider(time: number, reducedMotion: boolean): void {
    if (!this.glider) return;
    const { holder, orbit, pose } = this.glider;
    paragliderPose(orbit, time, 0.15, reducedMotion, pose);
    holder.position.set(pose.x, pose.y, pose.z);
    holder.rotation.set(0, pose.heading, pose.bank, 'YXZ');
  }

  /** Draws only the chunks of the map near enough to the camera; the haze hides the rest. */
  private choose(): void {
    const { x, y, z } = this.camera.position;
    this.chosenAt.copy(this.camera.position);
    // A slower device draws less far: each tier's share of a chunk's reach.
    const far = DRAWN_FAR[this.tier] ?? 1;
    for (const chunk of this.chunks) {
      const dx = chunk.x - x;
      const dy = chunk.y - y;
      const dz = chunk.z - z;
      const reach = chunk.reach * far;
      const show = dx * dx + dy * dy + dz * dz < reach * reach;
      chunk.mesh.visible = show;
      // In the scene only while it is near; a chunk the map still holds (the confetti) is hidden, not taken out.
      if (
        show !== chunk.near &&
        chunk.mesh.parent !== this.map &&
        chunk.mesh.parent?.parent !== this.map
      ) {
        if (show) this.near.add(chunk.mesh);
        else this.near.remove(chunk.mesh);
        chunk.near = show;
      }
    }
  }

  /** Gives a cyclist their shadow on the road. */
  private shadow(cyclist: Cyclist): void {
    if (this.lampShadows) {
      this.casting.add(cyclist);
      return;
    }
    if (!this.blob) return;
    const mesh = new Mesh(this.blob.geometry, this.blob.end);
    mesh.scale.set(SHADOW_WIDTH, 1, this.shadowLong);
    mesh.renderOrder = 1;
    this.shadows.set(cyclist, mesh);
    this.scene.add(mesh);
  }

  /** The scene's pass with a soft bloom over it, so the neon, the bulbs and the sun glow. */
  private glow(renderer: WebGPURenderer): RenderPipeline | null {
    try {
      const scene = pass(this.scene, this.camera);
      const colour = scene.getTextureNode('output');
      const pipeline = new RenderPipeline(renderer);
      pipeline.outputNode = colour.add(bloom(colour, 0.16, 0.45, 0.9));
      return pipeline;
    } catch {
      return null;
    }
  }

  /** Draws the frame: through the bloom at the tiers that have it, plainly at the others. */
  private render(): void {
    const renderer = this.renderer;
    if (!renderer) return;
    if (this.pinned) renderer.info.reset();
    if (this.pipeline && TIERS[this.tier]!.bloom) this.pipeline.render();
    else renderer.render(this.scene, this.camera);
    if (this.pinned) this.report(renderer);
  }

  /** Writes what the frame cost to the test-only hook, for the bench (tools/course-bench). */
  private report(renderer: WebGPURenderer): void {
    const hook = (globalThis as Record<string, unknown>)[PROBE_KEY] as Record<string, unknown>;
    // The chunks of each group in view: where the map's draw calls come from. Counted into the one record, so a
    // test that watches the frame rate is not measuring its own report.
    const drawn = this.drawn;
    for (const group in drawn.groups) drawn.groups[group] = 0;
    for (const { mesh, group } of this.chunks) {
      if (mesh.visible) drawn.groups[group] = (drawn.groups[group] ?? 0) + 1;
    }
    drawn.tier = this.tier;
    drawn.backend = this.backend;
    drawn.drawCalls = renderer.info.render.drawCalls;
    drawn.triangles = renderer.info.render.triangles;
    if (this.boardwalk) {
      Object.assign(drawn, {
        carRadius: this.boardwalk.street.carRadius,
        trainX: this.boardwalk.street.trainX,
      });
    }
    hook['course'] = drawn;
  }

  /** Steps the tier down when the judged frames ran slower than the display allows, and up while they keep its pace. */
  private judge(): void {
    const now = performance.now();
    const last = this.lastFrameAt;
    this.lastFrameAt = now;
    if (this.pinned || this.period === null || last === null) return;
    this.spent += now - last;
    if (++this.judged < JUDGED_FRAMES) return;
    const average = this.spent / this.judged;
    this.judged = 0;
    this.spent = 0;
    if (average > this.period * TOO_SLOW) {
      this.settled = true;
      if (this.tier > 0) this.step(-1);
    } else if (!this.settled && average <= this.period * AT_PACE && this.tier < TIERS.length - 1) {
      this.step(1);
    }
  }

  private step(by: number): void {
    this.tier += by;
    this.resize(...this.size);
  }
}
