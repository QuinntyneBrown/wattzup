// A course drawn with Three.js (ADR 0034, L2-166): the map built in Blender from the class it is modelled after,
// loaded as glTF, with the cyclist kit's riders on its road and a chase camera behind the rider. A class's clock
// places the rider, so each hill arrives with the resistance it was laid from; a race's riders are placed by the
// metres they have ridden. `main`'s scenes are drawn by
// world-renderer.ts; map-renderer.ts picks between the two.
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
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
  RepeatWrapping,
  type Texture,
  TextureLoader,
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
import type { AngliruRoadside } from './angliru-roadside';
import type { AntwerpWind } from './antwerp-wind';
import type { arenbergPave } from './arenberg-pave';
import { CourseCyclistKit, type RiderModel as Cyclist } from './course-cyclist';
import { fenceMaterial } from './fence-material';
import { type CabinPose, gondolaPosition } from './gondola-flight';
import { type GliderPose, paragliderPose } from './paraglider-flight';
import { type GroundEye, groundMaterial, surfaceTexture } from './ground-material';
import { haloMaterial } from './halo-material';
import { colouredGlow, LampGlow } from './lamp-glow';
import { colourLightMap, lampLightMap } from './lamp-light-map';
import type { PursuitBoard } from './pursuit-board';
import { ridersOnRoad } from './race-riders';
import { skyMaterial } from './sky-material';
import { type Rain, rain } from './rain';
import type { SpeedWeek } from './speed-week';
import type { speedwayAsphalt } from './speedway-asphalt';
import type { SpeedwayFlags } from './speedway-flags';
import type { seafrontAsphalt } from './seafront-asphalt';
import type { BrightonParade } from './brighton-parade';
import type { BrooklynCommute } from './brooklyn-commute';
import type { BundCruise } from './bund-cruise';
import type { CalobraCamp } from './calobra-camp';
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
import type { ArtMuseumFlags } from './artmuseum-flags';
import type { ArtMuseumJoggers } from './artmuseum-joggers';
import type { SalarMirage } from './atacama-salt';
import type { AtacamaWildlife } from './atacama-wildlife';
import type { AtlanticSwell } from './atlantic-swell';
import type { AubisqueWeather } from './aubisque-weather';
import type { AubisqueLivestock } from './aubisque-livestock';
import type { AustinPerformers } from './austin-performers';
import type { BathshebaReef } from './bathsheba-reef';
import type { BayOfIslandsBoats } from './bay-of-islands-boats';
import type { BeachRoadBunch } from './beach-road-bunch';
import type { HighlandWeather } from './bealach-weather';
import type { HighlandLivestock } from './bealach-livestock';
import type { BigSurCoast } from './bigsur-coast';
import type { BlackpoolTrams } from './blackpool-trams';
import type { BlueMountainsYard } from './blue-mountains-yard';
import type { MabryMill } from './mabry-mill';
import type { BondiSurf } from './bondi-surf';
import { PROBE_KEY, readWorldRideProbe } from './world-ride-probe';

