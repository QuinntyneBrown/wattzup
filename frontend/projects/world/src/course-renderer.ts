import type { cornwallVisitors } from './cornwall-visitors';
import type { CornwallHarbour } from './cornwall-harbour';
import type { cypressForest } from './cypress-forest';
import type { CypressLift } from './cypress-lift';
import type { dalesVerges } from './dales-verges';
import type { DalesSheep } from './dales-sheep';
import type { DalesFlags } from './dales-flags';
import type { DaytonaBoardwalk } from './daytona-boardwalk';
import type { DaytonaTideLine } from './daytona-tide-line';
import type { badwaterGeology } from './badwater-geology';
import type { DeathValleyStreet } from './world-deathvalley';
import type { diwaliPromenade } from './diwali-promenade';
import type { DiwaliFestival } from './diwali-festival';
import type { gardenaForest } from './gardena-forest';
import type { marinaPromenade } from './marina-promenade';
import type { MarinaBoats } from './marina-boats';
import type { fringeStreet } from './fringe-street';
import type { FringePerformers } from './fringe-performers';
import type { engadinShore } from './engadin-shore';
import type { engadinLakes } from './engadin-lakes';
import type { etnaAscent } from './etna-ascent';
import type { fenland } from './fenland';
import type { broadwayEscarpment } from './broadway-escarpment';
import type { subaruLine } from './subaru-line';
import type { furkaPass } from './furka-pass';
import type { galibierPass } from './galibier-pass';
import type { gardenaPass } from './gardena-pass';
import type { ghentArena } from './ghent-arena';
import type { gizaPanorama } from './giza-panorama';
import type { glasgowCircuit } from './glasgow-circuit';
import type { glastonburyFestival } from './glastonbury-festival';
import type { goldenGatePark } from './golden-gate-park';
import type { desertViewDrive } from './desert-view-drive';
// A course drawn with Three.js (ADR 0034, L2-166): the map built in Blender from the class it is modelled after,
// loaded as glTF, with the cyclist kit's riders on its road and a chase camera behind the rider. A class's clock
// places the rider, so each hill arrives with the resistance it was laid from; a race's riders are placed by the
// metres they have ridden. `main`'s scenes are drawn by
// world-renderer.ts; map-renderer.ts picks between the two.
import type { blossomFestival } from './blossom-festival';
import type { ChicagoRailway } from './chicago-railway';
import type { chichenPlaza } from './chichen-plaza';
import type { ConeyBoardwalk } from './coney-boardwalk';
import type { copacabanaPromenade } from './copacabana-promenade';
import type { CopacabanaBeach } from './copacabana-beach';
import type { copenhagenStreet } from './copenhagen-street';
import type { CopenhagenCommuters } from './copenhagen-commuters';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import {
  AdditiveBlending,
  AgXToneMapping,
  type CanvasTexture,
  Box3,
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
import type { DocklandsQuay } from './docklands-quay';
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
import type { CampolongoLifts } from './campolongo-lifts';
import type { CabotWildlife } from './cabot-wildlife';
import type { ParkTraffic } from './park-traffic';
import type { ChampsParade } from './champs-parade';
import { RiderBatch } from './rider-batch';
import { RiderBody } from './rider-body';
import { bendLean } from './rider-lean';
import { type ShadowShape, shadowLength, shadowShape } from './rider-shadow-shape';
import { outOfTheSaddle } from './rider-stance';
import { endShadow, sideShadow } from './shadow-silhouette';
import type { LigurianCoast } from './ligurian-coast';
import type { HeadlandSurf } from './headland-surf';
import type { comoPromenade } from './como-promenade';
import type { ComoFerries } from './como-ferries';
import type { ComunaCrews } from './comuna-crews';
import type { comunaStreets } from './comuna-streets';
import { SunGlow } from './sun-glow';
import { vertexFinish } from './rider-finish';
import { RiderShadows } from './rider-shadows';
import { wallMaterial } from './wall-material';
import { waterMaterial } from './water-material';
import { windowMaterial } from './window-material';
import type { southCoast } from './south-coast';
import type { ManxMountain } from './manx-mountain';
import type { JunkanooRush } from './junkanoo-rush';
import type { KilaueaVents } from './kilauea-vents';
import type { KilaueaCaldera } from './kilauea-caldera';
import type { BroadwayRace } from './broadway-race';
import type { KonaTriathlon } from './kona-triathlon';
import type { KoppenbergBanks } from './koppenberg-banks';
import type { KwaremontVillage } from './kwaremont-village';
import type { KyotoHanami } from './kyoto-hanami';
import type { ChicagoLakefront } from './chicago-lakefront';
import type { LakeLouise } from './lake-louise';
import type { AltoDeLetras } from './alto-de-letras';
import type { LisbonHills } from './lisbon-hills';
import type { LoireRiver } from './loire-river';
import type { UrubambaGorge } from './urubamba-gorge';
import type { BayfrontNight } from './bayfront-night';
import type { JemaaSquare } from './jemaa-square';
import type { StCharlesParade } from './st-charles-parade';
import type { MaunaKeaSummit } from './mauna-kea-summit';
import type { MerceFestival } from './merce-festival';
import type { OceanDrive } from './ocean-drive';
import type { MoabTrail } from './moab-trail';
import type { MonacoHarbour } from './monaco-harbour';
import type { MontmartreSquare } from './montmartre-square';
import type { MontrealFestival } from './montreal-festival';
import type { ItenTraining } from './iten-training';
import type { independencePass } from './independence-pass';
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
import type { JaipurFestival } from './jaipur-festival';
import type { JouvertBands } from './jouvert-bands';
import type { MojaveClimbers } from './mojave-climbers';
import type { BlueMountainsYard } from './blue-mountains-yard';
import type { MabryMill } from './mabry-mill';
import type { BondiSurf } from './bondi-surf';
import type { northFace } from './north-face';
import type { shipwreckCoast } from './shipwreck-coast';
import type { haleakalaSummit } from './haleakala-summit';
import type { hanRiver } from './han-river';
import type { hardknottFells } from './hardknott-fells';
import type { malecon } from './malecon';
import type { blackCanyon } from './black-canyon';
import type { sunsetStrip } from './sunset-strip';
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
  NorthFace: 5200,
  SouthernOcean: 4400,
  PortLimestone: 2300,
  Apostle: 2300,
  LondonArch: 2300,
  HkFlank: 1200,
  BanpoJets: 1050,
  HanReflections: 900,
  HanCyclists: 200,
  FellGround: 1850,
  HerdwickHead: 750,
  Portales: 650,
  OriginalElevations: 650,
  WallSpray: 420,
  SaltPuddles: 160,
  MaleconStone: 950,
  BlackCanyon: 2200,
  CanyonCrags: 750,
  MeadWater: 2700,
  RoadShimmer: 235,
  StripDancers: 150,
  StripBeams: 430,
  StripFestoons: 175,
  StripFleet: 1400,
  CoveFoam: 370,
  StripCloth: 170,
  IcelandLand: 2400,
  Basalt: 2500,
  Glacier: 3200,
  Falls: 720,
  GlacialWater: 1700,
  Icebergs: 900,
  Grazers: 330,
  AspenGrove: 690,
  RoaringFork: 580,
  SawatchGround: 2300,
  SawatchRock: 4300,
  PassSnow: 850,
  CabinLogs: 770,
  DivideSign: 420,
  TwinLakes: 4500,
  Land: 950,
  Pave: 180,
  Foliage: 110,
  CanyonStrata: 5800,
  GrandviewTemple: 5800,
  ColoradoBend: 13900,
  FarRim: 13800,
  Watchtower: 950,
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
  private boardwalk: ConeyBoardwalk | null = null;
  private copacabanaPromenade: Awaited<ReturnType<typeof copacabanaPromenade>> | null = null;
  private copacabana: CopacabanaBeach | null = null;
  private danishStreet: Awaited<ReturnType<typeof copenhagenStreet>> | null = null;
  private commuters: CopenhagenCommuters | null = null;
  backend: Backend = 'webgl2';
  private icelandCoast: ReturnType<typeof southCoast> | null = null;
  private divide: Awaited<ReturnType<typeof independencePass>> | null = null;
  private mountain: ManxMountain | null = null;
  private rush: JunkanooRush | null = null;
  private vents: KilaueaVents | null = null;
  private caldera: KilaueaCaldera | null = null;
  private broadway: BroadwayRace | null = null;
  private queenK: KonaTriathlon | null = null;
  private cobbledBanks: KoppenbergBanks | null = null;
  private kwaremontVillage: KwaremontVillage | null = null;
  private hanami: KyotoHanami | null = null;
  private chicagoShore: ChicagoLakefront | null = null;
  private lakeLouise: LakeLouise | null = null;
  private letras: AltoDeLetras | null = null;
  private lisbonHills: LisbonHills | null = null;
  private loireRiver: LoireRiver | null = null;
  private urubambaGorge: UrubambaGorge | null = null;
  private bayfrontNight: BayfrontNight | null = null;
  private jemaaSquare: JemaaSquare | null = null;
  private stCharlesParade: StCharlesParade | null = null;
  private maunaKeaSummit: MaunaKeaSummit | null = null;
  private merceFestival: MerceFestival | null = null;
  private oceanDrive: OceanDrive | null = null;
  private moabTrail: MoabTrail | null = null;
  private monacoHarbour: MonacoHarbour | null = null;
  private montmartreSquare: MontmartreSquare | null = null;
  private montrealFestival: MontrealFestival | null = null;
  private trainingHighlands: ItenTraining | null = null;
  private renderer: WebGPURenderer | null = null;
  private angliruRoadside: AngliruRoadside | null = null;
  private pave: ReturnType<typeof arenbergPave> | null = null;
  private visitors: Awaited<ReturnType<typeof cornwallVisitors>> | null = null;
  private harbour: CornwallHarbour | null = null;
  private cypressTrees: Awaited<ReturnType<typeof cypressForest>> | null = null;
  private cypressLift: CypressLift | null = null;
  private readonly climbingRiders: Cyclist[] = [];
  private verges: Awaited<ReturnType<typeof dalesVerges>> | null = null;
  private flock: DalesSheep | null = null;
  private dalesFlags: DalesFlags | null = null;
  private daytonaBoardwalk: DaytonaBoardwalk | null = null;
  private daytonaShore: DaytonaTideLine | null = null;
  private course: Course | null = null;
  private timing: PursuitBoard | null = null;
  private geology: Awaited<ReturnType<typeof badwaterGeology>> | null = null;
  private desertBasin: DeathValleyStreet | null = null;
  private diwaliTrees: Awaited<ReturnType<typeof diwaliPromenade>> | null = null;
  private festival: DiwaliFestival | null = null;
  private quay: DocklandsQuay | null = null;
  private gardenaTrees: Awaited<ReturnType<typeof gardenaForest>> | null = null;
  private marinaTrees: Awaited<ReturnType<typeof marinaPromenade>> | null = null;
  private marinaBoats: MarinaBoats | null = null;
  private street: Awaited<ReturnType<typeof fringeStreet>> | null = null;
  private fringe: FringePerformers | null = null;
  private shore: Awaited<ReturnType<typeof engadinShore>> | null = null;
  private lakes: Awaited<ReturnType<typeof engadinLakes>> | null = null;
  private etna: Awaited<ReturnType<typeof etnaAscent>> | null = null;
  private northFace: ReturnType<typeof northFace> | null = null;
  private coastline: ReturnType<typeof shipwreckCoast> | null = null;
  private summit: ReturnType<typeof haleakalaSummit> | null = null;
  private river: ReturnType<typeof hanRiver> | null = null;
  private fells: ReturnType<typeof hardknottFells> | null = null;
  private malecon: ReturnType<typeof malecon> | null = null;
  private dam: ReturnType<typeof blackCanyon> | null = null;
  private strip: ReturnType<typeof sunsetStrip> | null = null;
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
  private lifts: CampolongoLifts | null = null;
  private cabotWildlife: CabotWildlife | null = null;
  /** The rain, where it rains: it falls with the ride's clock and is not drawn with reduced motion. */
  private basin: Awaited<ReturnType<typeof blossomFestival>> | null = null;
  private railway: ChicagoRailway | null = null;
  private plaza: Awaited<ReturnType<typeof chichenPlaza>> | null = null;
  private fen: Awaited<ReturnType<typeof fenland>> | null = null;
  private escarpment: Awaited<ReturnType<typeof broadwayEscarpment>> | null = null;
  private subaru: Awaited<ReturnType<typeof subaruLine>> | null = null;
  private furka: Awaited<ReturnType<typeof furkaPass>> | null = null;
  private galibier: Awaited<ReturnType<typeof galibierPass>> | null = null;
  private gardena: Awaited<ReturnType<typeof gardenaPass>> | null = null;
  private rain: Rain | null = null;
  private parkTraffic: ParkTraffic | null = null;
  private champsParade: ChampsParade | null = null;
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
  private ligurianCoast: LigurianCoast | null = null;
  private headland: HeadlandSurf | null = null;
  private comoPromenade: Awaited<ReturnType<typeof comoPromenade>> | null = null;
  private ferries: ComoFerries | null = null;
  private crews: ComunaCrews | null = null;
  private barrio: Awaited<ReturnType<typeof comunaStreets>> | null = null;
  private arena: Awaited<ReturnType<typeof ghentArena>> | null = null;
  private panorama: ReturnType<typeof gizaPanorama> | null = null;
  private readonly monuments: { key: string; centre: Vector3 }[] = [];
  private readonly projected = new Vector3();
  private championship: ReturnType<typeof glasgowCircuit> | null = null;
  private frames = 0;
  /** The chunks of the map that are near enough the camera to be drawn: the only ones in the scene. */
  private readonly near = new Group();
  /** What the pinned probe reports of the frame just drawn. */
  private readonly drawn = {
    ferryRoll: null as number | null,
    walkerZ: null as number | null,
    cabinHeight: null as number | null,
    dhowRoll: null as null | number,
    wheelAngle: null as null | number,
    clubY: null as null | number,
    spectatorSections: 0,
    torchAngle: null as null | number,
    cloudBearing: null as number | null,
    turbineAngle: null as number | null,
    dustPosition: null as number | null,
    shadowOffset: null as number | null,
    walkerPosition: null as number | null,
    leafAngle: null as number | null,
    sheepHead: null as number | null,
    visitorPosition: null as number | null,
    cloudPosition: null as number | null,
    shuttlePosition: null as number | null,
    iceAboveLake: null as number | null,
    postbusDistance: null as number | null,
    cowHead: null as number | null,
    cloudHeight: null as number | null,
    postbusPosition: null as number | null,
    spectatorHeight: null as number | null,
    streamOffset: null as number | null,
    flagAngle: null as number | null,
    nearestRider: null as number | null,
    cyclistPosition: null as number | null,
    tier: 0 as number,
    pushCarPosition: undefined as number | undefined,
    mirageHeight: undefined as number | undefined,
    balloonHeight: undefined as number | undefined,
    bannerTip: undefined as number | undefined,
    floatPosition: undefined as number | undefined,
    cabPosition: undefined as number | undefined,
    ferryPosition: undefined as number | undefined,
    boatPosition: undefined as number | undefined,
    touristPosition: undefined as number | undefined,
    packDistance: undefined as number | undefined,
    coachDistance: undefined as number | undefined,
    chairDistance: undefined as number | undefined,
    cowPitch: undefined as number | undefined,
    boatHeel: undefined as number | undefined,
    moosePitch: undefined as number | undefined,
    horseStride: undefined as number | undefined,
    clubDistance: undefined as number | undefined,
    sprintLane: undefined as number | undefined,
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
    clubLane: null as number | null,
    highlandSun: null as number | null,
    sheepLane: null as number | null,
    surfCrest: null as number | null,
    fallingWater: null as number | null,
    tramMetres: null as number | null,
    illumination: null as number | null,
    throwHeight: null as number | null,
    powderRise: null as number | null,
    rickshawPosition: null as number | null,
    chainSwing: null as number | null,
    panMallet: null as number | null,
    speakerTruck: null as number | null,
    crowdClearance: null as number | null,
    handHeight: null as number | null,
    belayHand: null as number | null,
    mistPosition: null as number | null,
    speakerDepth: null as number | null,
    valleyMist: null as number | null,
    paddleHeight: null as number | null,
    walkerStride: null as number | null,
    foamAdvance: null as number | null,
    hikerX: null as number | null,
    boatRoll: null as number | null,
    walkerX: null as number | null,
    breakerHeight: null as number | null,
    foilX: null as number | null,
    dancerY: null as number | null,
    passengerY: null as number | null,
    villageFronts: 0,
    trainPosition: null as number | null,
    kiteHeight: null as number | null,
    heatPhase: null as number | null,
    busPosition: null as number | null,
    plumeHeight: null as number | null,
    gondolaPosition: null as number | null,
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
    gullY: null as number | null,
    climberX: null as number | null,
    chairX: null as number | null,
    flagTip: null as number | null,
    sheepX: null as number | null,
    pickupZ: null as number | null,
    gondolaY: null as number | null,
    mirageOpacity: null as number | null,
    ravenHeading: null as number | null,
    taxiZ: null as number | null,
    sparkY: null as number | null,
    groups: {} as Record<string, number>,
    kiteAngle: undefined as number | undefined,
    boatX: undefined as number | undefined,
    haze: undefined as number | undefined,
    trainX: undefined as number | undefined,
    steamHeight: undefined as number | undefined,
    wingAngle: undefined as number | undefined,
  };
  private readonly trainingGroup: Cyclist[] = [];
  private portWind: AntwerpWind | null = null;
  private readonly echelon: Cyclist[] = [];
  private readonly convoy: { holder: Group; moto: boolean }[] = [];
  private flags: ArtMuseumFlags | null = null;
  private joggers: ArtMuseumJoggers | null = null;
  private mirage: SalarMirage | null = null;
  private salt: Material | null = null;
  private atacamaWildlife: AtacamaWildlife | null = null;
  private swell: AtlanticSwell | null = null;
  private weather: AubisqueWeather | null = null;
  private livestock: AubisqueLivestock | null = null;
  private performers: AustinPerformers | null = null;
  private reef: BathshebaReef | null = null;
  private evening: ReturnType<typeof eveningUniform> | undefined;
  private bayBoats: BayOfIslandsBoats | null = null;
  private bunch: BeachRoadBunch | null = null;
  private highlandWeather: HighlandWeather | null = null;
  private highlandLivestock: HighlandLivestock | null = null;
  private bigSurCoast: BigSurCoast | null = null;
  private trams: BlackpoolTrams | null = null;
  private holi: JaipurFestival | null = null;
  private jouvert: JouvertBands | null = null;
  private jouvertAprons: MeshBasicMaterial | null = null;
  private frederick: MeshBasicMaterial | null = null;
  private climbers: MojaveClimbers | null = null;
  private mojaveFlora: MeshBasicMaterial | null = null;
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
  private glastonbury: ReturnType<typeof glastonburyFestival> | null = null;
  private park: ReturnType<typeof goldenGatePark> | null = null;
  private canyon: ReturnType<typeof desertViewDrive> | null = null;
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
      const parsed = parseCourse(file);
      this.course = new Course(
        parsed.id === 'cherryblossom' && options.sunrise
          ? {
              ...parsed,
              sky: ['#f8d0c1', '#efc4ce', '#d5c2d5', '#b7bedc', '#93acd1'],
              haze: '#f4d5cf',
              sun: [0.81, 0.2, -0.55],
              light: { colour: '#ffc1a3', intensity: 2.2 },
              fill: ['#e4cfe2', '#ba9d97'],
            }
          : parsed,
      );
      if (this.path === 'courses/cornwall') {
        const [{ CornwallHarbour }, { cornwallVisitors }] = await Promise.all([
          import('./cornwall-harbour'),
          import('./cornwall-visitors'),
        ]);
        if (this.disposed) return false;
        const visitors = await cornwallVisitors(this.course);
        if (this.disposed) {
          visitors.dispose();
          return false;
        }
        this.visitors = visitors;
        this.scene.add(visitors.root);
        this.disposables.push(visitors);
        this.camera.setViewOffset(1, 1, 0, 0.09, 1, 1);
        this.harbour = new CornwallHarbour(this.course, this.scene);
        this.disposables.push(this.harbour);
      }
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
      if (this.course.file.id === 'jouvert') {
        const { JouvertBands } = await import('./jouvert-bands');
        if (this.disposed) return false;
        const bands = await JouvertBands.load(this.course);
        if (this.disposed) {
          bands.dispose();
          return false;
        }
        this.jouvert = bands;
        this.scene.add(bands.group, bands.horizon);
        this.disposables.push(bands);
        this.camera.far = 23000;
        const atlas = await new TextureLoader().loadAsync('courses/jouvert-frederick.webp');
        if (this.disposed) {
          atlas.dispose();
          return false;
        }
        atlas.flipY = false;
        atlas.colorSpace = SRGBColorSpace;
        atlas.anisotropy = 4;
        this.frederick = new MeshBasicMaterial({ map: atlas, side: DoubleSide, color: 0xb7afbe });
        this.disposables.push(atlas, this.frederick);
        const aprons = await new TextureLoader().loadAsync('courses/jouvert-aprons.webp');
        if (this.disposed) {
          aprons.dispose();
          return false;
        }
        aprons.flipY = false;
        aprons.colorSpace = SRGBColorSpace;
        aprons.anisotropy = 4;
        this.jouvertAprons = new MeshBasicMaterial({
          map: aprons,
          alphaTest: 0.46,
          side: DoubleSide,
          color: 0xd9c9bc,
        });
        this.disposables.push(aprons, this.jouvertAprons);
        this.camera.clearViewOffset();
        this.camera.fov = 62;
        this.camera.updateProjectionMatrix();
      }
      if (this.course.file.id === 'joshuatree') {
        const { MojaveClimbers } = await import('./mojave-climbers');
        if (this.disposed) return false;
        const climbers = await MojaveClimbers.load(this.course);
        if (this.disposed) {
          climbers.dispose();
          return false;
        }
        this.climbers = climbers;
        this.scene.add(climbers.group, climbers.range);
        this.camera.far = 55000;
        this.disposables.push(climbers);
        const atlas = await new TextureLoader().loadAsync('courses/joshuatree-yuccas.webp');
        if (this.disposed) {
          atlas.dispose();
          return false;
        }
        atlas.colorSpace = SRGBColorSpace;
        atlas.flipY = false;
        atlas.anisotropy = 4;
        this.mojaveFlora = new MeshBasicMaterial({ map: atlas, side: DoubleSide, alphaTest: 0.46 });
        this.disposables.push(atlas, this.mojaveFlora);
        this.camera.clearViewOffset();
        this.camera.fov = 62;
        this.camera.updateProjectionMatrix();
      }
      if (this.course.file.id === 'arenberg') {
        const { arenbergPave } = await import('./arenberg-pave');
        if (this.disposed) return false;
        this.pave = arenbergPave();
        this.disposables.push(this.pave);
      }
      if (this.course.file.id === 'ibiza') {
        const { sunsetStrip } = await import('./sunset-strip');
        if (this.disposed) return false;
        this.strip = sunsetStrip();
        this.disposables.push(this.strip);
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
      if (this.course.file.id === 'iceland') {
        const { southCoast } = await import('./south-coast');
        if (this.disposed) return false;
        this.icelandCoast = southCoast();
        this.disposables.push(this.icelandCoast);
      }
      if (this.course.file.id === 'independence') {
        const { independencePass } = await import('./independence-pass');
        if (this.disposed) return false;
        const divide = await independencePass();
        if (this.disposed) {
          divide.dispose();
          return false;
        }
        this.divide = divide;
        this.disposables.push(divide);
      }
      if (this.course.file.id === 'isleofman') {
        const { ManxMountain } = await import('./manx-mountain');
        if (this.disposed) return false;
        const mountain = await ManxMountain.load(this.course);
        if (this.disposed) {
          mountain.dispose();
          return false;
        }
        this.mountain = mountain;
        this.scene.add(mountain.root);
        this.disposables.push(mountain);
      }
      if (this.course.file.id === 'junkanoo') {
        const { JunkanooRush } = await import('./junkanoo-rush');
        if (this.disposed) return false;
        const rush = await JunkanooRush.load(this.course);
        if (this.disposed) {
          rush.dispose();
          return false;
        }
        this.rush = rush;
        this.scene.add(rush.root);
        this.disposables.push(rush);
      }
      if (this.course.file.id === 'kilauea') {
        const { KilaueaCaldera } = await import('./kilauea-caldera');
        if (this.disposed) return false;
        const caldera = await KilaueaCaldera.load(this.course);
        if (this.disposed) {
          caldera.dispose();
          return false;
        }
        this.caldera = caldera;
        this.camera.setViewOffset(1, 1, 0, 0.035, 1, 1);
        this.scene.add(caldera.root);
        this.disposables.push(caldera);
        const { KilaueaVents } = await import('./kilauea-vents');
        if (this.disposed) return false;
        const vents = await KilaueaVents.load(this.course);
        if (this.disposed) {
          vents.dispose();
          return false;
        }
        this.vents = vents;
        this.scene.add(vents.root);
        this.disposables.push(vents);
      }
      if (this.course.file.id === 'knicks') {
        const { BroadwayRace } = await import('./broadway-race');
        if (this.disposed) return false;
        const broadway = await BroadwayRace.load(this.course);
        if (this.disposed) {
          broadway.dispose();
          return false;
        }
        this.broadway = broadway;
        this.camera.setViewOffset(1, 1, 0, 0.035, 1, 1);
        this.scene.add(this.broadway.root);
        this.disposables.push(this.broadway);
      }
      if (this.course.file.id === 'kona') {
        const { KonaTriathlon } = await import('./kona-triathlon');
        if (this.disposed) return false;
        const triathlon = await KonaTriathlon.load(this.course, body);
        if (this.disposed) {
          triathlon.dispose();
          return false;
        }
        this.camera.far = 32000;
        this.camera.setViewOffset(1, 1, 0, 0.045, 1, 1);
        this.camera.updateProjectionMatrix();
        this.queenK = triathlon;
        this.scene.add(triathlon.root);
        this.disposables.push(triathlon);
      }
      if (this.course.file.id === 'koppenberg') {
        const { KoppenbergBanks } = await import('./koppenberg-banks');
        if (this.disposed) return false;
        const banks = await KoppenbergBanks.load(this.course);
        if (this.disposed) {
          banks.dispose();
          return false;
        }
        this.camera.setViewOffset(1, 1, 0, 0.045, 1, 1);
        this.camera.updateProjectionMatrix();
        this.cobbledBanks = banks;
        this.scene.add(banks.root);
        this.disposables.push(banks);
      }
      if (this.course.file.id === 'kwaremont') {
        const { KwaremontVillage } = await import('./kwaremont-village');
        if (this.disposed) return false;
        const village = await KwaremontVillage.load(this.course);
        if (this.disposed) {
          village.dispose();
          return false;
        }
        this.camera.setViewOffset(1, 1, 0, 0.045, 1, 1);
        this.camera.updateProjectionMatrix();
        this.kwaremontVillage = village;
        this.scene.add(village.root);
        this.disposables.push(village);
      }
      if (this.course.file.id === 'kyoto') {
        const { KyotoHanami } = await import('./kyoto-hanami');
        if (this.disposed) return false;
        const walk = await KyotoHanami.load(this.course);
        if (this.disposed) {
          walk.dispose();
          return false;
        }
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.hanami = walk;
        this.scene.add(walk.root);
        this.disposables.push(walk);
      }
      if (this.course.file.id === 'lakefront') {
        const { ChicagoLakefront } = await import('./chicago-lakefront');
        if (this.disposed) return false;
        const shore = await ChicagoLakefront.load(this.course, body);
        if (this.disposed) {
          shore.dispose();
          return false;
        }
        this.camera.far = 32000;
        this.camera.setViewOffset(1, 1, 0, 0.042, 1, 1);
        this.camera.updateProjectionMatrix();
        this.chicagoShore = shore;
        this.scene.add(shore.root);
        this.disposables.push(shore);
      }
      if (this.course.file.id === 'lakelouise') {
        const { LakeLouise } = await import('./lake-louise');
        if (this.disposed) return false;
        const valley = await LakeLouise.load(this.course, body);
        if (this.disposed) {
          valley.dispose();
          return false;
        }
        this.camera.far = 28500;
        this.camera.setViewOffset(1, 1, 0, 0.04, 1, 1);
        this.camera.updateProjectionMatrix();
        this.lakeLouise = valley;
        this.scene.add(valley.root);
        this.disposables.push(valley);
      }
      if (this.course.file.id === 'letras') {
        const { AltoDeLetras } = await import('./alto-de-letras');
        if (this.disposed) return false;
        const andes = await AltoDeLetras.load(this.course, body);
        if (this.disposed) {
          andes.dispose();
          return false;
        }
        this.camera.far = 38000;
        this.camera.setViewOffset(1, 1, 0, 0.038, 1, 1);
        this.camera.updateProjectionMatrix();
        this.letras = andes;
        this.scene.add(andes.root);
        this.disposables.push(andes);
      }
      if (this.course.file.id === 'lisbon') {
        const { LisbonHills } = await import('./lisbon-hills');
        if (this.disposed) return false;
        const alfama = await LisbonHills.load(this.course);
        if (this.disposed) {
          alfama.dispose();
          return false;
        }
        this.camera.far = 20000;
        this.camera.setViewOffset(1, 1, 0, 0.035, 1, 1);
        this.camera.updateProjectionMatrix();
        this.lisbonHills = alfama;
        this.scene.add(alfama.root);
        this.disposables.push(alfama);
      }
      if (this.course.file.id === 'loire') {
        const { LoireRiver } = await import('./loire-river');
        if (this.disposed) return false;
        const river = await LoireRiver.load(this.course, body);
        if (this.disposed) {
          river.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.loireRiver = river;
        this.scene.add(river.root);
        this.disposables.push(river);
      }
      if (this.course.file.id === 'machupicchu') {
        const { UrubambaGorge } = await import('./urubamba-gorge');
        if (this.disposed) return false;
        const river = await UrubambaGorge.load(this.course);
        if (this.disposed) {
          river.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.urubambaGorge = river;
        this.scene.add(river.root);
        this.disposables.push(river);
      }
      if (this.course.file.id === 'marinabay') {
        const { BayfrontNight } = await import('./bayfront-night');
        if (this.disposed) return false;
        const river = await BayfrontNight.load(this.course);
        if (this.disposed) {
          river.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.bayfrontNight = river;
        this.scene.add(river.root);
        this.disposables.push(river);
      }
      if (this.course.file.id === 'marrakech') {
        const { JemaaSquare } = await import('./jemaa-square');
        if (this.disposed) return false;
        const river = await JemaaSquare.load(this.course);
        if (this.disposed) {
          river.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.jemaaSquare = river;
        this.scene.add(river.root);
        this.disposables.push(river);
      }
      if (this.course.file.id === 'mardigras') {
        const { StCharlesParade } = await import('./st-charles-parade');
        if (this.disposed) return false;
        const river = await StCharlesParade.load(this.course);
        if (this.disposed) {
          river.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.stCharlesParade = river;
        this.scene.add(river.root);
        this.disposables.push(river);
      }
      if (this.course.file.id === 'maunakea') {
        const { MaunaKeaSummit } = await import('./mauna-kea-summit');
        if (this.disposed) return false;
        const summit = await MaunaKeaSummit.load(this.course);
        if (this.disposed) {
          summit.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.maunaKeaSummit = summit;
        this.scene.add(summit.root);
        this.disposables.push(summit);
      }
      if (this.course.file.id === 'merce') {
        const { MerceFestival } = await import('./merce-festival');
        if (this.disposed) return false;
        const festival = await MerceFestival.load(this.course);
        if (this.disposed) {
          festival.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.merceFestival = festival;
        this.scene.add(festival.root);
        this.disposables.push(festival);
      }
      if (this.course.file.id === 'miami') {
        const { OceanDrive } = await import('./ocean-drive');
        if (this.disposed) return false;
        const drive = await OceanDrive.load(this.course);
        if (this.disposed) {
          drive.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.oceanDrive = drive;
        this.scene.add(drive.root);
        this.disposables.push(drive);
      }
      if (this.course.file.id === 'moab') {
        const { MoabTrail } = await import('./moab-trail');
        if (this.disposed) return false;
        const trail = await MoabTrail.load(this.course, body);
        if (this.disposed) {
          trail.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.moabTrail = trail;
        this.scene.add(trail.root);
        this.disposables.push(trail);
      }
      if (this.course.file.id === 'monaco') {
        const { MonacoHarbour } = await import('./monaco-harbour');
        if (this.disposed) return false;
        const harbour = await MonacoHarbour.load(this.course);
        if (this.disposed) {
          harbour.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.monacoHarbour = harbour;
        this.scene.add(harbour.root);
        this.disposables.push(harbour);
      }
      if (this.course.file.id === 'montmartre') {
        const { MontmartreSquare } = await import('./montmartre-square');
        if (this.disposed) return false;
        const square = await MontmartreSquare.load(this.course);
        if (this.disposed) {
          square.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.montmartreSquare = square;
        this.scene.add(square.root);
        this.disposables.push(square);
      }
      if (this.course.file.id === 'montreal') {
        const { MontrealFestival } = await import('./montreal-festival');
        if (this.disposed) return false;
        const festival = await MontrealFestival.load(this.course);
        if (this.disposed) {
          festival.dispose();
          return false;
        }
        this.camera.far = 19000;
        this.camera.setViewOffset(1, 1, 0, 0.036, 1, 1);
        this.camera.updateProjectionMatrix();
        this.montrealFestival = festival;
        this.scene.add(festival.root);
        this.disposables.push(festival);
      }
      if (this.course.file.id === 'iten') {
        const { ItenTraining } = await import('./iten-training');
        if (this.disposed) return false;
        const highlands = await ItenTraining.load(this.course);
        if (this.disposed) {
          highlands.dispose();
          return false;
        }
        this.trainingHighlands = highlands;
        this.scene.add(highlands.root);
        this.disposables.push(highlands);
      }
      const blossomModules =
        parsed.id === 'cherryblossom'
          ? await Promise.all([import('./blossom-festival'), import('./cherryblossom-shore')])
          : null;
      if (this.disposed) return false;
      const paving = blossomModules?.[1].promenadeSurface();
      if (paving) this.disposables.push(paving.tile);
      const champs = parsed.id === 'champs' ? await import('./champs-parade') : null;
      if (this.disposed) return false;
      const parisPaving = champs?.parisPave();
      if (parisPaving) this.disposables.push(parisPaving.tile);
      const chicago =
        parsed.id === 'chicago'
          ? await Promise.all([import('./chicago-railway'), import('./chicago-spectators')])
          : null;
      if (this.disposed) return false;
      const chicagoPaving = chicago?.[0].wabashAsphalt();
      if (chicagoPaving) this.disposables.push(chicagoPaving.tile);
      const chichenModule = parsed.id === 'chichen' ? await import('./chichen-plaza') : null;
      if (this.disposed) return false;
      const chichenPaving = chichenModule?.causewaySurface();
      if (chichenPaving) this.disposables.push(chichenPaving.tile);
      if (this.course.file.id === 'etna') {
        const { etnaAscent } = await import('./etna-ascent');
        if (this.disposed) return false;
        const ascent = await etnaAscent(this.course);
        if (this.disposed) {
          ascent.dispose();
          return false;
        }
        this.etna = ascent;
        this.disposables.push(ascent);
        this.scene.add(ascent.group);
        this.camera.setViewOffset(1, 1, 0, 0.03, 1, 1);
        ascent.at(0, 0);
      }
      if (this.course.file.id === 'fens') {
        const { fenland } = await import('./fenland');
        if (this.disposed) return false;
        const fen = await fenland(this.course);
        if (this.disposed) {
          fen.dispose();
          return false;
        }
        this.fen = fen;
        this.disposables.push(fen);
        this.scene.add(fen.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
        fen.at(0, 0);
      }
      if (this.course.file.id === 'fishhill') {
        const { broadwayEscarpment } = await import('./broadway-escarpment');
        if (this.disposed) return false;
        const hills = await broadwayEscarpment(this.course);
        if (this.disposed) {
          hills.dispose();
          return false;
        }
        this.escarpment = hills;
        this.disposables.push(hills);
        this.scene.add(hills.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
        hills.at(0, 0);
      }
      if (this.course.file.id === 'fuji') {
        const { subaruLine } = await import('./subaru-line');
        if (this.disposed) return false;
        const hills = await subaruLine(this.course);
        if (this.disposed) {
          hills.dispose();
          return false;
        }
        this.subaru = hills;
        this.camera.far = 19500;
        this.camera.updateProjectionMatrix();
        this.disposables.push(hills);
        this.scene.add(hills.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
        hills.at(0, 0);
      }
      if (this.course.file.id === 'furka') {
        const { furkaPass } = await import('./furka-pass');
        if (this.disposed) return false;
        const hills = await furkaPass(this.course);
        if (this.disposed) {
          hills.dispose();
          return false;
        }
        this.furka = hills;
        this.camera.far = 19500;
        this.camera.updateProjectionMatrix();
        this.disposables.push(hills);
        this.scene.add(hills.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
        hills.at(0, 0);
      }
      if (this.course.file.id === 'galibier') {
        const { galibierPass } = await import('./galibier-pass');
        if (this.disposed) return false;
        const hills = await galibierPass(this.course);
        if (this.disposed) {
          hills.dispose();
          return false;
        }
        this.galibier = hills;
        this.camera.far = 28000;
        this.camera.updateProjectionMatrix();
        this.disposables.push(hills);
        this.scene.add(hills.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
        hills.at(0, 0);
      }
      if (this.course.file.id === 'gardena') {
        const { gardenaPass } = await import('./gardena-pass');
        if (this.disposed) return false;
        const hills = await gardenaPass(this.course);
        if (this.disposed) {
          hills.dispose();
          return false;
        }
        this.gardena = hills;
        this.camera.far = 19500;
        this.camera.updateProjectionMatrix();
        this.disposables.push(hills);
        this.scene.add(hills.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
        hills.at(0, 0);
      }
      let gizaMaterials: Record<string, Material> | undefined;
      if (this.course.file.id === 'giza') {
        const { gizaSurfaces } = await import('./giza-surfaces');
        if (this.disposed) return false;
        const surfaces = gizaSurfaces();
        gizaMaterials = surfaces.materials;
        this.disposables.push(surfaces);
        this.camera.setViewOffset(1, 1, 0, 0.045, 1, 1);
      }
      if (this.course.file.id === 'glasgow') {
        const { glasgowCircuit } = await import('./glasgow-circuit');
        if (this.disposed) return false;
        this.championship = glasgowCircuit(this.course);
        this.scene.add(this.championship.group);
        this.disposables.push(this.championship);
        this.camera.setViewOffset(1, 1, 0, 0.075, 1, 1);
      }
      if (this.course.file.id === 'glastonbury') {
        const { glastonburyFestival } = await import('./glastonbury-festival');
        if (this.disposed) return false;
        this.glastonbury = glastonburyFestival(this.course);
        this.scene.add(this.glastonbury.group);
        this.disposables.push(this.glastonbury);
      }
      if (this.course.file.id === 'goldengate') {
        const { goldenGatePark } = await import('./golden-gate-park');
        if (this.disposed) return false;
        this.park = goldenGatePark(this.course);
        this.scene.add(this.park.group);
        this.disposables.push(this.park);
      }
      if (this.course.file.id === 'grandcanyon') {
        const { desertViewDrive } = await import('./desert-view-drive');
        if (this.disposed) return false;
        this.canyon = desertViewDrive(this.course);
        this.scene.add(this.canyon.group);
        this.disposables.push(this.canyon);
      }
      if (this.course.file.id === 'granite') {
        const { northFace } = await import('./north-face');
        if (this.disposed) return false;
        this.northFace = northFace(this.course);
        this.scene.add(this.northFace.group);
        this.disposables.push(this.northFace);
      }
      if (this.course.file.id === 'greatocean') {
        const { shipwreckCoast } = await import('./shipwreck-coast');
        if (this.disposed) return false;
        this.coastline = shipwreckCoast();
        this.disposables.push(this.coastline);
      }
      if (this.course.file.id === 'haleakala') {
        const { haleakalaSummit } = await import('./haleakala-summit');
        if (this.disposed) return false;
        this.summit = haleakalaSummit();
        this.disposables.push(this.summit);
      }
      if (this.course.file.id === 'hanriver') {
        const { hanRiver } = await import('./han-river');
        if (this.disposed) return false;
        this.river = hanRiver(this.course);
        this.disposables.push(this.river);
      }
      if (this.course.file.id === 'hardknott') {
        const { hardknottFells } = await import('./hardknott-fells');
        if (this.disposed) return false;
        this.fells = hardknottFells(this.course);
        this.disposables.push(this.fells);
      }
      if (this.course.file.id === 'havana') {
        const { malecon } = await import('./malecon');
        if (this.disposed) return false;
        this.camera.clearViewOffset();
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
        this.malecon = malecon(this.course);
        this.disposables.push(this.malecon);
      }
      if (this.course.file.id === 'hoover') {
        const { blackCanyon } = await import('./black-canyon');
        if (this.disposed) return false;
        this.camera.clearViewOffset();
        this.camera.updateProjectionMatrix();
        this.dam = blackCanyon(this.course);
        this.disposables.push(this.dam);
      }
      if (this.course.file.id === 'jaipur') {
        const { JaipurFestival } = await import('./jaipur-festival');
        if (this.disposed) return false;
        const festival = await JaipurFestival.load(this.course);
        if (this.disposed) {
          festival.dispose();
          return false;
        }
        this.camera.clearViewOffset();
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
        this.holi = festival;
        this.scene.add(festival.group);
        this.disposables.push(festival);
      }
      this.build(
        gltf.scene,
        canvas,
        clinker,
        fronts,
        foliage,
        (paving ?? parisPaving ?? chicagoPaving ?? chichenPaving)?.material,
        gizaMaterials,
      );
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
      if (this.course.file.id === 'campolongo') {
        const { CampolongoLifts } = await import('./campolongo-lifts');
        if (this.disposed) return false;
        this.lifts = new CampolongoLifts(this.course);
        this.scene.add(this.lifts.root);
        this.disposables.push(this.lifts);
      }
      if (this.course.file.id === 'cabot') {
        const { CabotWildlife } = await import('./cabot-wildlife');
        if (this.disposed) return false;
        this.cabotWildlife = new CabotWildlife(this.course);
        this.scene.add(this.cabotWildlife.root);
        this.disposables.push(this.cabotWildlife);
      }
      if (this.course.file.id === 'centralpark') {
        const { ParkTraffic } = await import('./park-traffic');
        if (this.disposed) return false;
        this.parkTraffic = new ParkTraffic(this.course, this.kit!, this.riderBatch!);
        this.scene.add(this.parkTraffic.root);
        this.disposables.push(this.parkTraffic);
        const { parkCanopy } = await import('./park-canopy');
        const trees = await parkCanopy(this.course);
        if (this.disposed) {
          trees.dispose();
          return false;
        }
        this.scene.add(trees.root);
        this.disposables.push(trees);
      }
      if (blossomModules) {
        const festival = await blossomModules[0].blossomFestival(
          this.course,
          options.sunrise === true,
        );
        if (this.disposed) {
          festival.dispose();
          return false;
        }
        this.basin = festival;
        this.scene.add(festival.root);
        this.disposables.push(festival);
      }
      if (champs) {
        this.champsParade = new champs.ChampsParade(
          this.course,
          this.kit!,
          this.riderBatch!,
          this.sun,
        );
        this.scene.add(this.champsParade.root);
        this.disposables.push(this.champsParade);
        const { champsAvenue } = await import('./champs-avenue');
        const crowd = await champsAvenue(this.course);
        if (this.disposed) {
          crowd.dispose();
          return false;
        }
        this.scene.add(crowd.root);
        this.disposables.push(crowd);
      }
      if (chicago) {
        this.railway = new chicago[0].ChicagoRailway(this.course);
        this.scene.add(this.railway.root);
        this.disposables.push(this.railway);
        const crowd = await chicago[1].chicagoSpectators(this.course);
        if (this.disposed) {
          crowd.dispose();
          return false;
        }
        this.scene.add(crowd.root);
        this.disposables.push(crowd);
      }
      if (chichenModule) {
        const plaza = await chichenModule.chichenPlaza(this.course);
        if (this.disposed) {
          plaza.dispose();
          return false;
        }
        this.plaza = plaza;
        this.scene.add(plaza.root);
        this.disposables.push(plaza);
      }
      if (this.course.file.id === 'cinqueterre' && this.course.file.ligurianCoast) {
        const { LigurianCoast } = await import('./ligurian-coast');
        if (this.disposed) return false;
        this.ligurianCoast = new LigurianCoast(this.course, this.scene, this.sun);
        this.disposables.push(this.ligurianCoast);
      }
      if (this.course.file.id === 'coast' && this.course.file.headland) {
        const { HeadlandSurf } = await import('./headland-surf');
        if (this.disposed) return false;
        this.headland = new HeadlandSurf(this.course, this.scene);
        this.disposables.push(this.headland);
      }
      if (this.course.file.id === 'como') {
        const [{ ComoFerries }, { comoPromenade }] = await Promise.all([
          import('./como-ferries'),
          import('./como-promenade'),
        ]);
        const trees = await comoPromenade(this.course);
        if (this.disposed) {
          trees.dispose();
          return false;
        }
        this.comoPromenade = trees;
        this.scene.add(trees.root);
        this.disposables.push(trees);
        if (this.disposed) return false;
        this.ferries = new ComoFerries(this.course, this.scene);
        this.disposables.push(this.ferries);
      }
      if (this.course.file.id === 'comuna13') {
        const [{ ComunaCrews }, { comunaStreets }] = await Promise.all([
          import('./comuna-crews'),
          import('./comuna-streets'),
        ]);
        const streets = await comunaStreets(this.course);
        if (this.disposed) {
          streets.dispose();
          return false;
        }
        this.barrio = streets;
        this.scene.add(streets.root);
        this.crews = new ComunaCrews(this.course, this.scene);
        this.disposables.push(streets, this.crews);
      }
      if (this.course.file.id === 'coney') {
        const { ConeyBoardwalk } = await import('./coney-boardwalk');
        if (this.disposed) return false;
        this.boardwalk = new ConeyBoardwalk(this.course, this.disposables);
        this.scene.add(this.boardwalk.group);
        this.camera.setViewOffset(1, 1, 0, 0.025, 1, 1);
      }
      if (this.course.file.id === 'copacabana') {
        const [{ CopacabanaBeach }, { copacabanaPromenade }] = await Promise.all([
          import('./copacabana-beach'),
          import('./copacabana-promenade'),
        ]);
        if (this.disposed) return false;
        const promenade = await copacabanaPromenade(this.course);
        if (this.disposed) {
          promenade.dispose();
          return false;
        }
        this.copacabanaPromenade = promenade;
        this.scene.add(promenade.root);
        this.disposables.push(promenade);
        this.camera.setViewOffset(1, 1, 0, 0.07, 1, 1);
        this.copacabana = new CopacabanaBeach(this.course, this.scene);
        this.disposables.push(this.copacabana);
      }
      if (this.course.file.id === 'copenhagen') {
        const [{ CopenhagenCommuters }, { copenhagenStreet }] = await Promise.all([
          import('./copenhagen-commuters'),
          import('./copenhagen-street'),
        ]);
        if (this.disposed) return false;
        const street = await copenhagenStreet(this.course);
        if (this.disposed) {
          street.dispose();
          return false;
        }
        this.danishStreet = street;
        this.scene.add(street.root);
        this.disposables.push(street);
        this.commuters = new CopenhagenCommuters(this.course, this.scene);
        this.disposables.push(this.commuters);
        this.camera.setViewOffset(1, 1, 0, 0.08, 1, 1);
      }
      if (this.path === 'courses/cypress') {
        const [{ CypressLift }, { cypressForest }] = await Promise.all([
          import('./cypress-lift'),
          import('./cypress-forest'),
        ]);
        if (this.disposed) return false;
        const forest = await cypressForest(this.course);
        if (this.disposed) {
          forest.dispose();
          return false;
        }
        this.cypressTrees = forest;
        this.scene.add(forest.root);
        this.disposables.push(forest);
        this.cypressLift = new CypressLift(this.course, this.scene);
        this.disposables.push(this.cypressLift);
        for (const [i, colour] of [0x6c93a6, 0xbe634f, 0xc5ab72].entries()) {
          const rider = this.kit!.make(new Color(colour), i + 17, true, 0.45);
          this.climbingRiders.push(rider);
          this.scene.add(rider.group);
          this.riderBatch?.add(rider);
          this.shadow(rider);
          this.lamplight(rider);
          this.disposables.push(...rider.owned);
        }
        this.camera.setViewOffset(1, 1, 0, 0.1, 1, 1);
      }
      if (this.path === 'courses/dales') {
        const [{ DalesSheep }, { DalesFlags }, { dalesVerges }] = await Promise.all([
          import('./dales-sheep'),
          import('./dales-flags'),
          import('./dales-verges'),
        ]);
        if (this.disposed) return false;
        const verges = await dalesVerges(this.course);
        if (this.disposed) {
          verges.dispose();
          return false;
        }
        this.verges = verges;
        this.scene.add(verges.root);
        this.disposables.push(verges);
        this.flock = new DalesSheep(this.course);
        this.dalesFlags = new DalesFlags(this.course, this.scene);
        this.scene.add(this.flock.mesh);
        this.disposables.push(this.flock, this.dalesFlags);
        this.camera.setViewOffset(1, 1, 0, 0.09, 1, 1);
      }
      if (this.path === 'courses/daytona') {
        const [{ DaytonaTideLine }, { DaytonaBoardwalk }] = await Promise.all([
          import('./daytona-tide-line'),
          import('./daytona-boardwalk'),
        ]);
        if (this.disposed) return false;
        this.daytonaBoardwalk = new DaytonaBoardwalk(this.scene);
        this.disposables.push(this.daytonaBoardwalk);
        this.daytonaShore = new DaytonaTideLine(this.course, this.disposables);
        this.scene.add(this.daytonaShore.group);
        this.camera.setViewOffset(1, 1, 0, 0.053, 1, 1);
      }
      if (this.path === 'courses/deathvalley') {
        const { DeathValleyStreet } = await import('./world-deathvalley');
        if (this.disposed) return false;
        this.desertBasin = new DeathValleyStreet((texture) => {
          this.disposables.push(texture);
          return texture;
        }, this.disposables);
        this.desertBasin.buildBasin(this.course);
        await this.desertBasin.loadPanamints(() => !this.disposed);
        if (this.disposed) return false;
        const { badwaterGeology } = await import('./badwater-geology');
        if (this.disposed) return false;
        const geology = await badwaterGeology(this.course);
        if (this.disposed) {
          geology.dispose();
          return false;
        }
        this.geology = geology;
        this.disposables.push(geology);
        this.scene.add(this.desertBasin.group, geology.group);
        this.camera.setViewOffset(1, 1, 0, 0.05, 1, 1);
      }
      if (this.path === 'courses/diwali') {
        const { DiwaliFestival } = await import('./diwali-festival');
        if (this.disposed) return false;
        this.festival = new DiwaliFestival(this.course, this.scene);
        this.disposables.push(this.festival);
        const { diwaliPromenade } = await import('./diwali-promenade');
        if (this.disposed) return false;
        const promenade = await diwaliPromenade(this.course);
        if (this.disposed) {
          promenade.dispose();
          return false;
        }
        this.diwaliTrees = promenade;
        this.disposables.push(promenade);
        this.scene.add(promenade.group);
        this.camera.setViewOffset(1, 1, 0, 0.062, 1, 1);
      }
      if (this.course.file.id === 'docklands') {
        const { DocklandsQuay } = await import('./docklands-quay');
        if (this.disposed) return false;
        this.quay = new DocklandsQuay(this.course);
        this.scene.add(this.quay.group);
        this.disposables.push(this.quay);
      }
      if (this.course.file.id === 'dolomites') {
        const { gardenaMassifs } = await import('./gardena-massifs');
        if (this.disposed) return false;
        const massifs = await gardenaMassifs(this.course);
        if (this.disposed) {
          massifs.dispose();
          return false;
        }
        this.scene.add(massifs.mesh);
        this.disposables.push(massifs);
        const { gardenaForest } = await import('./gardena-forest');
        if (this.disposed) return false;
        const forest = await gardenaForest();
        if (this.disposed) {
          forest.dispose();
          return false;
        }
        this.gardenaTrees = forest;
        this.scene.add(forest.group);
        this.disposables.push(forest);
      }
      if (this.course.file.id === 'dubai') {
        this.camera.setViewOffset(1, 1, 0, 0.045, 1, 1);
        const { MarinaBoats } = await import('./marina-boats');
        if (this.disposed) return false;
        this.marinaBoats = new MarinaBoats(this.course, this.scene);
        this.disposables.push(this.marinaBoats);
        const { marinaPromenade } = await import('./marina-promenade');
        if (this.disposed) return false;
        const promenade = await marinaPromenade(this.course);
        if (this.disposed) {
          promenade.dispose();
          return false;
        }
        this.marinaTrees = promenade;
        this.scene.add(promenade.group);
        this.disposables.push(promenade);
      }
      if (this.course.file.id === 'edinburgh') {
        this.camera.setViewOffset(1, 1, 0, 0.02, 1, 1);
        const { FringePerformers } = await import('./fringe-performers');
        if (this.disposed) return false;
        this.fringe = new FringePerformers(this.course, this.scene);
        this.disposables.push(this.fringe);
        const { fringeStreet } = await import('./fringe-street');
        if (this.disposed) return false;
        const street = await fringeStreet(this.course);
        if (this.disposed) {
          street.dispose();
          return false;
        }
        this.street = street;
        this.scene.add(street.group);
        this.disposables.push(street);
        street.at(0);
      }
      if (this.course.file.id === 'engadin') {
        const { engadinLakes } = await import('./engadin-lakes');
        if (this.disposed) return false;
        const lakes = await engadinLakes(this.course);
        if (this.disposed) {
          lakes.dispose();
          return false;
        }
        this.lakes = lakes;
        this.disposables.push(lakes);
        this.scene.add(lakes.group);
        this.camera.setViewOffset(1, 1, 0, 0.055, 1, 1);
        lakes.at(0, 0);
        const { engadinShore } = await import('./engadin-shore');
        if (this.disposed) return false;
        const shore = await engadinShore(this.course);
        if (this.disposed) {
          shore.dispose();
          return false;
        }
        this.shore = shore;
        this.scene.add(shore.group);
        this.disposables.push(shore);
        shore.at(0);
      }
      if (this.course.file.id === 'ghent') {
        const { ghentArena } = await import('./ghent-arena');
        if (this.disposed) return false;
        const arena = await ghentArena(this.course, this.tier === 0, gltf.scene);
        if (this.disposed) {
          arena.dispose();
          return false;
        }
        this.arena = arena;
        // In the Kuipke the next bend is only metres away. Leave room above it for the stands and roof.
        this.camera.clearViewOffset();
        this.camera.fov = 68;
        this.camera.updateProjectionMatrix();
        this.scene.add(this.arena.group);
        this.disposables.push(this.arena);
      }
      if (this.course.file.id === 'giza') {
        const { gizaPanorama } = await import('./giza-panorama');
        if (this.disposed) return false;
        if (this.pinned) {
          for (const name of ['Khafre', 'Khufu', 'Sphinx']) {
            const centre = new Box3()
              .setFromObject(gltf.scene.getObjectByName(name)!, true)
              .getCenter(new Vector3());
            this.monuments.push({ key: name.toLowerCase() + 'ScreenX', centre });
          }
        }
        this.panorama = gizaPanorama(this.course);
        this.scene.add(this.panorama.group);
        this.disposables.push(this.panorama);
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
        this.atacamaWildlife = new AtacamaWildlife();
        this.scene.add(this.atacamaWildlife.mesh);
        this.disposables.push(this.atacamaWildlife);
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
        this.bayBoats = new BayOfIslandsBoats(this.course);
        this.scene.add(this.bayBoats.group);
        this.disposables.push(this.bayBoats);
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
        this.highlandLivestock = new HighlandLivestock(this.course);
        this.highlandWeather = new HighlandWeather(this.course, this.sun);
        this.scene.add(this.highlandWeather.root, this.highlandLivestock.mesh);
        this.disposables.push(this.highlandLivestock, this.highlandWeather);
      }
      if (this.course.file.id === 'bigsur') {
        const { BigSurCoast } = await import('./bigsur-coast');
        if (this.disposed) return false;
        this.bigSurCoast = new BigSurCoast(this.course);
        this.scene.add(this.bigSurCoast.group);
        this.disposables.push(this.bigSurCoast);
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
    this.shore?.at(metres, frame.reducedMotion ? 0 : frame.time);
    this.lakes?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.etna?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.fen?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.escarpment?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.subaru?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.furka?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.galibier?.at(frame.reducedMotion ? 0 : frame.time, metres);
    this.gardena?.at(frame.reducedMotion ? 0 : frame.time, metres);
    if (frame.riders && !this.fieldMade) this.makeField(frame.riders, metres);
    this.lampShadows?.begin();
    const standing = this.ride(you, metres, 0);
    // Every wheel on the road turns with the rider's: the riders keep much the same pace.
    this.kit?.roll(metres);
    this.marinaBoats?.follow(metres);
    this.marinaTrees?.follow(metres, frame.reducedMotion ? 0 : frame.time);
    you.pose(frame.reducedMotion ? 0 : frame.crank, standing);
    this.basin?.update(frame.reducedMotion ? 0 : frame.time);
    this.railway?.update(frame.reducedMotion ? 0 : frame.time);
    this.plaza?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.placeRiders(frame, metres);
    this.timing?.update(metres, frame.time);
    if (this.trainingGroup.length) this.placeTrainingGroup(frame, metres);
    if (this.echelon.length) this.placeEchelon(frame, metres);
    this.camp?.update(frame.time, metres, frame.reducedMotion);
    if (this.cypressLift) {
      const seconds = frame.reducedMotion ? 0 : frame.time;
      this.cypressTrees?.follow(metres);
      this.sun.intensity = 1.94 + (0.86 * metres) / course.length;
      const leader = seconds * 3.64;
      for (const [i, rider] of this.climbingRiders.entries()) {
        const origin = leader + i * 37 + 21;
        const station = origin + Math.ceil((metres - 13 - origin) / 142) * 142;
        rider.group.visible = station < course.end;
        if (!rider.group.visible) continue;
        const standing = this.ride(rider, station, 4.76 + i * 0.19);
        rider.pose(seconds * (6.6 + i * 0.47) + i, standing);
      }
      this.cypressLift.update(seconds, metres);
    }
    if (this.verges) {
      this.verges.follow(metres);
      this.sun.intensity = 2.13 + 0.66 * Math.sin(metres / 317) + 0.32 * Math.sin(metres / 127);
    }
    this.flock?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.dalesFlags?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.daytonaBoardwalk?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.daytonaShore?.place(metres, frame.reducedMotion ? 0 : frame.time);
    this.geology?.follow(metres);
    this.desertBasin?.followBasin(course, metres, frame.reducedMotion ? 0 : frame.time);
    this.diwaliTrees?.follow(metres, frame.reducedMotion ? 0 : frame.time);
    this.festival?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.lampShadows?.end();
    this.bunch?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.parkTraffic?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.champsParade?.update(frame.time, metres, frame.reducedMotion);
    this.riderBatch?.follow();
    if (this.pinned) this.drawn.metres = metres;
    this.visitors?.follow(metres);
    if (this.harbour) {
      this.harbour.update(frame.reducedMotion ? 0 : frame.time, metres);
      this.sun.intensity = 2.1 + 0.62 * Math.sin(metres / 178) + 0.19 * Math.sin(metres / 63);
    }
    this.danishStreet?.follow(metres);
    this.commuters?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.copacabanaPromenade?.follow(metres);
    this.copacabana?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.boardwalk?.place(metres, frame.reducedMotion ? 0 : frame.time);
    if (this.evening) {
      const bay = this.course?.file.id === 'bayofislands';
      const summit = this.course?.file.id === 'maunakea';
      const sunsetStart = summit ? 20_000 : bay ? 19_500 : 14_300;
      const sunsetLength = summit ? 5_300 : bay ? 7900 : 5050;
      const desert = this.course?.file.id === 'moab';
      const sunsetStart = desert ? 7700 : bay ? 19_500 : 14_300;
      const sunsetLength = desert ? 5850 : bay ? 7900 : 5050;
      const progress = Math.max(0, Math.min(1, (metres - sunsetStart) / sunsetLength));
      const t = progress * progress * (3 - 2 * progress);
      this.evening.value = t;
      this.sun.color.setRGB(0.982 - 0.05 * t, 0.791 - 0.39 * t, 0.527 - 0.33 * t);
      if (this.scene.fog instanceof Fog)
        this.scene.fog.color.setRGB(0.402 + 0.43 * t, 0.604 - 0.27 * t, 0.658 - 0.43 * t);
    }
    this.aim(metres, frame.reducedMotion);
    this.mountain?.update(
      metres,
      frame.reducedMotion ? 0 : frame.time,
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z,
    );
    this.rush?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.vents?.update(metres, frame.reducedMotion ? 0 : frame.time, this.camera);
    this.broadway?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.queenK?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.cobbledBanks?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.kwaremontVillage?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.hanami?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.chicagoShore?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.lakeLouise?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.letras?.update(metres, frame.reducedMotion ? 0 : frame.time, this.sun, this.scene.fog);
    this.lisbonHills?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.loireRiver?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.urubambaGorge?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.bayfrontNight?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.jemaaSquare?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.stCharlesParade?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.maunaKeaSummit?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.merceFestival?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.oceanDrive?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.moabTrail?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.monacoHarbour?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.montmartreSquare?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.montrealFestival?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.trainingHighlands?.update(metres, frame.reducedMotion ? 0 : frame.time);
    if (this.pave && !frame.reducedMotion) this.camera.position.y += this.pave.wheelRise(metres);
    this.mirage?.update(
      you.group.position.x,
      you.group.position.y,
      frame.reducedMotion ? 0 : frame.time,
    );
    this.atacamaWildlife?.update(you.group.position.x, frame.reducedMotion ? 0 : frame.time);
    this.swell?.update(metres, frame.reducedMotion ? 0 : frame.time, this.camera.quaternion);
    this.weather?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.livestock?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.performers?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.reef?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.bayBoats?.update(metres, frame.reducedMotion ? 0 : frame.time);

    this.highlandWeather?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.highlandLivestock?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.bigSurCoast?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.trams?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.holi?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.jouvert?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.climbers?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.yard?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.mill?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.surf?.update(metres, frame.reducedMotion ? 0 : frame.time);
    this.speedWeek?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.speedway?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.parade?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.commute?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.cruise?.update(frame.reducedMotion ? 0 : frame.time);
    this.lifts?.update(frame.reducedMotion ? 0 : frame.time);
    this.cabotWildlife?.update(frame.reducedMotion ? 0 : frame.time);
    this.street?.at(metres);
    this.arena?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.panorama?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.championship?.update(frame.time, metres, frame.speedKmh, frame.reducedMotion);
    this.glastonbury?.update(frame.time, metres, frame.reducedMotion);
    this.park?.update(frame.time, metres, frame.reducedMotion);
    this.canyon?.update(frame.time, metres, frame.reducedMotion);
    // Chosen every few frames, and at once when the camera has jumped (a ride resumed elsewhere on the road).
    const leapt = this.camera.position.distanceToSquared(this.chosenAt) > 60 * 60;
    if (this.frames++ % CHUNK_SWEEP === 0 || leapt) this.choose();
    // The start lights: red until the clock starts, green from then, and not drawn once they are far behind.
    const lights = metres < START_LIGHTS;
    if (this.startRed) this.startRed.visible = lights && frame.time <= 0;
    if (this.startGreen) this.startGreen.visible = lights && frame.time > 0;
    this.ligurianCoast?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.headland?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.comoPromenade?.follow(metres);
    this.ferries?.update(frame.reducedMotion ? 0 : frame.time, metres);
    this.barrio?.follow(metres);
    this.crews?.update(frame.reducedMotion ? 0 : frame.time, metres);
    if (this.rain)
      this.rain.mesh.visible = !frame.reducedMotion && (!this.street || frame.time % 95 < 34);
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
    this.northFace?.update(frame.reducedMotion ? 0 : frame.time);
    this.coastline?.update(frame.reducedMotion ? 0 : frame.time);
    this.summit?.update(frame.reducedMotion ? 0 : frame.time);
    this.river?.update(frame.reducedMotion ? 0 : frame.time, this.camera);
    this.fells?.update(frame.reducedMotion ? 0 : frame.time);
    this.malecon?.update(frame.reducedMotion ? 0 : frame.time, this.camera, metres);
    this.dam?.update(frame.reducedMotion ? 0 : frame.time);
    this.strip?.update(frame.reducedMotion ? 0 : frame.time);
    this.icelandCoast?.update(frame.reducedMotion ? 0 : frame.time);
    this.divide?.update(frame.reducedMotion ? 0 : frame.time);
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
    this.boardwalk?.group.removeFromParent();
    this.boardwalk = null;
    this.daytonaBoardwalk = null;
    this.daytonaShore = null;
    this.copacabanaPromenade?.root.removeFromParent();
    this.copacabanaPromenade = null;
    this.copacabana = null;
    this.danishStreet?.root.removeFromParent();
    this.danishStreet = null;
    this.commuters = null;
    this.map = null;
    // The chunks were taken out of the map: their geometry is released here.
    for (const { mesh } of this.chunks) mesh.geometry.dispose();
    this.near.clear();
    this.chunks.length = 0;
    this.boats = null;
    this.confetti.length = 0;
    this.timing = null;
    this.arena = null;
    this.panorama = null;
    this.championship = null;
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
    this.dalesFlags = null;
    this.atacamaWildlife = null;
    this.salt = null;
    this.mirage = null;
    this.swell = null;
    this.livestock = null;
    this.weather = null;
    this.performers = null;
    this.reef = null;
    this.bayBoats = null;
    this.evening = undefined;
    this.bunch = null;
    this.highlandLivestock = null;
    this.highlandWeather = null;
    this.bigSurCoast = null;
    this.icelandCoast = null;
    this.divide = null;
    this.mountain = null;
    this.rush = null;
    this.vents = null;
    this.caldera = null;
    this.broadway = null;
    this.queenK = null;
    this.cobbledBanks = null;
    this.kwaremontVillage = null;
    this.hanami = null;
    this.chicagoShore = null;
    this.lakeLouise = null;
    this.letras = null;
    this.lisbonHills = null;
    this.loireRiver = null;
    this.urubambaGorge = null;
    this.bayfrontNight = null;
    this.jemaaSquare = null;
    this.stCharlesParade = null;
    this.maunaKeaSummit = null;
    this.merceFestival = null;
    this.oceanDrive = null;
    this.moabTrail = null;
    this.monacoHarbour = null;
    this.montmartreSquare = null;
    this.montrealFestival = null;
    this.trainingHighlands = null;
    this.trams = null;
    this.holi = null;
    this.jouvert = null;
    this.jouvertAprons = null;
    this.frederick = null;
    this.climbers = null;
    this.mojaveFlora = null;
    this.yard = null;
    this.mill = null;
    this.surf = null;
    this.basin = null;
    this.desertBasin = null;
    this.railway = null;
    this.plaza = null;
    this.ligurianCoast = null;
    this.headland = null;
    this.ferries = null;
    this.comoPromenade = null;
    this.barrio = null;
    this.crews = null;
    this.quay = null;
    this.festival = null;
    this.glastonbury = null;
    this.diwaliTrees = null;
    this.park = null;
    this.canyon = null;
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
    this.lifts = null;
    this.cabotWildlife = null;
    this.parkTraffic = null;
    this.champsParade = null;
    this.rain = null;
    this.cypressTrees = null;
    this.gardenaTrees = null;
    this.marinaBoats = null;
    this.marinaTrees = null;
    this.fringe = null;
    this.street = null;
    this.lakes = null;
    this.shore = null;
    this.etna = null;
    this.fen = null;
    this.escarpment = null;
    this.subaru = null;
    this.furka = null;
    this.galibier = null;
    this.gardena = null;
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
    coursePavement?: Material,
    localMaterials?: Record<string, Material>,
  ): void {
    // The course's world: its sky, its haze and its lights (a course that names none is Ibiza's sunset).
    const look = courseLook(this.course!.file);
    if (this.course!.file.id === 'bayofislands') this.evening = eveningUniform();
    if (this.course!.file.id === 'beachroad' || this.course!.file.id === 'maunakea' || this.course!.file.id === 'moab')
      this.evening = eveningUniform();
    const clearValley = this.course!.file.id === 'engadin';
    const fogRange = this.dam
      ? ([450, 4200] as const)
      : this.course!.file.id === 'calobra'
        ? ([2500, 16000] as const)
        : clearValley
          ? ([750, 5000] as const)
          : this.icelandCoast
            ? ([650, 4700] as const)
            : this.divide
              ? ([430, 5400] as const)
              : this.mountain
                ? ([650, 4100] as const)
                : FOG;
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
    Object.assign(materials, this.etna?.rocks);
    Object.assign(materials, this.fen?.materials);
    Object.assign(materials, this.escarpment?.materials);
    Object.assign(materials, this.subaru?.materials);
    Object.assign(materials, this.furka?.materials);
    Object.assign(materials, this.galibier?.materials);
    if (this.galibier) {
      materials['Sun']!.vertexColors = false;
      (materials['Sun'] as MeshBasicMaterial).color.setHex(0xfff9e8);
    }
    Object.assign(materials, this.gardena?.materials);
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
    const pavement =
      this.saltRoad ??
      this.speedwaySurface?.(detail) ??
      this.seafrontSurface?.(detail) ??
      this.deckSurface ??
      coursePavement;
    if (this.climbers) {
      materials['MojaveGranite'] = this.climbers.granite;
      materials['MojaveSand'] = this.climbers.sand;
    }
    if (this.mojaveFlora) materials['MojavePlants'] = this.mojaveFlora;
    if (this.jouvertAprons) materials['JouvertAprons'] = this.jouvertAprons;
    if (this.frederick) materials['FrederickFronts'] = this.frederick;
    materials['Ground'] = this.holi?.tarmac ?? this.jouvert?.road ?? pavement ?? ground.material;
    if (pavement) this.disposables.push(ground.material);
    this.groundEye = ground.eye;
    // Walls have their place on the wall in their UV: brick, steel and plaster are drawn from it (wall-material.ts).
    materials['Walls'] = wallMaterial(detail, made, LAMP_ON.Walls);
    // The city on the horizon is walls too, never lit by the lamps: its windows shine (wall-material.ts).
    if (this.mountain) materials['ManxMoor'] = this.mountain.moor;
    if (this.rush) Object.assign(materials, this.rush.materials);
    if (this.caldera) Object.assign(materials, this.caldera.materials);
    if (this.broadway) Object.assign(materials, this.broadway.materials);
    if (this.queenK) Object.assign(materials, this.queenK.materials);
    if (this.cobbledBanks) Object.assign(materials, this.cobbledBanks.materials);
    if (this.kwaremontVillage) Object.assign(materials, this.kwaremontVillage.materials);
    if (this.hanami) Object.assign(materials, this.hanami.materials);
    if (this.chicagoShore) Object.assign(materials, this.chicagoShore.materials);
    if (this.lakeLouise) Object.assign(materials, this.lakeLouise.materials);
    if (this.letras) Object.assign(materials, this.letras.materials);
    if (this.lisbonHills) Object.assign(materials, this.lisbonHills.materials);
    if (this.loireRiver) Object.assign(materials, this.loireRiver.materials);
    if (this.urubambaGorge) Object.assign(materials, this.urubambaGorge.materials);
    if (this.bayfrontNight) Object.assign(materials, this.bayfrontNight.materials);
    if (this.jemaaSquare) Object.assign(materials, this.jemaaSquare.materials);
    if (this.stCharlesParade) Object.assign(materials, this.stCharlesParade.materials);
    if (this.maunaKeaSummit) Object.assign(materials, this.maunaKeaSummit.materials);
    if (this.merceFestival) Object.assign(materials, this.merceFestival.materials);
    if (this.oceanDrive) Object.assign(materials, this.oceanDrive.materials);
    if (this.moabTrail) Object.assign(materials, this.moabTrail.materials);
    if (this.monacoHarbour) Object.assign(materials, this.monacoHarbour.materials);
    if (this.montmartreSquare) Object.assign(materials, this.montmartreSquare.materials);
    if (this.montrealFestival) Object.assign(materials, this.montrealFestival.materials);
    if (this.trainingHighlands) Object.assign(materials, this.trainingHighlands.materials);
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
        this.course!.file.id === 'coast',
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
      this.holi ? ground.material : this.jouvert ? ground.material : materials['Ground'],
      materials['Walls'],
      materials['Skyline'],
      materials['Windows'],
    );
    // Railings are panels with their place along the railing in their UV (fence-material.ts).
    materials['Fences'] = fenceMaterial(made, LAMP_ON.Solid);
    // The glow round each light: corners the material spreads to face the eye (halo-material.ts).
    materials['Halos'] = haloMaterial(DRAW_DISTANCE['Halos']! * 0.6, DRAW_DISTANCE['Halos']!);
    this.disposables.push(materials['Fences'], materials['Halos']);
    if (this.path === 'courses/deathvalley') {
      const sunDisc = materials['Sun'] as MeshBasicMaterial;
      sunDisc.vertexColors = false;
      sunDisc.color.setHex(0xfff6df);
    }
    if (this.northFace) Object.assign(materials, this.northFace.materials);
    if (this.coastline) Object.assign(materials, this.coastline.materials);
    if (this.summit) Object.assign(materials, this.summit.materials);
    if (this.river) Object.assign(materials, this.river.materials);
    if (this.fells) Object.assign(materials, this.fells.materials);
    if (this.malecon) Object.assign(materials, this.malecon.materials);
    if (this.dam) Object.assign(materials, this.dam.materials);
    if (this.strip) Object.assign(materials, this.strip.materials);
    if (this.icelandCoast) Object.assign(materials, this.icelandCoast.materials);
    if (this.divide) Object.assign(materials, this.divide.materials);
    this.beams = materials['Beams'] as MeshBasicMaterial;
    Object.assign(materials, localMaterials);
    if (this.championship) {
      materials['Tenements'] = this.championship.wall;
      materials['RaceBoards'] = this.championship.boardMaterial;
    }
    if (this.glastonbury) Object.assign(materials, this.glastonbury.materials);
    if (this.park) Object.assign(materials, this.park.materials);
    if (this.canyon) Object.assign(materials, this.canyon.materials);
    const painted: Mesh[] = [];
    map.traverse((part) => {
      const mesh = part as Mesh;
      if (!mesh.isMesh) return;
      // A chunk is named for its group and its place along the road: `Solid_012`.
      const [group = '', chunk] = mesh.name.split('_');
      this.dam?.landmark(group, mesh);
      this.malecon?.landmark(group, mesh);
      this.fells?.landmark(group, mesh);
      this.river?.landmark(group, mesh);
      this.summit?.landmark(group, mesh);
      this.coastline?.landmark(group, mesh);
      this.northFace?.landmark(group, mesh);
      this.canyon?.landmark(group, mesh);
      if ((this.mountain || this.caldera) && group === 'Sun') mesh.visible = false;
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
      const useLandMaterial =
        group === 'Boats' ||
        group === 'TourBoat' ||
        group === 'Commuter' ||
        group === 'TukTuk' ||
        group === 'TouringBike' ||
        group === 'Commissaire' ||
        group === 'TeamCar';
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
      if (
        group === 'Ground' ||
        group === 'Pave' ||
        group === 'GrandviewTemple' ||
        group === 'CanyonStrata'
      )
        mesh.geometry.computeVertexNormals();
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
    this.river?.install(map, this.scene);
    this.fells?.install(map, this.scene);
    this.malecon?.install(map, this.scene);
    this.dam?.install(map);
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
    } else if (this.caldera) {
      this.sky = this.caldera.sky;
      this.scene.add(this.sky);
    } else if (!this.fen && !this.mountain && !this.rush) {
      const dome = new SphereGeometry(9000, 24, 12);
      const sky =
        this.dam?.sky ??
        skyMaterial(
          look,
          this.course!.file.sun,
          detail,
          this.course!.file.id === 'atlanticroad',
          this.evening,
          this.bayfrontNight ? 0.085 : 1,
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
    const distance = this.marinaBoats
      ? 4.65
      : this.street
        ? 4.55
        : this.lakes
          ? 4.65
          : this.etna
            ? 4.55
            : this.fen
              ? 4.4
              : this.escarpment
                ? 4.45
                : this.subaru
                  ? 4.45
                  : this.furka
                    ? 4.45
                    : this.galibier
                      ? 4.45
                      : this.gardena
                        ? 4.45
                        : this.arena
                          ? 3.8
                          : this.malecon
                            ? 5.5
                            : this.dam
                              ? 4.5
                              : CAMERA_BACK;
    const eye = this.marinaBoats
      ? 2.55
      : this.street
        ? 2.4
        : this.lakes
          ? 2.65
          : this.etna
            ? 2.42
            : this.fen
              ? 2.1
              : this.escarpment
                ? 2.2
                : this.subaru
                  ? 2.2
                  : this.furka
                    ? 2.2
                    : this.galibier
                      ? 2.2
                      : this.gardena
                        ? 2.2
                        : this.arena
                          ? 2.15
                          : this.malecon
                            ? 2.1
                            : this.dam
                              ? 2.0
                              : CAMERA_UP;
    const behind = calobra
      ? 5.5
      : this.boardwalk
        ? 5.0
        : this.copacabana
          ? 4.1
          : this.commuters
            ? 4.1
            : distance + (CLOSE_BACK - distance) * close;
    const up = calobra
      ? 2.1
      : this.boardwalk
        ? 2.35
        : this.copacabana
          ? 2.05
          : this.commuters
            ? 2.0
            : eye + (CLOSE_UP - eye) * close;
    const sway = calobra && !reducedMotion ? Math.sin(metres / 3) * 0.04 : 0;
    const back = course.place(metres - behind, sway, this.here);
    const rim = this.plaza ? Math.max(0, 1 - Math.abs(metres - 3180) / 105) : 0;
    const cypressOverlook = this.cypressLift
      ? Math.max(
          Math.exp(-Math.pow((metres - 5650) / 115, 4)),
          Math.exp(-Math.pow((metres - 9320) / 115, 4)),
        )
      : 0;
    this.camera.position.set(
      back.x,
      back.y + up + 1.6 * rim * rim + 0.52 * cypressOverlook,
      back.z,
    );
    this.groundEye?.at(metres - behind, 0, up);
    // The last coastal bend opens onto the lagoon on the left.
    const lagoon =
      this.icelandCoast && metres > 10660 && metres < 11360
        ? Math.sin(((metres - 10660) * Math.PI) / 700) ** 2
        : 0;
    // Follow the outside of the promenade curve above the small exposed bay.
    const cove =
      this.strip && metres >= 720 && metres <= 1200
        ? Math.sin((Math.PI * (metres - 720)) / 480) ** 2
        : 0;
    let shoulder = 0;
    if (this.cypressLift) {
      const glance = (centre: number, width: number) =>
        Math.exp(-Math.pow((metres - centre) / width, 4));
      shoulder = 4.1 * glance(5650, 100) - 4.3 * glance(9320, 110) + 2.2 * glance(17905, 54);
    }
    const overlook =
      this.divide && metres > 11780 && metres < 12380
        ? Math.sin(((metres - 11780) * Math.PI) / 600) ** 2
        : 0;
    const summit =
      this.divide && metres > 15020 && metres < 15279
        ? 2.8 * Math.sin(((metres - 15020) * Math.PI) / 259) ** 2
        : 0;
    const river =
      this.divide && metres > 1980 && metres < 2420
        ? 2.7 * Math.sin(((metres - 1980) * Math.PI) / 440) ** 2
        : 0;
    const lap = this.railway ? metres % 1750 : 0;
    const bridge = this.railway ? Math.max(0, 1 - Math.abs(lap - 460) / 67) : 0;
    const skyline = this.railway ? Math.max(0, 1 - Math.abs(lap - 670) / 105) : 0;
    const train = this.railway ? Math.max(0, 1 - Math.abs(lap - 220) / 74) : 0;
    const view = this.basin?.sightline(metres) ?? this.plaza?.sightline(metres);
    const ahead = this.dam
      ? course.place(metres + 22, this.dam.lookAcross(metres), this.there)
      : this.malecon
        ? course.place(metres + 24, this.malecon.lookAcross(metres), this.there)
        : course.place(
            metres + (calobra ? 24 : this.arena ? 7.5 : LOOK_AHEAD),
            (view?.lane ?? 0) +
              summit +
              river -
              2.8 * bridge +
              (this.headland ? 1.6 : 0) +
              shoulder -
              4.4 * cove -
              3.3 * lagoon,
            this.there,
          );
    if (overlook > 0) {
      // Keep the rider in frame as Highway 82 rounds the outside of the lake overlook.
      // The glacial basin lies 460 m ahead and 94 m left of the road at the viewpoint.
      const origin = course.place(12080, 0, this.here);
      const ox = origin.x;
      const oz = origin.z;
      const tangent = course.place(12084, 0, this.here);
      const dx = tangent.x - ox;
      const dz = tangent.z - oz;
      const scale = 1 / Math.hypot(dx, dz);
      const lakeX = ox + (460 * dx + 94 * dz) * scale;
      const lakeZ = oz + (460 * dz - 94 * dx) * scale;
      const rider = course.place(metres, 0, this.here);
      const length = Math.hypot(lakeX - rider.x, lakeZ - rider.z);
      const ux = (lakeX - rider.x) / length;
      const uz = (lakeZ - rider.z) / length;
      this.camera.position.x += (rider.x - 5.2 * ux - this.camera.position.x) * overlook;
      this.camera.position.z += (rider.z - 5.2 * uz - this.camera.position.z) * overlook;
      this.camera.position.y += 1.7 * overlook;
      ahead.x += (rider.x + 14 * ux - ahead.x) * overlook;
      ahead.z += (rider.z + 14 * uz - ahead.z) * overlook;
      ahead.y += (rider.y - 1.4 - ahead.y) * overlook;
    }
    this.stCharlesParade?.sightline(metres, this.camera.position, ahead);
    this.mountain?.frameView(metres, this.camera.position, ahead);
    this.rush?.sightline(metres, this.camera.position, ahead);
    this.vents?.sightline(metres, this.camera.position, ahead);
    this.broadway?.sightline(metres, this.camera.position, ahead);
    this.queenK?.sightline(metres, this.camera.position, ahead);
    this.cobbledBanks?.sightline(metres, this.camera.position, ahead);
    this.kwaremontVillage?.sightline(metres, this.camera.position, ahead);
    this.hanami?.sightline(metres, this.camera.position, ahead);
    this.chicagoShore?.sightline(metres, this.camera.position, ahead);
    this.lakeLouise?.sightline(metres, this.camera.position, ahead);
    this.letras?.sightline(metres, this.camera.position, ahead);
    this.lisbonHills?.sightline(metres, this.camera.position, ahead);
    this.loireRiver?.sightline(metres, this.camera.position, ahead);
    this.urubambaGorge?.sightline(metres, this.camera.position, ahead);
    this.bayfrontNight?.sightline(metres, this.camera.position, ahead);
    this.jemaaSquare?.sightline(metres, this.camera.position, ahead);
    this.maunaKeaSummit?.sightline(metres, this.camera.position, ahead);
    this.merceFestival?.sightline(metres, this.camera.position, ahead);
    this.oceanDrive?.sightline(metres, this.camera.position, ahead);
    this.moabTrail?.sightline(metres, this.camera.position, ahead);
    this.monacoHarbour?.sightline(metres, this.camera.position, ahead);
    this.montmartreSquare?.sightline(metres, this.camera.position, ahead);
    this.montrealFestival?.sightline(metres, this.camera.position, ahead);
    this.trainingHighlands?.sightline(metres, this.camera.position, ahead);
    if (this.holi && Math.abs(metres - 2920) < 100) {
      const palace = Math.max(0, 1 - Math.abs(metres - 2920) / 100);
      const facade = course.place(2992, -38);
      const rider = course.place(metres);
      const dx = facade.x - rider.x,
        dz = facade.z - rider.z,
        distance = Math.max(1, Math.hypot(dx, dz));
      const zoom = Math.min(1, palace * 2);
      this.camera.position.x += (rider.x - (6 * dx) / distance - this.camera.position.x) * zoom;
      this.camera.position.z += (rider.z - (6 * dz) / distance - this.camera.position.z) * zoom;
      this.camera.position.y += 0.5 * zoom;
      ahead.x += (rider.x + (14 * dx) / distance - ahead.x) * zoom;
      ahead.z += (rider.z + (14 * dz) / distance - ahead.z) * zoom;
      ahead.y += 1.65 * zoom;
    }
    this.jouvert?.aim(metres, this.camera.position, ahead);
    this.climbers?.aim(metres, this.camera.position, ahead);
    this.camera.lookAt(
      ahead.x,
      ahead.y +
        (calobra ? 1.2 : this.arena ? 2.45 : LOOK_UP) +
        (view?.rise ?? 0) +
        1.8 * skyline +
        1.2 * train -
        Math.abs(shoulder) * 0.12,
      ahead.z,
    );
    // A restrained chase-camera roll lets the rider read the banking and still see the opposite straight.
    if (back.bank) this.camera.rotateZ(back.bank * 0.32);
    this.sky?.position.copy(this.camera.position);
    this.gardenaTrees?.follow(back.x, back.z);
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
    this.parkTraffic?.update(0, metres);
    this.riderBatch?.follow();
    this.aim(metres);
    this.street?.at(metres);
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
    this.quay?.at(time);
    this.marinaBoats?.at(time);
    this.fringe?.at(time);
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
    drawn.vicunaHeadHeight = this.atacamaWildlife?.headHeight ?? null;
    drawn.flamingoBillHeight = this.atacamaWildlife?.billHeight ?? null;
    drawn.sprayHeight = this.swell?.height ?? null;
    drawn.cirqueSun = this.weather ? this.sun.intensity : null;
    drawn.horseLane = this.livestock?.horseLane ?? null;
    drawn.guitarHand = this.performers?.guitarHand ?? null;
    drawn.reefCrest = this.reef?.crest ?? null;
    drawn.eveningLight = this.evening?.value ?? null;
    drawn.ferryX = this.bayBoats?.ferryX ?? this.ferries?.ferryX ?? null;

    drawn.clubLane = this.bunch?.clubLane ?? null;
    drawn.highlandSun = this.highlandWeather ? this.sun.intensity : null;
    drawn.sheepLane = this.highlandLivestock?.sheepLane ?? null;
    drawn.fallingWater = this.bigSurCoast?.fallHeight ?? null;
    drawn.surfCrest = this.bigSurCoast?.crest ?? null;
    drawn.illumination = this.trams?.illumination ?? null;
    drawn.tramMetres = this.trams?.nearestMetres ?? null;
    drawn.throwHeight = this.holi?.throwHeight ?? null;
    drawn.powderRise = this.holi?.powderRise ?? null;
    drawn.rickshawPosition = this.holi?.rickshawPosition ?? null;
    drawn.chainSwing = this.jouvert?.chainSwing ?? null;
    drawn.panMallet = this.jouvert?.panMallet ?? null;
    drawn.speakerTruck = this.jouvert?.speakerTruck ?? null;
    drawn.crowdClearance = this.jouvert?.crowdClearance ?? null;
    drawn.handHeight = this.climbers?.handHeight ?? null;
    drawn.belayHand = this.climbers?.belayHand ?? null;
    drawn.mistPosition = this.yard?.mistPosition ?? null;
    drawn.speakerDepth = this.yard?.speakerDepth ?? null;
    drawn.valleyMist = this.mill?.valleyMist ?? null;
    drawn.paddleHeight = this.mill?.paddleHeight ?? null;
    drawn.walkerStride = this.surf?.walkerStride ?? null;
    drawn.foamAdvance = this.surf?.foamAdvance ?? null;
    drawn.pushCarPosition = this.speedWeek?.pushCar.position.x;
    drawn.mirageHeight = this.speedWeek?.mirage.scale.y;
    drawn.flagTip = this.speedway?.flagTip ?? this.dalesFlags?.tip ?? null;
    drawn.balloonHeight = this.speedway?.balloonHeight;
    drawn.bannerTip = this.parade?.bannerTip;
    drawn.floatPosition = this.parade?.floatPosition;
    drawn.cabPosition = this.commute?.cabPosition;
    drawn.ferryPosition = this.commute?.ferryPosition;
    drawn.boatPosition = this.cruise?.boatPosition;
    drawn.touristPosition = this.cruise?.touristPosition;
    drawn.packDistance = this.camp?.packDistance;
    drawn.coachDistance = this.camp?.coachDistance;
    drawn.chairDistance = this.lifts?.chairDistance;
    drawn.cowPitch = this.lifts?.cowPitch;
    drawn.moosePitch = this.cabotWildlife?.moosePitch;
    drawn.boatHeel = this.cabotWildlife?.boatHeel;
    drawn.horseStride = this.parkTraffic?.horseStride;
    drawn.clubDistance = this.parkTraffic?.clubDistance;
    drawn.flagAngle = this.champsParade?.flagAngle ?? this.galibier?.flagAngle ?? null;
    drawn.sprintLane = this.champsParade?.sprintLane;
    drawn.hikerX = this.ligurianCoast?.hikerX ?? null;
    drawn.boatRoll = this.ligurianCoast?.boatRoll ?? this.harbour?.boatRoll ?? null;
    drawn.walkerX = this.headland?.walkerX ?? this.plaza?.walkerX ?? null;
    drawn.breakerHeight = this.headland?.breakerHeight ?? null;
    drawn.foilX = this.ferries?.foilX ?? null;
    drawn.dancerY = this.crews?.dancerY ?? null;
    drawn.passengerY = this.crews?.passengerY ?? null;
    drawn.gullY = this.harbour?.gullY ?? null;
    drawn.climberX = this.climbingRiders[0]?.group.position.x ?? null;
    drawn.chairX = this.cypressLift?.chairX ?? null;
    drawn.sheepX = this.flock?.sheepX ?? null;
    drawn.pickupZ = this.daytonaBoardwalk?.pickupZ ?? null;
    drawn.gondolaY = this.daytonaBoardwalk?.gondolaY ?? null;
    drawn.mirageOpacity = this.desertBasin?.mirageOpacity ?? null;
    drawn.ravenHeading = this.desertBasin?.ravenHeading ?? null;
    drawn.taxiZ = this.festival?.taxiZ ?? null;
    drawn.sparkY = this.festival?.sparkY ?? null;
    drawn.villageFronts = this.shore?.villageFronts ?? 0;
    drawn.trainPosition = this.lakes?.trainPosition ?? null;
    drawn.kiteHeight = this.lakes?.kiteHeight ?? null;
    drawn.heatPhase = this.etna?.heatPhase ?? null;
    drawn.busPosition = this.etna?.busPosition ?? null;
    drawn.plumeHeight = this.etna?.plumeHeight ?? null;
    drawn.gondolaPosition = this.etna?.gondolaPosition ?? null;
    drawn.walkerPosition = this.etna?.walkerPosition ?? this.escarpment?.walkerPosition ?? null;
    drawn.cloudBearing = this.fen?.cloudBearing ?? null;
    drawn.dustPosition = this.fen?.dustPosition ?? null;
    drawn.turbineAngle = this.fen?.turbineAngle ?? null;
    drawn.shadowOffset = this.fen?.shadowOffset ?? null;
    drawn.leafAngle = this.escarpment?.leafAngle ?? null;
    drawn.sheepHead = this.escarpment?.sheepHead ?? null;
    drawn.visitorPosition = this.subaru?.visitorPosition ?? null;
    drawn.cloudPosition =
      this.subaru?.cloudPosition ??
      this.galibier?.cloudPosition ??
      this.gardena?.cloudPosition ??
      null;
    drawn.shuttlePosition = this.subaru?.shuttlePosition ?? null;
    drawn.iceAboveLake = this.furka?.iceAboveLake ?? null;
    drawn.postbusDistance = this.furka?.postbusDistance ?? null;
    drawn.cowHead = this.furka?.cowHead ?? this.gardena?.cowHead ?? null;
    drawn.cloudHeight = this.furka?.cloudHeight ?? null;
    drawn.postbusPosition = this.furka?.postbusPosition ?? null;
    drawn.spectatorHeight = this.galibier?.spectatorHeight ?? null;
    drawn.streamOffset = this.galibier?.streamOffset ?? null;
    drawn.nearestRider = this.gardena?.nearestRider ?? null;
    drawn.cyclistPosition = this.gardena?.cyclistPosition ?? null;
    drawn.tier = this.tier;
    drawn.backend = this.backend;
    drawn.haze = this.basin ? this.scene.fog?.color.getHex() : undefined;
    drawn.boatX = this.basin?.boatX;
    drawn.kiteAngle = this.basin?.kiteAngle;
    drawn.trainX = this.railway?.trainX;
    drawn.steamHeight = this.railway?.steamHeight;
    drawn.wingAngle = this.plaza?.wingAngle;
    drawn.ferryRoll = this.quay?.ferry.rotation.z ?? null;
    drawn.walkerZ = this.quay?.walkerZ ?? null;
    drawn.cabinHeight = this.funivia?.holder.position.y ?? null;
    drawn.dhowRoll = this.marinaBoats?.dhow.rotation.z ?? null;
    drawn.wheelAngle = this.marinaBoats?.wheel.rotation.z ?? null;
    drawn.spectatorSections = this.street?.spectatorSections ?? 0;
    drawn.clubY = this.fringe?.clubY ?? null;
    drawn.torchAngle = this.fringe?.torchAngle ?? null;
    drawn.drawCalls = renderer.info.render.drawCalls;
    drawn.triangles = renderer.info.render.triangles;
    drawn.smokeHeight = this.smoke?.mesh.position.y ?? null;
    if (this.boardwalk) {
      Object.assign(drawn, {
        carRadius: this.boardwalk.street.carRadius,
        trainX: this.boardwalk.street.trainX,
      });
    }
    if (this.copacabana) {
      Object.assign(drawn, {
        volleyballY: this.copacabana.volleyballY,
        breakerX: this.copacabana.breakerX,
      });
    }
    if (this.commuters)
      Object.assign(drawn, {
        cargoPedalY: this.commuters.cargoPedalY,
        markerCount: this.commuters.markerCount,
      });
    if (this.arena) {
      const q = this.camera.quaternion;
      Object.assign(drawn, this.arena.state, {
        cameraRoll: Math.asin(2 * (q.x * q.y + q.w * q.z)),
      });
    }
    if (this.panorama) {
      Object.assign(drawn, this.panorama.state);
      for (const { key, centre } of this.monuments) {
        const screen = this.projected.copy(centre).project(this.camera);
        (drawn as Record<string, unknown>)[key] = screen.z < 1 ? screen.x : Infinity;
      }
    }
    if (this.championship) Object.assign(drawn, this.championship.measure(this.camera));
    if (this.glastonbury) Object.assign(drawn, this.glastonbury.state);
    if (this.park) Object.assign(drawn, this.park.measure(this.camera));
    if (this.canyon) Object.assign(drawn, this.canyon.measure(this.camera));
    if (this.northFace) Object.assign(drawn, this.northFace.report(this.camera));
    if (this.coastline) Object.assign(drawn, this.coastline.report(this.camera));
    if (this.summit) Object.assign(drawn, this.summit.report(this.camera));
    if (this.river) Object.assign(drawn, this.river.report(this.camera));
    if (this.fells) Object.assign(drawn, this.fells.report(this.camera));
    if (this.malecon) Object.assign(drawn, this.malecon.report(this.camera));
    if (this.dam) Object.assign(drawn, this.dam.report(this.camera));
    if (this.strip) Object.assign(drawn, this.strip.report());
    if (this.icelandCoast) Object.assign(drawn, this.icelandCoast.report(drawn.groups));
    if (this.divide) Object.assign(drawn, this.divide.report(drawn.groups));
    if (this.mountain) Object.assign(drawn, this.mountain.report());
    if (this.rush) Object.assign(drawn, this.rush.report());
    if (this.vents) Object.assign(drawn, this.vents.report());
    if (this.broadway) Object.assign(drawn, this.broadway.report());
    if (this.queenK) Object.assign(drawn, this.queenK.report());
    if (this.cobbledBanks) Object.assign(drawn, this.cobbledBanks.report());
    if (this.kwaremontVillage) Object.assign(drawn, this.kwaremontVillage.report());
    if (this.hanami) Object.assign(drawn, this.hanami.report());
    if (this.chicagoShore) Object.assign(drawn, this.chicagoShore.report());
    if (this.lakeLouise) Object.assign(drawn, this.lakeLouise.report());
    if (this.letras) Object.assign(drawn, this.letras.report());
    if (this.lisbonHills) Object.assign(drawn, this.lisbonHills.report());
    if (this.loireRiver) Object.assign(drawn, this.loireRiver.report());
    if (this.urubambaGorge) Object.assign(drawn, this.urubambaGorge.report());
    if (this.bayfrontNight) Object.assign(drawn, this.bayfrontNight.report());
    if (this.jemaaSquare) Object.assign(drawn, this.jemaaSquare.report());
    if (this.stCharlesParade) Object.assign(drawn, this.stCharlesParade.report());
    if (this.maunaKeaSummit) Object.assign(drawn, this.maunaKeaSummit.report());
    if (this.merceFestival) Object.assign(drawn, this.merceFestival.report());
    if (this.oceanDrive) Object.assign(drawn, this.oceanDrive.report());
    if (this.moabTrail) Object.assign(drawn, this.moabTrail.report());
    if (this.monacoHarbour) Object.assign(drawn, this.monacoHarbour.report());
    if (this.montmartreSquare) Object.assign(drawn, this.montmartreSquare.report());
    if (this.montrealFestival) Object.assign(drawn, this.montrealFestival.report());
    if (this.trainingHighlands) Object.assign(drawn, this.trainingHighlands.report());
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
