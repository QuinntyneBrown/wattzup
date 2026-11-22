// The World Ride scene drawn with Three.js's WebGPU renderer, on WebGPU or its WebGL2 backend
// (ADRs 0020, 0021). It and the scene parts it builds (world-oldtown.ts, world-cyclist.ts) are the
// only files that import Three.js; they are loaded on demand through world-renderer-loader.ts.
// Which techniques are drawn is decided by render-quality.ts (L2-111).
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  convertToTexture,
  float,
  mrt,
  normalView,
  output,
  packNormalToRGB,
  pass,
  screenUV,
  sin,
  smoothstep,
  time,
  vec2,
  vec4,
  velocity,
} from 'three/tsl';
import {
  AgXToneMapping,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  type Light,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Node,
  NoToneMapping,
  type Object3D,
  type PassNode,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RenderPipeline,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import type {
  SceneFrame,
  SceneRider,
  TimedSegment as Segment,
  WorldId,
  RealPlace,
  SceneryState,
  WorldRenderer,
  WorldStartOptions,
  WorldStartProgress,
} from '@telo/api';
// A type only, erased at build: the tiles' file is imported when the rider streams (L2-066).
import type { PhotorealTiles } from './photoreal-tiles';
import { heldFps } from './held-fps';
import { compiledFeatures } from './material-features';
import { skyStops } from './drawn-look';
import { type MutablePacerOnRoad, PACERS, pacersOnRoad } from './pacers';
import { ridersOnRoad } from './race-riders';
import {
  type Backend,
  FrameBudget,
  nextLower,
  startTier,
  techniquesAt,
  type Tier,
} from './render-quality';
import {
  materialVariants,
  PROBE_KEY,
  probeReport,
  readWorldRideProbe,
  type WorldRideProbeReport,
  takeDropRequest,
} from './world-ride-probe';
import { BEND_SAMPLES, bendAhead, bendPoint, heading, lean, racingLine } from './scene-bend';
import {
  EASE_PER_SECOND,
  MIN_SPEED,
  type MutableRoadPoint,
  nextArch,
  roadAhead,
  type RoadPoint,
} from './scene-road';
import { RoadBend } from './world-bend';
import { inkOutline } from './world-ink';
import { flatSky, ToonLook } from './world-toon';
import { Corners } from './world-corners';
import { RampSign } from './world-ramps';
import type { Cyclist } from './world-cyclist';
import { CyclistKit } from './world-cyclist';
import type { DocklandsStreet } from './world-docklands';
import type { SceneStreet, StreetFactory } from './world-kit';
import type { OldTownStreet } from './world-oldtown';
import { STREETS } from './world-streets';
import { targetGrade, type World } from './worlds';

interface Look {
  readonly sky: number;
  readonly fog: number;
  readonly ground: number;
  readonly road: number;
  /** The sun's elevation above the horizon, in degrees; below 0 is night. */
  readonly sun: number;
  /** A road wet from rain or spray (technique 14). */
  readonly wet: boolean;
  /** Shimmer over a hot road (technique 50). */
  readonly haze: boolean;
  /** The physical sky's haze and its blue (technique 11). */
  readonly turbidity?: number;
  readonly rayleigh?: number;
  /** Where the sun stands, in degrees from straight ahead; negative is left. */
  readonly azimuth?: number;
  /** The sun's strength and colour, and the sky's fill, where a scene sets its own. */
  readonly light?: { readonly sun: number; readonly fill: number; readonly colour: number };
  /** Where the fog starts and where it hides everything, in metres. */
  readonly fogRange?: readonly [number, number];
  /**
   * A night scene's key light, the moon over the city glow: its elevation and azimuth in
   * degrees, strength and colour, and the sky's fill with the colour it comes down in.
   */
  readonly moon?: {
    readonly elevation: number;
    readonly azimuth: number;
    readonly strength: number;
    readonly colour: number;
    readonly fill: number;
    readonly fillSky: number;
  };
}

/** The scenes ridden on Old Town's cobbles rather than tarmac. */
const COBBLED: ReadonlySet<WorldId> = new Set<WorldId>([
  'oldtown',
  'koppenberg',
  'champs',
  'montmartre',
]);

/** Until each scene's own look lands: sky, fog, ground, road, sun, wet and haze. */
const LOOKS: Record<WorldId, Look> = {
  docklands: {
    sky: 0x0b1030,
    // The street fades into the city's violet haze, the colour of the sky's glow at the horizon.
    fog: 0x2a2150,
    ground: 0x1c1e2b,
    road: 0x40434f,
    sun: -4,
    wet: true,
    haze: false,
    // Moonlight from behind the rider's left shoulder, and the violet glow of the city above.
    moon: {
      elevation: 34,
      azimuth: -150,
      strength: 1.6,
      colour: 0xaab8ff,
      fill: 2.2,
      fillSky: 0x6a5f9e,
    },
    fogRange: [40, 520],
  },
  granite: {
    sky: 0x8fb6d9,
    fog: 0xc9d6e2,
    ground: 0x5d6b4f,
    road: 0x4a4a4a,
    sun: 6,
    wet: false,
    haze: false,
  },
  oldtown: {
    sky: 0xa9c7e8,
    fog: 0xdcd8cf,
    ground: 0x6b6256,
    road: 0xd9d2c8,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 2.6,
    azimuth: -150,
    light: { sun: 3.5, fill: 1.0, colour: 0xffe2b6 },
    fogRange: [30, 430],
  },
  prairie: {
    sky: 0xf0c27b,
    fog: 0xf3d9a8,
    ground: 0xb49a4c,
    road: 0x555555,
    sun: 8,
    wet: false,
    haze: true,
  },
  dolomites: {
    sky: 0x9cc4ea,
    fog: 0xdbe7f0,
    ground: 0x4f7a3a,
    road: 0x4b4b4b,
    sun: 40,
    wet: false,
    haze: false,
  },
  // Sunrise over the Atlantic: the sun low ahead, just right of the drive, a peach haze down it.
  southbeach: {
    sky: 0xf6b88a,
    fog: 0xf3c9a6,
    ground: 0xe6d3ad,
    road: 0x5d5e66,
    sun: 7,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.8,
    azimuth: 18,
    light: { sun: 3.2, fill: 1.15, colour: 0xffc796 },
    fogRange: [120, 1100],
  },
  // A clear midsummer afternoon over Lake Ontario, the sun behind the rider's left shoulder.
  // Dusk over the Thames: the sun low behind the rider, the sky rose and violet, the road wet.
  westminster: {
    sky: 0xb48aa0,
    fog: 0x8f8597,
    ground: 0x3a3a44,
    road: 0x3c3d42,
    sun: 3,
    wet: true,
    haze: false,
    turbidity: 6,
    rayleigh: 3,
    azimuth: -155,
    light: { sun: 2.6, fill: 1.25, colour: 0xffb27a },
    fogRange: [70, 1100],
  },
  // An early summer morning in the park: the sun low behind the rider, a soft haze over Midtown.
  centralpark: {
    sky: 0x9cc8ea,
    fog: 0xc9d6df,
    ground: 0x4e8a3a,
    road: 0x4a4c51,
    sun: 16,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.8,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.0, colour: 0xffe7c4 },
    fogRange: [70, 1000],
  },
  // Indoors under the floodlights: a high warm key from the roof, the far end lost in the haze.
  ghent: {
    sky: 0x1c1a19,
    fog: 0x2b2622,
    ground: 0x3b3f45,
    road: 0xc9a06a,
    sun: 72,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 0.5,
    azimuth: -160,
    light: { sun: 2.4, fill: 1.3, colour: 0xfff0d8 },
    fogRange: [30, 240],
  },
  // Dusk on the Golden Mile: the last light low behind the rider, the illuminations switched on.
  blackpool: {
    sky: 0x2d2c5c,
    fog: 0x3b3766,
    ground: 0x8f7b62,
    road: 0x4c4d55,
    sun: 8,
    wet: false,
    haze: false,
    turbidity: 8,
    rayleigh: 3.5,
    azimuth: -150,
    light: { sun: 2.2, fill: 2.0, colour: 0xffa878 },
    fogRange: [80, 1400],
  },
  // Dawn over the suburb: the sun just up behind the rider, a pink-gold sky, long shadows.
  suburbia: {
    sky: 0xf2c9b0,
    fog: 0xecd8cc,
    ground: 0x5a9440,
    road: 0x55565c,
    sun: 7,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 2.4,
    azimuth: -150,
    light: { sun: 3.0, fill: 1.2, colour: 0xffc89a },
    fogRange: [70, 1100],
  },
  // A warm August bank holiday afternoon in west London: high sun behind the rider, light haze.
  nottinghill: {
    sky: 0x9fc4e4,
    fog: 0xcdd6dd,
    ground: 0x8a867e,
    road: 0x45464b,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 1.6,
    azimuth: -140,
    light: { sun: 3.2, fill: 1.0, colour: 0xfff0dc },
    fogRange: [70, 1100],
  }, // Late morning in lower Manhattan: a high sun behind the rider lights the towers' upper floors
  // while the canyon floor sits in their shade, the sky a clean blue over the ticker tape.
  knicks: {
    sky: 0x8fbbe6,
    fog: 0xbfcbd6,
    ground: 0x8d8d8f,
    road: 0x45464b,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 2.5,
    rayleigh: 1.6,
    azimuth: -160,
    light: { sun: 3.0, fill: 1.25, colour: 0xfff1dc },
    fogRange: [160, 1500],
  },
  // The Strip after midnight: a desert night sky over the glow, the neon doing the lighting.
  vegas: {
    sky: 0x0a0b22,
    fog: 0x261a3a,
    ground: 0x23222b,
    road: 0x3a3b44,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 40,
      azimuth: -150,
      strength: 1.2,
      colour: 0xc8b8ff,
      fill: 2.4,
      fillSky: 0x7a5aa0,
    },
    fogRange: [60, 1500],
  },
  // A golden afternoon in the high desert: the sun behind the rider, a clear deep sky, warm haze far off.
  route66: {
    sky: 0x6fa8dc,
    fog: 0xe6c7a2,
    ground: 0xb9744a,
    road: 0x5a5651,
    sun: 24,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.3,
    azimuth: -140,
    light: { sun: 3.4, fill: 1.0, colour: 0xffe2b8 },
    fogRange: [150, 2600],
  },
  // Golden hour on the Santa Monica Bay: the sun low over the ocean on the rider's left throws
  // long shadows across the path, and a warm marine haze gilds the pier and the mountains ahead
  // under a sky still blue overhead.
  venice: {
    sky: 0x7fb0d8,
    fog: 0xe8d2b0,
    ground: 0xe3cfa5,
    road: 0x55565b,
    sun: 9,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.3,
    azimuth: -72,
    light: { sun: 3.4, fill: 1.0, colour: 0xffc98c },
    fogRange: [110, 1300],
  },
  // A May morning on the Herengracht: a low, warm sun behind the rider throws the elms' long
  // shadows across the street, and a pale golden haze hangs over the water.
  amsterdam: {
    sky: 0x9ec4e6,
    fog: 0xdcdcd6,
    ground: 0x3d4a3e,
    road: 0x6b4a3a,
    sun: 19,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2,
    azimuth: -150,
    light: { sun: 3.3, fill: 1.2, colour: 0xffe6c4 },
    fogRange: [70, 950],
  },
  // Sunrise on the Giza plateau: a low gold sun behind the rider, warm dust in the air.
  giza: {
    sky: 0xf0c890,
    fog: 0xe8c49a,
    ground: 0xd9a86a,
    road: 0x7a6e66,
    sun: 9,
    wet: false,
    haze: true,
    turbidity: 9,
    rayleigh: 2.4,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.2, colour: 0xffc890 },
    fogRange: [120, 2600],
  },
  // A bright Florida morning on the beach: high sun behind the rider, sea haze on the horizon.
  daytona: {
    sky: 0x8ec8ee,
    fog: 0xcfe2ee,
    ground: 0xe0c9a0,
    road: 0xc9a878,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -145,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [80, 1400],
  },
  // A misty spring morning in the Flemish Ardennes: a pale sun high behind the mist, the cobbles
  // wet and slick, the fields fading into grey-green a few hundred metres off.
  koppenberg: {
    sky: 0xb9c4c6,
    fog: 0xc9cec4,
    ground: 0x5f8a3e,
    road: 0x6d6a66,
    sun: 22,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1.2,
    azimuth: -130,
    light: { sun: 2.2, fill: 1.5, colour: 0xf2f0e6 },
    fogRange: [35, 520],
  },
  // A clear, windswept noon high on the Ventoux: hard light behind the rider, a pale sky scoured by the mistral.
  ventoux: {
    sky: 0x7fb2e6,
    fog: 0xc9d6e2,
    ground: 0x8a9aa8,
    road: 0x55565c,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.1, colour: 0xfffaf0 },
    fogRange: [150, 3200],
  },
  // A bright late-summer afternoon in the Loop: the sun behind the rider, light slanting under the L.
  chicago: {
    sky: 0x8fbfe8,
    fog: 0xc8d4de,
    ground: 0x6a6a6a,
    road: 0x4a4b52,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 3.0, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [80, 900],
  },
  // A foggy summer morning in Golden Gate Park: the marine layer rolling in off the Pacific, the
  // sun a pale glow high behind it, soft light under the eucalyptus and the windmill grey ahead.
  goldengate: {
    sky: 0xb4bec6,
    fog: 0xc5ccd2,
    ground: 0x5f8048,
    road: 0x4b4c50,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 8,
    rayleigh: 0.8,
    azimuth: -100,
    light: { sun: 1.5, fill: 1.9, colour: 0xeef0ee },
    fogRange: [20, 380],
  },
  // Late afternoon on the Malecón, the hour Havana comes out to the wall: a low golden sun
  // behind the rider raking the façades, long shadows, and a warm salt haze over the Gulf.
  havana: {
    sky: 0x86bde6,
    fog: 0xe6dccb,
    ground: 0x1f6a96,
    road: 0x5d5e66,
    sun: 15,
    wet: false,
    haze: false,
    turbidity: 5.5,
    rayleigh: 1.6,
    azimuth: -130,
    light: { sun: 3.4, fill: 1.0, colour: 0xffd29a },
    fogRange: [110, 2200],
  },
  // A clear Cape morning: the sun behind the rider, the Atlantic glittering, the mountain sharp.
  seapoint: {
    sky: 0x7fb8ea,
    fog: 0xd2e0ea,
    ground: 0x1e5a78,
    road: 0x8a7a64,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: -145,
    light: { sun: 3.1, fill: 1.2, colour: 0xfff6e8 },
    fogRange: [150, 5000],
  },
  // A summer evening in the Quartier des Spectacles: the sun just down behind the rider, the sky violet, the festival lit.
  montreal: {
    sky: 0x6a5a9a,
    fog: 0x4a4068,
    ground: 0x55555a,
    road: 0x5e5f68,
    sun: 7,
    wet: false,
    haze: true,
    turbidity: 6,
    rayleigh: 2.6,
    azimuth: -150,
    light: { sun: 1.8, fill: 1.4, colour: 0xffb88a },
    fogRange: [60, 700],
  },
  // A clear Vancouver morning on the seawall: low sun over the park, a blue sky, the bay bright
  // and the North Shore mountains soft in the distance.
  stanleypark: {
    sky: 0x86b9e6,
    fog: 0xcfdde8,
    ground: 0x3e5a34,
    road: 0x55565a,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.8,
    rayleigh: 1.4,
    azimuth: 120,
    light: { sun: 2.8, fill: 1.2, colour: 0xfff4e4 },
    fogRange: [180, 5000],
  },
  // A crisp alpine morning: the sun behind the rider, deep blue sky over the snowfields.
  stelvio: {
    sky: 0x6aa8e6,
    fog: 0xc8d8e8,
    ground: 0x7a9a68,
    road: 0x55565c,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: -150,
    light: { sun: 3.2, fill: 1.2, colour: 0xfffaf0 },
    fogRange: [200, 3600],
  },
  // A bright August afternoon in Edinburgh: broken cloud, the sun behind the rider, the stone dark.
  edinburgh: {
    sky: 0x8ab4dc,
    fog: 0xc8d0d8,
    ground: 0x6a6a6e,
    road: 0x5a5a60,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3.5,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 2.9, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [80, 900],
  },
  // A bright winter morning on Oahu's North Shore: deep blue sky, trade-wind haze, the sun high.
  northshore: {
    sky: 0x5aa0e8,
    fog: 0xbcd8e8,
    ground: 0x6a8a3a,
    road: 0x5a5a5e,
    sun: 46,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.8,
    azimuth: -140,
    light: { sun: 3, fill: 1.4, colour: 0xfff6e4 },
    fogRange: [400, 3200],
  },
  // A clear summer morning in Alta Badia: deep blue sky, the forest dark, the Dolomites pale.
  campolongo: {
    sky: 0x5a9ae0,
    fog: 0xc0d4e4,
    ground: 0x3a5a34,
    road: 0x55565c,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 3, fill: 1.4, colour: 0xfff6ea },
    fogRange: [250, 3200],
  },
  // A warm Singapore night: the sky deep indigo over the city's glow, the bay black and lit.
  marinabay: {
    sky: 0x0c1030,
    fog: 0x1a1a3a,
    ground: 0x10141c,
    road: 0x3a3b44,
    sun: -8,
    wet: false,
    haze: false,
    moon: {
      elevation: 35,
      azimuth: -150,
      strength: 1.1,
      colour: 0xc8d0ff,
      fill: 2.4,
      fillSky: 0x5a5aa0,
    },
    fogRange: [200, 2600],
  },
  // An early summer morning on the Serpentine: the sun low behind the rider's left shoulder over
  // Park Lane, raking warm light and long shadows across the lawns, mist on the lake, and
  // Kensington Gardens soft in the haze beyond the bridge.
  serpentine: {
    sky: 0x9ec4e8,
    fog: 0xe2ddd0,
    ground: 0x4f7a3a,
    road: 0x6a6a6c,
    sun: 16,
    wet: false,
    haze: false,
    turbidity: 3.6,
    rayleigh: 1.8,
    azimuth: -128,
    light: { sun: 3.0, fill: 1.0, colour: 0xffd9a8 },
    fogRange: [120, 1500],
  },
  // A golden summer evening in Paris: warm low sun behind the riders, the stone glowing.
  champs: {
    sky: 0x7aa8d8,
    fog: 0xe0d4c0,
    ground: 0xb8b0a2,
    road: 0x6a645c,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.4,
    azimuth: -170,
    light: { sun: 3, fill: 1.3, colour: 0xffe4c0 },
    fogRange: [300, 3200],
  },
  // A bright April morning over the polder: big sky, scattered cloud, the colours vivid.
  tulips: {
    sky: 0x6aa8e8,
    fog: 0xd0dce8,
    ground: 0x5a8a3a,
    road: 0x8a4a3a,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -140,
    light: { sun: 3, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [300, 3200],
  },
  // A bright Pyrenean summer afternoon: deep sky, the pasture vivid, the high rock pale.
  tourmalet: {
    sky: 0x5a9ae0,
    fog: 0xc4d4e4,
    ground: 0x5a8a3a,
    road: 0x4f5058,
    sun: 44,
    wet: false,
    haze: false,
    turbidity: 2.8,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 3, fill: 1.4, colour: 0xfff6ea },
    fogRange: [250, 3200],
  },
  // A warm Californian afternoon in the Napa Valley, the sun lower now behind the rider's left
  // shoulder: golden light raking across the vine rows with long shadows, and a dusty warm haze
  // laying the hills and the ridges back in layers.
  napa: {
    sky: 0x8cbce8,
    fog: 0xead8b4,
    ground: 0xb59a5a,
    road: 0x5c5c5e,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 5.2,
    rayleigh: 1.3,
    azimuth: -122,
    light: { sun: 3.3, fill: 1.05, colour: 0xffd49c },
    fogRange: [180, 2300],
  },
  // A warm June evening on Worthy Farm: the sun low and golden, a soft haze over the fields.
  glastonbury: {
    sky: 0x7ab0e0,
    fog: 0xe0d8c8,
    ground: 0x5a8a3a,
    road: 0x7a7e84,
    sun: 18,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.5,
    azimuth: -160,
    light: { sun: 2.8, fill: 1.4, colour: 0xffe4b8 },
    fogRange: [250, 2800],
  },
  // Sunrise over Elliott Bay: the sun just up, pink and gold light, cold blue shadows.
  pikeplace: {
    sky: 0x9ab0d0,
    fog: 0xe8c8c0,
    ground: 0x3a5a3a,
    road: 0x6a5a50,
    sun: 7,
    wet: true,
    haze: false,
    turbidity: 5,
    rayleigh: 2.4,
    azimuth: 70,
    light: { sun: 2.4, fill: 1.3, colour: 0xffc8a0 },
    fogRange: [300, 3600],
  },
  // A grey, blustery Lake District day: flat light under low cloud, the fells muted and damp.
  hardknott: {
    sky: 0x9aa8b4,
    fog: 0xb8c0c4,
    ground: 0x5a6a3a,
    road: 0x55565a,
    sun: 30,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 0.8,
    azimuth: -130,
    light: { sun: 1.6, fill: 1.8, colour: 0xeef0f2 },
    fogRange: [400, 4200],
  },
  // A blazing July afternoon on the Alpe: the clear, thin air of altitude scatters little, so the
  // sky stays a deep blue down to the peaks; the sun high and a little behind the rider's left
  // shoulder, sharp shadows.
  alpe: {
    sky: 0x5f9fe0,
    fog: 0xc9d8ea,
    ground: 0x5a8a3a,
    road: 0x4e4f54,
    sun: 48,
    wet: false,
    haze: false,
    turbidity: 1.1,
    rayleigh: 0.7,
    azimuth: -140,
    light: { sun: 3.3, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [260, 4200],
  },
  // Sunrise in the Sonoran desert: the sun just up, long shadows, the sky pink to clear blue.
  saguaro: {
    sky: 0x8ab0e0,
    fog: 0xf0c8b0,
    ground: 0xc8a07a,
    road: 0x505058,
    sun: 9,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 2.2,
    azimuth: -110,
    light: { sun: 3, fill: 1.2, colour: 0xffc890 },
    fogRange: [400, 4200],
  },
  // A cool, bright Romsdal summer morning: clear northern light, crisp shadows, mist on the ledges.
  trollstigen: {
    sky: 0x7aa8d8,
    fog: 0xd0dce4,
    ground: 0x4a7a3a,
    road: 0x4f5054,
    sun: 34,
    wet: true,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.4,
    azimuth: 150,
    light: { sun: 2.6, fill: 1.5, colour: 0xf4f6ff },
    fogRange: [400, 3800],
  },
  // A bright Riviera spring afternoon: deep blue sky and sea, warm light on the terraces.
  poggio: {
    sky: 0x5a9ae8,
    fog: 0xd0e0ec,
    ground: 0x6a8a4a,
    road: 0x555860,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.4,
    azimuth: -120,
    light: { sun: 3, fill: 1.4, colour: 0xfff4e0 },
    fogRange: [400, 4400],
  },
  // A golden Parisian afternoon on the butte: the sun sinking in the west, its warm light raking
  // down the street onto the fronts on the left while the right stays in shade, a shadow line
  // across the cobbles, and a soft golden haze over the rooftops.
  montmartre: {
    sky: 0x8ab8e0,
    fog: 0xecd6b0,
    ground: 0x8a8478,
    road: 0x6a6660,
    sun: 32,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 1.2,
    azimuth: 40,
    light: { sun: 4.2, fill: 1.0, colour: 0xffc380 },
    fogRange: [200, 2600],
  },
  // Race day in May: a hot, clear blue sky and hard midday light over the oval.
  brickyard: {
    sky: 0x4a8ae0,
    fog: 0xd4e0ec,
    ground: 0x4a8a3a,
    road: 0x45474c,
    sun: 58,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.3,
    azimuth: -140,
    light: { sun: 3.2, fill: 1.4, colour: 0xfffaf0 },
    fogRange: [400, 4000],
  },
  // A hot, golden Yucatán afternoon: high humid haze, warm light on the white stone.
  chichen: {
    sky: 0x6aa0d8,
    fog: 0xd8e0c8,
    ground: 0x3a6a2a,
    road: 0xc8bea8,
    sun: 36,
    wet: false,
    haze: false,
    turbidity: 5,
    rayleigh: 1.6,
    azimuth: -150,
    light: { sun: 2.9, fill: 1.5, colour: 0xffeccc },
    fogRange: [300, 3200],
  },
  // A blazing summer morning on the salt: a deep blue sky paling to white at the horizon, the sun
  // high, hard shadows on the dazzling white, and the far ranges blue-grey in the heat.
  bonneville: {
    sky: 0x6aa6e0,
    fog: 0xdfe8f2,
    ground: 0xeeece4,
    road: 0xe2e0d8,
    sun: 52,
    wet: false,
    haze: false,
    turbidity: 1.2,
    rayleigh: 0.8,
    azimuth: 40,
    light: { sun: 3, fill: 0.9, colour: 0xfff6e8 },
    fogRange: [400, 5200],
  },
  // A clear early-summer morning on the lake: soft bright light, a faint haze over the water.
  como: {
    sky: 0x7ab0e0,
    fog: 0xd4e2e8,
    ground: 0x3a6a3a,
    road: 0x4f5156,
    sun: 32,
    wet: false,
    haze: false,
    turbidity: 3.2,
    rayleigh: 1.5,
    azimuth: 120,
    light: { sun: 2.7, fill: 1.5, colour: 0xfff6e8 },
    fogRange: [400, 4200],
  },
  // A bright late-spring morning on the valley floor: clean mountain air, sun on the granite.
  yosemite: {
    sky: 0x6aa8e8,
    fog: 0xd0dce8,
    ground: 0x5a7a34,
    road: 0x4a4c50,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.4,
    azimuth: 150,
    light: { sun: 2.9, fill: 1.5, colour: 0xfff4e4 },
    fogRange: [600, 6000],
  },
  // A clear, windy afternoon high on the volcano: thin bright air, hard light on the black rock.
  etna: {
    sky: 0x5a96d8,
    fog: 0xc8d4e0,
    ground: 0x2e2c2c,
    road: 0x3e4044,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.3,
    azimuth: -140,
    light: { sun: 3.0, fill: 1.6, colour: 0xfff2e0 },
    fogRange: [800, 9000],
  },
  // New Year's Eve in Times Square: a night sky over the glow, the screens doing the lighting.
  timessquare: {
    sky: 0x0b0a20,
    fog: 0x1a1430,
    ground: 0x2a2a30,
    road: 0x34353c,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 40,
      azimuth: -150,
      strength: 1.0,
      colour: 0xc8c0ff,
      fill: 2.6,
      fillSky: 0x8a6ab0,
    },
    fogRange: [60, 1400],
  },
  // A bright, cool summer morning high in the Alps: clear air, crisp light on granite and grass.
  tremola: {
    sky: 0x5a98e0,
    fog: 0xd0dce8,
    ground: 0x5a7a34,
    road: 0x7a7670,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.3,
    azimuth: 140,
    light: { sun: 2.9, fill: 1.6, colour: 0xfff6ea },
    fogRange: [700, 8000],
  },
  // A cloudless morning high above the sea of clouds: thin air, a deep blue sky, hard bright light.
  teide: {
    sky: 0x3a7ad8,
    fog: 0xd8e4f0,
    ground: 0x5a4a3e,
    road: 0x3e4044,
    sun: 46,
    wet: false,
    haze: false,
    turbidity: 1.8,
    rayleigh: 1.1,
    azimuth: 130,
    light: { sun: 3.1, fill: 1.6, colour: 0xfff4e4 },
    fogRange: [1200, 14000],
  },
  // Race weekend on the Riviera: a clear deep blue sky, the sun high behind the rider over the
  // harbour so the yachts shine white, the sea glittering and the far mountains blue-grey in the
  // heat haze.
  monaco: {
    sky: 0x5a9ad8,
    fog: 0xc8dcea,
    ground: 0xb8b0a0,
    road: 0x45464c,
    sun: 48,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.2,
    azimuth: 150,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff2dc },
    fogRange: [300, 2400],
  },
  // A breezy summer evening over the field: a high, wide sky and low warm light across the grass.
  tempelhof: {
    sky: 0x5a9ae0,
    fog: 0xd8e0e8,
    ground: 0x8a9a4a,
    road: 0x9a9890,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -110,
    light: { sun: 2.7, fill: 1.5, colour: 0xffe8c8 },
    fogRange: [600, 6000],
  },
  // A bright, wild Patagonian afternoon: clean cold air, hard light, the wind off the ice.
  paine: {
    sky: 0x4a8ad8,
    fog: 0xd8e4ec,
    ground: 0xb89a58,
    road: 0x8a7e6e,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.3,
    azimuth: -130,
    light: { sun: 3.0, fill: 1.6, colour: 0xfff4e4 },
    fogRange: [2500, 22000],
  },
  // Sunset over the sea off Ibiza: the sun just above the water ahead and left of the strip,
  // the sky blazing orange and pink, warm low light raking the whitewashed clubs.
  ibiza: {
    sky: 0xf7a070,
    fog: 0xf2a77a,
    ground: 0xd8c4a4,
    road: 0x4c4a52,
    sun: 4,
    wet: false,
    haze: false,
    turbidity: 8,
    rayleigh: 3,
    azimuth: -14,
    light: { sun: 2.6, fill: 1.15, colour: 0xff9a5a },
    fogRange: [150, 1900],
  },
  // A soft, grey Hebridean morning with the mist down: flat pale light, the road wet and shining.
  skye: {
    sky: 0xa8b0b8,
    fog: 0xc4cacf,
    ground: 0x6a6a3e,
    road: 0x3a3c40,
    sun: 24,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 0.6,
    azimuth: 160,
    light: { sun: 1.6, fill: 2.0, colour: 0xe8ecf0 },
    fogRange: [60, 1300],
  },
  // A bright summer morning on the harbour: clear sky, sparkling water, crisp light on glass.
  toronto: {
    sky: 0x5a9ae0,
    fog: 0xd8e4ee,
    ground: 0x5a8a3a,
    road: 0x3e4044,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.5,
    azimuth: 150,
    light: { sun: 2.9, fill: 1.5, colour: 0xfff6ea },
    fogRange: [600, 6000],
  },
  // A golden early-autumn weekend morning in the park: low warm sun, soft haze through the trees.
  prospect: {
    sky: 0x8ab4e0,
    fog: 0xe0dcc8,
    ground: 0x5a8a3a,
    road: 0x4a4c50,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 5,
    rayleigh: 1.2,
    azimuth: 120,
    light: { sun: 2.6, fill: 1.6, colour: 0xffeccc },
    fogRange: [200, 1600],
  },
  // A hot, clear spring morning over the Mediterranean: deep blue sky, hard light on limestone.
  calobra: {
    sky: 0x4a90e0,
    fog: 0xd8e2ec,
    ground: 0x8a8a5a,
    road: 0x5a5a58,
    sun: 46,
    wet: false,
    haze: false,
    turbidity: 2.5,
    rayleigh: 1.4,
    azimuth: 160,
    light: { sun: 3.0, fill: 1.5, colour: 0xfff4e4 },
    fogRange: [2500, 16000],
  },
  // Late afternoon in the Crete Senesi: the sun low and golden ahead and right, long shadows of
  // the cypresses across the gravel, the hills glowing and dust hazing the distance toward Siena.
  strade: {
    sky: 0x9cc0e0,
    fog: 0xecd4a8,
    ground: 0xc0aa6c,
    road: 0xe8e0d0,
    sun: 12,
    wet: false,
    haze: false,
    turbidity: 7.5,
    rayleigh: 1.9,
    azimuth: 60,
    light: { sun: 3.4, fill: 0.95, colour: 0xffc27a },
    fogRange: [160, 2600],
  },
  // A bright, blustery Irish spring afternoon: blue sky between fast clouds, clean light on the bog.
  wicklow: {
    sky: 0x5a94d8,
    fog: 0xc8d4dc,
    ground: 0x7a6a48,
    road: 0x55575a,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.4,
    azimuth: 210,
    light: { sun: 2.6, fill: 1.7, colour: 0xfff4e0 },
    fogRange: [900, 9000],
  },
  // Early morning high above the clouds: a deep, clear blue sky and low gold sunlight.
  haleakala: {
    sky: 0x3a7ad8,
    fog: 0xe8e0d4,
    ground: 0x6a3a2a,
    road: 0x3e3c3c,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 1.8,
    rayleigh: 1.1,
    azimuth: 150,
    light: { sun: 3.2, fill: 2.3, colour: 0xffe8c8 },
    fogRange: [2500, 16000],
  },
  // Dusk over Dubai Marina: the sun just down ahead and left, the sky burning orange low and
  // violet above, the towers' windows coming alight and the haze warm and rosy.
  dubai: {
    sky: 0x8a78b0,
    fog: 0xc89aa0,
    ground: 0xd8ccb8,
    road: 0x3e3c44,
    sun: 1.5,
    wet: false,
    haze: false,
    turbidity: 9,
    rayleigh: 3.2,
    azimuth: -20,
    light: { sun: 1.8, fill: 1.25, colour: 0xff9060 },
    fogRange: [180, 2200],
  },
  // Dusk on a festival night: the sky going orange and violet behind the Capitol, neon coming on.
  austin: {
    sky: 0x4a3a6a,
    fog: 0x6a4a6a,
    ground: 0x3a3a40,
    road: 0x3a3a40,
    sun: 2,
    wet: false,
    haze: false,
    turbidity: 9,
    rayleigh: 3,
    azimuth: 180,
    light: { sun: 1.8, fill: 2.6, colour: 0xffa868 },
    fogRange: [200, 1600],
  },
  // A bright, breezy English summer morning: blue sky, clouds sailing over the gorge's rim.
  winnats: {
    sky: 0x6a9ad8,
    fog: 0xd0dae2,
    ground: 0x6a8a3a,
    road: 0x58585a,
    sun: 42,
    wet: false,
    haze: false,
    turbidity: 3.5,
    rayleigh: 1.4,
    azimuth: 200,
    light: { sun: 2.7, fill: 1.8, colour: 0xfff4e4 },
    fogRange: [600, 6000],
  },
  // Race day in April in the Ardennes: a bright, broken spring sky over woods just coming into leaf.
  redoute: {
    sky: 0x7aa4d8,
    fog: 0xd4dce0,
    ground: 0x6a6a44,
    road: 0x5a5a5c,
    sun: 38,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.4,
    azimuth: 160,
    light: { sun: 2.6, fill: 1.8, colour: 0xfff4e4 },
    fogRange: [400, 4000],
  },
  // A Vuelta stage day in the Sierra del Aramo with the cloud down on the mountain: soft grey light.
  angliru: {
    sky: 0xa8b4c0,
    fog: 0xc8ced4,
    ground: 0x4a7a34,
    road: 0xa8a49a,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: 210,
    light: { sun: 1.9, fill: 2.2, colour: 0xf4f0ea },
    fogRange: [120, 1400],
  },
  // Indoors under the arena lights: bright, even, warm-white light from the roof's rigs high
  // overhead, and a faint haze in the hall's far end.
  velodrome: {
    sky: 0x2a2c32,
    fog: 0x6a625a,
    ground: 0x8a8e96,
    road: 0xdcae74,
    sun: 72,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 0.5,
    azimuth: 10,
    light: { sun: 2.4, fill: 1.7, colour: 0xfff4e6 },
    fogRange: [200, 1400],
  },
  // A warm, clear afternoon in early autumn on the Ligurian coast: the sun over the sea to the left.
  cinqueterre: {
    sky: 0x4a8ae0,
    fog: 0xd8e4ee,
    ground: 0x7a7a44,
    road: 0x6a6864,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.5,
    azimuth: 235,
    light: { sun: 2.9, fill: 1.6, colour: 0xfff0d8 },
    fogRange: [2500, 16000],
  },
  // A crisp, sunny winter morning of training-camp season above Girona: low sun, clear air, snow on the Pyrenees.
  angels: {
    sky: 0x5a94e0,
    fog: 0xd8e2ec,
    ground: 0x7a6040,
    road: 0x4a4a4c,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.5,
    rayleigh: 1.5,
    azimuth: 150,
    light: { sun: 2.8, fill: 1.6, colour: 0xfff0dc },
    fogRange: [2500, 16000],
  },
  // A clear midsummer afternoon on the Brooklyn shore, the sun high behind the rider's left
  // shoulder and a sea haze over the Atlantic.
  coney: {
    sky: 0x8ec4ea,
    fog: 0xd8e2ea,
    ground: 0xe8d8b4,
    road: 0xa8927a,
    sun: 48,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.2,
    azimuth: 200,
    light: { sun: 3.0, fill: 1.3, colour: 0xfff2dc },
    fogRange: [160, 1500],
  },
  // A bright, bitterly cold February afternoon in Ottawa: the low sun gold on the snow, the sky hard blue.
  winterlude: {
    sky: 0x5a90d8,
    fog: 0xdae4f0,
    ground: 0xeef2f8,
    road: 0x4e5054,
    sun: 18,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.6,
    azimuth: 215,
    light: { sun: 2.4, fill: 1.5, colour: 0xffe8c8 },
    fogRange: [1200, 9000],
  },
  // A warm, bright morning in Colombia's coffee country: high sun, clear Andean air, cloud lying in the valley.
  letras: {
    sky: 0x4a90e0,
    fog: 0xd4e2ee,
    ground: 0x2e6a2a,
    road: 0x555556,
    sun: 52,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.5,
    azimuth: 120,
    light: { sun: 2.8, fill: 1.7, colour: 0xfff4e0 },
    fogRange: [1500, 12000],
  },
  // A late summer afternoon on the Pacific shore, the low sun ahead and to the left over the
  // ocean, gilding the sand and hazing the mountains.
  santamonica: {
    sky: 0xf2c8a0,
    fog: 0xf2d6b8,
    ground: 0xead6ae,
    road: 0xc8c2b6,
    sun: 18,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 2,
    azimuth: 230,
    light: { sun: 3.0, fill: 1.2, colour: 0xffd8a8 },
    fogRange: [160, 1400],
  },
  // A bright, breezy spring afternoon in the port: clouds racing in off the North Sea, clear light between them.
  antwerp: {
    sky: 0x6a98d0,
    fog: 0xd0dae2,
    ground: 0x9a9890,
    road: 0x4c4c4e,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.3,
    azimuth: 200,
    light: { sun: 2.6, fill: 1.8, colour: 0xfff4e6 },
    fogRange: [1500, 9000],
  },
  // A clear, still summer morning at Lake Tahoe: sharp high-Sierra light and a deep blue sky.
  tahoe: {
    sky: 0x3a80e0,
    fog: 0xd4e2f0,
    ground: 0xa08a6a,
    road: 0x58585a,
    sun: 44,
    wet: false,
    haze: false,
    turbidity: 2,
    rayleigh: 1.6,
    azimuth: 120,
    light: { sun: 3.0, fill: 1.6, colour: 0xfff6e8 },
    fogRange: [2500, 16000],
  },
  // Midday in Death Valley: the sun near overhead, a hard white light off the salt, and the
  // heat haze paling the sky and the far ranges.
  deathvalley: {
    sky: 0x9cc4ec,
    fog: 0xf2e2c8,
    ground: 0xd8c4a0,
    road: 0x6a6662,
    sun: 68,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 1.4,
    azimuth: 160,
    light: { sun: 3.6, fill: 1.1, colour: 0xfff0d8 },
    fogRange: [300, 4200],
  },
  // Late on a cloudless afternoon on the Salar de Atacama: a deep high-altitude blue, the low sun turning the volcanoes pink.
  atacama: {
    sky: 0x2a6ad8,
    fog: 0xe8dcd4,
    ground: 0xece6da,
    road: 0x6a6460,
    sun: 22,
    wet: false,
    haze: false,
    turbidity: 1.5,
    rayleigh: 1.8,
    azimuth: 250,
    light: { sun: 2.8, fill: 1.4, colour: 0xffe0c0 },
    fogRange: [3000, 18000],
  },
  // Dawn at Angkor: the sky warming from violet to gold, the sun just clear of the jungle, mist on the moat.
  angkor: {
    sky: 0x8a6aa8,
    fog: 0xf0c8a8,
    ground: 0x5a5a2a,
    road: 0x9a4a2a,
    sun: 9,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.6,
    azimuth: 95,
    light: { sun: 2.8, fill: 1.9, colour: 0xffc890 },
    fogRange: [900, 7000],
  },
  // Trinidad J'Ouvert: Before sunrise: a violet sky warming to peach, the sun just up.
  jouvert: {
    sky: 0x9a7ab0,
    fog: 0xe8b8a0,
    ground: 0x5a4a36,
    road: 0x4a4644,
    sun: 5,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.6,
    azimuth: 80,
    light: { sun: 2.4, fill: 1.6, colour: 0xffb890 },
    fogRange: [300, 2600],
  },
  // Rio Sambadrome: Night: moonlight from behind, the city glow above.
  sambadrome: {
    sky: 0x0e1430,
    fog: 0x2a2a4a,
    ground: 0x3a2a40,
    road: 0x5a5560,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2,
      fillSky: 0x5a5f8e,
    },
    fogRange: [60, 700],
  },
  // Lisbon Tram Hills: A clear morning, the sun climbing behind the rider's left shoulder.
  lisbon: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0xb8a07a,
    road: 0xc8bcae,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Cornish Harbour: A grey day under soft cloud, the road damp.
  cornwall: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x4f5a3e,
    road: 0x56565a,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Copacabana Promenade: Sunset: the sun on the horizon ahead, the sky orange and rose.
  copacabana: {
    sky: 0xf09a6a,
    fog: 0xf4c098,
    ground: 0xe8d6b0,
    road: 0x6a6466,
    sun: 4,
    wet: false,
    haze: false,
    turbidity: 6,
    rayleigh: 2.8,
    azimuth: 30,
    light: { sun: 2.8, fill: 1.3, colour: 0xffb07a },
    fogRange: [200, 2200],
  },
  // Bondi to Bronte: A clear morning, the sun climbing behind the rider's left shoulder.
  bondi: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0xc9b98a,
    road: 0x8a8478,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Kīlauea Lava Road: Dusk: the sun just down, the moon rising over a violet sky.
  kilauea: {
    sky: 0x6a5a8a,
    fog: 0x8a7a9a,
    ground: 0x2a2422,
    road: 0x3a3634,
    sun: -2,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2.4,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // Shibuya Crossing: Neon night in the rain: a violet glow and a wet road.
  shibuya: {
    sky: 0x14102a,
    fog: 0x3a2a5a,
    ground: 0x20202a,
    road: 0x2e3038,
    sun: -8,
    wet: true,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xc8a8ff,
      fill: 2,
      fillSky: 0x7a5a9e,
    },
    fogRange: [40, 520],
  },
  // Día de Muertos Parade: Golden hour: the sun low ahead, the light warm and long.
  muertos: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x6a5a3a,
    road: 0x5a5658,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // San Fermín, Pamplona: A clear morning, the sun climbing behind the rider's left shoulder.
  pamplona: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0xb4a48c,
    road: 0xa89c90,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Great Ocean Road: Golden hour: the sun low ahead, the light warm and long.
  greatocean: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x8a8a4a,
    road: 0x4e4c4c,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // San Francisco Hills: Sea fog rolling in: soft light and a wet road.
  sfhills: {
    sky: 0xb8c4cc,
    fog: 0xccd4d8,
    ground: 0x6a6e60,
    road: 0x5c5c60,
    sun: 18,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 1.8, fill: 1.9, colour: 0xeef0f0 },
    fogRange: [40, 520],
  },
  // Mardi Gras, New Orleans: Dusk: the sun just down, the moon rising over a violet sky.
  mardigras: {
    sky: 0x6a5a8a,
    fog: 0x8a7a9a,
    ground: 0x3e5a32,
    road: 0x4c4a4e,
    sun: -2,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2.4,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // Victoria Harbour: Night: moonlight from behind, the city glow above.
  victoria: {
    sky: 0x0e1430,
    fog: 0x2a2a4a,
    ground: 0x28303a,
    road: 0x3c4048,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2,
      fillSky: 0x5a5f8e,
    },
    fogRange: [60, 700],
  },
  // Holi in Jaipur: Midday under a high sun, heat shimmering over the road.
  jaipur: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0xd8a08a,
    road: 0x9a7a6a,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Overseas Highway: A bright tropical day, the sun high over turquoise water.
  overseas: {
    sky: 0x4aa8f0,
    fog: 0xcfe8f4,
    ground: 0x3ab0b0,
    road: 0x6a6c70,
    sun: 55,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: 60,
    light: { sun: 3.6, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [300, 3200],
  },
  // Isle of Man Mountain Course: A grey day under soft cloud, the road damp.
  isleofman: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x5a6a40,
    road: 0x464648,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Philadelphia Art Museum Steps: A clear morning, the sun climbing behind the rider's left shoulder.
  artmuseum: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x5e7a48,
    road: 0x5a5a5e,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Lake Louise: A clear alpine day, crisp light on the peaks.
  lakelouise: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x3e6a4a,
    road: 0x505258,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Bealach na Bà: A grey day under soft cloud, the road damp.
  bealach: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x6a5a48,
    road: 0x4a4a4c,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Han River Parks, Seoul: Night: moonlight from behind, the city glow above.
  hanriver: {
    sky: 0x0e1430,
    fog: 0x2a2a4a,
    ground: 0x1e2a28,
    road: 0x3a3e44,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2,
      fillSky: 0x5a5f8e,
    },
    fogRange: [60, 700],
  },
  // Oktoberfest, Munich: Golden hour: the sun low ahead, the light warm and long.
  oktoberfest: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x6a8a40,
    road: 0x7a7268,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Brooklyn Bridge Commute: A clear morning, the sun climbing behind the rider's left shoulder.
  brooklyn: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x5a5048,
    road: 0x6a5a4e,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Strasbourg Christmas Market: A winter night: snow on the ground, warm lights, the road wet.
  strasbourg: {
    sky: 0x1a2040,
    fog: 0x5a5a70,
    ground: 0xc8ccd4,
    road: 0x5a5250,
    sun: -5,
    wet: true,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xffe0b0,
      fill: 2,
      fillSky: 0x6a6a8e,
    },
    fogRange: [50, 600],
  },
  // Kyoto Hanami: A soft spring morning under pink blossom.
  kyoto: {
    sky: 0xa8c8ec,
    fog: 0xf0dce4,
    ground: 0x6a7a50,
    road: 0x9a8e86,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.8,
    azimuth: -50,
    light: { sun: 3, fill: 1.4, colour: 0xfff0ec },
    fogRange: [150, 1600],
  },
  // Bathsheba, Barbados: A bright tropical day, the sun high over turquoise water.
  bathsheba: {
    sky: 0x4aa8f0,
    fog: 0xcfe8f4,
    ground: 0xe0d4b0,
    road: 0x5e5c5c,
    sun: 55,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: 60,
    light: { sun: 3.6, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [300, 3200],
  },
  // Machu Picchu Road: Up in the cloud: a white-out ahead and a damp road.
  machupicchu: {
    sky: 0xa8b4bc,
    fog: 0xc4ccd0,
    ground: 0x4a6a3a,
    road: 0x7a6a58,
    sun: 22,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: 60,
    light: { sun: 2, fill: 1.8, colour: 0xf0f2f4 },
    fogRange: [60, 800],
  },
  // Outback Highway: Blazing desert sun, heat haze over the road.
  outback: {
    sky: 0x7ab4e8,
    fog: 0xe8d4b8,
    ground: 0xb0502a,
    road: 0x4a4846,
    sun: 58,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 4, fill: 1, colour: 0xfff0d8 },
    fogRange: [400, 4000],
  },
  // Tel Aviv Promenade: Midday under a high sun, heat shimmering over the road.
  telaviv: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0xe8dcc0,
    road: 0x8a8480,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Silverstone Track Day: A grey day under soft cloud, the road damp.
  silverstone: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x4e7a3a,
    road: 0x3e3e42,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Mur de Huy: A grey day under soft cloud, the road damp.
  murdehuy: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x4a6238,
    road: 0x4a484a,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Arenberg Forest: A grey day under soft cloud, the road damp.
  arenberg: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x3e5030,
    road: 0x6a6258,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Chicago Lakefront Trail: A clear morning, the sun climbing behind the rider's left shoulder.
  lakefront: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0xd8ccaa,
    road: 0x626468,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Diwali, Marine Drive: A festival night: lamps and lanterns glowing warm under a dark sky.
  diwali: {
    sky: 0x1a1438,
    fog: 0x4a3050,
    ground: 0x2a2a34,
    road: 0x40404a,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xffc8a0,
      fill: 2,
      fillSky: 0x8a5a6e,
    },
    fogRange: [60, 700],
  },
  // Passo Sella: A clear alpine day, crisp light on the peaks.
  sella: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x6a8a4a,
    road: 0x4e4e52,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Kona Ironman: Blazing desert sun, heat haze over the road.
  kona: {
    sky: 0x7ab4e8,
    fog: 0xe8d4b8,
    ground: 0x2a2624,
    road: 0x4a4848,
    sun: 58,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 4, fill: 1, colour: 0xfff0d8 },
    fogRange: [400, 4000],
  },
  // Seven Sisters Cliffs: A clear morning, the sun climbing behind the rider's left shoulder.
  sevensisters: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x7a9a50,
    road: 0x56585a,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Brighton Pride: Midday under a high sun, heat shimmering over the road.
  brighton: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0xcac0a8,
    road: 0x5a5a60,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Iceland Ring Road: The midnight sun skimming the horizon behind the rider.
  iceland: {
    sky: 0xe8a878,
    fog: 0xe8c8b0,
    ground: 0x2a2a2c,
    road: 0x3c3c40,
    sun: 3,
    wet: false,
    haze: false,
    turbidity: 5,
    rayleigh: 2.4,
    azimuth: -170,
    light: { sun: 2.6, fill: 1.5, colour: 0xffc08a },
    fogRange: [400, 4000],
  },
  // Sydney Harbour Fireworks: Midnight: a dark sky over the water, waiting for the fireworks.
  sydneyharbour: {
    sky: 0x101a3a,
    fog: 0x30304a,
    ground: 0x202838,
    road: 0x38404a,
    sun: -8,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xd8c8ff,
      fill: 2,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // Monte Zoncolan: Light filtering through forest, the air cool.
  zoncolan: {
    sky: 0x8ab4d8,
    fog: 0xc8d8d0,
    ground: 0x2e4a28,
    road: 0x4a4a48,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -100,
    light: { sun: 2.8, fill: 1.5, colour: 0xfff0d0 },
    fogRange: [100, 1200],
  },
  // Valais Ski Stations: A clear alpine day, crisp light on the peaks.
  valais: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x4e7a40,
    road: 0x505054,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Loire Châteaux: Golden hour: the sun low ahead, the light warm and long.
  loire: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x7a8a48,
    road: 0x6a6460,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Copenhagen Cycle Superhighway: A clear morning, the sun climbing behind the rider's left shoulder.
  copenhagen: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x5a6a4a,
    road: 0x8a4a3e,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Surfers Paradise: A bright tropical day, the sun high over turquoise water.
  surfers: {
    sky: 0x4aa8f0,
    fog: 0xcfe8f4,
    ground: 0xe4cc90,
    road: 0x5c5e62,
    sun: 55,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: 60,
    light: { sun: 3.6, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [300, 3200],
  },
  // Moab Slickrock: Blazing desert sun, heat haze over the road.
  moab: {
    sky: 0x7ab4e8,
    fog: 0xe8d4b8,
    ground: 0xb4603a,
    road: 0x7a4a3a,
    sun: 58,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 4, fill: 1, colour: 0xfff0d8 },
    fogRange: [400, 4000],
  },
  // Glasgow World Championships: Rain: low cloud, a slick road and short sight lines.
  glasgow: {
    sky: 0x6a7480,
    fog: 0x8a929a,
    ground: 0x3a3e3a,
    road: 0x303236,
    sun: 18,
    wet: true,
    haze: false,
    turbidity: 10,
    rayleigh: 0.8,
    azimuth: -30,
    light: { sun: 1.4, fill: 1.9, colour: 0xd8dee4 },
    fogRange: [60, 700],
  },
  // Mount Washington Auto Road: Up in the cloud: a white-out ahead and a damp road.
  mountwashington: {
    sky: 0xa8b4bc,
    fog: 0xc4ccd0,
    ground: 0x5a5a4a,
    road: 0x4a4a4a,
    sun: 22,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: 60,
    light: { sun: 2, fill: 1.8, colour: 0xf0f2f4 },
    fogRange: [60, 800],
  },
  // Grand Canyon South Rim: Blazing desert sun, heat haze over the road.
  grandcanyon: {
    sky: 0x7ab4e8,
    fog: 0xe8d4b8,
    ground: 0x9a6a44,
    road: 0x4e4a48,
    sun: 58,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 4, fill: 1, colour: 0xfff0d8 },
    fogRange: [400, 4000],
  },
  // Calgary Stampede: Midday under a high sun, heat shimmering over the road.
  stampede: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0x9a8a5a,
    road: 0x5c5854,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // La Mercè, Barcelona: Dusk: the sun just down, the moon rising over a violet sky.
  merce: {
    sky: 0x6a5a8a,
    fog: 0x8a7a9a,
    ground: 0x7a6a58,
    road: 0x6a645e,
    sun: -2,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2.4,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // St. Patrick's Day, Dublin: A grey day under soft cloud, the road damp.
  stpatricks: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x4a6a3a,
    road: 0x505054,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Big Sur: Sea fog rolling in: soft light and a wet road.
  bigsur: {
    sky: 0xb8c4cc,
    fog: 0xccd4d8,
    ground: 0x5a6a3e,
    road: 0x4c4c4e,
    sun: 18,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 1.8, fill: 1.9, colour: 0xeef0f0 },
    fogRange: [40, 520],
  },
  // Songkran, Bangkok: A hot, wet tropical day, the road soaked.
  songkran: {
    sky: 0x7ab0d8,
    fog: 0xd0dce4,
    ground: 0x6a6a5a,
    road: 0x444648,
    sun: 48,
    wet: true,
    haze: false,
    turbidity: 3.5,
    rayleigh: 1.6,
    azimuth: 30,
    light: { sun: 3.2, fill: 1.4, colour: 0xfff0e0 },
    fogRange: [150, 1600],
  },
  // Playground Park Loop: A clear morning, the sun climbing behind the rider's left shoulder.
  playground: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x5a8a40,
    road: 0x6a6a6e,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Hoover Dam: blazing desert sun high over the Black Canyon, heat haze over the crest road.
  hoover: {
    sky: 0x7ab4e8,
    fog: 0xe8d4b8,
    ground: 0x4a3a30,
    road: 0x4a4846,
    sun: 58,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 4, fill: 1, colour: 0xfff0d8 },
    fogRange: [400, 4000],
  },
  // Aguascalientes Velodrome: Indoors under the track lights.
  aguascalientes: {
    sky: 0x2a2a30,
    fog: 0x3a3a40,
    ground: 0x8a6a4a,
    road: 0xb89a74,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1,
    rayleigh: 1,
    azimuth: 0,
    light: { sun: 2.4, fill: 2.4, colour: 0xfff4e8 },
    fogRange: [60, 400],
  },
  // Atlantic Ocean Road: A stormy sea: low cloud, spray and a wet road.
  atlanticroad: {
    sky: 0x5a6878,
    fog: 0x8090a0,
    ground: 0x4a5a3e,
    road: 0x3e3e42,
    sun: 14,
    wet: true,
    haze: false,
    turbidity: 10,
    rayleigh: 0.9,
    azimuth: 120,
    light: { sun: 1.6, fill: 1.8, colour: 0xd0d8e0 },
    fogRange: [100, 1100],
  },
  // Fish Hill, Cotswolds: Golden hour: the sun low ahead, the light warm and long.
  fishhill: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x7a8a48,
    road: 0x8a7a5a,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Junkanoo, Nassau: A festival night: lamps and lanterns glowing warm under a dark sky.
  junkanoo: {
    sky: 0x1a1438,
    fog: 0x4a3050,
    ground: 0x302838,
    road: 0x46444c,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xffc8a0,
      fill: 2,
      fillSky: 0x8a5a6e,
    },
    fogRange: [60, 700],
  },
  // Old Québec: A cold winter day, snow banked along the road.
  quebec: {
    sky: 0xa8c0d8,
    fog: 0xe4eaf0,
    ground: 0xd8dce0,
    road: 0x5a5654,
    sun: 16,
    wet: false,
    haze: false,
    turbidity: 3.5,
    rayleigh: 1.6,
    azimuth: -40,
    light: { sun: 2.6, fill: 1.8, colour: 0xfff4ea },
    fogRange: [150, 1600],
  },
  // Mount Fuji Road: Light filtering through forest, the air cool.
  fuji: {
    sky: 0x8ab4d8,
    fog: 0xc8d8d0,
    ground: 0x3a5a34,
    road: 0x4a4a4e,
    sun: 34,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.6,
    azimuth: -100,
    light: { sun: 2.8, fill: 1.5, colour: 0xfff0d0 },
    fogRange: [100, 1200],
  },
  // The Bund, Shanghai: Night: moonlight from behind, the city glow above.
  bund: {
    sky: 0x0e1430,
    fog: 0x2a2a4a,
    ground: 0x242830,
    road: 0x4a4a50,
    sun: -6,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2,
      fillSky: 0x5a5f8e,
    },
    fogRange: [60, 700],
  },
  // Comuna 13, Medellín: Midday under a high sun, heat shimmering over the road.
  comuna13: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0x9a6a4a,
    road: 0x7a6a62,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Adelaide Hills: Midday under a high sun, heat shimmering over the road.
  adelaide: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0xb49a5a,
    road: 0x505052,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Sella Ronda: A clear alpine day, crisp light on the peaks.
  sellaronda: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x5e8040,
    road: 0x48484c,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Marrakech Medina: Dusk: the sun just down, the moon rising over a violet sky.
  marrakech: {
    sky: 0x6a5a8a,
    fog: 0x8a7a9a,
    ground: 0xb07a4a,
    road: 0x9a6a4a,
    sun: -2,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2.4,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // Mount Tamalpais: Sea fog rolling in: soft light and a wet road.
  tamalpais: {
    sky: 0xb8c4cc,
    fog: 0xccd4d8,
    ground: 0x3a5a30,
    road: 0x4e4e50,
    sun: 18,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 1.8, fill: 1.9, colour: 0xeef0f0 },
    fogRange: [40, 520],
  },
  // Independence Pass: A clear alpine day, crisp light on the peaks.
  independence: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x6a8a3a,
    road: 0x4a4a4e,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Fenland Time Trial: A bright, blustery day, wind across open country.
  fens: {
    sky: 0x9ab8d4,
    fog: 0xd0dae0,
    ground: 0x6a7a3a,
    road: 0x5a5a5c,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 4,
    rayleigh: 1.4,
    azimuth: 90,
    light: { sun: 3, fill: 1.4, colour: 0xfff4e4 },
    fogRange: [300, 3000],
  },
  // Vienna Ringstrasse: A clear morning, the sun climbing behind the rider's left shoulder.
  vienna: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x7a7a6a,
    road: 0x626066,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Blue Mountains, Jamaica: A bright tropical day, the sun high over turquoise water.
  bluemountains: {
    sky: 0x4aa8f0,
    fog: 0xcfe8f4,
    ground: 0x2e6a2a,
    road: 0x5a5450,
    sun: 55,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: 60,
    light: { sun: 3.6, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [300, 3200],
  },
  // Col d'Aubisque: Up in the cloud: a white-out ahead and a damp road.
  aubisque: {
    sky: 0xa8b4bc,
    fog: 0xc4ccd0,
    ground: 0x5a7a40,
    road: 0x4a4a4c,
    sun: 22,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: 60,
    light: { sun: 2, fill: 1.8, colour: 0xf0f2f4 },
    fogRange: [60, 800],
  },
  // Rome Colosseum Loop: Golden hour: the sun low ahead, the light warm and long.
  rome: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0xa08a68,
    road: 0x6a625a,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Great St Bernard Pass: A clear alpine day, crisp light on the peaks.
  stbernard: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x6a7a5a,
    road: 0x4c4c4e,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Avenida 9 de Julio: Midday under a high sun, heat shimmering over the road.
  nuevedejulio: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0x6a7a50,
    road: 0x5a5a5e,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Okinawa Coast Road: A bright tropical day, the sun high over turquoise water.
  okinawa: {
    sky: 0x4aa8f0,
    fog: 0xcfe8f4,
    ground: 0xe0dcc0,
    road: 0x5a5c60,
    sun: 55,
    wet: false,
    haze: false,
    turbidity: 2.4,
    rayleigh: 1.5,
    azimuth: 60,
    light: { sun: 3.6, fill: 1.2, colour: 0xfff4e0 },
    fogRange: [300, 3200],
  },
  // Algarve Cliffs: Golden hour: the sun low ahead, the light warm and long.
  algarve: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0xc89a5a,
    road: 0x5e5a58,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Mulholland Drive: Dusk: the sun just down, the moon rising over a violet sky.
  mulholland: {
    sky: 0x6a5a8a,
    fog: 0x8a7a9a,
    ground: 0x7a6a4a,
    road: 0x46464a,
    sun: -2,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2.4,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // Provence Lavender: Golden hour: the sun low ahead, the light warm and long.
  provence: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x8a6a9a,
    road: 0x6a6460,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Cherry Blossom Festival, D.C.: A soft spring morning under pink blossom.
  cherryblossom: {
    sky: 0xa8c8ec,
    fog: 0xf0dce4,
    ground: 0x6a8a50,
    road: 0x7a7a7a,
    sun: 30,
    wet: false,
    haze: false,
    turbidity: 2.6,
    rayleigh: 1.8,
    azimuth: -50,
    light: { sun: 3, fill: 1.4, colour: 0xfff0ec },
    fogRange: [150, 1600],
  },
  // Oude Kwaremont: A grey day under soft cloud, the road damp.
  kwaremont: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x4a6a34,
    road: 0x6a6258,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Oregon Coast: Sea fog rolling in: soft light and a wet road.
  oregon: {
    sky: 0xb8c4cc,
    fog: 0xccd4d8,
    ground: 0x3a5a3a,
    road: 0x4a4c4e,
    sun: 18,
    wet: true,
    haze: false,
    turbidity: 9,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 1.8, fill: 1.9, colour: 0xeef0f0 },
    fogRange: [40, 520],
  },
  // Cypress Mountain: A clear morning, the sun climbing behind the rider's left shoulder.
  cypress: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x2e4a30,
    road: 0x4c4c50,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Iten, Kenya: A clear morning, the sun climbing behind the rider's left shoulder.
  iten: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x9a4a2a,
    road: 0x8a4a2e,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // The Palouse: Golden hour: the sun low ahead, the light warm and long.
  palouse: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0x9aa048,
    road: 0x56565a,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Prague Old Town: Dusk: the sun just down, the moon rising over a violet sky.
  prague: {
    sky: 0x6a5a8a,
    fog: 0x8a7a9a,
    ground: 0x7a6a5a,
    road: 0x6a625c,
    sun: -2,
    wet: false,
    haze: false,
    moon: {
      elevation: 30,
      azimuth: -140,
      strength: 1.4,
      colour: 0xaab8ff,
      fill: 2.4,
      fillSky: 0x5a5f8e,
    },
    fogRange: [80, 900],
  },
  // Ffordd Pen Llech: A grey day under soft cloud, the road damp.
  penllech: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x4a6a3a,
    road: 0x5a5856,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Andalusian White Villages: Midday under a high sun, heat shimmering over the road.
  pueblos: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0xa89a5a,
    road: 0x6a6460,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Mongolian Steppe: Midday under a high sun, heat shimmering over the road.
  steppe: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0x8a9a4a,
    road: 0x8a7a5a,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Teotihuacán: Midday under a high sun, heat shimmering over the road.
  teotihuacan: {
    sky: 0x6aa8e8,
    fog: 0xe0e8f0,
    ground: 0xa8906a,
    road: 0x8a7a64,
    sun: 62,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.4,
    azimuth: 20,
    light: { sun: 3.8, fill: 1.1, colour: 0xfff8ec },
    fogRange: [300, 3000],
  },
  // Furka Pass: A clear alpine day, crisp light on the peaks.
  furka: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x5a6a50,
    road: 0x4a4a4e,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // Beach Road, Melbourne: A clear morning, the sun climbing behind the rider's left shoulder.
  beachroad: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0xd4c49a,
    road: 0x5c5c60,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Blue Ridge Parkway: A crisp autumn day, the light warm on the leaves.
  blueridge: {
    sky: 0x88b0e0,
    fog: 0xe4d4c0,
    ground: 0x8a4a2a,
    road: 0x4c4c4e,
    sun: 24,
    wet: false,
    haze: false,
    turbidity: 3.2,
    rayleigh: 1.8,
    azimuth: 70,
    light: { sun: 3, fill: 1.3, colour: 0xffe0b8 },
    fogRange: [300, 3000],
  },
  // Verona Arena Finale: Golden hour: the sun low ahead, the light warm and long.
  verona: {
    sky: 0xe8b878,
    fog: 0xf0d4a8,
    ground: 0xa08a6a,
    road: 0x8a7a6c,
    sun: 10,
    wet: false,
    haze: false,
    turbidity: 4.5,
    rayleigh: 2.2,
    azimuth: 40,
    light: { sun: 3, fill: 1.2, colour: 0xffd09a },
    fogRange: [200, 2400],
  },
  // Valparaíso Stairways: A clear morning, the sun climbing behind the rider's left shoulder.
  valparaiso: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x8a6a5a,
    road: 0x7a6a64,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Mont Royal: A crisp autumn day, the light warm on the leaves.
  montroyal: {
    sky: 0x88b0e0,
    fog: 0xe4d4c0,
    ground: 0x7a5a2a,
    road: 0x4c4c50,
    sun: 24,
    wet: false,
    haze: false,
    turbidity: 3.2,
    rayleigh: 1.8,
    azimuth: 70,
    light: { sun: 3, fill: 1.3, colour: 0xffe0b8 },
    fogRange: [300, 3000],
  },
  // Utrecht Bike City: A clear morning, the sun climbing behind the rider's left shoulder.
  utrecht: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x4e6a3e,
    road: 0x8a4a3c,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Joshua Tree: Blazing desert sun, heat haze over the road.
  joshuatree: {
    sky: 0x7ab4e8,
    fog: 0xe8d4b8,
    ground: 0xb0946a,
    road: 0x4e4c4a,
    sun: 58,
    wet: false,
    haze: true,
    turbidity: 2,
    rayleigh: 1.2,
    azimuth: -20,
    light: { sun: 4, fill: 1, colour: 0xfff0d8 },
    fogRange: [400, 4000],
  },
  // Cabot Trail: A clear morning, the sun climbing behind the rider's left shoulder.
  cabot: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x3e6a3a,
    road: 0x4c4c50,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Pico Veleta: Thin, clear air high up: a deep blue sky and hard light.
  veleta: {
    sky: 0x3a7ad8,
    fog: 0xc8d8ea,
    ground: 0x8a7a5a,
    road: 0x4a4a4c,
    sun: 46,
    wet: false,
    haze: false,
    turbidity: 1.2,
    rayleigh: 1.2,
    azimuth: 110,
    light: { sun: 3.8, fill: 0.9, colour: 0xffffff },
    fogRange: [800, 7000],
  },
  // Bay of Islands Group Ride: A clear morning, the sun climbing behind the rider's left shoulder.
  bayofislands: {
    sky: 0x8ab8e8,
    fog: 0xd8e4ee,
    ground: 0x4a8a3a,
    road: 0x505256,
    sun: 28,
    wet: false,
    haze: false,
    turbidity: 2.2,
    rayleigh: 1.6,
    azimuth: -60,
    light: { sun: 3.2, fill: 1.2, colour: 0xfff0d8 },
    fogRange: [200, 2400],
  },
  // Yorkshire Dales: A grey day under soft cloud, the road damp.
  dales: {
    sky: 0x9aa4ae,
    fog: 0xb8c0c6,
    ground: 0x5a7a3a,
    road: 0x4a4a4c,
    sun: 25,
    wet: true,
    haze: false,
    turbidity: 8,
    rayleigh: 1,
    azimuth: -30,
    light: { sun: 1.8, fill: 1.8, colour: 0xe8ecf0 },
    fogRange: [120, 1400],
  },
  // Engadin Lakes: A clear alpine day, crisp light on the peaks.
  engadin: {
    sky: 0x6aa4e0,
    fog: 0xd4e2ee,
    ground: 0x4a7a48,
    road: 0x4e4e52,
    sun: 40,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.6,
    azimuth: -80,
    light: { sun: 3.4, fill: 1.1, colour: 0xfff4e8 },
    fogRange: [500, 5000],
  },
  // A bright summer morning on the pass: the sun well up in a clear blue sky, crisp light on the
  // pale rock, and a light haze over the far peaks.
  gardena: {
    sky: 0x6aa4e4,
    fog: 0xc8dcec,
    ground: 0x7aa84a,
    road: 0x4e4e52,
    sun: 44,
    wet: false,
    haze: false,
    turbidity: 3,
    rayleigh: 1.3,
    azimuth: 130,
    light: { sun: 3.2, fill: 1.0, colour: 0xfff4e4 },
    fogRange: [400, 6000],
  },
  // Late afternoon four thousand metres up on Mauna Kea: a deep, thin-air blue and a low gold sun over the cloud sea.
  maunakea: {
    sky: 0x1a4ab8,
    fog: 0xc8d4e8,
    ground: 0x6a3a2a,
    road: 0x3a3634,
    sun: 18,
    wet: false,
    haze: false,
    turbidity: 1.2,
    rayleigh: 2.2,
    azimuth: 250,
    light: { sun: 3.0, fill: 1.5, colour: 0xffe4c0 },
    fogRange: [3000, 20000],
  },
  // Early summer high on the Galibier: crisp mountain air, a clear blue sky and a bright midday sun on the snow.
  galibier: {
    sky: 0x3a78d8,
    fog: 0xd8e2f0,
    ground: 0x4a4a50,
    road: 0x4a4a4c,
    sun: 52,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 1.4,
    azimuth: 160,
    light: { sun: 3.0, fill: 1.6, colour: 0xfff8f0 },
    fogRange: [2500, 16000],
  },
  // Miami at night: moonlight over the sea behind the rider's left shoulder, the sky violet with
  // the city's glow, the road wet and catching the neon.
  miami: {
    sky: 0x1a1240,
    // The street fades into a warm magenta haze of neon in the damp air.
    fog: 0x4a2a64,
    ground: 0x2a2838,
    road: 0x2c2c34,
    sun: -6,
    wet: true,
    haze: false,
    moon: {
      elevation: 28,
      azimuth: -130,
      strength: 1.7,
      colour: 0xc0c8ff,
      fill: 2.6,
      fillSky: 0x8a4aa8,
    },
    fogRange: [45, 620],
  },
  // Caribana Parade: a hot, clear August mid-afternoon, the sun low enough behind the rider's
  // left shoulder to throw long shadows across the lanes, the sky a deep summer blue.
  caribana: {
    sky: 0x7fb8ea,
    fog: 0xd3e2ef,
    ground: 0x4f8a3a,
    road: 0x55575c,
    sun: 40,
    wet: false,
    haze: true,
    turbidity: 2.8,
    rayleigh: 1.9,
    azimuth: -145,
    light: { sun: 3.9, fill: 0.7, colour: 0xffe7c4 },
    fogRange: [130, 1200],
  },
  coast: {
    sky: 0xf29b6b,
    fog: 0xf6c39a,
    ground: 0x6f7d4a,
    road: 0x4a4646,
    sun: 3,
    wet: true,
    haze: true,
  },
};