/** The chase camera: this far behind the rider and above the road, looking this far ahead. */
const eveningUniform = () => uniform(0);
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
  Pave: 180,
  Foliage: 110,
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
  backend: Backend = 'webgl2';
  private renderer: WebGPURenderer | null = null;
  private angliruRoadside: AngliruRoadside | null = null;
  private pave: ReturnType<typeof arenbergPave> | null = null;
  private course: Course | null = null;
  private timing: PursuitBoard | null = null;
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
  private camp: CalobraCamp | null = null;
  /** The rain, where it rains: it falls with the ride's clock and is not drawn with reduced motion. */
  private rain: Rain | null = null;
  /** Where the ground is seen from, for what wet ground mirrors (ground-material.ts). */
  private speedWeek: SpeedWeek | null = null;
  private saltRoad: Material | null = null;
  private speedwaySurface: typeof speedwayAsphalt | null = null;
  private speedway: SpeedwayFlags | null = null;
  private seafrontSurface: typeof seafrontAsphalt | null = null;
  private parade: BrightonParade | null = null;
  private commute: BrooklynCommute | null = null;
  private deckSurface: Material | null = null;
  private cruise: BundCruise | null = null;
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
    pushCarPosition: undefined as number | undefined,
    mirageHeight: undefined as number | undefined,
    flagTip: undefined as number | undefined,
    balloonHeight: undefined as number | undefined,
    bannerTip: undefined as number | undefined,
    floatPosition: undefined as number | undefined,
    cabPosition: undefined as number | undefined,
    ferryPosition: undefined as number | undefined,
    boatPosition: undefined as number | undefined,
    touristPosition: undefined as number | undefined,
    packDistance: undefined as number | undefined,
    coachDistance: undefined as number | undefined,
    backend: '' as string,
    ghostSeparationMetres: 0,
    boatHeight: null as number | null,
    flagDisplacement: null as number | null,
    joggerHeight: null as number | null,
    vicunaHeadHeight: null as number | null,
    flamingoBillHeight: null as number | null,
    sprayHeight: null as number | null,
    cirqueSun: null as number | null,
    horseLane: null as number | null,
    guitarHand: null as number | null,
    reefCrest: null as number | null,
    eveningLight: null as number | null,
    ferryX: null as number | null,
    eveningLight: null as number | null,
    clubLane: null as number | null,
    highlandSun: null as number | null,
    sheepLane: null as number | null,
    surfCrest: null as number | null,
    fallingWater: null as number | null,
    tramMetres: null as number | null,
    illumination: null as number | null,
    mistPosition: null as number | null,
    speakerDepth: null as number | null,
    valleyMist: null as number | null,
    paddleHeight: null as number | null,
    walkerStride: null as number | null,
    foamAdvance: null as number | null,
    drawCalls: 0,
    triangles: 0,
    metres: 0,
    smokeHeight: null as number | null,
    tourBoatX: null as number | null,
    trainingRiderX: null as number | null,
    tukTukX: null as number | null,
    asturiasFlagAngle: 0,
    echelonLeaderX: null as number | null,
    commissaireX: null as number | null,
    groups: {} as Record<string, number>,
  };
  private readonly trainingGroup: Cyclist[] = [];
  private portWind: AntwerpWind | null = null;
  private readonly echelon: Cyclist[] = [];
  private readonly convoy: { holder: Group; moto: boolean }[] = [];
  private flags: ArtMuseumFlags | null = null;
  private joggers: ArtMuseumJoggers | null = null;
  private mirage: SalarMirage | null = null;
  private salt: Material | null = null;
  private wildlife: AtacamaWildlife | null = null;
  private swell: AtlanticSwell | null = null;
  private weather: AubisqueWeather | null = null;
  private livestock: AubisqueLivestock | null = null;
  private performers: AustinPerformers | null = null;
  private reef: BathshebaReef | null = null;
  private evening: ReturnType<typeof eveningUniform> | undefined;
  private boats: BayOfIslandsBoats | null = null;
  private evening: ReturnType<typeof eveningUniform> | undefined;
  private bunch: BeachRoadBunch | null = null;
  private weather: HighlandWeather | null = null;
  private livestock: HighlandLivestock | null = null;
  private coast: BigSurCoast | null = null;
  private trams: BlackpoolTrams | null = null;
  private yard: BlueMountainsYard | null = null;
  private mill: MabryMill | null = null;
  private surf: BondiSurf | null = null;
  private readonly chosenAt = new Vector3();
  /** The start lights: red until the ride's clock starts, green from then. */
  private startRed: Mesh | null = null;
  private startGreen: Mesh | null = null;
  private beams: MeshBasicMaterial | null = null;
  private smoke: { mesh: Mesh; x: number; y: number } | null = null;
  private readonly canalTraffic: { holder: Group; boat: boolean; order: number }[] = [];
  private readonly templeTraffic: { holder: Group; bike: boolean }[] = [];
  private readonly confetti: Mesh[] = [];
  private boats: { mesh: Mesh; waterline: number } | null = null;
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

      const [file, gltf, body, clinkerModule, fronts, foliage] = await Promise.all([
        fetch(`${this.path}.course.json`).then((response) => {
          if (!response.ok) throw new Error(`The course file answered ${response.status}.`);
          return response.json() as Promise<unknown>;
        }),
        // A map's buffers are written with the meshopt codec (tools/blender/meshopt_glb.mjs); one written without
        // it loads as before.
        new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${this.path}.glb`),
        // The riders' body, built in Blender as the map is (ADR 0036).
        RiderBody.load(),
        _world.id === 'amsterdam' ? import('./amsterdam-clinker') : null,
        _world.id === 'amsterdam' ? this.loadCourseTexture('-fronts.webp') : null,
        _world.id === 'amsterdam' ? this.loadCourseTexture('-foliage.webp') : null,
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
      if (this.course.file.id === 'atacama') {
        const { atacamaSalt, SalarMirage } = await import('./atacama-salt');
        if (this.disposed) return false;
        const { material, crust } = atacamaSalt();
        this.mirage = new SalarMirage();
        this.scene.add(this.mirage.mesh);
        this.disposables.push(this.mirage);
        this.salt = material;
        this.disposables.push(crust);
        // The summit is thirty kilometres away across the salt basin at the start.
        this.camera.far = 42000;
        this.camera.updateProjectionMatrix();
      }
      this.canvas = canvas;
      const clinker = clinkerModule?.clinkerTexture('#8a4a36') ?? null;
      if (clinker) {
        clinker.wrapS = clinker.wrapT = RepeatWrapping;
        this.disposables.push(clinker);
      }
      for (const image of [fronts, foliage]) {
        if (image) {
          image.colorSpace = SRGBColorSpace;
          image.anisotropy = 4;
          image.flipY = false;
        }
      }
      if (this.course.file.id === 'arenberg') {
        const { arenbergPave } = await import('./arenberg-pave');
        if (this.disposed) return false;
        this.pave = arenbergPave();
        this.disposables.push(this.pave);
      }
      if (this.course.file.id === 'bonneville') {
        const { saltFlatMaterial } = await import('./bonneville-surface');
        if (this.disposed) return false;
        const surface = saltFlatMaterial(this.course.file.roadHalfWidth);
        this.saltRoad = surface.material;
        this.disposables.push(...surface.textures);
      }
      if (this.course.file.id === 'brickyard') {
        const { speedwayAsphalt } = await import('./speedway-asphalt');
        if (this.disposed) return false;
        this.speedwaySurface = speedwayAsphalt;
      }
      if (this.course.file.id === 'brighton') {
        const { seafrontAsphalt } = await import('./seafront-asphalt');
        if (this.disposed) return false;
        this.seafrontSurface = seafrontAsphalt;
      }
      if (this.course.file.id === 'brooklyn') {
        const { brooklynDeck } = await import('./brooklyn-deck');
        if (this.disposed) return false;
        const surface = brooklynDeck();
        this.deckSurface = surface.material;
        this.disposables.push(...surface.textures);
      }
      if (this.course.file.id === 'calobra') {
        // The original Sa Calobra class's chase lens and unshifted horizon (#921).
        this.camera.clearViewOffset();
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
      }
      this.build(gltf.scene, canvas, clinker, fronts, foliage);
      if (this.course.file.id === 'aguascalientes') {
        const { PursuitBoard } = await import('./pursuit-board');
        if (this.disposed) return false;
        this.timing = new PursuitBoard();
        this.scene.add(this.timing.group);
        this.disposables.push(this.timing);
      }
      if (this.course.file.id === 'angliru') {
        const { AngliruRoadside } = await import('./angliru-roadside');
        if (this.disposed) return false;
        this.angliruRoadside = new AngliruRoadside(this.course);
        this.scene.add(this.angliruRoadside.root);
      }
      if (this.course.file.id === 'bonneville') {
        const { SpeedWeek } = await import('./speed-week');
        if (this.disposed) return false;
        this.speedWeek = new SpeedWeek(this.course);
        this.scene.add(this.speedWeek.root);
        this.disposables.push(this.speedWeek);
      }
      if (this.course.file.id === 'brickyard') {
        const { SpeedwayFlags } = await import('./speedway-flags');
        if (this.disposed) return false;
        this.speedway = new SpeedwayFlags(this.course);
        this.scene.add(this.speedway.root);
        this.disposables.push(this.speedway);
      }
      if (this.course.file.id === 'brighton') {
        const { BrightonParade } = await import('./brighton-parade');
        if (this.disposed) return false;
        this.parade = new BrightonParade(this.course);
        this.scene.add(this.parade.root);
        this.disposables.push(this.parade);
      }
      if (this.course.file.id === 'brooklyn') {
        const { BrooklynCommute } = await import('./brooklyn-commute');
        if (this.disposed) return false;
        this.commute = new BrooklynCommute(this.course);
        this.scene.add(this.commute.root);
        this.disposables.push(this.commute);
      }
      if (this.course.file.id === 'bund') {
        const { BundCruise } = await import('./bund-cruise');
        if (this.disposed) return false;
        this.cruise = new BundCruise(this.course);
        this.scene.add(this.cruise.root);
        this.disposables.push(this.cruise);
      }
      if (this.course.file.id === 'calobra') {
        const { CalobraCamp } = await import('./calobra-camp');
        if (this.disposed) return false;
        this.camp = new CalobraCamp(this.course, this.kit!, this.riderBatch!);
        this.scene.add(this.camp.root);
        this.disposables.push(this.camp);
      }

      // The map's programs compile while it loads, and its first picture is drawn before the ride's first frame.
      if (_world.id === 'angels') {
        for (const [index, colour] of [0x4a7990, 0xac5449, 0x537149].entries()) {
          const cyclist = this.rider('girona-club-' + index, colour);
          if (cyclist) this.trainingGroup.push(cyclist);
        }
      }
      if (this.course.file.id === 'antwerp') {
        const { AntwerpWind } = await import('./antwerp-wind');
        if (this.disposed) return false;
        this.portWind = new AntwerpWind(this.course);
        this.scene.add(this.portWind.root);
        for (const [index, colour] of [0x27698a, 0xc76437, 0xeac765, 0x4d7c65].entries()) {
          const rider = this.rider('scheldt-echelon-' + index, colour);
          if (rider) this.echelon.push(rider);
        }
      }
      if (this.path.endsWith('/artmuseum')) {
        const [{ ArtMuseumJoggers }, { ArtMuseumFlags }] = await Promise.all([
          import('./artmuseum-joggers'),
          import('./artmuseum-flags'),
        ]);
        if (this.disposed) return false;
        this.flags = new ArtMuseumFlags();
        this.scene.add(this.flags.mesh);
        this.disposables.push(this.flags);
        this.joggers = new ArtMuseumJoggers();
        this.scene.add(this.joggers.mesh);
        this.disposables.push(this.joggers);
      }
      if (this.course.file.id === 'atacama') {
        const { AtacamaWildlife } = await import('./atacama-wildlife');
        if (this.disposed) return false;
        this.wildlife = new AtacamaWildlife();
        this.scene.add(this.wildlife.mesh);
        this.disposables.push(this.wildlife);
      }
      if (this.course.file.id === 'atlanticroad') {
        const { AtlanticSwell } = await import('./atlantic-swell');
        if (this.disposed) return false;
        this.swell = new AtlanticSwell(this.course);
        this.scene.add(this.swell.group);
        this.disposables.push(this.swell);
      }
      if (this.course.file.id === 'aubisque') {
        const [{ AubisqueLivestock }, { AubisqueWeather }] = await Promise.all([
          import('./aubisque-livestock'),
          import('./aubisque-weather'),
        ]);
        if (this.disposed) return false;
        this.livestock = new AubisqueLivestock(this.course);
        this.weather = new AubisqueWeather(this.course, this.sun);
        this.scene.add(this.weather.root, this.livestock.mesh);
        this.disposables.push(this.livestock, this.weather);
      }
      if (this.course.file.id === 'austin') {
        const { AustinPerformers } = await import('./austin-performers');
        if (this.disposed) return false;
        this.performers = new AustinPerformers(this.course);
        this.scene.add(this.performers.mesh);
        this.disposables.push(this.performers);
      }
      if (this.course.file.id === 'bathsheba') {
        const { BathshebaReef } = await import('./bathsheba-reef');
        if (this.disposed) return false;
        this.reef = new BathshebaReef(this.course);
        this.scene.add(this.reef.group);
        this.disposables.push(this.reef);
      }
      if (this.course.file.id === 'bayofislands') {
        const { BayOfIslandsBoats } = await import('./bay-of-islands-boats');
        if (this.disposed) return false;
        this.boats = new BayOfIslandsBoats(this.course);
        this.scene.add(this.boats.group);
        this.disposables.push(this.boats);
      }
      if (this.course.file.id === 'beachroad') {
        const { BeachRoadBunch } = await import('./beach-road-bunch');
        if (this.disposed) return false;
        this.bunch = new BeachRoadBunch(this.course, this.kit!, this.riderBatch!);
        this.scene.add(this.bunch.group);
        this.disposables.push(this.bunch);
      }
      if (this.course.file.id === 'bealach') {
        const [{ HighlandLivestock }, { HighlandWeather }] = await Promise.all([
          import('./bealach-livestock'),
          import('./bealach-weather'),
        ]);
        if (this.disposed) return false;
        this.livestock = new HighlandLivestock(this.course);
        this.weather = new HighlandWeather(this.course, this.sun);
        this.scene.add(this.weather.root, this.livestock.mesh);
        this.disposables.push(this.livestock, this.weather);
      }
      if (this.course.file.id === 'bigsur') {
        const { BigSurCoast } = await import('./bigsur-coast');
        if (this.disposed) return false;
        this.coast = new BigSurCoast(this.course);
        this.scene.add(this.coast.group);
        this.disposables.push(this.coast);
      }
      if (this.course.file.id === 'blackpool') {
        const { BlackpoolTrams } = await import('./blackpool-trams');
        if (this.disposed) return false;
        this.trams = new BlackpoolTrams(this.course);
        this.scene.add(this.trams.group);
        this.disposables.push(this.trams);
      }
      if (this.course.file.id === 'bluemountains') {
        const { BlueMountainsYard } = await import('./blue-mountains-yard');
        if (this.disposed) return false;
        this.yard = new BlueMountainsYard(this.course);
        this.scene.add(this.yard.group);
        this.disposables.push(this.yard);
      }
      if (this.course.file.id === 'blueridge') {
        const { MabryMill } = await import('./mabry-mill');
        if (this.disposed) return false;
        this.mill = new MabryMill(this.course);
        this.scene.add(this.mill.group);
        this.disposables.push(this.mill);
      }
      if (this.course.file.id === 'bondi') {
        const { BondiSurf } = await import('./bondi-surf');
        if (this.disposed) return false;
        this.surf = new BondiSurf(this.course);
        this.scene.add(this.surf.group);
        this.disposables.push(this.surf);
      }
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
    if (this.pinned) this.drawn.metres = metres;
    if (frame.riders && !this.fieldMade) this.makeField(frame.riders, metres);
    this.lampShadows?.begin();
    const standing = this.ride(you, metres, 0);
    // Every wheel on the road turns with the rider's: the riders keep much the same pace.
    this.kit?.roll(metres);
    you.pose(frame.reducedMotion ? 0 : frame.crank, standing);
    this.placeRiders(frame, metres);
    this.timing?.update(metres, frame.time);
    if (this.trainingGroup.length) this.placeTrainingGroup(frame, metres);
    if (this.echelon.length) this.placeEchelon(frame, metres);
    this.camp?.update(frame.time, metres, frame.reducedMotion);
    this.lampShadows?.end();
    this.bunch?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.riderBatch?.follow();
    if (this.evening) {
      const progress = Math.max(0, Math.min(1, (metres - 19500) / 7900));
      const t = progress * progress * (3 - 2 * progress);
      this.evening.value = t;
      this.sun.color.setRGB(0.982 - 0.05 * t, 0.791 - 0.39 * t, 0.527 - 0.33 * t);
      if (this.scene.fog instanceof Fog)
        this.scene.fog.color.setRGB(0.402 + 0.43 * t, 0.604 - 0.27 * t, 0.658 - 0.43 * t);
    }
    if (this.evening) {
      const progress = Math.max(0, Math.min(1, (metres - 14300) / 5050));
      const t = progress * progress * (3 - 2 * progress);
      this.evening.value = t;
      this.sun.color.setRGB(0.982 - 0.05 * t, 0.791 - 0.39 * t, 0.527 - 0.33 * t);
      if (this.scene.fog instanceof Fog)
        this.scene.fog.color.setRGB(0.402 + 0.43 * t, 0.604 - 0.27 * t, 0.658 - 0.43 * t);
    }
    this.aim(metres, frame.reducedMotion);
    if (this.pave && !frame.reducedMotion) this.camera.position.y += this.pave.wheelRise(metres);
    this.mirage?.update(
      you.group.position.x,
      you.group.position.y,
      frame.reducedMotion ? 0 : frame.time,
    );
    this.wildlife?.update(you.group.position.x, frame.reducedMotion ? 0 : frame.time);
    this.swell?.update(metres, frame.reducedMotion ? 0 : frame.time, this.camera.quaternion);
    this.weather?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.livestock?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.performers?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.reef?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.boats?.update(metres, frame.reducedMotion ? 0 : frame.time);

    this.weather?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.livestock?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.coast?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.trams?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.yard?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.mill?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.surf?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.speedWeek?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.speedway?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.parade?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.commute?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.cruise?.update(frame.reducedMotion ? 0 : frame.time);
    // Chosen every few frames, and at once when the camera has jumped (a ride resumed elsewhere on the road).
    const leapt = this.camera.position.distanceToSquared(this.chosenAt) > 60 * 60;
    if (this.frames++ % CHUNK_SWEEP === 0 || leapt) this.choose();
    // The start lights: red until the clock starts, green from then, and not drawn once they are far behind.
    const lights = metres < START_LIGHTS;
    if (this.startRed) this.startRed.visible = lights && frame.time <= 0;
    if (this.startGreen) this.startGreen.visible = lights && frame.time > 0;
    if (this.rain) this.rain.mesh.visible = !frame.reducedMotion;
    if (this.canalTraffic.length)
      this.placeCanalTraffic(metres, frame.reducedMotion ? 0 : frame.time);
    if (this.templeTraffic.length)
      this.placeTempleTraffic(metres, frame.reducedMotion ? 0 : frame.time);
    if (this.angliruRoadside) {
      this.drawn.asturiasFlagAngle = this.angliruRoadside.draw(
        metres,
        frame.reducedMotion ? 0 : frame.time,
      );
    }
    if (this.convoy.length) this.placeConvoy(metres, frame.reducedMotion ? 0 : frame.time);
    this.flags?.update(you.group.position.x, frame.reducedMotion ? 0 : frame.time);
    if (this.joggers) {
      this.joggers.mesh.visible = Math.abs(you.group.position.x + 39) < 200;
      if (this.joggers.mesh.visible) this.joggers.update(frame.reducedMotion ? 0 : frame.time);
    }
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
    this.angliruRoadside?.dispose();
    this.angliruRoadside = null;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.map?.traverse((part) => {
      const mesh = part as Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    this.map = null;
    // The chunks were taken out of the map: their geometry is released here.
    for (const { mesh } of this.chunks) mesh.geometry.dispose();
    this.near.clear();
    this.chunks.length = 0;
    this.boats = null;
    this.confetti.length = 0;
    this.timing = null;
    this.funivia = null;
    this.glider = null;
    this.smoke = null;
    for (const { holder } of this.canalTraffic) this.scene.remove(holder);
    this.canalTraffic.length = 0;
    for (const { holder } of this.templeTraffic) this.scene.remove(holder);
    this.templeTraffic.length = 0;
    for (const { holder } of this.convoy) this.scene.remove(holder);
    this.convoy.length = 0;
    this.pave = null;
    this.joggers = null;
    this.flags = null;
    this.wildlife = null;
    this.salt = null;
    this.mirage = null;
    this.swell = null;
    this.livestock = null;
    this.weather = null;
    this.performers = null;
    this.reef = null;
    this.boats = null;
    this.evening = undefined;
    this.bunch = null;
    this.evening = undefined;
    this.livestock = null;
    this.weather = null;
    this.coast = null;
    this.trams = null;
    this.yard = null;
    this.mill = null;
    this.surf = null;
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.trainingGroup.length = 0;
    this.portWind?.dispose();
    this.portWind = null;
    this.echelon.length = 0;
    this.riders.clear();
    this.lamplit.clear();
    this.lampGlow = null;
    this.sunGlow = null;
    this.speedwaySurface = null;
    this.speedway = null;
    this.seafrontSurface = null;
    this.parade = null;
    this.commute = null;
    this.deckSurface = null;
    this.cruise = null;
    this.groundEye = null;
    this.speedWeek = null;
    this.saltRoad = null;
    this.riderBatch = null;
    this.camp = null;
    this.rain = null;
    this.shadows.clear();
    this.casting.clear();
    this.lampShadows = null;
    this.blob = null;
    this.renderer?.dispose();
    this.renderer = null;
  }

  private loadCourseTexture(suffix: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const texture = new TextureLoader().load(this.path + suffix, resolve, undefined, reject);
      this.disposables.push(texture);
    });
  }

  private build(
    map: Object3D,
    canvas: HTMLCanvasElement,
    clinker: Texture | null,
    fronts: Texture | null,
    foliage: Texture | null,
  ): void {
    // The course's world: its sky, its haze and its lights (a course that names none is Ibiza's sunset).
    const look = courseLook(this.course!.file);
    if (this.course!.file.id === 'bayofislands') this.evening = eveningUniform();
    if (this.course!.file.id === 'beachroad') this.evening = eveningUniform();
    const fogRange = this.course!.file.id === 'calobra' ? ([2500, 16000] as const) : FOG;
    this.scene.fog = new Fog(look.haze, fogRange[0], fogRange[1]);
    this.scene.background = new Color(look.haze);
    this.sun.color.setHex(look.light.colour);
    this.sun.intensity = look.light.intensity;
    // The map comes as a few groups of meshes, coloured by vertex and cut into chunks along the road (ADR 0034).
    // Each group is drawn with one cheap material: no texture, no PBR, shaded flat.
    const lit = { vertexColors: true, flatShading: true } as const;
    const glow = { vertexColors: true, toneMapped: false } as const;
    const materials: Record<string, Material> = {
      Land: this.salt ?? new MeshLambertMaterial(lit),
      Solid: new MeshLambertMaterial(lit),
      Leaves: new MeshLambertMaterial({ ...lit, side: DoubleSide }),
      Sea: new MeshLambertMaterial(lit),
      Conillera: new MeshLambertMaterial({ ...lit, fog: false }),
      Peaks: new MeshLambertMaterial({ ...lit, fog: false }),
      Funivia: new MeshLambertMaterial({ ...lit, fog: false }),
      Glider: new MeshLambertMaterial({ ...lit, fog: false }),
      Glow: new MeshBasicMaterial({ ...glow, fog: this.course!.file.id !== 'bund' }),
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
    if (fronts && foliage) {
      materials['Facades'] = new MeshLambertMaterial({ map: fronts, side: DoubleSide });
      materials['Dapple'] = new MeshBasicMaterial({
        map: foliage,
        color: 0x253322,
        side: DoubleSide,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      materials['Elms'] = new MeshLambertMaterial({
        map: foliage,
        side: DoubleSide,
        alphaTest: 0.45,
      });
    }
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
    if (this.pave) {
      materials['Pave'] = this.pave.material;
      materials['Foliage'] = this.pave.foliage;
    }
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
      clinker,
    );
    const pavement = this.saltRoad ?? this.speedwaySurface?.(detail) ?? this.seafrontSurface?.(detail) ?? this.deckSurface;
    materials['Ground'] = pavement ?? ground.material;
    if (pavement) this.disposables.push(ground.material);
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
        this.evening,
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
      if (group === 'Smoke' && !materials[group]) {
        const mist = new MeshBasicMaterial({
          ...glow,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          side: DoubleSide,
        });
        materials[group] = mist;
        this.disposables.push(mist);
      }
      const useLandMaterial = group === 'Boats' || group === 'TourBoat' || group === 'Commuter' || group === 'TukTuk' || group === 'TouringBike' || group === 'Commissaire' || group === 'TeamCar';
      const material = materials[useLandMaterial ? 'Land' : group];
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
      if (group === 'Ground' || group === 'Pave') mesh.geometry.computeVertexNormals();
      // The map is set once and never moves: its matrices are worked out here, not every frame.
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      if (group === 'Boats') this.boats = { mesh, waterline: mesh.position.y };
      if (group === 'Smoke') this.smoke = { mesh, x: mesh.position.x, y: mesh.position.y };
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
    for (const name of ['TourBoat', 'Commuter']) {
      const mesh = map.getObjectByName(name) as Mesh | undefined;
      if (!mesh?.isMesh) continue;
      mesh.updateMatrixWorld(true);
      mesh.matrix.copy(mesh.matrixWorld);
      this.disposables.push(mesh.geometry);
      for (const order of [0, 1]) {
        const holder = new Group();
        holder.add(order === 0 ? mesh : mesh.clone());
        this.scene.add(holder);
        this.canalTraffic.push({ holder, boat: name === 'TourBoat', order });
      }
    }
    for (const name of ['TukTuk', 'TouringBike']) {
      const vehicle = map.getObjectByName(name) as Mesh | undefined;
      if (!vehicle?.isMesh) continue;
      vehicle.updateMatrixWorld(true);
      vehicle.matrix.copy(vehicle.matrixWorld);
      const holder = new Group();
      holder.add(vehicle);
      this.scene.add(holder);
      this.templeTraffic.push({ holder, bike: name === 'TouringBike' });
      this.disposables.push(vehicle.geometry);
    }
    for (const name of ['Commissaire', 'TeamCar']) {
      const mesh = map.getObjectByName(name) as Mesh | undefined;
      if (!mesh?.isMesh) continue;
      mesh.updateMatrixWorld(true);
      mesh.matrix.copy(mesh.matrixWorld);
      const holder = new Group();
      holder.add(mesh);
      if (name === 'Commissaire' && this.pave) holder.add(this.pave.trail);
      this.scene.add(holder);
      this.convoy.push({ holder, moto: name === 'Commissaire' });
      this.disposables.push(mesh.geometry);
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
      const sky = skyMaterial(
        look,
        this.course!.file.sun,
        detail,
        this.course!.file.id === 'atlanticroad',
        this.evening,
        this.evening,
      );
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
      this.course!.file.id === 'aguascalientes',
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
      at.bank ?? bendLean(at.heading, ahead, LEAN_AHEAD),
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
  private aim(metres: number, reducedMotion = true): void {
    const course = this.course!;
    // Close in on the rider at the start line and at the finish line.
    const near = Math.max(
      1 - Math.abs(metres) / CLOSE_START,
      1 - Math.abs(metres - course.length) / CLOSE_FINISH,
      0,
    );
    const close = near * near * (3 - 2 * near);
    const calobra = course.file.id === 'calobra';
    const behind = calobra ? 5.5 : CAMERA_BACK + (CLOSE_BACK - CAMERA_BACK) * close;
    const up = calobra ? 2.1 : CAMERA_UP + (CLOSE_UP - CAMERA_UP) * close;
    const sway = calobra && !reducedMotion ? Math.sin(metres / 3) * 0.04 : 0;
    const back = course.place(metres - behind, sway, this.here);
    this.camera.position.set(back.x, back.y + up, back.z);
    this.groundEye?.at(metres - behind, 0, up);
    const ahead = course.place(metres + (calobra ? 24 : LOOK_AHEAD), 0, this.there);
    this.camera.lookAt(ahead.x, ahead.y + (calobra ? 1.2 : LOOK_UP), ahead.z);
    // A restrained chase-camera roll lets the rider read the banking and still see the opposite straight.
    if (back.bank) this.camera.rotateZ(back.bank * 0.32);
    this.sky?.position.copy(this.camera.position);
    const [x, , z] = course.file.sun;
    this.sun.target.position.set(ahead.x, ahead.y, ahead.z);
    this.sun.position.set(
      ahead.x + x * 70,
      ahead.y + 34 - 25 * (this.evening?.value ?? 0),
      ahead.z + z * 70,
    );
    this.sun.target.updateMatrixWorld();
  }

  private placeTrainingGroup(frame: SceneFrame, metres: number): void {
    const elapsed = frame.reducedMotion ? 0 : frame.time;
    const lead = 32 + elapsed * 5.2;
    // Reuse three bodies. Switch to the next group only when both groups are out of sight.
    const nearest = lead + Math.round((metres - lead) / 760) * 760;
    this.drawn.trainingRiderX = null;
    for (const [index, cyclist] of this.trainingGroup.entries()) {
      const at = nearest - index * 2.7;
      cyclist.group.visible = at >= 0 && at < this.course!.length && Math.abs(at - metres) < 150;
      if (!cyclist.group.visible) continue;
      const standing = this.ride(cyclist, at, index % 2 === 0 ? 1.3 : 2.2);
      cyclist.pose(elapsed * 8.9 + index, standing);
      if (index === 0) this.drawn.trainingRiderX = cyclist.group.position.x;
    }
  }

  private placeEchelon(frame: SceneFrame, metres: number): void {
    const time = frame.reducedMotion ? 0 : frame.time;
    this.portWind?.draw(metres, time);
    const lead = 28 + time * 8.4;
    const nearest = lead + Math.round((metres - lead) / 680) * 680;
    this.drawn.echelonLeaderX = null;
    for (const [index, cyclist] of this.echelon.entries()) {
      const along = nearest - index * 2.65;
      cyclist.group.visible =
        along >= 0 && along < this.course!.length && Math.abs(along - metres) < 155;
      const shadow = this.shadows.get(cyclist);
      if (shadow) shadow.visible = cyclist.group.visible;
      if (!cyclist.group.visible) continue;
      // Shelter from the Scheldt crosswind on the wheel ahead, diagonally across the quay.
      const standing = this.ride(cyclist, along, -1.32 + index * 0.86);
      cyclist.pose(time * 9.75 + index * 1.3, standing);
      if (index === 0) this.drawn.echelonLeaderX = cyclist.group.position.x;
    }
  }

  /** The race's other riders at their places, each on a line of their own (L2-064 AC3). */
  private placeRiders(frame: SceneFrame, metres: number): void {
    for (const rider of this.riders.values()) {
      rider.group.visible = false;
      const shadow = this.shadows.get(rider);
      if (shadow) shadow.visible = false;
    }
    if (!frame.riders) return;
    // A pursuit starts opposite the clocked opponent. Its replay still advances by the
    // recorded distance, including when a rider gains a full lap or makes the catch.
    if (this.timing && frame.riders.length === 1 && frame.riders[0]?.jersey === 'ghost') {
      const ghost = this.rider('ghost');
      if (ghost) {
        const lap = 250;
        const replay = metres + frame.riders[0].metres + lap / 2;
        const onOval = ((replay % lap) + lap) % lap;
        ghost.group.visible = true;
        this.ride(ghost, onOval, 0.45);
        ghost.pose(frame.reducedMotion ? 0 : frame.crank);
      }
      return;
    }
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
  private rider(jersey: string, clubColour?: number): Cyclist | null {
    const made = this.riders.get(jersey);
    if (made) return made;
    if (!this.kit || !this.canvas) return null;
    const colour =
      clubColour === undefined ? jerseyColour(this.canvas, jersey) : new Color(clubColour);
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
    if (this.boats) {
      const { mesh, waterline } = this.boats;
      mesh.position.y = waterline + 0.17 * Math.sin(time * 1.18) + 0.045 * Math.sin(time * 2.09);
      mesh.updateMatrix();
    }
    if (this.smoke) {
      const { mesh, x, y } = this.smoke;
      mesh.position.x = x + 0.55 * Math.sin(time * 0.75);
      mesh.position.y = y + 0.34 * Math.sin(time * 1.1);
      mesh.updateMatrix();
    }
    this.rain?.at(time);
    for (const confetti of this.confetti) {
      confetti.position.y = 0.45 * Math.sin(time * 1.3);
      confetti.rotation.y = 0.012 * Math.sin(time * 0.9);
      confetti.updateMatrix();
    }
    this.placeFunivia(time, false);
    this.placeGlider(time, false);
  }

  private placeCanalTraffic(rider: number, time: number): void {
    const course = this.course!;
    for (const { holder, boat, order } of this.canalTraffic) {
      const spacing = boat ? 400 : 96;
      const phase = (boat ? 78 : 18) + time * (boat ? 2.1 : 4.1);
      const metres = phase + (Math.floor((rider - phase) / spacing) + order) * spacing;
      holder.visible = metres >= 0 && metres <= course.end;
      if (!holder.visible) continue;
      const at = course.place(metres, boat ? -20 : -2.1, this.there);
      holder.position.set(at.x, boat ? -1.65 : at.y + 0.04, at.z);
      holder.rotation.y = at.heading;
      if (boat && this.pinned) this.drawn.tourBoatX = holder.position.x;
    }
  }

  private placeTempleTraffic(rider: number, time: number): void {
    const course = this.course!;
    for (const { holder, bike } of this.templeTraffic) {
      const spacing = bike ? 480 : 830;
      const phase = (bike ? 18 : 36) + time * (bike ? 4.4 : 6.5);
      const metres = phase + Math.round((rider - phase) / spacing) * spacing;
      holder.visible = metres >= 0 && metres < course.length && Math.abs(metres - rider) < 180;
      if (!holder.visible) continue;
      const at = course.place(metres, bike ? 2.65 : 1.65, this.there);
      holder.position.set(at.x, at.y + 0.025, at.z);
      holder.rotation.set(at.pitch, at.heading, 0, 'YXZ');
      if (!bike && this.pinned) this.drawn.tukTukX = holder.position.x;
    }
  }

  private placeConvoy(rider: number, time: number): void {
    const lead = 33 + 7.1 * time;
    const nearest = lead + Math.round((rider - lead) / 610) * 610;
    this.drawn.commissaireX = null;
    for (const { holder, moto } of this.convoy) {
      const d = nearest - (moto ? 0 : 18);
      holder.visible = d >= 0 && d < this.course!.length && Math.abs(d - rider) < 170;
      if (!holder.visible) continue;
      // A vehicle being passed moves out onto the muddy shoulder before it reaches the rider.
      const passing = Math.max(0, 1 - Math.abs(d - rider) / 23);
      const lane = (moto ? -1.22 : -1.05) - passing * (moto ? 0.75 : 1.43);
      const at = this.course!.place(d, lane, this.there);
      holder.position.set(at.x, at.y + 0.035, at.z);
      holder.rotation.set(at.pitch, at.heading, 0, 'YXZ');
      if (moto) {
        this.drawn.commissaireX = holder.position.x;
        this.pave?.updateTrail(d, time, time > 0);
      }
    }
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
    const ghost = this.riders.get('ghost');
    drawn.ghostSeparationMetres =
      this.you && ghost?.group.visible
        ? this.you.group.position.distanceTo(ghost.group.position)
        : 0;
    drawn.boatHeight = this.boats?.mesh.position.y ?? null;
    drawn.flagDisplacement = this.flags?.displacement ?? null;
    drawn.joggerHeight = this.joggers?.height ?? null;
    drawn.vicunaHeadHeight = this.wildlife?.headHeight ?? null;
    drawn.flamingoBillHeight = this.wildlife?.billHeight ?? null;
    drawn.sprayHeight = this.swell?.height ?? null;
    drawn.cirqueSun = this.weather ? this.sun.intensity : null;
    drawn.horseLane = this.livestock?.horseLane ?? null;
    drawn.guitarHand = this.performers?.guitarHand ?? null;
    drawn.reefCrest = this.reef?.crest ?? null;
    drawn.eveningLight = this.evening?.value ?? null;
    drawn.ferryX = this.boats?.ferryX ?? null;
    drawn.eveningLight = this.evening?.value ?? null;
    drawn.clubLane = this.bunch?.clubLane ?? null;
    drawn.highlandSun = this.weather ? this.sun.intensity : null;
    drawn.sheepLane = this.livestock?.sheepLane ?? null;
    drawn.fallingWater = this.coast?.fallHeight ?? null;
    drawn.surfCrest = this.coast?.crest ?? null;
    drawn.illumination = this.trams?.illumination ?? null;
    drawn.tramMetres = this.trams?.nearestMetres ?? null;
    drawn.mistPosition = this.yard?.mistPosition ?? null;
    drawn.speakerDepth = this.yard?.speakerDepth ?? null;
    drawn.valleyMist = this.mill?.valleyMist ?? null;
    drawn.paddleHeight = this.mill?.paddleHeight ?? null;
    drawn.walkerStride = this.surf?.walkerStride ?? null;
    drawn.foamAdvance = this.surf?.foamAdvance ?? null;
    drawn.pushCarPosition = this.speedWeek?.pushCar.position.x;
    drawn.mirageHeight = this.speedWeek?.mirage.scale.y;
    drawn.flagTip = this.speedway?.flagTip;
    drawn.balloonHeight = this.speedway?.balloonHeight;
    drawn.bannerTip = this.parade?.bannerTip;
    drawn.floatPosition = this.parade?.floatPosition;
    drawn.cabPosition = this.commute?.cabPosition;
    drawn.ferryPosition = this.commute?.ferryPosition;
    drawn.boatPosition = this.cruise?.boatPosition;
    drawn.touristPosition = this.cruise?.touristPosition;
    drawn.packDistance = this.camp?.packDistance;
    drawn.coachDistance = this.camp?.coachDistance;
    drawn.tier = this.tier;
    drawn.backend = this.backend;
    drawn.drawCalls = renderer.info.render.drawCalls;
    drawn.triangles = renderer.info.render.triangles;
    drawn.smokeHeight = this.smoke?.mesh.position.y ?? null;
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