/**
 * A colour flowing through the pass chain. TSL's node typings do not compose from one pass to
 * the next (a texture node, a join, an operator), so the chain carries them as one vec4 type.
 */
type ColorNode = ReturnType<typeof vec4>;

/** How far each panorama turns, as a share of its width, to put its landmark down the road. */
const PANORAMA_TURN: Partial<Record<WorldId, number>> = { oldtown: -0.12 };

/** Anisotropic filtering per tier (technique 8). */
const ANISOTROPY: Record<Tier, number> = { low: 4, medium: 8, high: 16, ultra: 16 };

/** 2 m steps ahead of the rider, and behind for the camera. */
const AHEAD = 150;
const UP = new Vector3(0, 1, 0);
const BEHIND = 10;
const STEP = 2;
const ROAD_HALF = 3.5;
const GROUND_HALF = 400;
const DASH = 10;
/** Street lamps and reflective posts repeat along the road (techniques 23, 24). */
const LAMP_EVERY = 40;
const LAMPS = 6;
const POST_EVERY = 20;
const POSTS = 14;
/** How far the gradient under the rider eases towards the target each frame. */

export class ThreeWorldRenderer implements WorldRenderer {
  private renderer: WebGPURenderer | null = null;
  private pipeline: RenderPipeline | null = null;
  /** The real place's 3D Tiles, once the rider streams them (L2-066), and which stream is the latest. */
  private tiles: PhotorealTiles | null = null;
  private streams = 0;
  private disposed = false;
  /** The flat sky's node (technique 53), made the first time `low` is applied. */
  private flatSkyNode: ReturnType<typeof flatSky> | null = null;
  /** The sky's light (technique 6): undefined until first made, null where it could not be. */
  private skyLight: Texture | null | undefined = undefined;
  /** Each tier's pass chain, kept once built: a drop swaps to one compiled ahead (#882). */
  private readonly pipelines = new Map<string, RenderPipeline>();
  /** Each pass chain's temporal anti-aliasing (technique 7), whose history is reset (#896). */
  private readonly temporal = new Map<RenderPipeline, { setSize(w: number, h: number): void }>();
  /** The GPU API drawing the world, for the race bar's tag (L2-065 AC1, ADR 0030). */
  backend: Backend = 'webgl2';
  private budget: FrameBudget | null = null;
  /** Each pass chain's scene pass, whose target and MRT World loading's batched build compiles into. */
  private readonly scenePasses = new WeakMap<RenderPipeline, PassNode>();
  /** What the test-only hook's sweep reads; null on every rider's ride (#672, #674). */
  private probe: WorldRideProbeReport | null = null;
  private on = new Set<number>();
  private reducedMotion = false;
  private lastFrameAt: number | null = null;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, 16 / 9, 0.1, 6000);
  private readonly sun = new DirectionalLight(0xffffff, 1.4);
  /** The key light's direction where the ride starts, before the road has turned. */
  private readonly keyLight = new Vector3(0, 1, 0);
  private readonly sky = new SkyMesh();
  private readonly road = stripGeometry();
  private readonly ground = stripGeometry();
  private readonly roadMaterial = new MeshStandardMaterial({ roughness: 0.9 });
  private readonly frameMaterial = new MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.6,
    roughness: 0.35,
  });
  /** Every bike's frame paint, given a clearcoat together at the tier that has one. */
  private readonly frames: MeshPhysicalMaterial[] = [this.frameMaterial];
  private readonly arch = new Group();
  private you: Cyclist | null = null;
  private readonly pacers = new Map<number, Cyclist>();
  /** The race's riders by jersey, each made the first time it rides into view (L2-064 AC3). */
  private readonly raceRiders = new Map<string, Cyclist>();
  /** What each race rider wears, for the test-only hook's report: the jersey, or the ghost's gold. */
  /** The colour and opacity each race rider wears, for the probe (L2-064 AC3). */
  private readonly wear = new Map<string, { readonly color: Color; readonly opacity: number }>();
  /** The kit the riders are made from, and the canvas whose jersey tokens colour them. */
  private kit: CyclistKit | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private readonly wheelBlur: Mesh[] = [];
  private readonly lamps: PointLight[] = [];
  private street: OldTownStreet | null = null;
  private corners: Corners | null = null;
  private ramp: RampSign | null = null;
  private towers: DocklandsStreet | null = null;
  /** The street of a scene built on the shared kit (world-streets.ts). */
  private scenery: SceneStreet | null = null;
  private readonly posts: Mesh[] = [];
  private readonly textures: Texture[] = [];
  private readonly disposables: { dispose(): void }[] = [];
  private plainRoad: CanvasTexture | null = null;
  private layeredRoad: CanvasTexture | null = null;
  private roadRelief: CanvasTexture | null = null;
  private archLabel: {
    text: string;
    canvas: HTMLCanvasElement;
    texture: CanvasTexture;
    mesh: Mesh;
    material: MeshBasicMaterial;
  } | null = null;
  private world: World | null = null;
  private look: Look = LOOKS.oldtown;
  private grade = 0;
  private lastS = 0;
  /** The road's bend, laid on every vertex but the sky's and the panorama's (ADR 0023). */
  private readonly bend = new RoadBend();
  private readonly unbent = new Set<Object3D>([this.sky]);
  /** The drawn look's toon shading at `low` (L2-111 technique 51). */
  private readonly toon = new ToonLook();
  /** What the rider's and pacers' twins write to the scene pass: ink them warmer (technique 52). */
  private readonly warmInk = mrt({ ink: float(1) });
  private readonly bendSamples = new Float32Array(BEND_SAMPLES * 4);
  private readonly aheadPoints: MutableRoadPoint[] = Array.from({ length: AHEAD + 1 }, () => ({
    metres: 0,
    height: 0,
    grade: 0,
  }));
  private readonly aheadHeights = new Float64Array(AHEAD + 1);
  private firstGradeSlope = 0;
  private readonly stripPoints: MutableRoadPoint[] = Array.from(
    { length: AHEAD + BEHIND + 1 },
    () => ({ metres: 0, height: 0, grade: 0 }),
  );
  private readonly cameraEye = { x: 0, z: 0 };
  private readonly cameraLook = { x: 0, z: 0 };
  private readonly lampAt = { x: 0, z: 0 };
  private readonly activePacers: MutablePacerOnRoad[] = [];
  private readonly heightAtAhead = (metres: number): number => {
    const heights = this.aheadHeights;
    if (metres < 0) return heights[0]! + this.firstGradeSlope * metres;
    const f = metres * (1 / STEP);
    if (f >= AHEAD) return heights[AHEAD]!;
    const i = f | 0;
    const a = heights[i]!;
    return a + (heights[i + 1]! - a) * (f - i);
  };

  async start(
    canvas: HTMLCanvasElement,
    world: World,
    nextFrame: () => Promise<void>,
    segments: readonly Segment[] = [],
    options: WorldStartOptions = {},
  ): Promise<boolean> {
    try {
      // Timer queries only for the performance sweep: a rider's frames never pay for them (#675).
      const asked = readWorldRideProbe((globalThis as Record<string, unknown>)[PROBE_KEY]);
      const renderer = new WebGPURenderer({
        canvas,
        antialias: false,
        trackTimestamp: asked !== null,
        // The sweep may profile the WebGL2 fallback on a WebGPU screen (#679).
        forceWebGL: asked?.forceWebGL ?? false,
      });
      await renderer.init();
      this.renderer = renderer;
      this.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
    } catch {
      return false;
    }
    this.world = world;
    this.look = LOOKS[world.id];
    this.grade = world.grade['warm-up'];
    this.renderer.outputColorSpace = SRGBColorSpace;
    const probe = readWorldRideProbe((globalThis as Record<string, unknown>)[PROBE_KEY]);
    // The test-only hook pins the tier; ultra draws at high on WebGL2 (L2-111 AC2).
    const pin = probe && this.backend === 'webgl2' && probe.tier === 'ultra' ? 'high' : probe?.tier;
    // A judged hook opens the ride at its tier and lets slow frames drop it, as a rider's (L2-159 AC4).
    // World loading may ask for a level: Low, when the rider chose it or a build above it failed (L2-155, L2-156).
    this.budget = new FrameBudget(pin ?? options.tier ?? startTier(), undefined, {
      pinned: !!pin && !probe?.judged,
    });
    this.probe = probeReport(
      this.budget.tier,
      this.backend,
      this.renderer.hasFeature('timestamp-query'),
    );
    // The sweep counts every pass of a frame, so the counts reset per frame, not per render.
    if (this.probe) {
      this.renderer.info.autoReset = false;
      countCompiles(this.renderer, this.probe);
    }

    await this.buildScene(world, canvas);
    // Docklands' photographed distance is the mock's own still, riders and all: its towers are
    // built in 3D instead.
    // A kit-built street draws its own distance in 3D, as Docklands' towers do.
    const loadStreet = STREETS[world.id];
    if (world.id !== 'docklands' && !loadStreet) await this.addPanorama(world);
    if (loadStreet) this.addScenery(await loadStreet());
    if (world.id === 'oldtown') await this.addStreet();
    if (world.id === 'docklands') await this.addTowers();
    this.applyTier();
    await this.buildPrograms(options.progress);
    const tier = this.budget.tier;
    options.progress?.({ step: 'warm-up', tier });
    // The warm-up's frames are timed for the rate it held (L2-152 AC5); `main`'s warm-up is unchanged.
    const times: number[] = [];
    await this.warmUp(
      canvas,
      async () => {
        await nextFrame();
        times.push(performance.now());
      },
      segments,
    );
    const fps = heldFps(times);
    if (fps !== null) options.progress?.({ step: 'warmed', fps, tier });
    if (this.probe) this.probe.programsBeforeRide = this.renderer.info.memory.programs;
    return true;
  }

  /**
   * Builds the scene's programs before the warm-up draws it, with three's own `compileAsync`, which compiles in
   * batches and yields to each frame, reporting each one built of the total (L2-152 AC4; slice 16.2, as `main` has no
   * batched build). Parts hidden or out of view are built too, as the warm-up draws them, and the build goes into the
   * scene pass's render target and MRT, so its programs share three's cache key with the warm-up's and the ride's
   * frames. A program that fails to build rejects, and with it `start`.
   */
  private async buildPrograms(progress?: (progress: WorldStartProgress) => void): Promise<void> {
    const renderer = this.renderer!;
    const hidden: Object3D[] = [];
    const culled: Object3D[] = [];
    this.scene.traverse((part) => {
      if (!part.visible && !(part as Light).isLight) hidden.push(part);
      if (part.frustumCulled) culled.push(part);
    });
    for (const part of hidden) part.visible = true;
    for (const part of culled) part.frustumCulled = false;
    const scenePass = this.pipeline ? this.scenePasses.get(this.pipeline) : undefined;
    const target = renderer.getRenderTarget();
    const mrt = renderer.getMRT();
    if (scenePass) {
      renderer.setRenderTarget(scenePass.renderTarget);
      renderer.setMRT(scenePass.getMRT());
    }
    try {
      await renderer.compileAsync(this.scene, this.camera, null, (event) =>
        progress?.({
          step: 'shaders',
          built: event.loaded,
          total: event.total,
          backend: this.backend,
        }),
      );
    } finally {
      renderer.setRenderTarget(target);
      renderer.setMRT(mrt);
      for (const part of hidden) part.visible = false;
      for (const part of culled) part.frustumCulled = true;
    }
  }

  /**
   * Draws the whole scene through the tier's pass chain over three frames while it is still
   * loading, at the canvas's own size, and waits for the GPU to finish: the programs, buffers
   * and render targets the ride needs exist before its first frame (L2-111 AC10). Parts hidden
   * or out of view at the start are drawn too, so their programs are ready when they appear.
   */
  private async warmUp(
    canvas: HTMLCanvasElement,
    nextFrame: () => Promise<void>,
    segments: readonly Segment[],
  ): Promise<void> {
    const renderer = this.renderer;
    const tier = this.budget?.tier;
    if (!renderer || !tier) return;
    this.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio);
    // The tiers a slow budget could drop to (one step, or straight to low) are drawn first, so a
    // drop compiles nothing (#882, #896); the tier the ride starts at is drawn last.
    const lower = [...new Set([nextLower(tier), 'low' as const])].filter(
      (t): t is Tier => t !== null && t !== tier,
    );
    for (const t of lower) {
      this.applyTier(t);
      await this.warmRound(nextFrame);
    }
    if (lower.length) this.applyTier(tier);
    await this.warmRound(nextFrame);
    await this.rehearse(nextFrame, segments);
    // WebGPU builds pipelines in the GPU process: wait for them, not just for the call.
    const device = (renderer.backend as { device?: GPUDevice }).device;
    await device?.queue.onSubmittedWorkDone();
  }

  /**
   * Runs the ride's own frame (laying the road, placing the riders and the scenery) a few times
   * at the start line, so the ride's first frames run warmed code rather than paying for its
   * first run (#882). The sweep's report and the frame budget see none of it.
   */
  private async rehearse(
    nextFrame: () => Promise<void>,
    segments: readonly Segment[],
  ): Promise<void> {
    const probe = this.probe;
    this.probe = null;
    for (let i = 0; i < REHEARSALS; i++) {
      await nextFrame();
      this.draw({
        s: 0,
        crank: 0,
        segments,
        elapsed: 0,
        time: 0,
        speedKmh: 0,
        reducedMotion: this.reducedMotion,
      });
      // The warm-up drew hidden parts from a camera no frame had placed yet, so the first
      // rehearsal jumps the whole view and smears. The rest start the history afresh from a
      // still camera, so the picture held while the frame period is measured, and the ride's
      // first frames, are clean (#896).
      if (i === 0) this.freshHistory();
    }
    this.probe = probe;
    this.lastFrameAt = null;
    this.lastS = 0;
  }

  /**
   * Starts the drawn pass chain's history afresh: on its next frame, temporal anti-aliasing takes
   * that frame's own picture as its history instead of blending in older ones (#896).
   */
  private freshHistory(): void {
    const node = this.pipeline && this.temporal.get(this.pipeline);
    // A history of another size than the picture is restarted from the picture (TRAANode).
    node?.setSize(1, 1);
  }

  /** One warm-up: every part drawn, in view or not, over three frames. */
  private async warmRound(nextFrame: () => Promise<void>): Promise<void> {
    const renderer = this.renderer!;
    const hidden: Object3D[] = [];
    const culled: Object3D[] = [];
    this.scene.traverse((part) => {
      // A light is left as it is: the lights a material is compiled for are part of its program.
      if (!part.visible && !(part as Light).isLight) hidden.push(part);
      if (part.frustumCulled) culled.push(part);
    });
    for (const part of hidden) part.visible = true;
    for (const part of culled) part.frustumCulled = false;
    // Three frames, one per animation frame (the scene pass runs once per frame): the pass
    // chain's history (temporal anti-aliasing, motion vectors) takes its programs from the
    // second, and its depth copy from the first frame the drawing buffer has its full size.
    for (let frame = 0; frame < 3; frame++) {
      if (frame > 0) await nextFrame();
      if (this.pipeline) this.pipeline.render();
      else renderer.render(this.scene, this.camera);
    }
    for (const part of hidden) part.visible = false;
    for (const part of culled) part.frustumCulled = true;
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (!this.renderer || width === 0 || height === 0) return;
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  draw(frame: SceneFrame): void {
    const world = this.world;
    if (!this.renderer || !world) return;
    this.feedBudget();
    if (frame.reducedMotion !== this.reducedMotion) {
      this.reducedMotion = frame.reducedMotion;
      this.applyTier();
    }

    const speed = frame.speedKmh / 3.6;
    const here = frame.segments.find(
      (s) => frame.elapsed >= s.start && frame.elapsed < s.start + s.duration,
    );
    // The grade under the rider eases as the road ahead was laid: 0.12 of the way a second
    // ridden, whatever the frame rate, so the rider rides onto the ramp the road showed.
    const v = Math.max(speed, MIN_SPEED);
    const dt = Math.min(Math.max(frame.s - this.lastS, 0) / v, 1);
    this.lastS = frame.s;
    const ease = 1 - Math.pow(1 - EASE_PER_SECOND, dt);
    if (here) this.grade += ease * (targetGrade(world, here.kind, frame.s) - this.grade);
    const ahead = roadAhead(
      world,
      frame.segments,
      { t: frame.elapsed, s: frame.s, speed, grade: this.grade },
      AHEAD,
      this.aheadPoints,
    );
    const heights = this.aheadHeights;
    for (let i = 0; i < ahead.length; i++) heights[i] = ahead[i]!.height;
    this.firstGradeSlope = (ahead[0]?.grade ?? 0) / 100;
    bendAhead(world, frame.s, this.bendSamples);
    // The sun stays where it is in the sky as the road turns: ride round a right-hander and it
    // swings left across the view, and the houses' shadows swing with it.
    const turn = (heading(world, frame.s) * Math.PI) / 180;
    this.sun.position
      .copy(this.keyLight)
      .applyAxisAngle(UP, turn)
      .multiplyScalar(80)
      .add(this.sun.target.position);
    this.sky.sunPosition.value.copy(this.sunDirection()).applyAxisAngle(UP, turn);
    this.bend.update(this.bendSamples, this.heightAtAhead);
    if (this.towers) {
      // The road over an effort is a bridge ramp, laid at the same speed as the road ahead.
      const efforts = frame.segments.filter((g) => g.kind === 'work');
      this.towers.setTime(frame.reducedMotion ? 0 : frame.time, frame.reducedMotion);
      this.towers.setBridge(
        (metres) => {
          const t = frame.elapsed + metres / v;
          return efforts.some((g) => t >= g.start && t < g.start + g.duration);
        },
        efforts.map((g) => (g.start - frame.elapsed) * v),
      );
    }
    // Moving parts ride by the scene's smooth time, not the engine's whole seconds (#897).
    this.scenery?.setTime(frame.reducedMotion ? 0 : frame.time);
    this.layRoad(ahead, frame.s);
    const texture = this.roadMaterial.map;
    if (texture) texture.offset.y = (frame.s / DASH) % 1;
    if (this.roadRelief) this.roadRelief.offset.y = (frame.s / DASH) % 1;
    this.placeArch(world, frame, speed, ahead);
    this.placeRoadside(frame.s, ahead);
    // A race draws its own riders; elsewhere `main`'s simulated pacers ride (L2-064 AC3, L2-107 AC7).
    if (frame.riders) this.placeRaceRiders(world, frame, ahead, frame.riders);
    else this.placePacers(world, frame, ahead);

    // The bike rocks under the pedal strokes and leans into a bend: right on a right-hander.
    const riderGrade = ahead[0]?.grade ?? 0;
    this.you?.pose(
      frame.reducedMotion ? 0 : frame.crank,
      -lean(world, frame.s, speed),
      standing(riderGrade),
    );
    // It sits on the road: nose up on a climb, down on a descent.
    if (this.you) this.you.group.rotation.x = pitch(riderGrade);
    const blur = this.on.has(34) ? Math.min(0.55, speed / 14) : 0;
    for (const disc of this.wheelBlur) {
      disc.visible = blur > 0.02;
      (disc.material as MeshBasicMaterial).opacity = blur;
    }
    const sway = frame.reducedMotion ? 0 : Math.sin(frame.s / 3) * 0.04;
    // The camera rides the bend: its eye and the point it looks at both follow the road (L2-110
    // AC9), and both depend only on s, so under reduced motion it turns only as the rider rides.
    const eye = bendPoint(this.bendSamples, sway, 5.5, this.cameraEye);
    const look = bendPoint(this.bendSamples, 0, -24, this.cameraLook);
    // The eye rides 2.1 m over the road under it, 5.5 m behind the rider: lower on a climb.
    this.camera.position.set(eye.x, this.heightAtAhead(-5.5) + 2.1, eye.z);
    this.camera.lookAt(look.x, 1.2 + this.heightAtAhead(24), look.z);

    if (this.probe) this.renderer.info.reset();
    this.tiles?.update(this.camera, this.renderer);
    if (this.pipeline) this.pipeline.render();
    else this.renderer.render(this.scene, this.camera);
    if (this.probe) {
      this.probe.drawCalls = this.renderer.info.render.drawCalls;
      this.probe.programs = this.renderer.info.memory.programs;
      const gpu = this.probe.gpuMs;
      if (gpu) {
        void this.renderer.resolveTimestampsAsync('render').then((ms) => {
          if (typeof ms === 'number') gpu.push(ms);
        });
      }
    }
  }

  setFramePeriod(ms: number): void {
    this.budget?.setPeriod(ms);
  }

  pauseBudget(): void {
    this.budget?.pause();
    this.lastFrameAt = null;
  }

  /**
   * Streams the real place's tiles beside the built-in world (L2-066). New in Telo Ride: `main` has no tiles. The
   * loader is imported here, on the rider's press, so it stays out of the world chunk.
   */
  stream(place: RealPlace, key: string, report: (state: SceneryState) => void): void {
    this.tiles?.dispose();
    this.tiles = null;
    const stream = ++this.streams;
    void import('./photoreal-tiles').then(({ PhotorealTiles }) => {
      if (this.disposed || stream !== this.streams) return;
      this.tiles = new PhotorealTiles(place, key, report);
      this.scene.add(this.tiles.group);
    });
  }

  dispose(): void {
    this.disposed = true;
    this.tiles?.dispose();
    this.tiles = null;
    for (const d of this.disposables) d.dispose();
    this.toon.dispose();
    for (const t of this.textures) t.dispose();
    if (this.archLabel) {
      this.archLabel.material.map?.dispose();
      this.archLabel.material.dispose();
      this.archLabel.mesh.geometry.dispose();
      this.archLabel = null;
    }
    this.skyLight = undefined;
    this.flatSkyNode = null;
    for (const pipeline of this.pipelines.values()) pipeline.dispose();
    this.pipelines.clear();
    this.temporal.clear();
    this.pipeline = null;
    this.renderer?.dispose();
    this.renderer = null;
  }

  /** Tells the test-only hook what the scene now draws with (#679, L2-111 AC8, AC11). */
  private report(): void {
    if (!this.probe) return;
    this.probe.materials = this.materialVariants();
    let unbent = 0;
    this.scene.traverse((o) => {
      const mesh = o as Mesh;
      if (this.unbent.has(o) || !(mesh.isMesh || (o as { isSprite?: boolean }).isSprite)) return;
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of list) if (m && !(m as { positionNode?: unknown }).positionNode) unbent++;
    });
    this.probe.unbent = unbent;
    this.probe.outlines = this.on.has(52);
    this.probe.skyGradient = this.scene.backgroundNode !== null;
    this.probe.dithered = this.toon.dithered(this.scene);
  }

  /** The scene's distinct materials by variant, for the performance sweep (#679). */
  private materialVariants(): Record<string, number> {
    const materials: Material[] = [];
    this.scene.traverse((o) => {
      const m = (o as Mesh).material;
      if (m) materials.push(...(Array.isArray(m) ? m : [m]));
    });
    return materialVariants(materials as never[]);
  }

  /** Feeds the frame budget while frames run back to back, and lowers the tier on a drop. */
  private feedBudget(): void {
    const now = performance.now();
    const last = this.lastFrameAt;
    this.lastFrameAt = now;
    if (this.probe && last !== null) this.probe.frames.push(now - last);
    // The sweep's drop, as a slow budget's would be (#882).
    if (this.probe && takeDropRequest() && this.budget?.lower()) this.applyTier();
    if (last === null || now - last > 1000 || !this.budget) return;
    if (this.budget.sample(now, now - last) === 'drop') this.applyTier();
  }

  /**
   * Turns the tier's techniques on and off, and swaps in its pass chain (L2-111 AC2, AC5). The
   * load also applies the next-lower tier for a moment, to compile it ahead (#882).
   */
  private applyTier(tier: Tier | undefined = this.budget?.tier): void {
    const renderer = this.renderer;
    if (!renderer || !tier) return;
    const on = techniquesAt(tier, this.backend, this.reducedMotion);
    if (this.probe) this.probe.tier = tier;
    this.on = on;
    const look = this.look;

    renderer.toneMapping = on.has(17) ? AgXToneMapping : NoToneMapping;
    // The physical sky is bright HDR: expose for it, as a camera would.
    renderer.toneMappingExposure = on.has(11) ? 0.5 : 1;
    const anisotropy = on.has(8) ? ANISOTROPY[tier] : 1;
    for (const t of this.textures) {
      t.anisotropy = anisotropy;
      t.needsUpdate = true;
    }

    // Docklands draws its own night sky (world-docklands.ts); the physical sky is black at night.
    this.sky.visible = on.has(11) && this.world?.id !== 'docklands';
    // At low the sky is a flat three-stop gradient, and the fog takes its horizon (technique 53).
    this.scene.background = on.has(11) || on.has(53) ? null : new Color(look.sky);
    // Made once: a new node would be a new program at every tier change (#882).
    this.scene.backgroundNode = on.has(53) ? (this.flatSkyNode ??= flatSky(look.sky)) : null;
    (this.scene.fog as Fog | null)?.color.set(on.has(53) ? skyStops(look.sky).horizon : look.fog);

    renderer.shadowMap.enabled = on.has(12);
    // The WebGPU renderer has no PCFSoftShadowMap: soft shadows (37) widen the PCF filter instead.
    renderer.shadowMap.type = PCFShadowMap;
    this.sun.shadow.radius = on.has(37) ? 4 : 1;
    this.sun.castShadow = on.has(12);

    // A material gets a new program only when a compiled feature changes: textures, roughness
    // and colour are uniforms, so a tier drop rebuilds only what it must (#680).
    const road = compiledFeatures(this.roadMaterial);
    // The drawn look keeps the road's own pattern, so cobbles still read as cobbles (#896).
    this.roadMaterial.map = on.has(9) || on.has(51) ? this.layeredRoad : this.plainRoad;
    // The setts' relief comes with the photometric-stereo materials (technique 3).
    this.roadMaterial.normalMap = on.has(3) ? this.roadRelief : null;
    const wet = on.has(14) && look.wet;
    this.roadMaterial.roughness = wet ? 0.28 : 0.9;
    this.roadMaterial.color.set(look.road).multiplyScalar(wet ? 0.7 : 1);
    this.wetSky(wet);
    if (compiledFeatures(this.roadMaterial) !== road) this.roadMaterial.needsUpdate = true;

    for (const frame of this.frames) {
      const paint = compiledFeatures(frame);
      frame.clearcoat = on.has(15) ? 1 : 0;
      frame.clearcoatRoughness = 0.08;
      if (compiledFeatures(frame) !== paint) frame.needsUpdate = true;
    }

    const night = look.sun < 0;
    for (const lamp of this.lamps) lamp.visible = on.has(23) && night;
    for (const post of this.posts) post.visible = on.has(24);

    this.scene.environment = on.has(6) ? this.lightFromSky(renderer) : null;
    this.scene.environmentIntensity = 0.06;

    // At low, lit surfaces shade in bands; the twins follow the bend at once (technique 51).
    this.toon.apply(this.scene, on.has(51), new Color(look.sky), this.unbent);
    // The rider and pacers take a warmer ink than the scenery (technique 52).
    if (on.has(52)) {
      for (const rider of [this.you, ...this.pacers.values(), ...this.raceRiders.values()]) {
        if (rider) this.toon.inkWarm(rider.group, this.warmInk);
      }
    }
    this.bend.apply(this.scene, this.unbent);
    this.report();

    const previous = this.pipeline;
    this.pipeline = this.pipelineFor(renderer, on);
    // A chain swapped in carries history from the last time it was drawn, perhaps the warm-up.
    if (this.pipeline !== previous) this.freshHistory();
  }

  /**
   * The pass chain for these techniques, built the first time it is asked for. Tiers that draw
   * the same passes share one chain, so a drop between them changes nothing (#882).
   */
  private pipelineFor(renderer: WebGPURenderer, on: Set<number>): RenderPipeline {
    const key = PASS_TECHNIQUES.filter((id) => on.has(id)).join(',');
    let pipeline = this.pipelines.get(key);
    if (!pipeline) {
      pipeline = this.buildPipeline(renderer, on);
      this.pipelines.set(key, pipeline);
    }
    return pipeline;
  }

  /** The post-processing chain of the tier, in the order of the design. */
  private buildPipeline(renderer: WebGPURenderer, on: Set<number>): RenderPipeline {
    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(this.scene, this.camera);
    this.scenePasses.set(pipeline, scenePass);
    const needsVelocity = on.has(7) || on.has(33);
    // The ink outline reads normals and the riders' ink mask beside the colour (technique 52).
    const outlines = on.has(52);
    if (needsVelocity || outlines) {
      scenePass.setMRT(
        mrt({
          output,
          ...(needsVelocity ? { velocity } : {}),
          ...(outlines ? { normal: packNormalToRGB(normalView), ink: float(0) } : {}),
        }),
      );
    }
    const depth = scenePass.getTextureNode('depth');
    const beauty = scenePass.getTextureNode('output');

    // Heat haze shimmers just above the horizon (technique 50).
    let color: ColorNode = (on.has(50) && this.look.haze
      ? beauty.sample(
          screenUV.add(
            vec2(
              sin(time.mul(3).add(screenUV.y.mul(140)))
                .mul(0.0012)
                .mul(
                  smoothstep(float(0.38), float(0.5), screenUV.y).mul(
                    smoothstep(float(0.62), float(0.5), screenUV.y),
                  ),
                ),
              0,
            ),
          ),
        )
      : beauty) as unknown as ColorNode;

    if (on.has(36)) {
      const occlusion = createAmbientOcclusion(depth, this.camera).getTextureNode().r;
      color = vec4(color.rgb.mul(occlusion), color.a);
    }
    if (on.has(33) && needsVelocity) {
      const moving = scenePass.getTextureNode('velocity');
      color = motionBlur(convertToTexture(color), moving.mul(0.5)) as unknown as ColorNode;
    }
    if (outlines) {
      color = inkOutline(
        color,
        scenePass as unknown as Parameters<typeof inkOutline>[1],
      ) as unknown as ColorNode;
    }
    if (on.has(49)) color = color.add(bloom(color, 0.12, 0.2, 1.4)) as unknown as ColorNode;
    if (on.has(7)) {
      const temporal = traa(color, depth, scenePass.getTextureNode('velocity'), this.camera);
      // TRAANode's typings omit the setSize it has.
      this.temporal.set(pipeline, temporal as unknown as { setSize(w: number, h: number): void });
      pipeline.outputNode = temporal;
    } else {
      pipeline.outputNode = fxaa(color);
    }
    return pipeline;
  }

  /** Image-based lighting from the scene's sky (technique 6). */
  /**
   * The sky's light, made once per scene: it depends only on the world's sun, so a tier change
   * reuses it, and the materials lit by it keep their programs (#882). The physical sky is HDR
   * radiance: a small share of it lights the scene (environmentIntensity).
   */
  private lightFromSky(renderer: WebGPURenderer): Texture | null {
    if (this.skyLight !== undefined) return this.skyLight;
    try {
      const skyScene = new Scene();
      const sky = new SkyMesh();
      sky.scale.setScalar(1000);
      sky.sunPosition.value.copy(this.sunDirection());
      skyScene.add(sky);
      const pmrem = new PMREMGenerator(renderer);
      const target = pmrem.fromScene(skyScene);
      pmrem.dispose();
      this.disposables.push(target);
      this.skyLight = target.texture;
    } catch {
      this.skyLight = null;
    }
    return this.skyLight;
  }

  private sunDirection(): Vector3 {
    return direction(this.look.sun, this.look.azimuth ?? -27);
  }

  private async buildScene(world: World, canvas: HTMLCanvasElement): Promise<void> {
    const look = this.look;
    this.scene.fog = new Fog(look.fog, look.fogRange?.[0] ?? 60, look.fogRange?.[1] ?? 650);
    const moon = look.sun < 0 ? look.moon : undefined;
    this.scene.add(
      moon
        ? new HemisphereLight(moon.fillSky, look.ground, moon.fill)
        : new HemisphereLight(
            look.sky,
            look.ground,
            look.sun < 0 ? 0.5 : (look.light?.fill ?? 1.4),
          ),
    );

    // At night the key light is the moon, where the look has one; the sky keeps the sun.
    const sunDir = moon ? direction(moon.elevation, moon.azimuth) : this.sunDirection();
    this.sun.intensity = moon ? moon.strength : look.sun < 0 ? 0.15 : (look.light?.sun ?? 2.2);
    this.sun.color.set(moon?.colour ?? look.light?.colour ?? 0xffffff);
    // The shadow box reaches further down a street of houses than over open country.
    const reach = world.id === 'oldtown' ? 45 : 25;
    this.sun.target.position.set(0, 0, 25 - reach);
    this.keyLight.copy(sunDir);
    this.sun.position.copy(sunDir).multiplyScalar(80).add(this.sun.target.position);
    this.sun.shadow.mapSize.set(2048, 2048);
    // A tight box around the rider: the shadow stays sharp and steady as the road moves.
    const cam = this.sun.shadow.camera;
    cam.left = -reach;
    cam.right = reach;
    cam.top = reach;
    cam.bottom = -reach;
    cam.near = 1;
    cam.far = 240;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun, this.sun.target);

    this.sky.scale.setScalar(4500);
    this.sky.turbidity.value = look.turbidity ?? 4;
    this.sky.rayleigh.value = look.sun < 0 ? 0.3 : (look.rayleigh ?? 1.6);
    this.sky.mieCoefficient.value = 0.003;
    this.sky.sunPosition.value.copy(this.sunDirection());
    this.scene.add(this.sky);

    this.plainRoad = this.track(roadTexture(false));
    const cobbles = COBBLED.has(world.id)
      ? (await import('./world-oldtown')).cobbleTextures()
      : null;
    const roadMap = cobbles
      ? cobbles.map
      : world.id === 'docklands'
        ? wetAsphaltTexture()
        : roadTexture(true);
    this.layeredRoad = this.track(roadMap);
    this.roadRelief = cobbles ? this.track(cobbles.relief) : null;
    this.roadMaterial.color.set(look.road);
    const groundMesh = this.addMesh(
      this.ground,
      new MeshStandardMaterial({ color: look.ground, roughness: 1 }),
    );
    groundMesh.receiveShadow = true;
    const roadMesh = this.addMesh(this.road, this.roadMaterial);
    roadMesh.receiveShadow = true;
    this.addRider(canvas);
    this.addArch();
    this.addRoadside();
  }

  private track<T extends Texture>(texture: T): T {
    this.textures.push(texture);
    return texture;
  }

  private addMesh(geometry: BufferGeometry, material: Material): Mesh {
    const mesh = new Mesh(geometry, material);
    this.scene.add(mesh);
    this.disposables.push(geometry, material);
    return mesh;
  }

  /**
   * The photographed distance, on an arc far ahead that the fog does not reach. It is loaded
   * before the first frame: a ride that has not started draws only when its state changes.
   */
  private async addPanorama(world: World): Promise<void> {
    const arc = (2 * Math.PI) / 3;
    const geometry = new CylinderGeometry(900, 900, 560, 48, 1, true, Math.PI - arc / 2, arc);
    const material = new MeshBasicMaterial({ side: BackSide, fog: false, transparent: true });
    const mesh = this.addMesh(geometry, material);
    mesh.position.y = 160;
    // The photographed distance stands beyond the road and does not bend (L2-110 AC9).
    this.unbent.add(mesh);
    try {
      const texture = await new TextureLoader().loadAsync(`/worlds/${world.id}/panorama.webp`);
      texture.colorSpace = SRGBColorSpace;
      texture.wrapS = RepeatWrapping;
      texture.repeat.x = -1;
      texture.offset.x = PANORAMA_TURN[world.id] ?? 0;
      material.map = this.track(texture);
      material.alphaMap = this.track(fadeTexture());
      material.needsUpdate = true;
    } catch {
      mesh.visible = false;
    }
  }

  /** The rider on their bike, from behind, in the You colour of the rider board. */
  private addRider(canvas: HTMLCanvasElement): void {
    const kit = new CyclistKit(this.frameMaterial);
    this.kit = kit;
    this.canvas = canvas;
    // The rider wears the You jersey of the race board (L2-060).
    const you = kit.make(jerseyColour(canvas, 'you'), 4, this.frameMaterial, {
      frameColor: 0x15171c,
    });
    this.you = you;
    this.wheelBlur.push(...you.wheelBlur);
    this.scene.add(you.group);
    this.disposables.push(kit, this.frameMaterial);
    // The simulated pacers ride with the rider, each in its board colour (L2-107 AC7).
    for (const pacer of PACERS) {
      const rider = kit.make(riderColour(canvas, pacer.jersey), pacer.jersey, this.frameMaterial, {
        frameColor: FRAME_PAINT[pacer.jersey % FRAME_PAINT.length]!,
        helmetColor: pacer.jersey % 2 === 0 ? 0xf2f2ee : undefined,
      });
      rider.group.visible = false;
      this.wheelBlur.push(...rider.wheelBlur);
      this.pacers.set(pacer.jersey, rider);
      this.scene.add(rider.group);
    }
    // The ghost is made with the scene, so its translucent material compiles while the world loads.
    this.addGhost(kit, canvas);
  }

  /**
   * The ghost of a solo race: the cyclist kit's rider in translucent gold (L2-064 AC3). `main` has no ghost; it is drawn
   * new from the kit, in its style. The wheels keep the kit's spokes, so they still read as wheels.
   */
  private addGhost(kit: CyclistKit, canvas: HTMLCanvasElement): void {
    const gold = jerseyColour(canvas, 'ghost');
    const glass = new MeshStandardMaterial({
      color: gold,
      roughness: 0.4,
      transparent: true,
      opacity: GHOST_OPACITY,
      depthWrite: false,
    });
    const ghost = kit.make(gold, 0);
    ghost.group.traverse((part) => {
      const mesh = part as Mesh;
      if (mesh.isMesh && mesh.material !== kit.spokes && mesh.material !== kit.spokeLace) {
        mesh.material = glass;
        mesh.castShadow = false;
      }
    });
    ghost.group.visible = false;
    this.raceRiders.set('ghost', ghost);
    this.wear.set('ghost', glass);
    this.scene.add(ghost.group);
    this.disposables.push(glass);
  }

  /**
   * A race rider in their jersey, made the first time they ride into view and dressed as the scene is at its tier:
   * toon twins and warmer ink at low, and the road's bend. Each bike takes a frame paint of its own, as the pacers'.
   */
  private raceRider(jersey: string): Cyclist | null {
    const made = this.raceRiders.get(jersey);
    if (made) return made;
    if (!this.kit || !this.canvas) return null;
    const number = this.raceRiders.size;
    const colour = jerseyColour(this.canvas, jersey);
    const rider = this.kit.make(colour, number, this.frameMaterial, {
      frameColor: FRAME_PAINT[number % FRAME_PAINT.length]!,
      helmetColor: number % 2 === 0 ? 0xf2f2ee : undefined,
    });
    rider.group.visible = false;
    this.raceRiders.set(jersey, rider);
    this.wear.set(jersey, { color: colour, opacity: 1 });
    this.scene.add(rider.group);
    if (this.on.has(51)) this.toon.apply(rider.group, true, new Color(this.look.sky), this.unbent);
    if (this.on.has(52)) this.toon.inkWarm(rider.group, this.warmInk);
    this.bend.apply(rider.group, this.unbent);
    return rider;
  }

  /** Puts each race rider in view at their place, and hides the rest (L2-064 AC3). */
  private placeRaceRiders(
    world: World,
    frame: SceneFrame,
    ahead: RoadPoint[],
    riders: readonly SceneRider[],
  ): void {
    // `main`'s pacers ride no race, though the start's rehearsal frame, which has no riders, drew them.
    for (const rider of [...this.pacers.values(), ...this.raceRiders.values()])
      rider.group.visible = false;
    const drawn = ridersOnRoad(riders, AHEAD * STEP);
    drawn.forEach((p, order) => {
      const rider = this.raceRider(p.jersey);
      if (rider) this.ride(world, frame, ahead, rider, p.metres, p.lane, order + 1);
    });
    if (this.probe) {
      this.probe.pacers = [...this.pacers.values()].filter((p) => p.group.visible).length;
      this.probe.riders = drawn.map((p) => {
        const wear = this.wear.get(p.jersey);
        return {
          jersey: p.jersey,
          metres: p.metres,
          colour: `#${wear?.color.getHexString() ?? '000000'}`,
          opacity: wear?.opacity ?? 0,
        };
      });
    }
  }

  /** Puts each pacer in view at its gap, and hides the rest (L2-107 AC7). */
  private placePacers(world: World, frame: SceneFrame, ahead: RoadPoint[]): void {
    for (const rider of this.pacers.values()) rider.group.visible = false;
    for (const p of pacersOnRoad(frame.time, AHEAD * STEP, PACERS, this.activePacers)) {
      const rider = this.pacers.get(p.jersey);
      if (!rider) continue;
      this.ride(world, frame, ahead, rider, p.metres, p.lane, p.jersey);
    }
  }

  /** Puts a pacer or race rider on the road `metres` ahead, on `lane`, pedalling out of step by `seed`. */
  private ride(
    world: World,
    frame: SceneFrame,
    ahead: RoadPoint[],
    rider: Cyclist,
    metres: number,
    lane: number,
    seed: number,
  ): void {
    const shadowAhead = (world.id === 'oldtown' ? 45 : 25) + 30;
    rider.group.visible = true;
    rider.setCastShadow(metres > -25 && metres < shadowAhead);
    // Through a bend each pacer cuts to the inside, towards the apex; one beside the rider
    // holds their lane so as not to ride into them.
    const clear = Math.min(Math.max((Math.abs(metres) - 3) / 10, 0), 1);
    const line = racingLine(world, frame.s + metres, lane, ROAD_HALF);
    const grade = gradeAt(ahead, metres);
    rider.group.position.set(lane + (line - lane) * clear, this.heightAtAhead(metres), -metres);
    rider.group.rotation.x = pitch(grade);
    // Each pacer leans into the bend it is riding through, as the rider does.
    rider.pose(
      frame.reducedMotion ? 0 : frame.crank * (0.9 + seed * 0.03) + seed,
      -lean(world, frame.s + metres, frame.speedKmh / 3.6),
      standing(grade),
    );
  }

  /** The arch over the road ahead: two posts, a beam, its start line and label, merged per finish. */
  private addArch(): void {
    const matte = new MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
    const steel = new MeshStandardMaterial({ color: 0x8d939b, metalness: 0.7, roughness: 0.35 });
    const paintArchPart = (geo: BufferGeometry, hex: number) => {
      const c = new Color(hex);
      const count = geo.getAttribute('position').count;
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        arr[i * 3] = c.r;
        arr[i * 3 + 1] = c.g;
        arr[i * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new BufferAttribute(arr, 3));
      geo.clearGroups();
      return geo;
    };
    // Each leg is a truss: four steel chords on a weighted foot, merged into 1 steel + 1 matte mesh.
    const chordParts: BufferGeometry[] = [];
    const frameParts: BufferGeometry[] = [];
    for (const x of [-ROAD_HALF - 0.7, ROAD_HALF + 0.7]) {
      for (const [dx, dz] of [
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ] as const) {
        const c = new BoxGeometry(0.06, 5.2, 0.06);
        c.translate(x + dx, 2.75, dz);
        chordParts.push(c);
      }
      const f = paintArchPart(new BoxGeometry(0.9, 0.25, 0.9).translate(x, 0.125, 0), 0x1b1e24);
      frameParts.push(f);
    }
    frameParts.push(
      paintArchPart(new BoxGeometry(2 * ROAD_HALF + 2, 1.4, 0.45).translate(0, 5.6, 0), 0x1b1e24),
    );
    // The line across the road where the effort starts, merged into the vertex-coloured matte mesh.
    frameParts.push(
      paintArchPart(
        new PlaneGeometry(2 * ROAD_HALF, 0.4).rotateX(-Math.PI / 2).translate(0, 0.02, 0),
        0xf2f3ef,
      ),
    );
    const chordsGeo = mergeGeometries(chordParts, false)!;
    const frameGeo = mergeGeometries(frameParts, false)!;
    for (const g of [...chordParts, ...frameParts]) g.dispose();

    const chordsMesh = new Mesh(chordsGeo, steel);
    chordsMesh.castShadow = true;
    const frameMesh = new Mesh(frameGeo, matte);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    this.arch.add(chordsMesh, frameMesh);

    // The banner's lettering: one persistent canvas/texture painted in place (#882).
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 96;
    paintArchLabel(labelCanvas, '');
    const labelTex = new CanvasTexture(labelCanvas);
    labelTex.colorSpace = SRGBColorSpace;
    const label = new Mesh(
      new PlaneGeometry(2 * ROAD_HALF + 1.8, 1.2),
      new MeshBasicMaterial({ map: labelTex, side: DoubleSide }),
    );
    label.position.set(0, 5.6, 0.24);
    this.arch.add(label);
    this.archLabel = {
      text: '',
      canvas: labelCanvas,
      texture: labelTex,
      mesh: label,
      material: label.material,
    };
    this.disposables.push(matte, steel, chordsGeo, frameGeo);
    this.arch.visible = false;
    this.scene.add(this.arch);
  }

  /** Street lamps for a night scene and reflective posts on both verges (techniques 23, 24). */
  private addRoadside(): void {
    const lamps = this.look.sun < 0 ? LAMPS : 0;
    for (let i = 0; i < lamps; i++) {
      const lamp = new PointLight(0xffc98a, 40, 45, 2);
      lamp.visible = false;
      this.lamps.push(lamp);
      this.scene.add(lamp);
    }
    const post = new BoxGeometry(0.12, 1, 0.12);
    const reflector = new MeshStandardMaterial({
      color: 0xf2f3ef,
      emissive: new Color(0xff5a2e),
      emissiveIntensity: this.look.sun < 0 ? 2.5 : 0.4,
      roughness: 0.4,
    });
    // Old Town's kerbs have iron bollards (world-oldtown.ts) and Docklands' quay a neon line
    // (world-docklands.ts) in place of verge posts.
    const id = this.world?.id;
    const posts = id === 'oldtown' || id === 'docklands' || (id && STREETS[id]) ? 0 : POSTS;
    for (let i = 0; i < posts; i++) {
      const mesh = new Mesh(post, reflector);
      mesh.visible = false;
      this.posts.push(mesh);
      this.scene.add(mesh);
    }
    this.disposables.push(post, reflector);
  }

  private async addStreet(): Promise<void> {
    const { OldTownStreet } = await import('./world-oldtown');
    const street = new OldTownStreet((t) => this.track(t), this.disposables);
    street.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(street.group);
    this.street = street;
    // Padding, signs and marshals at each corner of the circuit, on the kerb and at the barriers.
    const corners = new Corners(this.disposables);
    corners.build(ROAD_HALF, 0.15, ROAD_HALF + 0.4);
    this.scene.add(corners.group);
    this.corners = corners;
    // A gradient sign at the foot of each ramp, on the right-hand pavement behind the barrier.
    const ramp = new RampSign(this.disposables);
    this.disposables.push(ramp);
    this.scene.add(ramp.group);
    this.ramp = ramp;
  }

  private addScenery(make: StreetFactory): void {
    const street = make((t) => this.track(t), this.disposables);
    street.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(street.group);
    // The street's far scenery stands beyond the road and does not bend, as the panorama does.
    for (const far of street.backdrop ?? []) far.traverse((part) => this.unbent.add(part));
    this.scenery = street;
  }

  private async addTowers(): Promise<void> {
    const { DocklandsStreet } = await import('./world-docklands');
    const towers = new DocklandsStreet((t) => this.track(t), this.disposables);
    towers.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(towers.group);
    this.towers = towers;
    this.wetSky(this.look.wet === true);
  }

  /** A wet Docklands road mirrors its night sky's violet glow, as the mock's road does. */
  /** The wet road's sky reflection: its code compiles in only while the road has it (#680). */
  private wetSky(wet: boolean): void {
    const before = compiledFeatures(this.roadMaterial);
    this.roadMaterial.envMap = wet && this.towers ? this.towers.skyEnv() : null;
    this.roadMaterial.envMapIntensity = 1.4;
    if (compiledFeatures(this.roadMaterial) !== before) this.roadMaterial.needsUpdate = true;
  }

  private placeRoadside(s: number, ahead: RoadPoint[]): void {
    this.street?.place(s, this.heightAtAhead);
    if (this.world) this.corners?.place(this.world, s, this.heightAtAhead);
    this.ramp?.place(ahead, ROAD_HALF + 1, 0.15);
    this.towers?.place(s, this.heightAtAhead);
    this.scenery?.place(s, this.heightAtAhead);
    for (let i = 0; i < this.lamps.length; i++) {
      const lamp = this.lamps[i]!;
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + 8;
      // A light is no vertex, so it takes the bend here.
      const at = bendPoint(
        this.bendSamples,
        i % 2 === 0 ? -ROAD_HALF - 1.5 : ROAD_HALF + 1.5,
        -metres,
        this.lampAt,
      );
      lamp.position.set(at.x, this.heightAtAhead(metres) + 6, at.z);
    }
    for (let i = 0; i < this.posts.length; i++) {
      const post = this.posts[i]!;
      const metres = Math.floor(i / 2) * POST_EVERY - (s % POST_EVERY) + 4;
      post.position.set(
        i % 2 === 0 ? -ROAD_HALF - 0.8 : ROAD_HALF + 0.8,
        this.heightAtAhead(metres) + 0.5,
        -metres,
      );
    }
  }

  private placeArch(world: World, frame: SceneFrame, speed: number, ahead: RoadPoint[]): void {
    const arch = nextArch(world, frame.segments, frame.elapsed, speed);
    const far = AHEAD * STEP;
    this.arch.visible = arch !== null && arch.metres <= far;
    if (!arch || !this.arch.visible) return;
    this.arch.position.set(0, heightAt(ahead, arch.metres), -arch.metres);
    const label = this.archLabel;
    if (!label || label.text === arch.label) return;
    paintArchLabel(label.canvas, arch.label);
    label.texture.needsUpdate = true;
    label.text = arch.label;
  }

  /** Lays the road and the ground beside it over the points ahead, and a short run behind. */
  private layRoad(ahead: RoadPoint[], s: number): void {
    const first = ahead[0]!;
    const points = this.stripPoints;
    for (let k = 0; k < BEHIND; k++) {
      const metres = -(BEHIND - k) * STEP;
      const p = points[k]!;
      p.metres = metres;
      p.height = (first.grade / 100) * metres;
      p.grade = first.grade;
    }
    for (let k = 0; k < ahead.length; k++) {
      const src = ahead[k]!;
      const dst = points[BEHIND + k]!;
      dst.metres = src.metres;
      dst.height = src.height;
      dst.grade = src.grade;
    }
    fillStrip(this.road, points, ROAD_HALF, 0);
    this.street?.lay(points, s);
    this.towers?.lay(points, s);
    this.scenery?.lay(points, s);
    fillStrip(this.ground, points, GROUND_HALF, -0.05);
    this.towers?.sink(this.ground, points);
    this.scenery?.sink?.(this.ground, points);
  }
}

/** A strip of quads along the road: two vertices per point. */
function stripGeometry(): BufferGeometry {
  const count = AHEAD + BEHIND + 1;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3));
  const normals = new Float32Array(count * 6);
  for (let i = 0; i < count * 2; i++) normals[i * 3 + 1] = 1;
  geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(count * 4), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const a = i * 2;
    // Wound counter-clockwise from above, so the strip faces up.
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setIndex(index);
  return geometry;
}

function fillStrip(
  geometry: BufferGeometry,
  points: RoadPoint[],
  half: number,
  drop: number,
): void {
  const position = geometry.getAttribute('position') as BufferAttribute;
  const normal = geometry.getAttribute('normal') as BufferAttribute;
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  const posArr = position.array as Float32Array;
  const nrmArr = normal.array as Float32Array;
  const uvArr = uv.array as Float32Array;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const y = p.height + drop;
    const z = -p.metres;
    const g = p.grade / 100;
    const ny = 1 / Math.hypot(1, g);
    const nz = g * ny;
    const pBase = i * 6;
    posArr[pBase] = -half;
    posArr[pBase + 1] = y;
    posArr[pBase + 2] = z;
    posArr[pBase + 3] = half;
    posArr[pBase + 4] = y;
    posArr[pBase + 5] = z;
    nrmArr[pBase] = 0;
    nrmArr[pBase + 1] = ny;
    nrmArr[pBase + 2] = nz;
    nrmArr[pBase + 3] = 0;
    nrmArr[pBase + 4] = ny;
    nrmArr[pBase + 5] = nz;
    const uBase = i * 4;
    const v = p.metres / DASH;
    uvArr[uBase] = 0;
    uvArr[uBase + 1] = v;
    uvArr[uBase + 2] = 1;
    uvArr[uBase + 3] = v;
  }
  position.needsUpdate = true;
  normal.needsUpdate = true;
  uv.needsUpdate = true;
}

/** A direction in the sky: azimuth 0 is straight down the road, positive to the rider's right. */
function direction(elevationDegrees: number, azimuthDegrees: number): Vector3 {
  const elevation = (elevationDegrees * Math.PI) / 180;
  const azimuth = (azimuthDegrees * Math.PI) / 180;
  const level = Math.cos(elevation);
  return new Vector3(
    Math.sin(azimuth) * level,
    Math.sin(elevation),
    -Math.cos(azimuth) * level,
  ).normalize();
}

/** The road's gradient `metres` ahead, in percent, between the two points either side of it. */
function gradeAt(points: RoadPoint[], metres: number): number {
  const f = Math.min(Math.max(metres / STEP, 0), points.length - 1);
  const i = Math.min(Math.floor(f), Math.max(points.length - 2, 0));
  const a = points[i]?.grade ?? 0;
  const b = points[i + 1]?.grade ?? a;
  return a + (b - a) * (f - i);
}

/** How far out of the saddle a rider climbs a gradient: seated to 4%, standing from 7%. */
function standing(grade: number): number {
  const u = Math.min(Math.max((grade - 4) / 3, 0), 1);
  return u * u * (3 - 2 * u);
}

/** The pitch, in radians about the x axis, of something standing on a gradient: nose up uphill. */
function pitch(grade: number): number {
  return Math.atan(grade / 100);
}

/**
 * The road's height `metres` ahead, between the two points either side of it. Behind the rider it
 * runs back at the grade under the rider, as the road behind is laid (`layRoad`).
 */
function heightAt(points: RoadPoint[], metres: number): number {
  const first = points[0];
  if (metres < 0) return (first?.height ?? 0) + ((first?.grade ?? 0) / 100) * metres;
  const f = Math.min(Math.max(metres / STEP, 0), points.length - 1);
  const i = Math.min(Math.floor(f), Math.max(points.length - 2, 0));
  const a = points[i]?.height ?? 0;
  const b = points[i + 1]?.height ?? a;
  return a + (b - a) * (f - i);
}

/**
 * The road surface, one 10 m tile with the dashed centre line and edge lines. Layered
 * (technique 9): aggregate speckle over the base, a tar seam and a worn wheel track.
 */
function roadTexture(layered: boolean): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    if (layered) {
      let seed = 7;
      const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9000; i++) {
        const shade = 200 + Math.floor(random() * 55);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
      }
      ctx.fillStyle = 'rgba(40,40,40,0.35)';
      ctx.fillRect(0, size * 0.62, size, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(size * 0.68, 0, size * 0.12, size);
    }
    ctx.fillStyle = '#f2f3ef';
    ctx.fillRect(size / 2 - 4, 0, 8, size * 0.56);
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(4, 0, 6, size);
    ctx.fillRect(size - 10, 0, 6, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Neon Docklands' road: rain-dark asphalt. Coarse aggregate grain, two darker tyre tracks
 * worn into each lane, a tar seam, and pale wet patches where the road holds standing water.
 */
function wetAsphaltTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e4e4e4';
    ctx.fillRect(0, 0, size, size);
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14000; i++) {
      const shade = 110 + Math.floor(random() * 145);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    // Tyre tracks: two in each lane, darker where the wheels keep to them.
    ctx.fillStyle = 'rgba(30,30,40,0.45)';
    for (const at of ASPHALT_TRACKS) ctx.fillRect(size * at - 9, 0, 18, size);
    // A tar seam across the road.
    ctx.fillStyle = 'rgba(20,20,26,0.5)';
    ctx.fillRect(0, size * 0.62, size, 3);
    // Standing water: soft pale patches that catch the reflected neon.
    for (let i = 0; i < 6; i++) {
      const x = size * (0.1 + random() * 0.8);
      const y = random() * size;
      const r = 14 + random() * 22;
      const pool = ctx.createRadialGradient(x, y, 0, x, y, r);
      pool.addColorStop(0, 'rgba(255,255,255,0.8)');
      pool.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2f3ef';
    ctx.fillRect(size / 2 - 4, 0, 8, size * 0.56);
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(4, 0, 6, size);
    ctx.fillRect(size - 10, 0, 6, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Where the tyre tracks run across the road tile, as fractions of its width: two per lane. */
const ASPHALT_TRACKS = [0.17, 0.36, 0.64, 0.83];

/** Opaque below, fading out over the top fifth: the panorama's sky melts into the sky above. */
function fadeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#000');
    g.addColorStop(0.22, '#fff');
    g.addColorStop(1, '#fff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  return new CanvasTexture(canvas);
}

/** A rider colour of the design system, `--color-rider-<n>` (4 is You), read from the page. */
function riderColour(element: Element, n: number): Color {
  const value = getComputedStyle(element).getPropertyValue(`--color-rider-${n}`).trim();
  const colour = new Color(0xd7ff3a);
  if (value) colour.setStyle(value);
  return colour;
}

/** A race rider's colour, the design system's `--jersey-<jersey>` (L2-064 AC3); the ghost's is gold. */
function jerseyColour(element: Element, jersey: string): Color {
  const value = getComputedStyle(element).getPropertyValue(`--jersey-${jersey}`).trim();
  const colour = new Color(0xd7ff3a);
  if (value) colour.setStyle(value);
  return colour;
}

/** How much of the scene shows through the ghost (L2-064 AC3). */
const GHOST_OPACITY = 0.45;

/** Frame paints for the pacers' bikes: white, red, navy, silver and teal. */
const FRAME_PAINT = [0xeeeeea, 0xb3262c, 0x1d2b4a, 0xa9aeb5, 0x2a7d7a];

function paintArchLabel(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // As the mocks: dark lettering on the volt banner, inside a dark keyline.
  ctx.fillStyle = '#d8ff3e';
  ctx.fillRect(0, 0, 1024, 96);
  ctx.strokeStyle = '#1b1e24';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 1008, 80);
  ctx.fillStyle = '#1b1e24';
  ctx.font = 'bold 60px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 512, 50);
}

/** How many times the load runs the ride's own frame before the ride starts (#882). */
const REHEARSALS = 4;

/** The techniques buildPipeline reads: a pass chain is keyed by those of them a tier draws. */
const PASS_TECHNIQUES = [7, 33, 36, 49, 50, 52] as const;

/**
 * Counts each shader program and render pipeline the backend builds into the sweep's report:
 * each is a compile, and a frame that waits on one stalls (#882).
 */
/** Builds the GTAO post-processing node (technique 36) at half resolution (0.5x). */
export function createAmbientOcclusion(depth: Node, camera: PerspectiveCamera) {
  // GTAO rebuilds normals from depth when given none; its typings omit the null it documents.
  const aoPass = ao(depth, null as unknown as Node, camera);
  aoPass.resolutionScale = 0.5;
  return aoPass;
}

function countCompiles(renderer: WebGPURenderer, probe: WorldRideProbeReport): void {
  type Build = (...args: unknown[]) => unknown;
  const backend = renderer.backend as unknown as Record<string, Build>;
  for (const name of ['createProgram', 'createRenderPipeline']) {
    const build = backend[name]!.bind(backend);
    backend[name] = (...args) => {
      probe.compiled++;
      return build(...args);
    };
  }
}
