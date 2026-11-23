// Neon Docklands' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): glass
// and concrete towers after dark on both sides of the road, their windows lit at random and a
// neon sign down some of their faces. The towers repeat along a loop longer than the road in
// view, so the street never ends.
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  EquirectangularReflectionMapping,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LatheGeometry,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Texture,
} from 'three/webgpu';

/** Metres from the road's edge to the nearest tower face: the quay's pavement between. */
const SETBACK = 11;
/** The street repeats every LOOP metres; towers run from BEHIND metres behind the rider. */
const LOOP = 640;
const BEHIND = 30;
/** Towers reach below the road, so a ramp never shows their footing. */
const FOOTING = 6;
/** One window texture tile covers this many metres of façade, across and up. */
const TILE = 24;
/** The neon colours of the signs: magenta, cyan, volt and violet. */
const NEON = ['#ff4fb8', '#3fe0ff', '#d8ff3e', '#9b6bff'];
/** What the blade signs spell, top to bottom. */
const SIGN_WORDS = ['HOTEL', 'NOODLES', 'BAR', 'DOCK 9', 'CLUB', 'OPEN', 'RAMEN', 'CAFE'];
/** How brightly a blade sign glows, and how dim it drops when its tube stutters. */
const BLADE_GLOW = 1.8;
const BLADE_DIM = 0.12;
/**
 * The blade signs whose tubes are failing, each with when in the round its stutter starts (s):
 * every FLICKER_EVERY seconds one stutters off and on for FLICKER_FOR seconds.
 */
const FLICKERING: readonly [string, number][] = [
  ['HOTEL', 0],
  ['BAR', 3.1],
  ['CLUB', 5.4],
];
const FLICKER_EVERY = 7;
const FLICKER_FOR = 1.1;
/**
 * The harbour: along this stretch of the loop, in metres, the left side has no towers and the
 * quay looks over the water to the far shore, FAR_SHORE metres away.
 */
const HARBOUR_FROM = 20;
/**
 * The harbour ferry: where it crosses on the loop (m), the middle and reach of its crossing
 * from the road's centre (m), one crossing there and back (s) and where it starts in it, its
 * length and its wake's length (m).
 */
const FERRY_OFFSET = 190;
const FERRY_MID = -170;
const FERRY_REACH = 130;
const FERRY_PERIOD = 150;
const FERRY_PHASE = 1.09;
const FERRY_LONG = 34;
const FERRY_WAKE = 46;
/**
 * Boats moored in the harbour, `offset` metres along the loop and `out` metres beyond the
 * quay's edge, `length` metres long; `hex` lights the cabin.
 */
const BOATS: readonly { offset: number; out: number; length: number; hex: string }[] = [
  { offset: 52, out: 7, length: 16, hex: '#ffd49a' },
  { offset: 84, out: 22, length: 24, hex: '#3fe0ff' },
  { offset: 118, out: 8, length: 13, hex: '#ff4fb8' },
  { offset: 150, out: 30, length: 20, hex: '#ffd49a' },
  { offset: 186, out: 9, length: 18, hex: '#9b6bff' },
  { offset: 222, out: 18, length: 15, hex: '#ffd49a' },
];
/**
 * The elevated railway crosses the street SKYTRAIN metres along the loop, its deck RAIL_DECK
 * metres above the road, with a train standing on it.
 */
const SKYTRAIN = 150;
const RAIL_DECK = 15;
/** The line's name on the deck over the street: its width (m). */
const LINE_SIGN_WIDE = 16;
/** The viaduct runs from RAIL_WEST (inside the far shore) to RAIL_EAST, across the road. */
const RAIL_WEST = -360;
const RAIL_EAST = 210;
const TRAIN_SPEED = 16;
/** The top of a train's cars above the deck (m): the drones climb over it. */
const TRAIN_TOP = 3.7;
/** The landmark's searchlights: cones BEAM_LENGTH long, leaning BEAM_LEAN, sweeping at SWEEP. */
const BEAM_LENGTH = 900;
const BEAM_WIDTH = 34;
const BEAM_LEAN = 0.42;
const SWEEP = 0.25;
/** The drizzle: DROPS streaks DROP metres long, falling at RAIN_SPEED m/s round the rider. */
const DROPS = 1100;
const DROP = 0.7;
const RAIN_SPEED = 9;
const RAIN_BOX = 26;
const RAIN_HEIGHT = 14;
/** Steam grates at the road's edge: [metres along the loop, side]. */
const VENTS: readonly [number, -1 | 1][] = [
  [48, -1],
  [62, 1],
  [96, -1],
  [210, 1],
  [330, 1],
  [410, -1],
  [530, 1],
];
/** Each vent's PUFFS puffs climb STEAM_HEIGHT metres over STEAM_LIFE seconds. */
const PUFFS = 6;
const STEAM_HEIGHT = 5;
const STEAM_LIFE = 4;
/** The neon lights under the vents, in turn, and the haze their steam fades to as it rises. */
const VENT_LIGHTS = ['#ff4fd8', '#3fe0ff', '#a070ff'];
const STEAM_HAZE = '#c8c4e6';
/** What the towers' screens scroll, each on its own neon ground. */
const SCREEN_WIDE = 8;
/** The colour each screen's light throws on the pavement, as its gradient's leading colour. */
const SCREEN_GLOW: readonly string[] = ['#ff4fb8', '#3fe0ff', '#9b6bff'];
const SCREENS: readonly string[] = [
  'HARBOUR NIGHTS  ·  OPEN LATE  ·  ',
  'RAMEN 24H  ·  NOODLE BAR  ·  ',
  'DOCKLANDS  ·  RIDE THE NIGHT  ·  ',
];
/** The big wheel on the far shore (FAR_SHORE is 340): where it stands (x, z), its size, cabins and turn (rad/s). */
const WHEEL_AT = [-334, -560] as const;
/** The harbour bridge: from and to across the harbour (x, m), how far ahead (z), its deck and
 * pylon heights (m). FAR_SHORE is declared below, so its span is written out. */
const BRIDGE_SPAN = [-20, -320] as const;
const BRIDGE_Z = -640;
const BRIDGE_DECK = 30;
/** Each bulb's glow on the harbour bridge, across (m). */
const BRIDGE_BULB = 7;
/**
 * The harbour bridge's bulbs: their colours in turn along the cable, the length of the chase's
 * wave across the harbour (m per radian) and how fast it runs (rad/s).
 */
const BULB_COLOURS = ['#ffcf6a', '#5ff2ff', '#ff6ad5'];
const BULB_WAVE = 9;
const BULB_CHASE = 3;
const BRIDGE_PYLON = 110;
const WHEEL_RADIUS = 56;
const WHEEL_HUB = 64;
const WHEEL_CABINS = 18;
const WHEEL_TURN = 0.04;
/**
 * The holographic whale: its length; its path across the sky ahead (from x, its length, its depth
 * and height); where along it the ride starts; its speed.
 */
const WHALE_LENGTH = 70;
const WHALE_FROM = -420;
const WHALE_PATH = 640;
const WHALE_Z = -430;
const WHALE_HEIGHT = 78;
const WHALE_START = 300;
const WHALE_SPEED = 3;
/** Vending machines against the towers across the street, at these offsets round the loop. */
const MACHINES: readonly number[] = [22, 64, 118, 176, 250, 330, 402, 455, 520, 610];
const MACHINE_WIDE = 1.4;
const MACHINE_TALL = 2.4;
const MACHINE_DEEP = 1;
const MACHINE_COLOURS: readonly string[] = ['#ff3b5c', '#2f7dff', '#ffb347', '#2fd18a'];
/** The giant neon cyclist: where it hangs over the street's far end, its length (m) and its
 * cadence (radians a second, about 80 rpm). */
const CYCLIST_AT = [0, 250, -640] as const;
/**
 * Fireworks over the harbour, on the far shore's side: where each bursts (m), its colour and
 * how far through the show it starts.
 */
const FIREWORKS: readonly { at: readonly [number, number, number]; hex: string; from: number }[] = [
  { at: [-196, 283, -700], hex: '#ff4fd8', from: 0 },
  { at: [-374, 230, -700], hex: '#5ff2ff', from: 0.38 },
  { at: [-383, 140, -700], hex: '#ffd23a', from: 0.7 },
];
/**
 * The lighthouse in the harbour: where it stands (x, z in m), its tower's height (m), its
 * beams' length and width at the mouth (m), one turn (s) and where they point at rest.
 */
const LIGHTHOUSE_AT = [-190, -400] as const;
const LIGHTHOUSE_HEIGHT = 56;
/** How much larger than life the lighthouse stands, so it reads from across the harbour. */
const LIGHTHOUSE_SCALE = 1.5;
const LIGHTHOUSE_BEAM_LONG = 260;
const LIGHTHOUSE_BEAM_WIDE = 12;
const LIGHTHOUSE_TURN = 12;
/** Each beam's nested cones: width as a share of the beam's, and brightness. */
const LIGHTHOUSE_BEAM_LAYERS: readonly (readonly [number, number])[] = [
  [1, 0.35],
  [0.62, 0.5],
  [0.3, 0.8],
];
const LIGHTHOUSE_FACING = Math.PI / 5;
/**
 * The laser show: where its emitter stands on a rooftop ahead (x, y, z in m), how many beams,
 * their length and width (m), their colours, and how far (rad) and how fast they swing.
 */
const LASER_AT = [5, 118, -720] as const;
const LASER_BEAMS = 9;
const LASER_LONG = 900;
const LASER_WIDE = 4;
const LASER_COLOURS = ['#39ff6a', '#ff3df0'];
const LASER_SWAY = 0.22;
const LASER_SWING = 0.5;
/**
 * The holographic globe over the city ahead: where it hovers (x, y, z in m), its radius (m),
 * its axis's lean (rad) and one turn (s).
 */
const HOLO_AT = [6, 205, -650] as const;
const HOLO_RADIUS = 40;
const HOLO_TILT = 0.4;
const HOLO_TURN = 60;
/** The satellites riding the globe's ring, and one turn of the ring (s), the other way round. */
const HOLO_SATELLITES = 3;
const HOLO_RING_TURN = -24;
/**
 * Holographic koi over the street: where each school swims round the loop (m), how many in a
 * school, the height they swim at over the road (m), and their skins' ground and patch colours.
 */
const KOI_SCHOOLS = [62, 330, 520];
const KOI_PER_SCHOOL = 7;
const KOI_HEIGHT = 12;
/**
 * How deep a school swims about KOI_HEIGHT (m): together with the fishes' bob it keeps them
 * above the gates' name plates and the lantern strings, which they used to swim through.
 */
const KOI_DEPTH = 3;
/** A koi's outline from head (+1) to tail (-1): its radius at each point along its length. */
const KOI_PROFILE: readonly (readonly [number, number])[] = [
  [0, -1],
  [0.1, -0.92],
  [0.2, -0.6],
  [0.38, -0.2],
  [0.5, 0.2],
  [0.48, 0.55],
  [0.34, 0.82],
  [0.14, 0.97],
  [0, 1],
];
const KOI_SKINS: readonly (readonly [string, string])[] = [
  ['#ffffff', '#ff5a1f'],
  ['#ff7a1a', '#fff2d6'],
  ['#ffd23a', '#ff7a1a'],
  ['#ffffff', '#ff3d6e'],
];
/**
 * The blimp: where it hangs (x, y, z in m), its length and girth (m), how far it drifts either
 * way (m) and how long one drift there and back takes (s).
 */
const BLIMP_AT = [-221, 243, -600] as const;
const BLIMP_LONG = 70;
const BLIMP_ROUND = 18;
/** How much larger than life the blimp hangs, so its screen reads from the road. */
const BLIMP_SCALE = 1.4;
const BLIMP_DRIFT = 40;
const BLIMP_PERIOD = 240;
/**
 * Lightning over the far shore: where each bolt strikes (x, z in m), the top and foot of its
 * trunk (m), its width (m), how often one strikes (s) and how much it lights the sky.
 */
const LIGHTNING_AT: readonly [number, number][] = [
  [-30, -1150],
  [50, -1250],
  [-90, -1300],
];
const LIGHTNING_TOP = 520;
const LIGHTNING_FOOT = 60;
const LIGHTNING_WIDE = 11;
const LIGHTNING_EVERY = 9;
const LIGHTNING_SKY = 2.5;
/** Sparks in each burst, the show's length (s), the part spent climbing and the burst's reach (m). */
const FIREWORK_SPARKS = 240;
const FIREWORK_PERIOD = 5.5;
const FIREWORK_RISE = 0.2;
const FIREWORK_REACH = 60;
/** Each spark's glow, across (m). */
const FIREWORK_SPARK = 9;
const CYCLIST_SIZE = 72;
const CYCLIST_CADENCE = 8.4;
/** The moon: where it hangs (beyond the clouds, inside the sky's dome) and how big it is (m). */
const MOON_AT = [-820, 640, -1830] as const;
const MOON_SIZE = 120;
/** The cloud ceiling: its height, its breadth and how fast it drifts (texture repeats per second). */
const CLOUD_HEIGHT = 260;
const CLOUD_SPAN = 4000;
const CLOUD_DRIFT = 0.002;
/** Canopy drips: how many streams, how long each takes to fall (s), how far ahead (m). */
const DRIPS = 650;
const DRIP_FALL = 0.55;
const DRIP_REACH = 60;
/** Rain splashes: how many, in how many groups, how long each lasts (s), how far ahead (m). */
const SPLASHES = 140;
const SPLASH_PHASES = 10;
const SPLASH_LIFE = 0.45;
const SPLASH_REACH = 26;
/** Neon gates over the road, at these offsets round the loop. */
const GATES: readonly number[] = [70, 230, 380, 540];
const GATE_HEIGHT = 7.5;
/** A gate's posts stand this far beyond the road's edge. */
const GATE_OUT = 2.8;
const GATE_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#9b6bff', '#ffb347'];
/** Zebra crossings, at these offsets round the loop: bar width and depth across the road (m). */
const CROSSINGS = [56, 196, 316, 446, 586];
const CROSSING_BAR = 0.55;
const CROSSING_DEPTH = 5;
/** At most this many people wait at each kerb of a crossing. */
const CROSSING_WAITERS = 3;
/** Their beacons: post height (m), blink period (s), and how near before the halo hides (m). */
const BEACON_HEIGHT = 2.9;
/** The traffic signals at each crossing: the mast's height (m), how far over the road its arm
 * reaches (a fraction of the road's half-width past the centre), where along the arm the heads
 * hang (fractions of its length), and the lamps' colours, top to bottom. */
const SIGNAL_HEIGHT = 5.6;
const SIGNAL_REACH = 0.3;
const SIGNAL_HEADS = [0.45, 0.95];
const SIGNAL_LAMPS = ['#ff3045', '#ffa81f', '#35ff8a'] as const;
const BEACON_BLINK = 1.2;
const BEACON_HALO_NEAR = 7;
/** Bike-lane symbols: where round the loop, and their size on the road (m). */
const LANE_SYMBOLS = [40, 130, 262, 360, 420, 500, 620];
const LANE_SYMBOL_WIDE = 2.2;
const LANE_SYMBOL_LONG = 6.4;
/** Street trees: how far beyond the road's edge (m), how far apart (m), and how tall (m). */
const TREE_OUT = 3;
const TREE_EVERY = 24;
const TREE_HEIGHT = 4.2;
/** Leafy tufts round each crown and how far out from its middle (m), and the leaves' shades: colour and the glow they hold. */
const TREE_CLUMPS = 8;
/** Each planter's bed: shrubs round the trunk and flowers among them, in neon-bright hues. */
const PLANTER_SHRUBS = 5;
const PLANTER_BLOOMS = 12;
const PLANTER_FLOWERS = ['#ff4fb8', '#ffd24a', '#ff7a3a', '#c06bff'];
const TREE_CLUMP_OUT = 1.85;
const LEAF_SHADES: readonly (readonly [string, string])[] = [
  ['#1d3a34', '#0c2a30'],
  ['#28503f', '#0f3328'],
  ['#1f3a4a', '#10283a'],
  ['#3a3550', '#1c1834'],
];
/** The trees' uplights: their neon in turn, the beam's radius at the crown (m), its brightness. */
const TREE_UPLIGHTS = ['#3fe0ff', '#ff4fd8'];
const TREE_UPLIGHT_WIDE = 1.9;
const TREE_UPLIGHT_STRENGTH = 0.4;
/** A lead cab's indicators: their orange, their glow across (m) and flashes a second. */
const BLINK_COLOUR = '#ff6a00';
const BLINK_GLOW = 2;
const BLINK_RATE = 1.5;
/** Where in its flash the indicators start, so they are lit as the ride settles. */
const BLINK_PHASE = 0.7;
/** The glow round a tree's fairy light: across (m), its colour and how fast it twinkles (rad/s). */
const TWINKLE_HALO = 0.55;
const TWINKLE_COLOUR = '#ffd27a';
const TWINKLE_RATE = 2.4;
/** How far out from the crown the lights and their glow sit (m), clear of the leaves. */
const TWINKLE_OUT = 0.55;
/**
 * Delivery drones: how many, their lowest height over the road (m), how far ahead they show.
 * They fly clear over the gates' name plates, their slung parcels and all, rather than through
 * them.
 */
const DRONES = 8;
const DRONE_HEIGHT = GATE_HEIGHT + 3.2;
/**
 * The drones climb over the skybridges: the bridge's roof above its walkway (m) and half its
 * depth along the street (m), the room a drone leaves above it, parcel and all (m), and how far
 * before a bridge it starts to climb (m).
 */
const SKYBRIDGE_TOP = 3.7;
const SKYBRIDGE_HALF = 3.5;
const DRONE_CLEARANCE = 1.8;
const DRONE_CLIMB = 16;
const DRONE_REACH = 260;
const DRONE_FIRST = 48;
/** The colour of the LED band round each drone's hull. */
const DRONE_LEDS = '#5ff2ff';
/** Shop signs hung under the towers' canopies: their names and neon colour, and length (m). */
const SHOPS: readonly (readonly [string, string])[] = [
  ['RAMEN', '#ff4f6d'],
  ['ARCADE', '#3fd9ff'],
  ['24H MART', '#2fd18a'],
  ['KARAOKE', '#ff4fd8'],
  ['BIKE REPAIR', '#ffb347'],
  ['NOODLES', '#ffd84a'],
  ['TEA HOUSE', '#b06bff'],
];
const SHOP_SIGN_LONG = 3.8;
/** Bike racks: where round the loop, how far beyond the road's edge (m), the frames' colours. */
const BIKE_RACKS = [44, 126, 232, 352, 470, 562];
const BIKE_RACK_OUT = 1.9;
/** Rows of delivery mopeds on the right-hand pavement: where round the loop (m), how far from
 * the road's centre beyond its half-width (m), how many in a row, the gap between them (m),
 * their angle to the kerb (rad), and their paints. */
const MOPEDS = [64, 176, 336, 516];
const MOPED_OUT = 1.5;
const MOPED_ROW = 4;
const MOPED_GAP = 0.9;
const MOPED_ANGLE = 0.7;
const MOPED_PAINTS = ['#ff4fb8', '#5ff2ff', '#ffd24a', '#9b6bff'];
/** Taxi ranks on the right-hand pavement: where (loop metres), how far out (m), cabs in each. */
/**
 * Glass skybridges over the street: where (loop metres) and how high (m) each runs. Along the
 * harbour, where no towers stand on the left, one lands on a lift tower on the promenade.
 */
/** How far out from the road's edge a harbour skybridge's lift tower stands (m). */
const LIFT_OUT = 2.6;
const SKYBRIDGES: readonly [number, number][] = [
  [100, 11],
  [468, 14],
  [612, 9],
];
/** Rain puddles on the pavements: how many round the loop, and how far out they lie (m). */
const PUDDLES = 70;
const PUDDLE_NEAR = 1.2;
const PUDDLE_FAR = 8;
/** Puddles out on the road, in the lanes, round the loop. */
const ROAD_PUDDLES = 46;
const TAXI_RANKS = [40, 236, 400, 540];
const TAXI_OUT = 5;
const TAXIS_PER_RANK = 3;
const TAXI_LONG = 4.4;
const BIKE_COLOURS = ['#ff4f6d', '#3fd9ff', '#ffd84a', '#f2f2f2', '#2fd18a'];
/** Bus shelters: where round the loop (between the trees), how far out (m), how long (m). */
const SHELTERS = [48, 290, 506];
const SHELTER_OUT = 2.6;
const SHELTER_LONG = 4.2;
/** The shelters' backlit adverts: a headline and its colour. */
const SHELTER_ADVERTS: readonly (readonly [string, string, AdvertPicture])[] = [
  ['NOODLE BAR', '#ff4fd8', 'bowl'],
  ['NIGHT FERRY', '#3fd9ff', 'ferry'],
  ['SYNTH COLA', '#ffb347', 'bottle'],
];
/** What an advert pictures above its headline. */
type AdvertPicture = 'bowl' | 'ferry' | 'bottle';
/** Kerbside bollards: how high (m) and how far apart (m). */
const BOLLARD_HEIGHT = 0.95;
const BOLLARD_EVERY = 8;
/**
 * The bollards' light rings and the pulses racing away down them: the ring's cyan, its flare
 * across (m), how far apart the pulses run (m), how fast (m/s) and how long each is (m).
 */
const BOLLARD_RING = '#5ff2ff';
const BOLLARD_FLARE = 1.1;
/** A bollard's flare shows in full from BOLLARD_FLARE_NEAR on and is gone by BOLLARD_FLARE_GONE (m). */
const BOLLARD_FLARE_NEAR = 22;
const BOLLARD_FLARE_GONE = 8;
const BOLLARD_PULSE_GAP = 56;
const BOLLARD_PULSE_SPEED = 28;
const BOLLARD_PULSE_WIDE = 6;
/** Where the pulses start (m), so one is passing the nearest bollards as the ride settles. */
const BOLLARD_PULSE_PHASE = 12;
/** Night-market stalls on the quay promenade, at these offsets round the loop. */
const STALLS: readonly number[] = [26, 33, 40, 140, 147, 290, 297, 304, 460, 467, 580];
/** Cooking steam over each stall: puffs, how long each takes to rise (s) and how high (m). */
const STALL_PUFFS = 4;
const STALL_STEAM_LIFE = 3.2;
const STALL_STEAM_HEIGHT = 2.4;
const STALL_X = -10;
const STALL_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347'];
/**
 * The tables out in front of the stalls: their plastic colours in turn, how far out from the
 * booth's middle (m) and how far along it (m).
 */
const SEAT_COLOURS = ['#d8342a', '#2f6fd6', '#2fb36a'];
const SEAT_OUT = 3.7;
const SEAT_Z = 0.3;
/** The walkers' scarves, bright against their dark coats. */
const WALKER_SCARVES = ['#ff4fb8', '#3fe0ff', '#ffb347', '#9b6bff', '#d8342a'];
/** The diners' coats and their bright beanies, a set per stall. */
const DINER_COATS = ['#3b2f5c', '#5c2f3f', '#2f4a5c'];
const DINER_HATS = ['#ff4fb8', '#ffb347', '#3fe0ff'];
/** The stalls' paper lanterns, and the dishes on their menu boards, by stall in turn. */
const STALL_LANTERN = '#f2261a';
/** Gig posters pasted on the booths: colour and where on the cladding (px of 256). */
const BOOTH_POSTERS: readonly (readonly [string, number, number])[] = [
  ['#ff4fb8', 18, 150],
  ['#3fe0ff', 98, 170],
  ['#ffb347', 180, 140],
];
/** The paper lanterns' ribs, and the gold of their bands and tassels. */
const LANTERN_RIBS = 9;
const LANTERN_TASSEL = '#ffc24a';
const STALL_MENUS: readonly (readonly string[])[] = [
  ['DUMPLINGS', 'BAO', 'TEA'],
  ['RAMEN', 'GYOZA', 'SODA'],
  ['SKEWERS', 'NOODLES', 'COFFEE'],
];
/** Each stall's special, chalked on its A-frame: the dish and its price. */
const STALL_SPECIALS: readonly (readonly [string, string])[] = [
  ['PORK BAO', '$4'],
  ['TONKOTSU', '$9'],
  ['YAKITORI', '$6'],
];
/** The A-frame: its board (m), how far it leans, and where it stands from the booth (m). */
const AFRAME_WIDE = 0.6;
const AFRAME_TALL = 0.9;
const AFRAME_LEAN = 0.22;
const AFRAME_OUT = 3.1;
const AFRAME_Z = 2.5;
/** People on the pavement across the street, scattered round the loop. */
const WALKERS = 26;
/** Each stroller walks up and down a stretch of pavement this long. */
const STROLL = 30;
const WALKER_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347', '#9b6bff', '#d7ff3a'];
/** Sky lanes across the city: depth, height, speed (m/s, signed), start and size of their craft. */
const SKYLANES = [
  { z: -120, y: 40, speed: 9, phase: 0.44, size: 2.4 },
  { z: -190, y: 58, speed: -11, phase: 0.6, size: 3 },
  { z: -270, y: 50, speed: 8, phase: 0.53, size: 3.6 },
  { z: -360, y: 80, speed: -10, phase: 0.36, size: 4.4 },
  { z: -460, y: 68, speed: 12, phase: 0.66, size: 5 },
] as const;
/** A craft crosses this much sky before coming round again. */
const SKYLANE_SPAN = 700;
/** Festoon lantern strings across the street, at these offsets round the loop. */
const LANTERNS: readonly number[] = [30, 44, 58, 150, 164, 300, 314, 470, 484, 498, 590];
const LANTERN_HEIGHT = 9;
const LANTERN_SAG = 1.8;
const LANTERN_EVERY = 1.1;
const LANTERN_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347', '#9b6bff'];
/** The bridges' lamps: DECK_LAMPS pairs every DECK_LAMP_EVERY metres, masts and arms in metres. */
const DECK_LAMPS = 12;
const DECK_LAMP_EVERY = 25;
const DECK_LAMP_HEIGHT = 7;
const DECK_LAMP_ARM = 2.2;
/** The neon strips up the towers' corners are this thick. */
const EDGE = 0.35;
/** The centre line's dashes: DASH metres of line in every DASH_EVERY. */
const DASH = 3;
const DASH_EVERY = 9;
/** Cat's eyes: how far in from the kerb (m), how wide and long each is, and their spacing. */
const STUD_IN = 0.85;
const STUD_WIDE = 0.24;
const STUD_LONG = 0.45;
const STUD_EVERY = 4;
/** The harbour railing's height above the quay. */
const RAILING = 1.1;
const HARBOUR_TO = 250;
const FAR_SHORE = 340;
/** Where the far shore's searchlights stand: x, height and z. */
const SEARCHLIGHTS: readonly [number, number, number][] = [
  [-FAR_SHORE - 20, 70, -600],
  [-FAR_SHORE - 40, 95, -740],
];
/**
 * The bridge ramps: the road over an effort crosses open dock on a bridge with steel parapets
 * PARAPET metres high, held by a pylon PYLON metres tall with CABLES stays each way.
 */
const PARAPET = 1.15;
const PYLON = 38;
const PYLON_INTO = 46;
const CABLES = 9;
const CABLE_EVERY = 9;
/** The dock water lies this far below the lowest road in view; the deck's girder is this deep. */
const DOCK_DROP = 7;
const GIRDER = 1.8;
/**
 * The working dock beside each bridge: container cranes and moored barges, each `along` metres
 * from the bridge's start and `x` metres across from the road's centre.
 */
const CRANES: readonly { along: number; x: number }[] = [
  { along: 70, x: -72 },
  { along: 190, x: 68 },
  { along: 320, x: -88 },
  { along: 450, x: 80 },
];
const BARGES: readonly { along: number; x: number; length: number }[] = [
  { along: 120, x: 38, length: 54 },
  { along: 260, x: -42, length: 66 },
  { along: 400, x: 44, length: 48 },
];
/** The night sky's dome, far beyond the skyline and the far shore. */
const SKY_RADIUS = 3000;
const CRANE_HEIGHT = 34;
const BOOM = 64;
/** A blade sign stands out this far from its façade. */
const BLADE = 2;
/** The harbour skyline stands this far ahead, past the street's fog, and keeps its distance. */
const SKYLINE_AHEAD = 700;
/** The quay's kerb stands this high above the road, and is this wide. */
const KERB = 0.2;
const KERB_WIDTH = 0.3;
/** The pavement's slabs: two to a texture tile, each this many metres square. */
const SLAB = 1.5;
/**
 * Street lamps stand on alternate sides every LAMP_EVERY metres, LAMP_OUT metres from the
 * road's centre, where world-renderer.ts puts the night's point lights; their heads are
 * LAMP_HEIGHT metres above the road.
 */
const LAMP_EVERY = 40;
/** Festival banners on the lamp posts: their words and colour, and their size (m). */
const BANNERS: readonly (readonly [string, string])[] = [
  ['HARBOUR NIGHT RIDE', '#ff4fd8'],
  ['DOCKLANDS LIGHT FEST', '#3fd9ff'],
  ['RIDE THE BRIDGES', '#b06bff'],
];
const BANNER_WIDE = 0.9;
const BANNER_TALL = 2.2;
const LAMP_FIRST = 8;
const LAMP_OUT = 5;
const LAMP_HEIGHT = 6;
/** The cone of light under each lamp: its radius on the paving (m) and its brightness. */
const LAMP_CONE_WIDE = 2.6;
/** Each lamp's hanging basket: how far out on its bracket (m), how far below the globe (m),
 * its flowers on top and the trailing strands over its rim, and the flowers' colours. */
const BASKET_OUT = 0.6;
const BASKET_DROP = 2.6;
const BASKET_BLOOMS = 9;
const BASKET_TRAILS = 5;
const BASKET_FLOWERS = ['#ff4fb8', '#ffd24a', '#ff7a3a', '#f4f1ff'];
const LAMP_CONE_STRENGTH = 0.55;
/** The halo round a lamp's globe, and round a lantern's bulb, this wide. */
const LAMP_HALO = 2.6;
const LANTERN_HALO = 0.9;
/** Lamp halos show only beyond this many metres ahead, and lantern halos beyond the next. */
const LAMP_HALO_NEAR = 6;
const LANTERN_HALO_NEAR = 8;
const LAMPS = 10;
/** The towers' street floor: glazing this high above the pavement, in bays this wide. */
const LOBBY = 4.6;
/** Glass lifts: the share of towers with one, the least height that has one (m), its trip (s). */
const LIFT_SHARE = 0.3;
const LIFT_MIN_HEIGHT = 36;
const LIFT_PERIOD = 26;
const LOBBY_BAY = 6;
/** The goods on the shelves seen through the shops' glass. */
const SHOP_GOODS = ['#ff4fb8', '#3fe0ff', '#ffb347', '#2fb36a', '#d8342a', '#9b6bff'];

/** What the rooftops are made of: crown band lights, a beacon, and a mast and lamp shape. */
interface RoofKit {
  readonly crowns: readonly MeshStandardMaterial[];
  readonly beacon: MeshStandardMaterial;
  readonly mast: CylinderGeometry;
  readonly lamp: SphereGeometry;
}

interface Tower {
  readonly mesh: Mesh;
  readonly side: -1 | 1;
  readonly offset: number;
  readonly width: number;
  readonly depth: number;
}

export class DocklandsStreet {
  readonly group = new Group();
  private readonly towers: Tower[] = [];
  private readonly random = seeded(41);
  private readonly skyline = new Group();
  private readonly farShore = new Group();
  private readonly lamps: Group[] = [];
  private streakTexture: CanvasTexture | null = null;
  private readonly streakMaterials = new Map<string, MeshBasicMaterial>();
  private readonly streakPlane = new PlaneGeometry(1, 1);
  private readonly ribbons: {
    geometry: BufferGeometry;
    profile: [number, number][];
    /** The cross-section on a bridge, point for point; the quay's own where omitted. */
    bridge?: [number, number][];
    /** On a bridge, heights are above the dock water rather than the road. */
    sink?: boolean;
  }[] = [];
  /** The dock water's height under the bridges in view, relative to the rider. */
  private dockLevel = -DOCK_DROP;
  /** Whether the road `metres` ahead is on a bridge ramp; set by the renderer each frame. */
  private onBridge: (metres: number) => boolean = () => false;
  /** Metres ahead of the rider to the start of each bridge; behind the rider is negative. */
  private bridgeStarts: readonly number[] = [];
  private readonly pylon = new Group();
  private readonly dock = new Group();
  private readonly boats: { mesh: Group; offset: number }[] = [];
  /** The harbour ferry: its place on the loop, and the hull that sails out and back, with its wake. */
  private ferry: { placed: Group; sailing: Group; wake: Mesh } | null = null;
  private readonly skytrain = new Group();
  private readonly deckLamps: Group[] = [];
  private readonly screenTextures: CanvasTexture[] = [];
  private readonly vents: {
    group: Group;
    offset: number;
    puffs: { mesh: Mesh; phase: number }[];
    /** The neon under its grate. */
    hue: Color;
  }[] = [];
  /** The haze vent steam fades to as it rises. */
  private readonly steamHaze = new Color(STEAM_HAZE);
  private readonly train = new Group();
  private readonly lanterns: { group: Group; offset: number; blooms: Sprite[] }[] = [];
  private readonly stalls: { group: Group; offset: number }[] = [];
  /** Cooking steam over the stalls: each puff and where it is in its rise. */
  private readonly stallSteam: { mesh: Mesh; phase: number; drift: number }[] = [];
  /** Pairs of lit bollards along the kerbs, every BOLLARD_EVERY metres round the loop. */
  private readonly bollards: {
    group: Group;
    offset: number;
    ring: MeshBasicMaterial;
    glow: MeshBasicMaterial;
    /** How far ahead of the rider it stood when last placed (m). */
    metres: number;
  }[] = [];
  /** Street trees in lit planters along the far pavement, round the loop. */
  private readonly trees: { group: Group; offset: number }[] = [];
  /** Bus shelters on the far pavement, at SHELTERS round the loop. */
  private readonly shelters: { group: Group; offset: number }[] = [];
  /** Racks of parked bicycles at the kerb, at BIKE_RACKS round the loop. */
  private readonly bikeRacks: { group: Group; offset: number }[] = [];
  /** Rows of parked mopeds on the right-hand pavement, at MOPEDS round the loop. */
  private readonly mopeds: { group: Group; offset: number }[] = [];
  private readonly taxiRanks: { group: Group; offset: number }[] = [];
  private readonly puddles: { mesh: Mesh; offset: number }[] = [];
  /** Glass lift cars on the towers' street faces: where each rides between and its timing. */
  private readonly lifts: { car: Group; low: number; high: number; phase: number }[] = [];
  private readonly skybridges: { group: Group; offset: number }[] = [];
  /** Delivery drones flying the street: each's loop position at time zero, speed and height. */
  private readonly drones: {
    group: Group;
    offset: number;
    speed: number;
    at: number;
    strobes: Mesh[];
  }[] = [];
  /** Bike-lane symbols painted on the road, in both lanes, at LANE_SYMBOLS round the loop. */
  private readonly laneSymbols: { group: Group; offset: number }[] = [];
  /** Zebra crossings over the road, their beacons' globes and halos blinking together. */
  private readonly crossings: { group: Group; offset: number; blooms: Sprite[] }[] = [];
  private beaconMaterial: MeshBasicMaterial | null = null;
  private readonly gates: { group: Group; offset: number }[] = [];
  private readonly machines: { group: Group; offset: number }[] = [];
  private readonly walkers: { group: Group; offset: number }[] = [];
  /** Holographic koi schools over the street: each school's place round the loop, and its fish. */
  private readonly koiSchools: { group: Group; offset: number }[] = [];
  private readonly koi: {
    fish: Group;
    tail: Mesh;
    radius: number;
    height: number;
    phase: number;
    speed: number;
  }[] = [];
  private readonly craft: { group: Group; strobe: Mesh; lane: (typeof SKYLANES)[number] }[] = [];
  /** The people walking the pavement: each strolls its own way at its own pace. */
  private readonly strollers: { person: Group; speed: number; phase: number }[] = [];

  /**
   * Runs the train along its viaduct for `seconds` of the ride: it crosses from the harbour
   * side to the far towers at TRAIN_SPEED and comes round again. Held still for reduced motion.
   */
  setTime(clock: number, still = false): void {
    // The ride's clock counts whole seconds; everything moves on the smooth one instead.
    const seconds = this.smooth(clock, still);
    this.fall(seconds, still);
    this.splash(seconds, still);
    this.drip(seconds, still);
    // The beacons blink together, on for most of each second; lit and still for reduced motion.
    if (this.beaconMaterial) {
      const lit = still || (seconds % BEACON_BLINK) / BEACON_BLINK < 0.6;
      this.beaconMaterial.color.set(lit ? '#ffa81f' : '#3a2408');
      if (lit) this.beaconMaterial.color.multiplyScalar(1.8);
    }
    this.steam(still ? 0 : seconds);
    this.stroll(still ? 0 : seconds);
    this.swim(still ? 0 : seconds);
    this.pedal(still ? 0 : seconds);
    this.ride(still ? 0 : seconds);
    this.burst(seconds, still);
    this.strike(seconds, still);
    this.sweep(seconds);
    this.drift(seconds, still);
    this.sail(seconds);
    this.swimKoi(seconds);
    this.sweepLasers(seconds);
    this.chase(seconds, still);
    this.flicker(seconds, still);
    this.twinkle(seconds, still);
    this.blinkTaxis(seconds, still);
    this.pulseBollards(seconds, still);
    if (this.holoGlobe) this.holoGlobe.rotation.y = (seconds / HOLO_TURN) * Math.PI * 2;
    if (this.holoRing) this.holoRing.rotation.z = (seconds / HOLO_RING_TURN) * Math.PI * 2;
    for (const [i, drone] of this.drones.entries()) {
      drone.at = drone.offset + (still ? 0 : seconds * drone.speed);
      // Their lights blink out of step with each other; steady for reduced motion.
      const lit = still || (seconds * 1.3 + i * 0.37) % 1 < 0.5;
      for (const strobe of drone.strobes) strobe.visible = lit;
    }
    if (this.cloudTexture) this.cloudTexture.offset.set(still ? 0 : seconds * CLOUD_DRIFT, 0);
    const turning = this.wheel.userData['turning'] as Group | undefined;
    const turn = still ? 0 : seconds * WHEEL_TURN;
    if (turning) turning.rotation.z = turn;
    const hanging = this.wheel.userData['hanging'] as Group | undefined;
    for (const car of hanging?.children ?? []) {
      const a = (car.userData['angle'] as number) + turn;
      car.position.set(Math.cos(a) * WHEEL_RADIUS, Math.sin(a) * WHEEL_RADIUS - 1.8, 0);
    }
    this.fly(still ? 0 : seconds);
    // The screens' words scroll past; held still for reduced motion.
    this.screenTextures.forEach((texture, i) => {
      texture.offset.x = still ? 0 : (seconds * (0.05 + i * 0.012)) % 1;
    });
    // The landmark's searchlights sweep the haze, each its own way; held still for reduced motion.
    this.searchlights.forEach((pivot, i) => {
      const way = i % 2 === 0 ? 1 : -1;
      pivot.rotation.y = (i * Math.PI) / 1.7 + (still ? 0 : way * seconds * SWEEP);
    });
    // The whole train is out of sight inside the towers at either end of its run.
    const start = RAIL_WEST - 40;
    const run = RAIL_EAST + 40 - start;
    // At the ride's start the train stands as built, its lead car over the road.
    const along = (((seconds * TRAIN_SPEED - start) % run) + run) % run;
    this.train.position.x = start + along;
  }
  private readonly searchlights: Group[] = [];
  private readonly wheel = new Group();
  /** The fireworks over the harbour: each burst's sparks, centre, start and spark directions. */
  private readonly fireworks: {
    sparks: InstancedMesh;
    at: readonly [number, number, number];
    from: number;
    directions: number[];
  }[] = [];
  private readonly sparkDummy = new Object3D();
  /** The night sky's material, lit up by the lightning. */
  private skyMaterial: MeshBasicMaterial | null = null;
  /** The lighthouse's turning beams. */
  private lighthouseBeams: Group | null = null;
  /** The ride's last whole second and when it came, to run smooth motion on through it. */
  private tick = 0;
  private tickAt: number | null = null;
  /** The laser show's beams over the city ahead, each with its own place in the fan. */
  private readonly lasers: { beam: Mesh; base: number; phase: number }[] = [];
  /** The lead cabs' indicators and their glow. */
  private blinkers: MeshBasicMaterial[] = [];
  /** The glows round each tree's fairy lights, and each light's twinkle phase. */
  private readonly treeGlows: { mesh: InstancedMesh; phases: number[] }[] = [];
  /** The blade signs' materials, one per word in SIGN_WORDS. */
  private blades: MeshStandardMaterial[] = [];
  /** The harbour bridge's bulbs, and where each hangs across the harbour (x, m). */
  private bridgeBulbs: { mesh: InstancedMesh; xs: number[] } | null = null;
  /** The holographic globe over the city ahead, turning. */
  private holoGlobe: Group | null = null;
  /** The globe's ring and its satellites, turning in the ring's plane. */
  private holoRing: Group | null = null;
  /** The blimp, drifting over the harbour, and its blinking navigation lights. */
  private blimp: { body: Group; lights: MeshBasicMaterial[] } | null = null;
  /** The lightning's bolts, one striking at a time. */
  private readonly bolts: Mesh[] = [];
  /** The giant neon cyclist's pedalling parts: cranks, and each leg's thigh and shin. */
  private cyclist: { crank: Group; legs: { thigh: Mesh; shin: Mesh; side: number }[] } | null =
    null;
  /** Rain splashes on the road ahead, in SPLASH_PHASES groups that land in turn. */
  /** Each splash lands at `at`, metres along the ride, so it stays put on the road as we pass. */
  private readonly splashes: { mesh: Mesh; phase: number; x: number; at: number }[] = [];
  /** The rider's distance at the last place(), where new splashes land ahead of. */
  private riderS = 0;
  /** Water running off the towers' canopies: each stream's place round the loop, its side,
   * how far through its fall it is, and the segments that draw them all. */
  private readonly drips: { at: number; side: number; life: number; phase: number }[] = [];
  private dripLines: LineSegments | null = null;
  private readonly dripRandom = seeded(379);
  private readonly splashMaterials: MeshBasicMaterial[] = [];
  private readonly splashLife: number[] = [];
  private readonly splashRandom = seeded(331);
  private cloudTexture: CanvasTexture | null = null;
  private readonly whale = new Group();

  /**
   * Searchlight beams from the far shore's rooftops, leaning out and sweeping the violet haze
   * over the harbour: soft cones of light, brightest at the lamp and fading into the sky.
   */
  private addSearchlights(): void {
    const texture = this.track(beamTexture());
    const material = new MeshBasicMaterial({
      color: new Color('#c9c2ff').multiplyScalar(0.9),
      map: texture,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      side: DoubleSide,
    });
    const cone = new CylinderGeometry(BEAM_WIDTH, 1.2, BEAM_LENGTH, 24, 1, true);
    cone.translate(0, BEAM_LENGTH / 2, 0);
    this.disposables.push(material, cone);
    for (const [x, y, z] of SEARCHLIGHTS) {
      const pivot = new Group();
      pivot.position.set(x, y, z);
      const lean = new Group();
      lean.rotation.z = BEAM_LEAN;
      lean.add(new Mesh(cone, material));
      pivot.add(lean);
      this.farShore.add(pivot);
      this.searchlights.push(pivot);
    }
    this.setTime(0, true);
  }

  /**
   * A big wheel on the far shore's waterfront, turned to face the road: twin neon rims in pink
   * and cyan, lit spokes and a ring of glowing cabins, turning slowly on its A-frame legs.
   */
  private addWheel(): void {
    const light = (hex: string, k = 1.6) =>
      new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(k),
        toneMapped: false,
        fog: false,
      });
    const pink = light('#ff4fb8');
    const cyan = light('#3fe0ff');
    const spoke = light('#c9c2ff', 0.9);
    const cabins = ['#ffb347', '#ff4fb8', '#3fe0ff', '#9b6bff'].map((hex) => light(hex, 2));
    const steel = new MeshStandardMaterial({
      color: 0x1c1d28,
      metalness: 0.6,
      roughness: 0.5,
      fog: false,
    });
    const outer = new TorusGeometry(WHEEL_RADIUS, 0.45, 6, 96);
    const inner = new TorusGeometry(WHEEL_RADIUS * 0.82, 0.3, 6, 96);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(pink, cyan, spoke, ...cabins, steel, outer, inner, unit);
    // The rims and spokes turn in the plane facing the road, about an axis across the harbour.
    const turning = new Group();
    turning.rotation.y = Math.PI / 2;
    turning.add(new Mesh(outer, pink), new Mesh(inner, cyan));
    // The cabins hang level from the rim as it turns, in a plane of their own that does not.
    const hanging = new Group();
    hanging.rotation.y = Math.PI / 2;
    for (let i = 0; i < WHEEL_CABINS; i++) {
      const a = (i / WHEEL_CABINS) * Math.PI * 2;
      const bar = new Mesh(unit, spoke);
      bar.scale.set(0.18, WHEEL_RADIUS, 0.18);
      bar.position.set((Math.cos(a) * WHEEL_RADIUS) / 2, (Math.sin(a) * WHEEL_RADIUS) / 2, 0);
      bar.rotation.z = a - Math.PI / 2;
      const car = new Mesh(unit, cabins[i % cabins.length]!);
      car.scale.set(3, 2.4, 2);
      car.userData['angle'] = a;
      turning.add(bar);
      hanging.add(car);
    }
    const hub = new Mesh(unit, steel);
    hub.scale.set(6, 3, 3);
    this.wheel.add(turning, hanging, hub);
    this.wheel.userData['hanging'] = hanging;
    // Its A-frame legs, splayed along the shore.
    for (const way of [-1, 1]) {
      const leg = new Mesh(unit, steel);
      const foot = WHEEL_RADIUS * 0.55;
      const length = Math.hypot(WHEEL_HUB, foot);
      leg.scale.set(1.4, length, 1.4);
      leg.position.set(0, -WHEEL_HUB / 2, (way * foot) / 2);
      leg.rotation.x = -way * Math.atan2(foot, WHEEL_HUB);
      this.wheel.add(leg);
    }
    this.wheel.userData['turning'] = turning;
    this.wheel.position.set(WHEEL_AT[0], WHEEL_HUB, WHEEL_AT[1]);
    this.farShore.add(this.wheel);
  }

  /**
   * A holographic whale swimming slowly through the sky over the harbour: a wireframe of light in
   * cyan, a long body with a fluke and fins.
   */
  private addWhale(): void {
    const wire = new MeshBasicMaterial({
      color: new Color('#3fe0ff').multiplyScalar(0.9),
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const body = new SphereGeometry(1, 18, 10);
    const fluke = new ConeGeometry(0.5, 1, 4, 1, true);
    this.disposables.push(wire, body, fluke);
    const trunk = new Mesh(body, wire);
    trunk.scale.set(WHALE_LENGTH / 2, WHALE_LENGTH / 9, WHALE_LENGTH / 8);
    // Its tail narrows behind it to a flat fluke.
    const tail = new Mesh(body, wire);
    tail.scale.set(WHALE_LENGTH / 4, WHALE_LENGTH / 16, WHALE_LENGTH / 14);
    tail.position.x = -WHALE_LENGTH * 0.55;
    const flukes = new Mesh(fluke, wire);
    flukes.scale.set(WHALE_LENGTH / 5, WHALE_LENGTH / 9, WHALE_LENGTH / 3);
    flukes.rotation.z = Math.PI / 2;
    flukes.position.x = -WHALE_LENGTH * 0.82;
    const fins = [-1, 1].map((side) => {
      const fin = new Mesh(fluke, wire);
      fin.scale.set(WHALE_LENGTH / 14, WHALE_LENGTH / 5, WHALE_LENGTH / 30);
      fin.rotation.set(side * 1.1, 0, -0.5);
      fin.position.set(WHALE_LENGTH * 0.12, -WHALE_LENGTH / 14, side * WHALE_LENGTH * 0.12);
      return fin;
    });
    this.whale.add(trunk, tail, flukes, ...fins);
    this.group.add(this.whale);
    this.swim(0);
  }

  /**
   * Swims the whale across the sky ahead, from over the harbour towards the towers, nose first
   * and side on to the rider, rising and falling; it comes round again past the far side.
   */
  private swim(seconds: number): void {
    const along = (seconds * WHALE_SPEED + WHALE_START) % WHALE_PATH;
    this.whale.position.set(
      WHALE_FROM + along,
      WHALE_HEIGHT + Math.sin(seconds * 0.25) * 6,
      WHALE_Z,
    );
    this.whale.rotation.set(0, 0, Math.sin(seconds * 0.25 + 1) * 0.08);
  }

  private rain: LineSegments | null = null;
  private readonly drops: { x: number; z: number; phase: number }[] = [];

  /**
   * A fine drizzle round the rider: DROPS short streaks falling at RAIN_SPEED through a box
   * RAIN_BOX metres on a side, slanting a little with the wind. Wet streets need rain.
   */
  private addRain(): void {
    const random = seeded(229);
    for (let i = 0; i < DROPS; i++) {
      this.drops.push({
        x: (random() - 0.5) * RAIN_BOX,
        z: 6 - random() * RAIN_BOX * 1.6,
        phase: random() * RAIN_HEIGHT,
      });
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(DROPS * 6), 3));
    const material = new LineBasicMaterial({
      color: 0xb8c4ff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.disposables.push(geometry, material);
    this.rain = new LineSegments(geometry, material);
    this.rain.frustumCulled = false;
    this.group.add(this.rain);
  }

  /** Lets the drizzle fall for `seconds`; for reduced motion there is none. */
  /**
   * Raindrops landing on the road ahead: thin rings that spread and fade where each drop hits,
   * in groups that land in turn, each group somewhere new each time.
   */
  private addSplashes(roadHalf: number): void {
    const ring = new RingGeometry(0.8, 1, 20);
    this.disposables.push(ring);
    for (let k = 0; k < SPLASH_PHASES; k++) {
      const material = new MeshBasicMaterial({
        color: new Color('#cfd8ff'),
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      });
      this.disposables.push(material);
      this.splashMaterials.push(material);
      this.splashLife.push(1);
    }
    for (let i = 0; i < SPLASHES; i++) {
      const mesh = new Mesh(ring, this.splashMaterials[i % SPLASH_PHASES]!);
      mesh.rotation.x = -Math.PI / 2;
      this.group.add(mesh);
      this.splashes.push({ mesh, phase: i % SPLASH_PHASES, x: 0, at: 0 });
    }
    this.splashHalf = roadHalf + 1.5;
  }

  private splashHalf = 4;

  /** Spreads and fades each group of splashes, landing it somewhere new as it starts again. */
  /**
   * Rain running off the edges of the towers' canopies in thin streams, a curtain of falling
   * water along the pavement that catches the street's light.
   */
  private addDrips(): void {
    for (let i = 0; i < DRIPS; i++) {
      this.drips.push({ at: 0, side: 1, life: 1, phase: this.dripRandom() });
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(DRIPS * 6), 3));
    const material = new LineBasicMaterial({
      color: new Color('#cfe6ff'),
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.disposables.push(geometry, material);
    this.dripLines = new LineSegments(geometry, material);
    this.dripLines.frustumCulled = false;
    this.group.add(this.dripLines);
  }

  /** Lets each stream fall from its canopy, starting somewhere new along the street each time. */
  private drip(seconds: number, still: boolean): void {
    if (!this.dripLines) return;
    // For reduced motion there are none, rather than streams frozen in mid-air.
    this.dripLines.visible = !still;
    for (const stream of this.drips) {
      const life = (seconds / DRIP_FALL + stream.phase) % 1;
      if (life < stream.life) {
        stream.at = this.riderS + BEHIND + 2 + this.dripRandom() * DRIP_REACH;
        const loop = ((stream.at % LOOP) + LOOP) % LOOP;
        // No towers stand along the harbour, so the left has none there.
        const harbour = loop >= HARBOUR_FROM && loop < HARBOUR_TO;
        stream.side = harbour || this.dripRandom() < 0.5 ? 1 : -1;
      }
      stream.life = life;
    }
  }

  /** Draws each stream where it falls, against the canopy edge it runs off. */
  private placeDrips(s: number, heightAt: (metres: number) => number): void {
    if (!this.dripLines) return;
    const position = this.dripLines.geometry.getAttribute('position') as BufferAttribute;
    const edge = this.roadHalf + SETBACK - 1.85;
    this.drips.forEach((stream, i) => {
      const metres = ((((stream.at - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const ground = heightAt(Math.max(metres, 0));
      const hidden = metres < 0 || this.onBridge(Math.max(metres, 0));
      const top = ground + KERB + LOBBY + 0.1;
      const y = top - stream.life * (LOBBY - 0.1);
      const x = stream.side * (edge + (i % 7) * 0.02);
      const z = -metres;
      const length = hidden ? 0 : 1.4;
      position.setXYZ(i * 2, x, y, z);
      position.setXYZ(i * 2 + 1, x, y - length, z);
    });
    position.needsUpdate = true;
  }

  private splash(seconds: number, still: boolean): void {
    for (let k = 0; k < SPLASH_PHASES; k++) {
      const life = (seconds / SPLASH_LIFE + k / SPLASH_PHASES) % 1;
      const landed = life < this.splashLife[k]!;
      this.splashLife[k] = life;
      // Held still for reduced motion: no splashes at all, rather than frozen rings.
      this.splashMaterials[k]!.opacity = still ? 0 : (1 - life) * 0.55;
      for (const drop of this.splashes) {
        if (drop.phase !== k) continue;
        if (landed) {
          drop.x = (this.splashRandom() * 2 - 1) * this.splashHalf;
          drop.at = this.riderS + 2 + this.splashRandom() * SPLASH_REACH;
        }
        drop.mesh.scale.setScalar(0.05 + life * 0.2);
      }
    }
  }

  private fall(seconds: number, still: boolean): void {
    const rain = this.rain;
    if (!rain) return;
    rain.visible = !still;
    if (still) return;
    const position = rain.geometry.getAttribute('position') as BufferAttribute;
    this.drops.forEach((drop, i) => {
      const y = RAIN_HEIGHT - ((drop.phase + seconds * RAIN_SPEED) % RAIN_HEIGHT);
      position.setXYZ(i * 2, drop.x, y, drop.z);
      position.setXYZ(i * 2 + 1, drop.x - DROP * 0.12, y - DROP, drop.z + DROP * 0.05);
    });
    position.needsUpdate = true;
  }

  private skyReflection: CanvasTexture | null = null;

  /** The night sky as an environment map, for the water, the glass and the wet road to reflect. */
  skyEnv(): CanvasTexture {
    if (!this.skyReflection) {
      const texture = this.track(nightSkyTexture());
      texture.mapping = EquirectangularReflectionMapping;
      this.skyReflection = texture;
    }
    return this.skyReflection;
  }
  private cables: LineSegments | null = null;

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.addQuay(roadHalf, points);
    this.addLamps();
    const roof = new MeshStandardMaterial({ color: 0x0c0e16, roughness: 0.9 });
    // Three façades: blue glass, grey concrete and dark curtain wall, each lit its own way.
    const facades = [
      { base: '#1b2033', lit: ['#ffd9a0', '#9fd8ff', '#ffffff'], share: 0.34 },
      { base: '#272631', lit: ['#ffe2b0', '#ffc77a'], share: 0.22 },
      { base: '#12151f', lit: ['#7fb8ff', '#c6e6ff', '#ff9ad5'], share: 0.18 },
    ].map(({ base, lit, share }, i) => {
      const texture = this.track(windowTexture(base, lit, share, 101 + i * 17));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.9,
        roughness: 0.35,
        metalness: 0.3,
        // The glass catches a little of the night sky's glow.
        envMap: this.skyEnv(),
        envMapIntensity: 0.35,
      });
    });
    // One blade sign material for each word, in a neon colour of its own.
    const blades = SIGN_WORDS.map((word, i) => {
      const texture = this.track(bladeTexture(word, NEON[i % NEON.length]!));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: BLADE_GLOW,
        roughness: 0.5,
        side: DoubleSide,
      });
    });
    this.blades = blades;
    const lobbies = [
      { glass: '#ffd9a6', frame: '#1a1b22', dark: 0.15 },
      { glass: '#bfe6ff', frame: '#22242c', dark: 0.3 },
      { glass: '#ffe9c9', frame: '#2a1f24', dark: 0.45 },
    ].map(({ glass, frame, dark }, i) => {
      const texture = this.track(lobbyTexture(glass, frame, dark, 211 + i * 31));
      texture.wrapS = RepeatWrapping;
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.75,
        roughness: 0.25,
        metalness: 0.2,
      });
    });
    const canopyMaterial = new MeshStandardMaterial({
      color: 0x101218,
      metalness: 0.5,
      roughness: 0.45,
    });
    const lobbyRandom = seeded(97);
    // The rooftops draw from their own sequence too, so the street's layout is unchanged.
    const roofRandom = seeded(151);
    const kit = this.roofKit(true);
    // Neon strips up the towers' edges, from their own sequence so nothing else moves.
    const edgeRandom = seeded(211);
    // Big scrolling screens high on some towers, from their own sequence too.
    const screenRandom = seeded(263);
    const screens = SCREENS.map((words, i) => {
      const texture = this.track(screenTexture(words, i));
      texture.wrapS = RepeatWrapping;
      texture.repeat.set(0.5, 1);
      this.screenTextures.push(texture);
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const screenPlane = new PlaneGeometry(1, 1);
    const screenBox = new BoxGeometry(1, 1, 1);
    const frames = SCREEN_GLOW.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.3), toneMapped: false }),
    );
    this.disposables.push(...screens, screenPlane, screenBox, ...frames);
    const edges = NEON.map(
      (hex) =>
        new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.6,
        }),
    );
    const edgeBox = new BoxGeometry(EDGE, 1, EDGE);
    this.disposables.push(...edges, edgeBox);

    const blade = new PlaneGeometry(BLADE, 1);
    const bracket = new BoxGeometry(BLADE + 0.3, 0.12, 0.12);
    this.disposables.push(...lobbies, canopyMaterial, blade, bracket);
    this.disposables.push(roof, ...facades, ...blades);
    // Glass lifts up some towers' street faces, from their own sequence so the layout holds.
    const liftRandom = seeded(421);
    // The cab's glass: warm light behind glazing bars, a handrail, and riders inside.
    const liftGlass = new MeshBasicMaterial({
      color: new Color(0xffffff).multiplyScalar(1.15),
      map: this.track(liftCabTexture()),
      toneMapped: false,
    });
    const liftRim = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(2.2),
      toneMapped: false,
    });
    const liftBox = new BoxGeometry(1, 1, 1);
    this.disposables.push(liftGlass, liftRim, liftBox);
    // Shop signs along the canopies' road edges, from their own sequence so the layout holds.
    const shopRandom = seeded(359);
    const shopSigns = SHOPS.map(([name, hex]) => {
      const texture = this.track(shopSignTexture(name, hex));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const signPlane = new PlaneGeometry(1, 1);
    this.disposables.push(...shopSigns, signPlane);

    for (const side of [-1, 1] as const) {
      let offset = 0;
      while (offset < LOOP) {
        if (side < 0 && offset >= HARBOUR_FROM && offset < HARBOUR_TO) {
          offset = HARBOUR_TO;
          continue;
        }
        const width = 14 + this.random() * 16;
        const depth = 14 + this.random() * 14;
        const height = 24 + this.random() ** 2 * 120;
        const facade = facades[Math.floor(this.random() * facades.length)]!;
        const geometry = towerGeometry(width, height + FOOTING, depth);
        this.disposables.push(geometry);
        // Faces are +x, -x, top, bottom, +z, -z.
        const mesh = new Mesh(geometry, [facade, facade, roof, roof, facade, facade]);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.userData['height'] = height;
        this.addRooftop(
          mesh,
          (height + FOOTING) / 2,
          roofRandom,
          width,
          height,
          depth,
          facade,
          roof,
          kit,
        );
        // The street floor: lit glazing towards the road under a dark canopy.
        const street = -(height - FOOTING) / 2 + KERB;
        if (screenRandom() < 0.3) {
          // A screen standing out from the façade over the pavement, turned to face the
          // riders coming up the street, high above the canopy.
          const pick = Math.floor(screenRandom() * screens.length);
          const wide = SCREEN_WIDE;
          const tall = wide * 0.5;
          const screen = new Mesh(screenPlane, screens[pick]!);
          screen.scale.set(wide, tall, 1);
          const across = -side * (width / 2 + wide / 2 + 0.6);
          const up = street + LOBBY + 6 + screenRandom() * 8 + tall / 2;
          const front = depth / 2 - 1;
          screen.position.set(across, up, front);
          mesh.add(screen);
          // Its dark housing, and two steel arms that carry it out from the façade.
          const housing = new Mesh(screenBox, canopyMaterial);
          housing.scale.set(wide + 0.5, tall + 0.5, 0.45);
          housing.position.set(across, up, front - 0.25);
          mesh.add(housing);
          // A lit frame in the screen's own colour.
          for (const [w, h, dx, dy] of [
            [wide + 0.5, 0.22, 0, tall / 2 + 0.14],
            [wide + 0.5, 0.22, 0, -tall / 2 - 0.14],
            [0.22, tall + 0.5, wide / 2 + 0.14, 0],
            [0.22, tall + 0.5, -wide / 2 - 0.14, 0],
          ] as const) {
            const bar = new Mesh(screenBox, frames[pick]!);
            bar.scale.set(w, h, 0.12);
            bar.position.set(across + dx, up + dy, front + 0.02);
            mesh.add(bar);
          }
          for (const y of [up + tall / 2 - 0.4, up - tall / 2 + 0.4]) {
            const arm = new Mesh(screenBox, canopyMaterial);
            arm.scale.set(wide + 0.8, 0.18, 0.18);
            arm.position.set(-side * (width / 2 + (wide + 0.8) / 2), y, front - 0.5);
            mesh.add(arm);
          }
          // Its glow falls on the wet pavement below.
          this.streak(mesh, SCREEN_GLOW[pick]!, across, street, front - 2, 14, wide * 0.8, 1.1);
        }
        if (edgeRandom() < 0.4) {
          // A neon strip runs up each of the tower's corners on the road, above the canopy.
          const colour = Math.floor(edgeRandom() * edges.length);
          const material = edges[colour]!;
          const foot = street + LOBBY + 0.6;
          const top = (height + FOOTING) / 2;
          for (const z of [-depth / 2, depth / 2]) {
            const strip = new Mesh(edgeBox, material);
            strip.scale.y = top - foot;
            strip.position.set(-side * (width / 2 + EDGE / 2), (top + foot) / 2, z);
            mesh.add(strip);
            // Its colour runs down the wet pavement and out across the road, as neon does.
            this.streak(mesh, NEON[colour]!, -side * (width / 2 + 4), street, z - 2, 16, 1.8, 1.5);
            this.streak(
              mesh,
              NEON[colour]!,
              -side * (width / 2 + SETBACK + 2),
              street - KERB,
              z - 3,
              22,
              1.4,
              0.8,
            );
          }
        }
        const length = depth - 2;
        const glazing = new PlaneGeometry(length, LOBBY);
        const uv = glazing.getAttribute('uv');
        for (let v = 0; v < uv.count; v++) uv.setX(v, (uv.getX(v) * length) / LOBBY_BAY);
        const lobby = new Mesh(glazing, lobbies[Math.floor(lobbyRandom() * lobbies.length)]!);
        lobby.rotation.y = (-side * Math.PI) / 2;
        lobby.position.set(-side * (width / 2 + 0.04), street + LOBBY / 2, 0);
        if (shopRandom() < 0.85) {
          // A lit shop sign hangs under the canopy, out over the pavement, facing the riders
          // coming up the street.
          const pick = Math.floor(shopRandom() * shopSigns.length);
          const sign = new Mesh(signPlane, shopSigns[pick]!);
          sign.scale.set(SHOP_SIGN_LONG, SHOP_SIGN_LONG / 6, 1);
          const z = (shopRandom() - 0.3) * (length - 2);
          sign.position.set(
            -side * (width / 2 + SHOP_SIGN_LONG / 2 + 0.2),
            street + LOBBY - SHOP_SIGN_LONG / 12 - 0.15,
            z,
          );
          mesh.add(sign);
          const hanger = new Mesh(signPlane, canopyMaterial);
          hanger.scale.set(SHOP_SIGN_LONG + 0.2, 0.08, 1);
          hanger.position.set(sign.position.x, street + LOBBY - 0.08, z);
          mesh.add(hanger);
          this.streak(mesh, SHOPS[pick]![1], -side * (width / 2 + 2), street, z - 2, 6, 2, 0.9);
        }
        const canopyBox = new BoxGeometry(1.8, 0.22, length);
        const canopy = new Mesh(canopyBox, canopyMaterial);
        canopy.position.set(-side * (width / 2 + 0.9), street + LOBBY + 0.2, 0);
        canopy.castShadow = true;
        this.disposables.push(glazing, canopyBox);
        mesh.add(lobby, canopy);
        if (this.random() < 0.45) {
          // A blade sign stands out from the façade over the canopy, read down the street.
          const word = Math.floor(this.random() * blades.length);
          const material = blades[word]!;
          const tall = Math.min(height * 0.4, 6 + this.random() * 10);
          this.random();
          const lift = this.random() * height * 0.15;
          const along = (this.random() - 0.5) * (depth - 4);
          const sign = new Mesh(blade, material);
          sign.scale.y = tall;
          const out = -side * (width / 2 + BLADE / 2 + 0.15);
          const foot = street + LOBBY + 1.6 + lift;
          sign.position.set(out, foot + tall / 2, along);
          mesh.add(sign);
          // Its colour reflects on the wet pavement below, towards the road.
          this.streak(
            mesh,
            NEON[word % NEON.length]!,
            out - side * 2.5,
            street,
            along - 1,
            10,
            2.2,
            1.4,
          );
          for (const y of [foot + 0.4, foot + tall - 0.4]) {
            const arm = new Mesh(bracket, canopyMaterial);
            arm.position.set(out, y, along);
            mesh.add(arm);
          }
        }
        if (liftRandom() < LIFT_SHARE && height > LIFT_MIN_HEIGHT) {
          // On the face towards the street: a lit rail up the facade and the car riding it.
          const face = -side * (width / 2);
          const ground = -(height - FOOTING) / 2;
          const low = ground + LOBBY + 2;
          const high = ground + height - 8;
          const rail = new Mesh(liftBox, liftRim);
          rail.scale.set(0.3, high - low + 4, 0.3);
          rail.position.set(face - side * 0.12, (low + high) / 2, 0);
          mesh.add(rail);
          const car = new Group();
          const cab = new Mesh(liftBox, liftGlass);
          cab.scale.set(3, 3.6, 3.2);
          car.add(cab);
          for (const y of [-1.86, 1.86]) {
            const rim = new Mesh(liftBox, liftRim);
            rim.scale.set(3.1, 0.2, 3.3);
            rim.position.y = y;
            car.add(rim);
          }
          car.position.set(face - side * 1.7, low, 0);
          mesh.add(car);
          this.lifts.push({ car, low, high, phase: liftRandom() });
        }
        this.group.add(mesh);
        this.towers.push({ mesh, side, offset: offset + depth / 2, width, depth });
        // A lane or a plaza between some towers lets the distance through.
        offset += depth + (this.random() < 0.3 ? 8 + this.random() * 18 : 1.5);
      }
    }
    this.roadHalf = roadHalf;
    this.addSkyline(facades, roof);
    this.addFarShore(facades, roof);
  }

  /**
   * A tower's top against the sky: a stepped setback in the same façade, a lit crown band
   * round the top and, on the tallest, an antenna mast with a red beacon.
   */
  private addRooftop(
    tower: Mesh,
    roofline: number,
    random: () => number,
    width: number,
    height: number,
    depth: number,
    facade: MeshStandardMaterial,
    roof: MeshStandardMaterial,
    kit: RoofKit,
  ): void {
    let top = roofline;
    let w = width;
    let d = depth;
    if (random() < 0.55) {
      // One or two setbacks, each narrower than the floor below.
      const steps = random() < 0.4 ? 2 : 1;
      for (let k = 0; k < steps; k++) {
        w *= 0.62 + random() * 0.18;
        d *= 0.62 + random() * 0.18;
        const tall = 6 + random() * 14;
        const geometry = towerGeometry(w, tall, d);
        this.disposables.push(geometry);
        const step = new Mesh(geometry, [facade, facade, roof, roof, facade, facade]);
        step.position.y = top + tall / 2;
        tower.add(step);
        top += tall;
      }
    }
    if (random() < 0.4) {
      const crown = new Mesh(this.unitBox(), kit.crowns[Math.floor(random() * kit.crowns.length)]!);
      crown.scale.set(w + 0.3, 0.6, d + 0.3);
      crown.position.y = top - 1.2;
      tower.add(crown);
    }
    if (height > 70 || random() < 0.25) {
      const tall = 8 + random() * 18;
      const pole = new Mesh(kit.mast, roof);
      pole.scale.y = tall;
      pole.position.y = top + tall / 2;
      const light = new Mesh(kit.lamp, kit.beacon);
      light.position.y = top + tall + 0.4;
      tower.add(pole, light);
    }
  }

  /** The rooftops' lights and shapes; `fog` is false for the distant skyline and far shore. */
  private roofKit(fog: boolean): RoofKit {
    const crowns = NEON.concat('#f2f4ff').map(
      (hex) =>
        new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.2,
          fog,
        }),
    );
    const beacon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3,
      fog,
    });
    // Distant masts and lamps are drawn larger, or they would vanish at that range.
    const scale = fog ? 1 : 2.5;
    const mast = new CylinderGeometry(0.18 * scale, 0.35 * scale, 1, 6);
    const lamp = new SphereGeometry(0.6 * scale, 10, 8);
    this.disposables.push(...crowns, beacon, mast, lamp);
    return { crowns, beacon, mast, lamp };
  }

  private hazeMaterial: MeshBasicMaterial | null = null;

  /**
   * A curtain of the city's violet haze, `width` by `height` metres, standing on the water at
   * (x, 0, z) and turned by `turn` about the vertical: thick at its foot, clear at its top. It
   * softens the distant towers' feet into the glow, as the mock's skyline sits in haze.
   */
  private haze(width: number, height: number, x: number, z: number, along: number, turn = 0): Mesh {
    if (!this.hazeMaterial) {
      this.hazeMaterial = new MeshBasicMaterial({
        color: new Color('#5b4288'),
        map: this.track(hazeTexture()),
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        side: DoubleSide,
      });
      this.disposables.push(this.hazeMaterial);
    }
    const plane = new PlaneGeometry(width, height);
    this.disposables.push(plane);
    const mesh = new Mesh(plane, this.hazeMaterial);
    mesh.rotation.y = turn;
    mesh.position.set(x, height / 2 - 2, z + along);
    mesh.renderOrder = 2;
    return mesh;
  }

  private glow: CanvasTexture | null = null;
  private readonly billboardMaterials = new Map<string, [MeshBasicMaterial, MeshBasicMaterial]>();

  /**
   * A neon billboard high on a distant tower's face, with its glow bleeding into the haze, as
   * the mock's skyline has. The face is at local `x` (turned to +x) or else `z` (to +z).
   */
  private billboard(
    tower: Mesh,
    random: () => number,
    width: number,
    height: number,
    x: number,
    z: number,
  ): void {
    const hex = NEON[Math.floor(random() * NEON.length)]!;
    let pair = this.billboardMaterials.get(hex);
    if (!pair) {
      this.glow ??= this.track(glowTexture());
      // Untouched by tone mapping, so the neon keeps its hue rather than washing to white.
      const sign = new MeshBasicMaterial({
        color: new Color(hex),
        fog: false,
        toneMapped: false,
      });
      const halo = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(1.3),
        map: this.glow,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      });
      pair = [sign, halo];
      this.billboardMaterials.set(hex, pair);
      this.disposables.push(sign, halo);
    }
    const face = x !== 0 ? Math.min(width, 40) : width;
    const w = face * (0.45 + random() * 0.35);
    const h = w * (0.3 + random() * 0.4);
    const y = height / 2 - h - 6 - random() * height * 0.25;
    const plane = new PlaneGeometry(1, 1);
    this.disposables.push(plane);
    const sign = new Mesh(plane, pair[0]);
    sign.scale.set(w, h, 1);
    const halo = new Mesh(plane, pair[1]);
    halo.scale.set(w * 3.2, h * 4.5, 1);
    for (const [mesh, out] of [
      [sign, 0.4],
      [halo, 1.2],
    ] as const) {
      if (x !== 0) {
        mesh.rotation.y = Math.PI / 2;
        mesh.position.set(x + out, y, 0);
      } else {
        mesh.position.set(0, y, z + out);
      }
      tower.add(mesh);
    }
  }

  private unitGeometry: BoxGeometry | null = null;

  /** One shared unit cube for the rooftops' crown bands. */
  private unitBox(): BoxGeometry {
    if (!this.unitGeometry) {
      this.unitGeometry = new BoxGeometry(1, 1, 1);
      this.disposables.push(this.unitGeometry);
    }
    return this.unitGeometry;
  }

  /**
   * The harbour city across the water at the end of the street: a band of towers in depth and
   * a landmark tower with a lit crown and spire. Like Old Town's cathedral it stands a fixed
   * distance ahead, out of the fog, which would hide it; its façades are dimmed by hand.
   */
  private addSkyline(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(73);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.75;
      material.color.multiplyScalar(0.6);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    const kit = this.roofKit(false);
    const roofRandom = seeded(173);
    for (let i = 0; i < 46; i++) {
      // Taller towers gather towards the middle, as a business district does.
      const x = (random() * 2 - 1) ** 3 * 420;
      const centre = 1 - Math.min(Math.abs(x) / 420, 1);
      const height = 40 + random() * 70 + centre * random() * 160;
      const width = 18 + random() * 26;
      const depth = 18 + random() * 20;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, -random() * 260);
      this.addRooftop(mesh, height / 2, roofRandom, width, height, depth, facade, top, kit);
      if (roofRandom() < 0.3) this.billboard(mesh, roofRandom, width, height, 0, depth / 2);
      this.skyline.add(mesh);
    }
    this.addLandmark(far[0]!, top);
    // The city's haze, thickest at the waterline, in front of the skyline.
    this.skyline.add(this.haze(2400, 150, 0, 30, 0));
    this.group.add(this.skyline);
  }

  /**
   * The city across the harbour, on the left: lit towers along the far shore. It keeps its
   * distance, like the skyline.
   */
  private addFarShore(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(131);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.8;
      material.color.multiplyScalar(0.5);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    const kit = this.roofKit(false);
    const roofRandom = seeded(191);
    for (let z = 80; z > -760;) {
      const width = 16 + random() * 24;
      const depth = 16 + random() * 18;
      const height = 30 + random() ** 1.5 * 150;
      const x = -FAR_SHORE - depth / 2 - random() * 120;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, z - width / 2);
      this.addRooftop(mesh, height / 2, roofRandom, width, height, depth, facade, top, kit);
      // The far shore's towers turn their faces to the harbour, towards the road.
      if (roofRandom() < 0.3) this.billboard(mesh, roofRandom, width, height, width / 2, 0);
      this.farShore.add(mesh);
      z -= width + 2 + random() * 10;
    }
    // The haze over the water, before the far shore, turned to face the road.
    this.addSearchlights();
    this.addWheel();
    this.addWhale();
    this.addHarbourBridge();
    this.addLighthouse();
    this.addBlimp();
    this.addHoloGlobe();
    this.addLasers();
    this.farShore.add(this.haze(1100, 110, -FAR_SHORE + 20, 0, -320, Math.PI / 2));
    this.group.add(this.farShore);
  }

  /**
   * A lighthouse on a rock in the harbour: a tapering tower banded red and white, a gallery,
   * a lantern room glowing warm under a dark cap, and two beams sweeping round from it.
   */
  private addLighthouse(): void {
    const [x, z] = LIGHTHOUSE_AT;
    const house = new Group();
    house.position.set(x, 0, z);
    house.scale.setScalar(LIGHTHOUSE_SCALE);
    const rock = new MeshBasicMaterial({ color: new Color('#15131f'), fog: false });
    const bands = this.track(lighthouseTexture());
    const tower = new MeshBasicMaterial({
      map: bands,
      color: new Color(0xffffff).multiplyScalar(0.75),
      fog: false,
    });
    const dark = new MeshBasicMaterial({ color: new Color('#0d0e16'), fog: false });
    const lamp = new MeshBasicMaterial({
      color: new Color('#ffe2a8').multiplyScalar(2.6),
      fog: false,
      toneMapped: false,
    });
    const rockGeometry = new CylinderGeometry(9, 14, 6, 9);
    const towerGeometry = new CylinderGeometry(3.2, 5.2, LIGHTHOUSE_HEIGHT, 16, 1, true);
    const galleryGeometry = new CylinderGeometry(5, 5, 1, 16);
    const lanternGeometry = new CylinderGeometry(3, 3, 4.4, 12);
    const capGeometry = new ConeGeometry(3.6, 3.4, 12);
    this.disposables.push(rock, tower, dark, lamp, rockGeometry, towerGeometry);
    this.disposables.push(galleryGeometry, lanternGeometry, capGeometry);
    const base = new Mesh(rockGeometry, rock);
    base.position.y = 1;
    const shaft = new Mesh(towerGeometry, tower);
    shaft.position.y = 4 + LIGHTHOUSE_HEIGHT / 2;
    const top = 4 + LIGHTHOUSE_HEIGHT;
    const gallery = new Mesh(galleryGeometry, dark);
    gallery.position.y = top + 0.5;
    const lantern = new Mesh(lanternGeometry, lamp);
    lantern.position.y = top + 3.2;
    const cap = new Mesh(capGeometry, dark);
    cap.position.y = top + 7.1;
    house.add(base, shaft, gallery, lantern, cap);
    // The lantern's glow, seen from across the harbour.
    const halo = new SpriteMaterial({
      map: this.track(glowTexture()),
      color: new Color('#ffd89a').multiplyScalar(1.6),
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.disposables.push(halo);
    const glow = new Sprite(halo);
    glow.scale.setScalar(26);
    glow.position.y = top + 3.2;
    house.add(glow);
    // Two beams back to back, each a long open cone fading away from the lantern. Each is three
    // cones nested, wide and faint round narrow and bright, so its edges fall off softly.
    const fade = this.track(lighthouseBeamTexture());
    const layers = LIGHTHOUSE_BEAM_LAYERS.map(([wide, strength]) => {
      const material = new MeshBasicMaterial({
        map: fade,
        color: new Color('#ffe9c0').multiplyScalar(strength),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        fog: false,
        toneMapped: false,
      });
      const geometry = new ConeGeometry(
        LIGHTHOUSE_BEAM_WIDE * wide,
        LIGHTHOUSE_BEAM_LONG,
        24,
        1,
        true,
      );
      this.disposables.push(material, geometry);
      return { material, geometry };
    });
    const turning = new Group();
    turning.position.y = top + 3.2;
    for (const turn of [0, Math.PI]) {
      const arm = new Group();
      arm.rotation.y = turn;
      for (const { material, geometry } of layers) {
        const ray = new Mesh(geometry, material);
        // The cone's tip at the lantern, its mouth out along +x.
        ray.rotation.z = Math.PI / 2;
        ray.position.x = LIGHTHOUSE_BEAM_LONG / 2;
        ray.frustumCulled = false;
        arm.add(ray);
      }
      turning.add(arm);
    }
    house.add(turning);
    this.lighthouseBeams = turning;
    this.farShore.add(house);
  }

  /**
   * The ride's clock run smoothly: it counts whole seconds, so this runs on through each second
   * from when it last ticked, and stops a second after the clock does. 0 when still.
   */
  private smooth(seconds: number, still: boolean): number {
    const now = performance.now();
    if (seconds !== this.tick || this.tickAt === null) {
      this.tick = seconds;
      this.tickAt = now;
    }
    return still ? 0 : seconds + Math.min((now - this.tickAt) / 1000, 1);
  }

  /** Turns the lighthouse's beams. */
  private sweep(seconds: number): void {
    if (!this.lighthouseBeams) return;
    this.lighthouseBeams.rotation.y = LIGHTHOUSE_FACING + (seconds / LIGHTHOUSE_TURN) * Math.PI * 2;
  }

  /**
   * An advertising blimp over the harbour: a long grey-violet hull, tail fins, a lit gondola,
   * a glowing screen along the side facing the road, and red and green lights at its ends.
   */
  private addBlimp(): void {
    const [x, y, z] = BLIMP_AT;
    const body = new Group();
    body.position.set(x, y, z);
    body.scale.setScalar(BLIMP_SCALE);
    const hullMaterial = new MeshStandardMaterial({
      color: new Color('#4a4466'),
      emissive: new Color('#3a3358'),
      emissiveIntensity: 0.9,
      roughness: 0.5,
      fog: false,
    });
    const darkMaterial = new MeshBasicMaterial({ color: new Color('#14121e'), fog: false });
    const gondolaMaterial = new MeshBasicMaterial({
      color: new Color('#ffd9a0').multiplyScalar(1.4),
      fog: false,
      toneMapped: false,
    });
    const screenMaterial = new MeshBasicMaterial({
      map: this.track(blimpTexture()),
      color: new Color(0xffffff).multiplyScalar(1.5),
      fog: false,
      toneMapped: false,
    });
    const hull = new SphereGeometry(1, 32, 16);
    const fin = new BoxGeometry(1, 1, 1);
    const screen = new PlaneGeometry(BLIMP_LONG * 0.56, BLIMP_ROUND * 0.62);
    this.disposables.push(hullMaterial, darkMaterial, gondolaMaterial, screenMaterial);
    this.disposables.push(hull, fin, screen);
    const shell = new Mesh(hull, hullMaterial);
    shell.scale.set(BLIMP_LONG / 2, BLIMP_ROUND / 2, BLIMP_ROUND / 2);
    body.add(shell);
    // The screen stands just off the hull's side, towards the road and the rider.
    const side = new Mesh(screen, screenMaterial);
    side.position.set(0, 0, BLIMP_ROUND / 2 + 0.3);
    body.add(side);
    // A vertical fin and two flat ones at the tail (+x), and the gondola underneath.
    for (const [sx, sy, sz, py, pz] of [
      [8, 9, 0.8, 5, 0],
      [8, 0.8, 18, 0, 0],
    ] as const) {
      const vane = new Mesh(fin, darkMaterial);
      vane.scale.set(sx, sy, sz);
      vane.position.set(BLIMP_LONG / 2 - 6, py, pz);
      body.add(vane);
    }
    const gondola = new Mesh(fin, gondolaMaterial);
    gondola.scale.set(9, 2.4, 3.4);
    gondola.position.set(-3, -BLIMP_ROUND / 2 - 0.8, 0);
    body.add(gondola);
    const lights: MeshBasicMaterial[] = [];
    for (const [hex, at] of [
      ['#ff3344', -BLIMP_LONG / 2 - 0.8],
      ['#33ff77', BLIMP_LONG / 2 + 0.8],
    ] as const) {
      const light = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(3),
        fog: false,
        toneMapped: false,
      });
      this.disposables.push(light);
      const bulb = new Mesh(hull, light);
      bulb.scale.setScalar(1.3);
      bulb.position.set(at, 0, 0);
      body.add(bulb);
      lights.push(light);
    }
    this.farShore.add(body);
    this.blimp = { body, lights };
  }

  /**
   * A giant holographic globe hovering over the city at the end of the street: cyan meridians
   * and parallels, continents in glowing pink dots, a tilted ring round it and a soft glow
   * behind. Light only, drawn additively, so the sky shows through.
   */
  private addHoloGlobe(): void {
    const [x, y, z] = HOLO_AT;
    const holder = new Group();
    holder.position.set(x, y, z);
    holder.rotation.z = HOLO_TILT;
    const light = (map: CanvasTexture, hex: string, strength: number) =>
      new MeshBasicMaterial({
        map,
        color: new Color(hex).multiplyScalar(strength),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        fog: false,
        toneMapped: false,
      });
    const skin = light(this.track(holoGlobeTexture()), '#ffffff', 1.6);
    const ringMaterial = light(this.track(holoRingTexture()), '#5ff2ff', 3.2);
    const sphere = new SphereGeometry(HOLO_RADIUS, 48, 24);
    const ring = new RingGeometry(HOLO_RADIUS * 1.3, HOLO_RADIUS * 1.55, 96, 1);
    this.disposables.push(skin, ringMaterial, sphere, ring);
    const turning = new Group();
    turning.add(new Mesh(sphere, skin));
    holder.add(turning);
    // The ring lies tilted round the globe and turns in its own plane, its satellites with it.
    const tilt = new Group();
    tilt.rotation.x = -Math.PI / 2 + 0.85;
    const spin = new Group();
    spin.add(new Mesh(ring, ringMaterial));
    const satellite = new SpriteMaterial({
      map: this.track(glowTexture()),
      color: new Color('#e8fbff').multiplyScalar(2.4),
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.disposables.push(satellite);
    for (let k = 0; k < HOLO_SATELLITES; k++) {
      const a = (k / HOLO_SATELLITES) * Math.PI * 2;
      const dot = new Sprite(satellite);
      dot.scale.setScalar(HOLO_RADIUS * 0.22);
      dot.position.set(Math.cos(a) * HOLO_RADIUS * 1.42, Math.sin(a) * HOLO_RADIUS * 1.42, 0);
      spin.add(dot);
    }
    tilt.add(spin);
    holder.add(tilt);
    this.holoRing = spin;
    const halo = new SpriteMaterial({
      map: this.track(glowTexture()),
      color: new Color('#3fa8ff').multiplyScalar(0.5),
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.disposables.push(halo);
    const glow = new Sprite(halo);
    glow.scale.setScalar(HOLO_RADIUS * 3.2);
    holder.add(glow);
    this.farShore.add(holder);
    this.holoGlobe = turning;
  }

  /**
   * Schools of holographic koi swimming in the air over the street: glowing bodies in orange,
   * white and gold patched like koi, each with a fanned tail and fins of glowing light,
   * circling and bobbing as they go, a little see-through like any hologram.
   */
  private addKoi(): void {
    const random = seeded(449);
    const skins = KOI_SKINS.map(([ground, patch]) => {
      const material = new MeshBasicMaterial({
        map: this.track(koiTexture(ground, patch, random)),
        color: new Color(0xffffff).multiplyScalar(1.3),
        transparent: true,
        opacity: 0.88,
        toneMapped: false,
      });
      this.disposables.push(material);
      return material;
    });
    const fin = new MeshBasicMaterial({
      color: new Color('#ff9a7a').multiplyScalar(1.2),
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    // A fish's outline turned round its length: a round head (+x) tapering to a slim tail.
    const body = new LatheGeometry(
      KOI_PROFILE.map(([r, y]) => new Vector2(r, y)),
      20,
    );
    body.rotateZ(-Math.PI / 2);
    // The tail: a fan from the body's end, flat and upright.
    const tailShape = new BufferGeometry();
    tailShape.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([
          0, 0, 0, -1.3, 0.75, 0, -1.3, -0.75, 0, 0, 0, 0, -1, 0.35, 0, -1, -0.35, 0,
        ]),
        3,
      ),
    );
    this.disposables.push(fin, body, tailShape);
    for (const offset of KOI_SCHOOLS) {
      const group = new Group();
      for (let k = 0; k < KOI_PER_SCHOOL; k++) {
        const fish = new Group();
        const length = 1.4 + random() * 0.9;
        const shell = new Mesh(body, skins[k % skins.length]!);
        shell.scale.set(length, length * 0.42, length * 0.52);
        fish.add(shell);
        const tail = new Mesh(tailShape, fin);
        tail.scale.setScalar(length * 0.55);
        tail.position.x = -length * 0.92;
        fish.add(tail);
        for (const side of [-1, 1]) {
          const pectoral = new Mesh(tailShape, fin);
          pectoral.scale.setScalar(length * 0.22);
          pectoral.rotation.set(Math.PI / 2, 0, side * 2.2);
          pectoral.position.set(length * 0.35, -length * 0.1, side * length * 0.25);
          fish.add(pectoral);
        }
        group.add(fish);
        this.koi.push({
          fish,
          tail,
          radius: 2 + random() * 4,
          height: KOI_HEIGHT + (random() - 0.5) * KOI_DEPTH,
          phase: random() * Math.PI * 2,
          speed: (0.6 + random() * 0.5) * (random() < 0.5 ? -1 : 1),
        });
      }
      this.group.add(group);
      this.koiSchools.push({ group, offset });
    }
  }

  /** Swims each koi round its circle, nose along its way, bobbing and beating its tail. */
  private swimKoi(seconds: number): void {
    for (const { fish, tail, radius, height, phase, speed } of this.koi) {
      const a = phase + (seconds * speed) / radius;
      fish.position.set(
        Math.cos(a) * radius,
        height + Math.sin(a * 2 + phase) * 0.6,
        Math.sin(a) * radius * 1.8,
      );
      // Heading along the circle's tangent: +x is the nose.
      fish.rotation.y = -a - (speed > 0 ? Math.PI / 2 : -Math.PI / 2);
      tail.rotation.y = Math.sin(seconds * 5 + phase) * 0.45;
    }
  }

  /**
   * A laser show from a rooftop at the end of the street: a fan of thin green and magenta
   * beams reaching up across the night sky, fading with distance. Light only, drawn additively.
   */
  private addLasers(): void {
    const [x, y, z] = LASER_AT;
    const source = new Group();
    source.position.set(x, y, z);
    const fade = this.track(laserTexture());
    const plane = new PlaneGeometry(LASER_LONG, LASER_WIDE);
    // From the source outwards along +x, so the beam turns about its own start.
    plane.translate(LASER_LONG / 2, 0, 0);
    this.disposables.push(plane);
    const materials = LASER_COLOURS.map((hex) => {
      const material = new MeshBasicMaterial({
        map: fade,
        color: new Color(hex).multiplyScalar(3.2),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        fog: false,
        toneMapped: false,
      });
      this.disposables.push(material);
      return material;
    });
    for (let k = 0; k < LASER_BEAMS; k++) {
      const beam = new Mesh(plane, materials[k % materials.length]!);
      beam.frustumCulled = false;
      // Spread evenly across the fan, from low on the left to low on the right.
      const base = Math.PI * (0.18 + (0.64 * k) / (LASER_BEAMS - 1));
      beam.rotation.z = base;
      source.add(beam);
      this.lasers.push({ beam, base, phase: k * 0.7 });
    }
    // The emitter: a bright point where the beams meet.
    const halo = new SpriteMaterial({
      map: this.track(glowTexture()),
      color: new Color('#e8ffe8').multiplyScalar(1.4),
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.disposables.push(halo);
    const glow = new Sprite(halo);
    glow.scale.setScalar(14);
    source.add(glow);
    this.farShore.add(source);
  }

  /** Swings the laser fan to and fro, each beam a little behind the last. */
  private sweepLasers(seconds: number): void {
    for (const { beam, base, phase } of this.lasers) {
      beam.rotation.z = base + Math.sin(seconds * LASER_SWING + phase) * LASER_SWAY;
    }
  }

  /** Drifts the blimp slowly to and fro along the harbour, and blinks its lights. */
  private drift(seconds: number, still: boolean): void {
    if (!this.blimp) return;
    const { body, lights } = this.blimp;
    const t = (seconds / BLIMP_PERIOD) * Math.PI * 2;
    body.position.x = BLIMP_AT[0] + Math.sin(t) * BLIMP_DRIFT;
    const lit = still || seconds % 1.5 < 0.4;
    for (const light of lights) light.visible = lit;
  }

  /**
   * A suspension bridge across the harbour mouth, far ahead: two tall pylons outlined in
   * light, a dark deck with a lit edge, and main cables and hangers strung with white bulbs.
   * Untouched by fog, like the far shore it reaches.
   */
  private addHarbourBridge(): void {
    const [from, to] = BRIDGE_SPAN;
    const z = BRIDGE_Z;
    const steel = new MeshBasicMaterial({ color: new Color('#11121a'), fog: false });
    const edge = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.4),
      fog: false,
      toneMapped: false,
    });
    const wire = new LineBasicMaterial({
      color: new Color('#7fe8ff').multiplyScalar(1.2),
      fog: false,
      toneMapped: false,
    });
    // Each bulb a small glowing quad facing the rider: point sizes are not honoured by every
    // renderer backend, and points drew as single pixels.
    this.glow ??= this.track(glowTexture());
    // White, so each bulb's own colour, set per instance, shows true.
    const bulbs = new MeshBasicMaterial({
      color: new Color(0xffffff).multiplyScalar(4.5),
      map: this.glow,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const bulb = new PlaneGeometry(BRIDGE_BULB, BRIDGE_BULB);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(steel, edge, wire, bulbs, bulb, unit);
    const box = (material: Material, w: number, h: number, d: number, x: number, y: number) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      this.farShore.add(mesh);
    };
    // The deck and its lit edge on the side towards the rider.
    const deckLong = to - from;
    box(steel, deckLong, 2.4, 10, (from + to) / 2, BRIDGE_DECK);
    box(edge, deckLong, 0.5, 0.3, (from + to) / 2, BRIDGE_DECK - 0.4);
    // Two pylons, each two legs joined by cross-beams, their outer edges lit.
    const pylons = [from + deckLong * 0.22, to - deckLong * 0.22];
    for (const px of pylons) {
      for (const dz of [-1, 1]) {
        const leg = new Mesh(unit, steel);
        leg.scale.set(4, BRIDGE_PYLON, 3);
        leg.position.set(px, BRIDGE_PYLON / 2, z + dz * 5);
        this.farShore.add(leg);
        const line = new Mesh(unit, edge);
        line.scale.set(0.5, BRIDGE_PYLON, 0.5);
        line.position.set(px, BRIDGE_PYLON / 2, z + dz * 5 + dz * 1.6);
        this.farShore.add(line);
      }
      for (const y of [BRIDGE_DECK + 18, BRIDGE_PYLON - 6]) {
        const beam = new Mesh(unit, steel);
        beam.scale.set(3, 3, 10);
        beam.position.set(px, y, z);
        this.farShore.add(beam);
      }
    }
    // The main cable on the near side: back-stays from each end up to its pylon, and the main
    // span sagging between the pylons, with hangers down to the deck and bulbs along it.
    const top = BRIDGE_PYLON - 1;
    const cable = (x: number): number => {
      const [a, b] = pylons as [number, number];
      if (x <= a) return BRIDGE_DECK + 2 + ((top - BRIDGE_DECK - 2) * (x - from)) / (a - from);
      if (x >= b) return BRIDGE_DECK + 2 + ((top - BRIDGE_DECK - 2) * (to - x)) / (to - b);
      const t = (x - a) / (b - a);
      return top - (top - BRIDGE_DECK - 4) * 4 * t * (1 - t);
    };
    const near = z + 5.5;
    const lines: number[] = [];
    const lights: number[] = [];
    const steps = 120;
    for (let k = 0; k < steps; k++) {
      const a = from + (deckLong * k) / steps;
      const b = from + (deckLong * (k + 1)) / steps;
      lines.push(a, cable(a), near, b, cable(b), near);
      // Bulbs strung along the cable, and a row along the deck's edge too.
      if (k % 2 === 0) lights.push(a, cable(a), near, a, BRIDGE_DECK + 1.4, near);
      if (k % 4 === 0) lines.push(a, cable(a), near, a, BRIDGE_DECK + 1.2, near);
    }
    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(lines), 3));
    this.disposables.push(lineGeometry);
    const lit = new InstancedMesh(bulb, bulbs, lights.length / 3);
    const dummy = new Object3D();
    for (let k = 0; k < lights.length / 3; k++) {
      // Just in front of the cable, so the wire does not cut through the glow.
      dummy.position.set(lights[k * 3]!, lights[k * 3 + 1]!, lights[k * 3 + 2]! + 0.5);
      dummy.updateMatrix();
      lit.setMatrixAt(k, dummy.matrix);
      lit.setColorAt(k, new Color(BULB_COLOURS[Math.floor(k / 2) % BULB_COLOURS.length]!));
    }
    this.bridgeBulbs = {
      mesh: lit,
      xs: Array.from({ length: lights.length / 3 }, (_, k) => lights[k * 3]!),
    };
    this.farShore.add(new LineSegments(lineGeometry, wire), lit);
  }

  /**
   * Races pulses of light away down the bollards, like runway lights leading the riders on:
   * every BOLLARD_PULSE_GAP metres a pulse lights the pairs it passes. Steady for reduced
   * motion.
   */
  private pulseBollards(seconds: number, still: boolean): void {
    for (const { ring, glow, metres } of this.bollards) {
      const gap = BOLLARD_PULSE_GAP;
      const along =
        (((metres - seconds * BOLLARD_PULSE_SPEED + BOLLARD_PULSE_PHASE) % gap) + gap) % gap;
      const near = Math.min(along, gap - along) / BOLLARD_PULSE_WIDE;
      const pulse = still ? 0 : Math.exp(-near * near);
      ring.color.set(BOLLARD_RING).multiplyScalar(1.6 + pulse * 2.4);
      // Close to the rider a flare would swell into a ghostly ball, so it fades out there.
      const fade = (metres - BOLLARD_FLARE_GONE) / (BOLLARD_FLARE_NEAR - BOLLARD_FLARE_GONE);
      glow.opacity = pulse * Math.min(Math.max(fade, 0), 1);
      glow.color.set(BOLLARD_RING).multiplyScalar(1.4 + pulse);
    }
  }

  /** Flashes the lead cabs' indicators on and off. Lit steady for reduced motion. */
  private blinkTaxis(seconds: number, still: boolean): void {
    const on = still || (seconds * BLINK_RATE + BLINK_PHASE) % 1 < 0.55;
    for (const material of this.blinkers) material.opacity = on ? 1 : 0.08;
  }

  /**
   * Twinkles the trees' fairy lights: each glow swells and fades at its own pace and moment.
   * Steady for reduced motion.
   */
  private twinkle(seconds: number, still: boolean): void {
    const colour = new Color();
    for (const { mesh, phases } of this.treeGlows) {
      phases.forEach((phase, k) => {
        const wave = Math.sin(seconds * TWINKLE_RATE * (0.6 + phase) + phase * Math.PI * 2);
        const bright = still ? 0.8 : 0.25 + 0.75 * (0.5 + 0.5 * wave) ** 2;
        mesh.setColorAt(k, colour.set(TWINKLE_COLOUR).multiplyScalar(bright));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Stutters the failing blade signs: once a round each drops dark and catches again a few
   * times, then holds lit. Steady for reduced motion.
   */
  private flicker(seconds: number, still: boolean): void {
    for (const [word, start] of FLICKERING) {
      const material = this.blades[SIGN_WORDS.indexOf(word)];
      if (!material) continue;
      const t = (((seconds - start) % FLICKER_EVERY) + FLICKER_EVERY) % FLICKER_EVERY;
      const off = !still && t < FLICKER_FOR && Math.sin(t * 41 + t * t * 23) < 0.25;
      material.emissiveIntensity = off ? BLADE_DIM : BLADE_GLOW;
    }
  }

  /**
   * Chases light along the harbour bridge: a wave of brightness runs across its bulbs from
   * one shore to the other, each bulb keeping its own colour. All lit for reduced motion.
   */
  private chase(seconds: number, still: boolean): void {
    if (!this.bridgeBulbs) return;
    const { mesh, xs } = this.bridgeBulbs;
    const colour = new Color();
    xs.forEach((x, k) => {
      const wave = 0.5 + 0.5 * Math.sin(x / BULB_WAVE - seconds * BULB_CHASE);
      const bright = still ? 1 : 0.45 + 0.75 * wave * wave;
      colour.set(BULB_COLOURS[Math.floor(k / 2) % BULB_COLOURS.length]!).multiplyScalar(bright);
      mesh.setColorAt(k, colour);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  /** The tallest tower on the skyline: stepped, with a magenta crown and a lit spire. */
  private addLandmark(facade: MeshStandardMaterial, top: MeshStandardMaterial): void {
    const glow = (hex: string, strength: number) =>
      new MeshStandardMaterial({
        color: 0x000000,
        emissive: new Color(hex),
        emissiveIntensity: strength,
        fog: false,
      });
    const crown = glow('#ff4fb8', 2.2);
    const spire = glow('#ffe7f6', 2.6);
    const beacon = glow('#ff2a2a', 3);
    this.disposables.push(crown, spire, beacon);
    const landmark = new Group();
    let y = 0;
    for (const [width, height] of [
      [46, 190],
      [36, 70],
      [26, 46],
    ] as const) {
      const geometry = towerGeometry(width, height, width);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.y = y + height / 2;
      landmark.add(mesh);
      y += height;
    }
    const band = new BoxGeometry(27, 6, 27);
    const needle = new BoxGeometry(1.4, 60, 1.4);
    const lamp = new BoxGeometry(3, 3, 3);
    this.disposables.push(band, needle, lamp);
    const ring = new Mesh(band, crown);
    ring.position.y = y - 10;
    const mast = new Mesh(needle, spire);
    mast.position.y = y + 30;
    const light = new Mesh(lamp, beacon);
    light.position.y = y + 61;
    landmark.add(ring, mast, light);
    landmark.position.set(-24, 0, -60);
    this.skyline.add(landmark);
  }

  private roadHalf = 3.5;

  /**
   * The quay along both sides: a granite kerb, wet concrete slabs back to the towers, and a
   * neon line along the road's edge in the magenta of the mock.
   */
  private addQuay(roadHalf: number, points: number): void {
    const slabs = this.track(slabTexture());
    slabs.repeat.set(1 / (2 * SLAB), 1 / (2 * SLAB));
    const pavement = new MeshStandardMaterial({
      map: slabs,
      color: 0x8a8fa6,
      roughness: 0.42,
      metalness: 0.1,
      // The wet slabs catch a soft sheen of the sky's glow.
      envMap: this.skyEnv(),
      envMapIntensity: 0.6,
      side: DoubleSide,
    });
    const kerb = new MeshStandardMaterial({ color: 0x6d7182, roughness: 0.6, side: DoubleSide });
    const neon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff5fc4'),
      emissiveIntensity: 2.6,
      side: DoubleSide,
    });
    // Still water mirrors the sky's violet glow, strongest at the grazing angle it is seen at.
    const water = new MeshStandardMaterial({
      color: 0x04060d,
      roughness: 0.06,
      metalness: 0,
      envMap: this.skyEnv(),
      envMapIntensity: 1.6,
      side: DoubleSide,
    });
    const steel = new MeshStandardMaterial({
      color: 0x1c2030,
      metalness: 0.7,
      roughness: 0.35,
      side: DoubleSide,
    });
    const rail = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#3fe0ff'),
      emissiveIntensity: 2.4,
      side: DoubleSide,
    });
    // The harbour railing: dark glass panels under a warm lit handrail.
    const glass = new MeshStandardMaterial({
      color: 0x0c1220,
      metalness: 0.6,
      roughness: 0.15,
      transparent: true,
      opacity: 0.55,
      side: DoubleSide,
    });
    const handrail = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ffd49a'),
      emissiveIntensity: 2.6,
      side: DoubleSide,
    });
    this.disposables.push(pavement, kerb, neon, water, steel, rail, glass, handrail);
    // The volt dashed centre line of the mock, glowing on the dark wet road.
    const dashes = this.track(dashTexture());
    dashes.repeat.set(1, 1 / DASH_EVERY);
    const centre = new MeshBasicMaterial({
      color: new Color('#d8ff3e').multiplyScalar(1.4),
      map: dashes,
      alphaTest: 0.5,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.disposables.push(centre);
    this.ribbon(points, centre, [
      [-0.08, 0.014],
      [0.08, 0.014],
    ]);
    // Cat's eyes along both edges of the road: small lit studs that pick out the road's line
    // into the rain and haze, like a runway's.
    const studs = this.track(studTexture());
    studs.repeat.set(1, 1 / STUD_EVERY);
    const eyes = new MeshBasicMaterial({
      color: new Color('#7ff4ff').multiplyScalar(2.4),
      map: studs,
      alphaTest: 0.5,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      toneMapped: false,
    });
    this.disposables.push(eyes);
    for (const side of [-1, 1]) {
      const x = side * (roadHalf - STUD_IN);
      this.ribbon(points, eyes, [
        [x - STUD_WIDE / 2, 0.016],
        [x + STUD_WIDE / 2, 0.016],
      ]);
    }
    // The open dock under a bridge, both sides; under the quay it lies hidden below the ground.
    this.ribbon(
      points,
      water,
      [
        [-FAR_SHORE - 200, -0.6],
        [FAR_SHORE + 200, -0.6],
      ],
      [
        [-FAR_SHORE - 200, 0],
        [FAR_SHORE + 200, 0],
      ],
      true,
    );
    this.addPylon(roadHalf);
    this.addDock();
    this.addSky();
    this.addClouds();
    this.addMoon();
    this.addCyclistSign();
    this.addFireworks();
    this.addLightning();
    this.addBoats(roadHalf + SETBACK + 2);
    this.addFerry();
    this.addSkytrain(roadHalf);
    this.addDeckLamps(roadHalf);
    this.addVents(roadHalf);
    this.addLanterns(roadHalf);
    this.addStalls();
    this.addCrossings(roadHalf);
    this.addBollards(roadHalf);
    this.addTrees(roadHalf);
    this.addShelters(roadHalf);
    this.addBikeRacks(roadHalf);
    this.addMopeds(roadHalf);
    this.addTaxiRanks(roadHalf);
    this.addPuddles(roadHalf);
    this.addSkybridges(roadHalf);
    this.addDrones(roadHalf);
    this.addLaneSymbols(roadHalf);
    this.addGates(roadHalf);
    this.addMachines(roadHalf);
    this.addWalkers(roadHalf);
    this.addKoi();
    this.addAirTraffic();
    this.addRain();
    this.addSplashes(roadHalf);
    this.addDrips();
    const back = roadHalf + SETBACK + 2;
    const edge = roadHalf + KERB_WIDTH;
    for (const side of [-1, 1]) {
      // Each cross-section runs from left to right, so every strip faces up.
      const across = (profile: [number, number][]) =>
        side < 0 ? profile.map(([x, y]) => [-x, y] as [number, number]).reverse() : profile;
      this.ribbon(
        points,
        kerb,
        across([
          [roadHalf, -0.05],
          [roadHalf, KERB],
          [edge, KERB],
        ]),
      );
      // On a bridge the pavement gives way to the parapet, and the dock is open beyond it.
      this.ribbon(
        points,
        pavement,
        across([
          [edge, KERB],
          [back, KERB],
        ]),
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
      );
      this.ribbon(
        points,
        steel,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge, KERB],
          [edge, KERB + PARAPET],
        ]),
      );
      // The deck's steel girder, seen below the parapet over open water.
      this.ribbon(
        points,
        steel,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge + 0.05, -GIRDER],
          [edge + 0.05, KERB],
        ]),
      );
      this.ribbon(
        points,
        rail,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge - 0.08, KERB + PARAPET],
          [edge + 0.08, KERB + PARAPET],
        ]),
      );
      this.ribbon(
        points,
        neon,
        across([
          [roadHalf - 0.42, 0.012],
          [roadHalf - 0.22, 0.012],
        ]),
      );
      if (side < 0) {
        // The harbour water beyond the quay, and the quay's stone face down to it.
        this.ribbon(
          points,
          water,
          [
            [-FAR_SHORE - 200, -0.03],
            [-back, -0.03],
          ],
          undefined,
          true,
        );
        this.ribbon(
          points,
          kerb,
          [
            [-back, -0.03],
            [-back, KERB],
          ],
          [
            [-back, 0],
            [-back, 0],
          ],
          true,
        );
        // A railing along the quay's edge where it meets the harbour, folded away on a bridge.
        const fold = (n: number) =>
          Array.from({ length: n }, () => [-edge, KERB] as [number, number]);
        this.ribbon(
          points,
          glass,
          [
            [-back + 0.4, KERB + RAILING],
            [-back + 0.4, KERB],
          ],
          fold(2),
        );
        this.ribbon(
          points,
          handrail,
          // Its face turned to the road, so it reads as a solid line at a glance.
          [
            [-back + 0.4, KERB + RAILING - 0.14],
            [-back + 0.3, KERB + RAILING],
            [-back + 0.5, KERB + RAILING],
          ],
          fold(3),
        );
        this.ribbon(
          points,
          handrail,
          [
            [-back + 0.4, KERB + 0.18],
            [-back + 0.4, KERB + 0.04],
          ],
          fold(2),
        );
      }
    }
  }

  /**
   * A light's reflection on the wet ground (technique 14): a soft streak of its colour lying
   * on the surface, brightest under the light and drawn out towards the rider, as lights smear
   * on wet asphalt at night. Its far end is at (x, y, z) in `parent`'s frame.
   */
  private streak(
    parent: Group | Mesh,
    hex: string,
    x: number,
    y: number,
    z: number,
    length: number,
    width: number,
    strength: number,
  ): void {
    if (!this.streakTexture) {
      this.streakTexture = this.track(streakTexture());
      this.disposables.push(this.streakPlane);
    }
    const key = `${hex}/${strength}`;
    let material = this.streakMaterials.get(key);
    if (!material) {
      material = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(strength),
        map: this.streakTexture,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      this.streakMaterials.set(key, material);
      this.disposables.push(material);
    }
    const mesh = new Mesh(this.streakPlane, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(width, length, 1);
    mesh.position.set(x, y + 0.015, z + length / 2);
    mesh.renderOrder = 1;
    parent.add(mesh);
  }

  /** An additive halo of `hex` light at `strength`, for a light seen through the rain. */
  private halo(hex: string, strength: number): SpriteMaterial {
    this.glow ??= this.track(glowTexture());
    const material = new SpriteMaterial({
      map: this.glow,
      color: new Color(hex).multiplyScalar(strength),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.disposables.push(material);
    return material;
  }

  /** Slim dark poles with a glowing globe on top, as in the mock. */
  private addLamps(): void {
    const metal = new MeshStandardMaterial({ color: 0x15171d, metalness: 0.6, roughness: 0.4 });
    const globe = new MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: new Color(0xffe2b0),
      emissiveIntensity: 3,
    });
    const pole = new CylinderGeometry(0.06, 0.09, LAMP_HEIGHT - KERB, 8);
    const foot = new CylinderGeometry(0.16, 0.2, 0.5, 10);
    const head = new SphereGeometry(0.26, 16, 12);
    const collar = new CylinderGeometry(0.12, 0.08, 0.16, 10);
    // A soft halo round each globe, as its light blooms in the wet air.
    const halo = this.halo('#ffd9a0', 1.3);
    this.disposables.push(metal, globe, pole, foot, head, collar);
    // A cone of light falling from each globe through the rain, brightest under the globe and
    // fading out before the paving.
    const fall = new MeshBasicMaterial({
      color: new Color('#ffd9a0').multiplyScalar(LAMP_CONE_STRENGTH),
      map: this.track(lighthouseBeamTexture()),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    const cone = new ConeGeometry(LAMP_CONE_WIDE, LAMP_HEIGHT - 0.3, 24, 1, true);
    // Its tip at the globe, its open end on the paving.
    cone.translate(0, -(LAMP_HEIGHT - 0.3) / 2, 0);
    this.disposables.push(fall, cone);
    // Festival banners hang from a bracket on each pole, out over the pavement's edge.
    const banners = BANNERS.map(([words, hex]) => {
      const texture = this.track(bannerTexture(words, hex));
      return new MeshBasicMaterial({ map: texture, side: DoubleSide, toneMapped: false });
    });
    const trims = BANNERS.map(
      ([, hex]) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.8), toneMapped: false }),
    );
    const cloth = new PlaneGeometry(BANNER_WIDE, BANNER_TALL);
    const bar = new BoxGeometry(1, 0.05, 0.05);
    this.disposables.push(...banners, ...trims, cloth, bar);
    // A hanging basket on a bracket on the pole's other side: a bowl brimming with leaves,
    // bright flowers on top and trailing strands spilling over its rim.
    const bowl = new SphereGeometry(0.3, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const mound = new IcosahedronGeometry(0.3, 1);
    const bead = new SphereGeometry(0.06, 6, 4);
    const strand = new CylinderGeometry(0.018, 0.012, 1, 4);
    const wicker = new MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9 });
    const foliage = new MeshStandardMaterial({
      color: 0x2a5a3c,
      roughness: 0.8,
      flatShading: true,
      emissive: new Color(0x0e2a1c),
    });
    const petals = BASKET_FLOWERS.map(
      (hex) =>
        new MeshStandardMaterial({ color: hex, emissive: new Color(hex), emissiveIntensity: 1.1 }),
    );
    this.disposables.push(bowl, mound, bead, strand, wicker, foliage, ...petals);
    // The baskets draw from their own sequence, so the lamps are unchanged.
    const basketRandom = seeded(641);
    for (let i = 0; i < LAMPS; i++) {
      const lamp = new Group();
      const shaft = new Mesh(pole, metal);
      shaft.position.y = KERB + (LAMP_HEIGHT - KERB) / 2 - 0.3;
      shaft.castShadow = true;
      const base = new Mesh(foot, metal);
      base.position.y = KERB + 0.25;
      const cup = new Mesh(collar, metal);
      cup.position.y = LAMP_HEIGHT - 0.28;
      const light = new Mesh(head, globe);
      light.position.y = LAMP_HEIGHT;
      const bloom = new Sprite(halo);
      bloom.position.y = LAMP_HEIGHT;
      bloom.scale.setScalar(LAMP_HALO);
      const pool = new Mesh(cone, fall);
      pool.position.y = LAMP_HEIGHT - 0.1;
      lamp.add(shaft, base, cup, light, bloom, pool);
      lamp.userData['bloom'] = bloom;
      // Lamps stand on the left at even places: their light reflects on the road inside them.
      const inward = i % 2 === 0 ? 1 : -1;
      const pick = i % BANNERS.length;
      const top = LAMP_HEIGHT - 1.2;
      const centre = inward * (0.12 + BANNER_WIDE / 2);
      for (const y of [top, top - BANNER_TALL]) {
        const rod = new Mesh(bar, metal);
        rod.scale.x = BANNER_WIDE + 0.15;
        rod.position.set(centre, y, 0);
        lamp.add(rod);
      }
      const banner = new Mesh(cloth, banners[pick]!);
      banner.position.set(centre, top - BANNER_TALL / 2, 0);
      lamp.add(banner);
      // A lit trim down the banner's outer edge.
      const trim = new Mesh(bar, trims[pick]!);
      trim.scale.set(0.05, BANNER_TALL / 0.05, 1);
      trim.position.set(centre + inward * (BANNER_WIDE / 2), top - BANNER_TALL / 2, 0);
      lamp.add(trim);
      const bx = -inward * BASKET_OUT;
      const by = LAMP_HEIGHT - BASKET_DROP;
      const arm = new Mesh(bar, metal);
      arm.scale.x = BASKET_OUT + 0.1;
      arm.position.set(bx / 2, by + 0.75, 0);
      const chain = new Mesh(strand, metal);
      chain.scale.y = 0.6;
      chain.position.set(bx, by + 0.45, 0);
      const basket = new Mesh(bowl, wicker);
      basket.position.set(bx, by, 0);
      const leaves = new Mesh(mound, foliage);
      leaves.scale.y = 0.6;
      leaves.position.set(bx, by + 0.02, 0);
      lamp.add(arm, chain, basket, leaves);
      for (let k = 0; k < BASKET_BLOOMS; k++) {
        const a = basketRandom() * Math.PI * 2;
        const r = basketRandom() * 0.26;
        const flower = new Mesh(bead, petals[k % petals.length]!);
        flower.position.set(
          bx + Math.cos(a) * r,
          by + 0.12 + basketRandom() * 0.08,
          Math.sin(a) * r,
        );
        lamp.add(flower);
      }
      for (let k = 0; k < BASKET_TRAILS; k++) {
        const a = (k / BASKET_TRAILS) * Math.PI * 2 + basketRandom();
        const from = new Vector3(bx + Math.cos(a) * 0.27, by, Math.sin(a) * 0.27);
        const to = new Vector3(
          bx + Math.cos(a) * 0.36,
          by - 0.45 - basketRandom() * 0.3,
          Math.sin(a) * 0.36,
        );
        lamp.add(span(strand, foliage, from, to));
        const tip = new Mesh(bead, petals[(k + 1) % petals.length]!);
        tip.position.copy(to);
        lamp.add(tip);
      }
      this.streak(lamp, '#ffd9a0', inward * 1.6, 0, -0.5, 14, 2.2, 2.6);
      this.streak(lamp, '#ffd9a0', 0, KERB, -0.5, 6, 1.4, 1);
      this.lamps.push(lamp);
      this.group.add(lamp);
    }
  }

  /**
   * Steam rising from grates at the road's edge: soft puffs that drift up, swell and thin out,
   * catching the street's light. Each vent stands `offset` metres along the loop.
   */
  /**
   * Strings of festoon lanterns slung across the street from the lamp line to the façades, sagging over the
   * riders: a dark wire with a row of glowing bulbs in pink, cyan, amber and violet.
   */
  private addLanterns(roadHalf: number): void {
    // From the lamp line on the quay side to the façades across the street.
    const left = -LAMP_OUT;
    const right = roadHalf + SETBACK;
    const mid = (left + right) / 2;
    const half = (right - left) / 2;
    const bulbs = LANTERN_COLOURS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.6), toneMapped: false }),
    );
    const bulb = new SphereGeometry(0.16, 10, 8);
    const wire = new LineBasicMaterial({ color: 0x0a0a12 });
    const halos = LANTERN_COLOURS.map((hex) => this.halo(hex, 0.6));
    this.disposables.push(...bulbs, bulb, wire);
    const sagAt = (x: number) => LANTERN_SAG * (1 - ((x - mid) / half) ** 2);
    LANTERNS.forEach((offset, n) => {
      const group = new Group();
      const blooms: Sprite[] = [];
      const vertices: number[] = [];
      const steps = 24;
      for (let k = 0; k < steps; k++) {
        const a = left + (2 * half * k) / steps;
        const b = left + (2 * half * (k + 1)) / steps;
        vertices.push(a, -sagAt(a), 0, b, -sagAt(b), 0);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
      this.disposables.push(geometry);
      group.add(new LineSegments(geometry, wire));
      let i = n;
      for (let x = left + LANTERN_EVERY; x < right; x += LANTERN_EVERY) {
        const colour = i++ % bulbs.length;
        const mesh = new Mesh(bulb, bulbs[colour]!);
        mesh.position.set(x, -sagAt(x) - 0.22, 0);
        const bloom = new Sprite(halos[colour]!);
        bloom.position.copy(mesh.position);
        bloom.scale.setScalar(LANTERN_HALO);
        group.add(mesh, bloom);
        blooms.push(bloom);
      }
      group.position.y = LANTERN_HEIGHT;
      this.group.add(group);
      this.lanterns.push({ group, offset, blooms });
    });
  }

  /**
   * Night-market stalls on the quay promenade, facing the road: a dark booth with a warm lit
   * serving hatch, a striped awning over it and a neon strip along its roof, throwing its
   * light on the wet paving.
   */
  /**
   * Zebra crossings over the road: broad white bars, wet and catching the light, with a striped
   * post at each kerb carrying an amber globe that blinks, throwing its glow on the road.
   */
  private addCrossings(roadHalf: number): void {
    const paint = new MeshStandardMaterial({
      color: 0xe8ecf4,
      roughness: 0.35,
      emissive: new Color(0xb8c4e0),
      emissiveIntensity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const pole = new MeshStandardMaterial({ color: 0x20202a, roughness: 0.5 });
    const band = new MeshBasicMaterial({ color: new Color('#f2f2f2'), toneMapped: false });
    const globe = new MeshBasicMaterial({
      color: new Color('#ffa81f').multiplyScalar(1.8),
      toneMapped: false,
    });
    this.beaconMaterial = globe;
    const bar = new PlaneGeometry(CROSSING_BAR, CROSSING_DEPTH);
    const post = new BoxGeometry(0.16, BEACON_HEIGHT, 0.16);
    const stripe = new BoxGeometry(0.18, 0.3, 0.18);
    const ball = new SphereGeometry(0.32, 14, 10);
    this.disposables.push(paint, pole, band, globe, bar, post, stripe, ball);
    // Traffic signals on a mast arm reaching out over the road at the near side of each crossing:
    // dark heads with red, amber and green lamps, the green lit for the riders.
    const mast = new CylinderGeometry(0.12, 0.15, SIGNAL_HEIGHT, 10);
    const arm = new CylinderGeometry(0.07, 0.07, 1, 8);
    const housing = new BoxGeometry(0.42, 1.15, 0.3);
    const visor = new BoxGeometry(0.34, 0.04, 0.22);
    const lamp = new CircleGeometry(0.12, 16);
    const unlit = SIGNAL_LAMPS.map(
      (hex) => new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(0.18) }),
    );
    const go = new MeshBasicMaterial({
      color: new Color(SIGNAL_LAMPS[2]).multiplyScalar(2),
      toneMapped: false,
    });
    const goHalo = this.halo(SIGNAL_LAMPS[2], 0.9);
    this.disposables.push(mast, arm, housing, visor, lamp, ...unlit, go);
    const across = roadHalf * 2;
    const count = Math.floor(across / (CROSSING_BAR * 2));
    const start = -((count - 1) * CROSSING_BAR * 2) / 2;
    for (const offset of CROSSINGS) {
      const group = new Group();
      for (let i = 0; i < count; i++) {
        const mesh = new Mesh(bar, paint);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(start + i * CROSSING_BAR * 2, 0.015, 0);
        group.add(mesh);
      }
      const blooms: Sprite[] = [];
      for (const side of [-1, 1]) {
        const x = side * (roadHalf + KERB_WIDTH + 0.5);
        const z = (side * CROSSING_DEPTH) / 2 + side * 0.4;
        const stand = new Mesh(post, pole);
        stand.position.set(x, KERB + BEACON_HEIGHT / 2, z);
        group.add(stand);
        for (let k = 0; k < 4; k++) {
          const ring = new Mesh(stripe, band);
          ring.position.set(x, KERB + BEACON_HEIGHT - 0.9 - k * 0.6, z);
          group.add(ring);
        }
        const light = new Mesh(ball, globe);
        light.position.set(x, KERB + BEACON_HEIGHT + 0.3, z);
        const bloom = new Sprite(this.halo('#ffa81f', 0.9));
        bloom.scale.setScalar(2.2);
        bloom.position.copy(light.position);
        group.add(light, bloom);
        blooms.push(bloom);
        this.streak(group, '#ffa81f', x - side * 1.5, 0, z, 6, 1.2, 0.9);
      }
      const mx = roadHalf + KERB_WIDTH + 1;
      const mz = CROSSING_DEPTH / 2 + 1.2;
      const standard = new Mesh(mast, pole);
      standard.position.set(mx, KERB + SIGNAL_HEIGHT / 2, mz);
      const reach = new Vector3(-roadHalf * SIGNAL_REACH, KERB + SIGNAL_HEIGHT - 0.25, mz);
      group.add(standard, span(arm, pole, new Vector3(mx, reach.y, mz), reach));
      for (const at of SIGNAL_HEADS) {
        const x = mx + (reach.x - mx) * at;
        const y = reach.y - 0.75;
        const head = new Mesh(housing, pole);
        head.position.set(x, y, mz);
        group.add(head, span(arm, pole, new Vector3(x, reach.y, mz), new Vector3(x, y + 0.5, mz)));
        for (let k = 0; k < 3; k++) {
          const ly = y + 0.36 - k * 0.36;
          const disc = new Mesh(lamp, k === 2 ? go : unlit[k]!);
          disc.position.set(x, ly, mz + 0.152);
          const hood = new Mesh(visor, pole);
          hood.position.set(x, ly + 0.15, mz + 0.26);
          group.add(disc, hood);
        }
        const bloom = new Sprite(goHalo);
        bloom.scale.setScalar(1.1);
        bloom.position.set(x, y - 0.36, mz + 0.2);
        group.add(bloom);
      }
      this.group.add(group);
      this.crossings.push({ group, offset, blooms });
    }
  }

  /**
   * Low steel bollards along both kerbs, each crowned with a cyan light ring,
   * drawing the road's edges on into the distance.
   */
  private addBollards(roadHalf: number): void {
    const steel = new MeshStandardMaterial({ color: 0x1b1d26, metalness: 0.6, roughness: 0.35 });
    const post = new CylinderGeometry(0.11, 0.13, BOLLARD_HEIGHT, 10);
    const band = new CylinderGeometry(0.125, 0.125, 0.09, 10);
    const flare = new PlaneGeometry(BOLLARD_FLARE, BOLLARD_FLARE);
    // A domed steel cap, a flange where it is bolted to the pavement, and a reflector band.
    const dome = new SphereGeometry(0.12, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const flange = new CylinderGeometry(0.19, 0.2, 0.05, 12);
    const stripe = new CylinderGeometry(0.133, 0.133, 0.06, 12);
    const reflector = new MeshBasicMaterial({ color: new Color('#e8ecf4').multiplyScalar(0.8) });
    this.glow ??= this.track(glowTexture());
    this.disposables.push(steel, post, band, flare, dome, flange, stripe, reflector);
    const x = roadHalf + KERB_WIDTH + 0.35;
    for (let offset = 0; offset < LOOP; offset += BOLLARD_EVERY) {
      // Clear of the crossings, whose beacons stand at the kerbs.
      if (CROSSINGS.some((c) => Math.abs(c - offset) < 4)) continue;
      const group = new Group();
      // Each pair its own ring and flare, so the pulse can light them pair by pair.
      const ring = new MeshBasicMaterial({ color: new Color(BOLLARD_RING), toneMapped: false });
      const glow = new MeshBasicMaterial({
        color: new Color(BOLLARD_RING),
        map: this.glow,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      this.disposables.push(ring, glow);
      for (const side of [-1, 1]) {
        const stand = new Mesh(post, steel);
        stand.position.set(side * x, KERB + BOLLARD_HEIGHT / 2, 0);
        const light = new Mesh(band, ring);
        light.position.set(side * x, KERB + BOLLARD_HEIGHT - 0.12, 0);
        const cap = new Mesh(dome, steel);
        cap.position.set(side * x, KERB + BOLLARD_HEIGHT, 0);
        const foot = new Mesh(flange, steel);
        foot.position.set(side * x, KERB + 0.025, 0);
        const reflect = new Mesh(stripe, reflector);
        reflect.position.set(side * x, KERB + 0.28, 0);
        group.add(cap, foot, reflect);
        const halo = new Mesh(flare, glow);
        halo.position.set(side * x, KERB + BOLLARD_HEIGHT - 0.12, 0.2);
        group.add(stand, light, halo);
      }
      this.group.add(group);
      this.bollards.push({ group, offset, ring, glow, metres: 0 });
    }
  }

  /**
   * A bicycle and an arrow painted in each lane, in a pale cyan that glows faintly on the wet
   * road, the arrow pointing the way the lane runs.
   */
  private addLaneSymbols(roadHalf: number): void {
    const texture = this.track(laneSymbolTexture());
    const material = new MeshBasicMaterial({
      map: texture,
      color: new Color('#bff6ff').multiplyScalar(1.3),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const plane = new PlaneGeometry(LANE_SYMBOL_WIDE, LANE_SYMBOL_LONG);
    this.disposables.push(material, plane);
    for (const offset of LANE_SYMBOLS) {
      const group = new Group();
      for (const side of [-1, 1]) {
        const mesh = new Mesh(plane, material);
        mesh.rotation.x = -Math.PI / 2;
        // The far lane's symbol faces its own riders, coming the other way.
        if (side < 0) mesh.rotation.z = Math.PI;
        mesh.position.set((side * roadHalf) / 2, 0.016, 0);
        group.add(mesh);
      }
      this.group.add(group);
      this.laneSymbols.push({ group, offset });
    }
  }

  /**
   * Street trees along the pavement under the towers: a dark planter with a lit cyan rim, a slim
   * trunk and a rounded crown of dark leaves, warm fairy lights wound through it.
   */
  private addTrees(roadHalf: number): void {
    const planter = new MeshStandardMaterial({ color: 0x17161f, roughness: 0.6 });
    const rim = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.4),
      toneMapped: false,
    });
    const bark = new MeshStandardMaterial({ color: 0x2a2026, roughness: 0.9 });
    // A few shades of leaf, so the clumps of a crown read apart from one another.
    const shades = LEAF_SHADES.map(
      ([hex, glow]) =>
        new MeshStandardMaterial({
          color: hex,
          roughness: 0.8,
          flatShading: true,
          emissive: new Color(glow),
        }),
    );
    const leaves = shades[0]!;
    const bulb = new MeshBasicMaterial({
      color: new Color('#ffd27a').multiplyScalar(2),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const trunk = new CylinderGeometry(0.12, 0.18, 1, 7);
    const crown = new IcosahedronGeometry(1, 1);
    const clump = new IcosahedronGeometry(1, 0);
    const light = new SphereGeometry(0.07, 6, 4);
    this.disposables.push(planter, rim, bark, ...shades, bulb, unit, trunk, crown, clump, light);
    // The smaller clumps draw from their own sequence, so the trees' layout is unchanged.
    const clumpRandom = seeded(503);
    // Low shrubs and flowers planted round each trunk, from their own sequence too.
    const bedRandom = seeded(521);
    const blooms = PLANTER_FLOWERS.map(
      (hex) =>
        new MeshStandardMaterial({ color: hex, emissive: new Color(hex), emissiveIntensity: 1.3 }),
    );
    const flower = new SphereGeometry(0.085, 6, 4);
    this.disposables.push(...blooms, flower);
    // A soft glow round each fairy light, coloured per light so it can twinkle.
    this.glow ??= this.track(glowTexture());
    const halo = new MeshBasicMaterial({
      color: new Color(0xffffff).multiplyScalar(2.4),
      map: this.glow,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const haloPlane = new PlaneGeometry(TWINKLE_HALO, TWINKLE_HALO);
    this.disposables.push(halo, haloPlane);
    // A neon uplight in each planter, its beam opening up into the crown.
    const beamFade = this.track(lighthouseBeamTexture());
    const uplights = TREE_UPLIGHTS.map((hex) => {
      const material = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(TREE_UPLIGHT_STRENGTH),
        map: beamFade,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      });
      this.disposables.push(material);
      return material;
    });
    const upBeam = new ConeGeometry(TREE_UPLIGHT_WIDE, TREE_HEIGHT, 20, 1, true);
    // Its tip in the planter and its open end up in the crown: flipped, so the fade still runs
    // from bright at the lamp to nothing at the far end.
    upBeam.rotateX(Math.PI);
    upBeam.translate(0, TREE_HEIGHT / 2, 0);
    this.disposables.push(upBeam);
    let uplit = 0;
    // The twinkle's phases draw from their own sequence, so the trees' layout is unchanged.
    const twinkleRandom = seeded(461);
    const random = seeded(347);
    const x = roadHalf + TREE_OUT;
    for (let offset = 14; offset < LOOP; offset += TREE_EVERY) {
      // Clear of the crossings and the vending machines.
      if (CROSSINGS.some((c) => Math.abs(c - offset) < 6)) continue;
      if (MACHINES.some((m) => Math.abs(m - offset) < 5)) continue;
      const group = new Group();
      const box = new Mesh(unit, planter);
      box.scale.set(1.6, 0.6, 1.6);
      box.position.set(x, KERB + 0.3, 0);
      const band = new Mesh(unit, rim);
      band.scale.set(1.66, 0.06, 1.66);
      band.position.set(x, KERB + 0.6, 0);
      const stem = new Mesh(trunk, bark);
      stem.scale.y = TREE_HEIGHT - 1.6;
      stem.position.set(x, KERB + 0.6 + (TREE_HEIGHT - 1.6) / 2, 0);
      group.add(box, band, stem);
      for (let k = 0; k < PLANTER_SHRUBS; k++) {
        const a = (k / PLANTER_SHRUBS) * Math.PI * 2 + bedRandom() * 0.6;
        const shrub = new Mesh(clump, shades[k % 2 === 0 ? 1 : 0]!);
        shrub.scale.set(0.32 + bedRandom() * 0.12, 0.22 + bedRandom() * 0.1, 0.32);
        shrub.rotation.y = bedRandom() * 3;
        shrub.position.set(x + Math.cos(a) * 0.48, KERB + 0.68, Math.sin(a) * 0.48);
        group.add(shrub);
      }
      for (let k = 0; k < PLANTER_BLOOMS; k++) {
        const a = bedRandom() * Math.PI * 2;
        const r = 0.3 + bedRandom() * 0.42;
        const bloom = new Mesh(flower, blooms[k % blooms.length]!);
        bloom.position.set(x + Math.cos(a) * r, KERB + 0.9 + bedRandom() * 0.12, Math.sin(a) * r);
        group.add(bloom);
      }
      const up = new Mesh(upBeam, uplights[uplit++ % uplights.length]!);
      up.position.set(x, KERB + 0.6, 0);
      group.add(up);
      // Three overlapping lumps make a rounded, uneven crown.
      for (let k = 0; k < 3; k++) {
        const lump = new Mesh(crown, leaves);
        const size = 1.1 + random() * 0.5;
        lump.scale.setScalar(size);
        lump.rotation.set(random() * 3, random() * 3, 0);
        lump.position.set(
          x + (random() - 0.5) * 1.2,
          KERB + TREE_HEIGHT - 0.3 + random() * 0.8,
          (random() - 0.5) * 1.2,
        );
        group.add(lump);
      }
      // Smaller clumps round its edge break the outline into leafy tufts.
      for (let k = 0; k < TREE_CLUMPS; k++) {
        const a = (k / TREE_CLUMPS) * Math.PI * 2 + clumpRandom();
        const tuft = new Mesh(clump, shades[1 + (k % (shades.length - 1))]!);
        tuft.scale.setScalar(0.6 + clumpRandom() * 0.35);
        tuft.rotation.set(clumpRandom() * 3, clumpRandom() * 3, 0);
        tuft.position.set(
          x + Math.cos(a) * TREE_CLUMP_OUT,
          KERB + TREE_HEIGHT - 0.2 + (clumpRandom() - 0.3) * 1.1,
          Math.sin(a) * TREE_CLUMP_OUT,
        );
        group.add(tuft);
      }
      // Fairy lights on the crown's surface, mostly on the side towards the road.
      const glows = new InstancedMesh(haloPlane, halo, 16);
      const dummy = new Object3D();
      const phases: number[] = [];
      for (let k = 0; k < 16; k++) {
        const a = random() * Math.PI * 2;
        const y = (random() - 0.4) * 1.6;
        const r = Math.sqrt(Math.max(0, 1.6 * 1.6 - y * y)) * 0.98;
        const dot = new Mesh(light, bulb);
        dot.position.set(x - Math.abs(Math.cos(a)) * r, KERB + TREE_HEIGHT + y, Math.sin(a) * r);
        group.add(dot);
        // Light and glow out from the crown along the light's direction, clear of the leaves.
        dummy.position
          .set(dot.position.x - x, dot.position.y - KERB - TREE_HEIGHT, dot.position.z)
          .multiplyScalar(1 + TWINKLE_OUT / 1.6)
          .add(new Vector3(x, KERB + TREE_HEIGHT, 0));
        dot.position.copy(dummy.position);
        dummy.updateMatrix();
        glows.setMatrixAt(k, dummy.matrix);
        glows.setColorAt(k, new Color(TWINKLE_COLOUR));
        phases.push(twinkleRandom());
      }
      // Its bounds are the plane's at the origin, not its lights'; never cull it on those.
      glows.frustumCulled = false;
      group.add(glows);
      this.treeGlows.push({ mesh: glows, phases });
      this.group.add(group);
      this.trees.push({ group, offset });
    }
  }

  /**
   * Bus shelters on the pavement, open to the road: a dark frame, a tinted glass back, a roof
   * with a lit edge, a bench, and at the near end a backlit advert that lights the wet paving.
   */
  private addShelters(roadHalf: number): void {
    const frame = new MeshStandardMaterial({ color: 0x14151c, metalness: 0.5, roughness: 0.4 });
    const glass = new MeshStandardMaterial({
      color: 0x6fa8c8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      depthWrite: false,
    });
    const edge = new MeshBasicMaterial({
      color: new Color('#ff4fd8').multiplyScalar(1.5),
      toneMapped: false,
    });
    const adverts = SHELTER_ADVERTS.map(([title, hex, picture]) => {
      const texture = this.track(advertTexture(title, hex, picture));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(frame, glass, edge, unit, ...adverts);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    const x = roadHalf + SHELTER_OUT;
    const long = SHELTER_LONG;
    SHELTERS.forEach((offset, i) => {
      const group = new Group();
      const back = x + 0.8;
      // Four posts, the roof over them and its lit edge towards the road.
      for (const px of [x - 0.7, back]) {
        for (const pz of [-long / 2, long / 2]) {
          group.add(box(frame, 0.1, 2.5, 0.1, px, KERB + 1.25, pz));
        }
      }
      group.add(box(frame, 1.9, 0.12, long + 0.3, x + 0.05, KERB + 2.56, 0));
      group.add(box(edge, 0.06, 0.08, long + 0.3, x - 0.92, KERB + 2.56, 0));
      group.add(box(glass, 0.04, 2.2, long, back, KERB + 1.2, 0));
      group.add(box(frame, 0.45, 0.08, long - 1, back - 0.3, KERB + 0.48, 0));
      // The advert closes the near end, facing the oncoming rider.
      const advert = new Mesh(unit, adverts[i % adverts.length]!);
      advert.scale.set(1.3, 1.9, 0.08);
      advert.position.set(x + 0.05, KERB + 1.25, long / 2);
      group.add(advert);
      this.streak(
        group,
        SHELTER_ADVERTS[i % SHELTER_ADVERTS.length]![1],
        x - 1.5,
        KERB,
        long / 2,
        6,
        2,
        1,
      );
      this.group.add(group);
      this.shelters.push({ group, offset });
    });
  }

  /**
   * Delivery drones flying the length of the street above the riders, some up it and some down:
   * a dark body on four arms, each arm ending in a rotor disc, a cyan glow beneath, a parcel
   * slung below and red and green lights that blink.
   */
  private addDrones(roadHalf: number): void {
    const body = new MeshStandardMaterial({ color: 0x1a1b24, metalness: 0.5, roughness: 0.4 });
    const rotor = new MeshBasicMaterial({
      color: new Color('#8fe9ff'),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      toneMapped: false,
    });
    const belly = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.6),
      toneMapped: false,
    });
    // A cardboard parcel, taped and labelled, lit a little by the drone's own glow.
    const cardboard = this.track(parcelTexture());
    const parcel = new MeshStandardMaterial({
      map: cardboard,
      emissiveMap: cardboard,
      emissive: new Color(0xffffff),
      emissiveIntensity: 0.3,
      roughness: 0.8,
    });
    // A band of LEDs round the hull's waist, so the drone reads against the night sky.
    const leds = new MeshBasicMaterial({
      color: new Color(DRONE_LEDS).multiplyScalar(1.8),
      toneMapped: false,
    });
    this.disposables.push(leds);
    const red = new MeshBasicMaterial({
      color: new Color('#ff3045').multiplyScalar(2),
      toneMapped: false,
    });
    const green = new MeshBasicMaterial({
      color: new Color('#35ff8a').multiplyScalar(2),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const disc = new CylinderGeometry(0.42, 0.42, 0.02, 16);
    const dot = new SphereGeometry(0.09, 8, 6);
    // A faint beam from the belly down to the road: open-ended, apex at the drone.
    const beamMaterial = new MeshBasicMaterial({
      color: new Color('#5ff2ff'),
      transparent: true,
      opacity: 0.07,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    const beam = new ConeGeometry(1, 1, 20, 1, true);
    beam.translate(0, -0.5, 0);
    this.disposables.push(
      body,
      rotor,
      belly,
      parcel,
      red,
      green,
      unit,
      disc,
      dot,
      beamMaterial,
      beam,
    );
    const random = seeded(353);
    for (let i = 0; i < DRONES; i++) {
      const group = new Group();
      const hull = new Mesh(unit, body);
      hull.scale.set(0.7, 0.22, 0.9);
      group.add(hull);
      const band = new Mesh(unit, leds);
      band.scale.set(0.72, 0.05, 0.92);
      group.add(band);
      const glow = new Mesh(unit, belly);
      glow.scale.set(0.5, 0.04, 0.6);
      glow.position.y = -0.12;
      group.add(glow);
      for (const ax of [-1, 1]) {
        for (const az of [-1, 1]) {
          const arm = new Mesh(unit, body);
          arm.scale.set(0.08, 0.06, 0.08);
          arm.scale.x = 0.75;
          arm.position.set(ax * 0.45, 0.04, az * 0.5);
          group.add(arm);
          const blades = new Mesh(disc, rotor);
          blades.position.set(ax * 0.8, 0.1, az * 0.55);
          group.add(blades);
        }
      }
      const box = new Mesh(unit, parcel);
      box.scale.set(0.45, 0.4, 0.45);
      box.position.y = -0.55;
      group.add(box);
      const port = new Mesh(dot, red);
      port.position.set(-0.4, 0, -0.5);
      const starboard = new Mesh(dot, green);
      starboard.position.set(0.4, 0, -0.5);
      group.add(port, starboard);
      // Up the street on the rider's side, down it on the far side.
      const up = i % 2 === 0;
      const speed = (up ? 1 : -1) * (5 + random() * 4);
      if (!up) group.rotation.y = Math.PI;
      group.scale.setScalar(2.4);
      const cone = new Mesh(beam, beamMaterial);
      group.add(cone);
      group.position.set(
        (up ? 1 : -1) * roadHalf * (0.3 + random() * 0.8),
        DRONE_HEIGHT + random() * 4,
        0,
      );
      // The beam reaches the road, in the group's scaled units, a pool 3 m across.
      cone.position.y = -0.15;
      cone.scale.set(1.5 / 2.4, group.position.y / 2.4, 1.5 / 2.4);
      this.group.add(group);
      // Spread evenly round the loop, the first just ahead of the start.
      const offset = DRONE_FIRST + (i * LOOP) / DRONES + random() * 20;
      this.drones.push({
        group,
        offset,
        speed,
        at: offset,
        strobes: [port, starboard],
      });
    }
  }

  /**
   * Bicycles parked at steel hoop stands on the pavement, side on to the street: wheels, a frame
   * in one of a few bright colours, saddle and bars, and a red rear light left on.
   */
  private addBikeRacks(roadHalf: number): void {
    const steel = new MeshStandardMaterial({ color: 0x8a8f9c, metalness: 0.8, roughness: 0.3 });
    const tyre = new MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.7 });
    const frames = BIKE_COLOURS.map(
      (hex) =>
        new MeshStandardMaterial({
          color: new Color(hex),
          metalness: 0.4,
          roughness: 0.35,
          emissive: new Color(hex).multiplyScalar(0.15),
        }),
    );
    const tail = new MeshBasicMaterial({
      color: new Color('#ff2a3a').multiplyScalar(2),
      toneMapped: false,
    });
    const wheel = new TorusGeometry(0.33, 0.03, 6, 22);
    const hoop = new TorusGeometry(0.4, 0.03, 6, 16, Math.PI);
    const tube = new BoxGeometry(1, 0.045, 0.045);
    const dot = new SphereGeometry(0.045, 8, 6);
    this.disposables.push(steel, tyre, ...frames, tail, wheel, hoop, tube, dot);
    const bar = (
      material: Material,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      z = 0,
    ): Mesh => {
      const mesh = new Mesh(tube, material);
      mesh.scale.x = Math.hypot(x2 - x1, y2 - y1);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
      mesh.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      return mesh;
    };
    const random = seeded(367);
    const x = roadHalf + BIKE_RACK_OUT;
    BIKE_RACKS.forEach((offset) => {
      const group = new Group();
      const count = 3 + Math.floor(random() * 2);
      for (let k = 0; k < count; k++) {
        const z = (k - (count - 1) / 2) * 0.85;
        // The stand: a hoop set into the paving.
        const stand = new Mesh(hoop, steel);
        stand.position.set(x, KERB + 0.35, z - 0.15);
        group.add(stand);
        if (random() < 0.15) continue;
        // The bicycle, lying along x: front wheel towards the road.
        const bike = new Group();
        const frame = frames[Math.floor(random() * frames.length)]!;
        const r = 0.33;
        for (const wx of [-0.52, 0.52]) {
          const w = new Mesh(wheel, tyre);
          w.position.set(wx, r, 0);
          bike.add(w);
        }
        bike.add(
          bar(frame, -0.52, r, -0.08, r + 0.02),
          bar(frame, -0.08, r + 0.02, -0.16, r + 0.5),
          bar(frame, -0.16, r + 0.5, 0.36, r + 0.46),
          bar(frame, -0.08, r + 0.02, 0.36, r + 0.46),
          bar(frame, -0.52, r, -0.16, r + 0.5),
          bar(frame, 0.36, r + 0.46, 0.52, r),
          bar(frame, 0.36, r + 0.46, 0.4, r + 0.66),
          bar(tyre, -0.28, r + 0.6, -0.08, r + 0.6),
        );
        const bars = new Mesh(tube, tyre);
        bars.scale.x = 0.42;
        bars.rotation.y = Math.PI / 2;
        bars.position.set(0.4, r + 0.66, 0);
        bike.add(bars);
        const light = new Mesh(dot, tail);
        light.position.set(-0.26, r + 0.5, 0);
        bike.add(light);
        bike.position.set(x - 0.05, KERB, z);
        bike.rotation.y = Math.PI + (random() - 0.5) * 0.15;
        group.add(bike);
      }
      this.group.add(group);
      this.bikeRacks.push({ group, offset });
    });
  }

  /**
   * Delivery mopeds angle-parked on the right-hand pavement, noses to the road: a body in a neon
   * paint, a seat, a leg shield and bars, a top box with a lit stripe, and a red tail-light.
   */
  private addMopeds(roadHalf: number): void {
    const tyre = new MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.7 });
    const dark = new MeshStandardMaterial({ color: 0x15161c, roughness: 0.5 });
    const chrome = new MeshStandardMaterial({ color: 0x9aa0ac, metalness: 0.8, roughness: 0.3 });
    const paints = MOPED_PAINTS.map(
      (hex) =>
        new MeshStandardMaterial({
          color: new Color(hex),
          metalness: 0.3,
          roughness: 0.35,
          emissive: new Color(hex).multiplyScalar(0.2),
        }),
    );
    const stripes = MOPED_PAINTS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.6), toneMapped: false }),
    );
    const tail = new MeshBasicMaterial({
      color: new Color('#ff2a3a').multiplyScalar(2),
      toneMapped: false,
    });
    const wheel = new CylinderGeometry(0.22, 0.22, 0.12, 16);
    wheel.rotateX(Math.PI / 2);
    const unit = new BoxGeometry(1, 1, 1);
    const tube = new CylinderGeometry(0.025, 0.025, 1, 6);
    const dot = new SphereGeometry(0.05, 8, 6);
    this.disposables.push(tyre, dark, chrome, ...paints, ...stripes, tail, wheel, unit, tube, dot);
    const box = (material: Material, w: number, h: number, d: number, x: number, y: number) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, 0);
      return mesh;
    };
    const random = seeded(653);
    const x = roadHalf + MOPED_OUT;
    for (const offset of MOPEDS) {
      const group = new Group();
      for (let k = 0; k < MOPED_ROW; k++) {
        const pick = Math.floor(random() * paints.length);
        const paint = paints[pick]!;
        const moped = new Group();
        for (const wx of [-0.55, 0.55]) {
          const w = new Mesh(wheel, tyre);
          w.position.set(wx, 0.22, 0);
          moped.add(w);
        }
        const shield = box(paint, 0.1, 0.6, 0.4, 0.38, 0.62);
        shield.rotation.z = -0.25;
        moped.add(
          box(dark, 0.75, 0.08, 0.3, 0, 0.3),
          box(paint, 0.55, 0.35, 0.38, -0.3, 0.5),
          box(dark, 0.5, 0.08, 0.3, -0.3, 0.72),
          shield,
          span(tube, chrome, new Vector3(0.45, 0.4, 0), new Vector3(0.5, 1, 0)),
          box(chrome, 0.05, 0.04, 0.62, 0.5, 1),
          box(paint, 0.4, 0.38, 0.42, -0.48, 0.97),
          box(stripes[pick]!, 0.41, 0.06, 0.43, -0.48, 1.04),
        );
        const light = new Mesh(dot, tail);
        light.position.set(-0.6, 0.6, 0);
        moped.add(light);
        moped.position.set(x, KERB, (k - (MOPED_ROW - 1) / 2) * MOPED_GAP);
        // Nose towards the road, angled back the way the riders come.
        moped.rotation.y = Math.PI - MOPED_ANGLE + (random() - 0.5) * 0.2;
        group.add(moped);
      }
      this.group.add(group);
      this.mopeds.push({ group, offset });
    }
  }

  /**
   * Taxi ranks on the right-hand pavement: a row of yellow cabs nose towards the riders, roof
   * signs lit, headlights on and tail-lights glowing, with a lit rank sign at its head.
   */
  private addTaxiRanks(roadHalf: number): void {
    const paint = new MeshStandardMaterial({
      color: 0xf2c21b,
      metalness: 0.5,
      roughness: 0.3,
      emissive: new Color('#f2c21b').multiplyScalar(0.55),
    });
    const glass = new MeshStandardMaterial({ color: 0x10131c, metalness: 0.9, roughness: 0.1 });
    const tyre = new MeshStandardMaterial({ color: 0x0b0b0f, roughness: 0.8 });
    // The cabin's windows: tinted panes between their pillars, the driver and a fare inside.
    const cabin = new MeshBasicMaterial({
      map: this.track(taxiCabinTexture()),
      color: new Color(0xffffff).multiplyScalar(1.1),
      toneMapped: false,
    });
    // The checker band along each flank, below the windows.
    const checkerTexture = this.track(checkerBandTexture());
    const checker = new MeshBasicMaterial({ map: checkerTexture, toneMapped: false });
    const band = new PlaneGeometry(TAXI_LONG - 0.4, 0.14);
    this.disposables.push(cabin, checker, band);
    // The roof sign, lettered TAXI over a checker band on both faces.
    const sign = new MeshBasicMaterial({
      color: new Color(0xffffff).multiplyScalar(1.5),
      map: this.track(taxiSignTexture()),
      toneMapped: false,
    });
    const head = new MeshBasicMaterial({
      color: new Color('#f4f7ff').multiplyScalar(2.6),
      toneMapped: false,
    });
    const tail = new MeshBasicMaterial({
      color: new Color('#ff2a3a').multiplyScalar(2.2),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const wheel = new CylinderGeometry(0.34, 0.34, 0.22, 14);
    // A silver hubcap on each wheel's outer face, five spokes round a centre badge.
    const hubcap = new MeshBasicMaterial({
      map: this.track(hubcapTexture()),
      transparent: true,
      color: new Color(0xffffff).multiplyScalar(0.85),
    });
    const hubDisc = new CircleGeometry(0.25, 20);
    this.disposables.push(hubcap, hubDisc);
    const rankTexture = this.track(rankSignTexture());
    const rank = new MeshBasicMaterial({ map: rankTexture, toneMapped: false });
    const board = new PlaneGeometry(1.4, 0.7);
    // The lead cab's indicators, flashing amber, and their glow; shared so they blink as one.
    const blink = new MeshBasicMaterial({
      color: new Color(BLINK_COLOUR).multiplyScalar(3),
      transparent: true,
      toneMapped: false,
    });
    this.glow ??= this.track(glowTexture());
    const blinkGlow = new MeshBasicMaterial({
      color: new Color(BLINK_COLOUR).multiplyScalar(2.2),
      map: this.glow,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const blinkPlane = new PlaneGeometry(BLINK_GLOW, BLINK_GLOW);
    this.blinkers = [blink, blinkGlow];
    this.disposables.push(paint, glass, tyre, sign, head, tail, unit, wheel, rank, board);
    this.disposables.push(blink, blinkGlow, blinkPlane);
    const box = (
      group: Group,
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      group.add(mesh);
    };
    const x = roadHalf + TAXI_OUT;
    for (const offset of TAXI_RANKS) {
      const group = new Group();
      for (let k = 0; k < TAXIS_PER_RANK; k++) {
        // The first cab at the rank's head, nearest the riders; the rest queue behind it.
        const z = -k * (TAXI_LONG + 1.2);
        const y = KERB;
        box(group, paint, 1.8, 0.62, TAXI_LONG, x, y + 0.62, z);
        const cab = new Mesh(unit, [cabin, cabin, glass, glass, cabin, cabin]);
        cab.scale.set(1.6, 0.5, 2.3);
        cab.position.set(x, y + 1.18, z - 0.2);
        group.add(cab);
        for (const side of [-1, 1]) {
          const stripe = new Mesh(band, checker);
          stripe.rotation.y = (side * Math.PI) / 2;
          stripe.position.set(x + side * 0.91, y + 0.82, z);
          group.add(stripe);
        }
        box(group, paint, 1.62, 0.06, 2.1, x, y + 1.45, z - 0.2);
        box(group, sign, 0.7, 0.3, 0.3, x, y + 1.63, z - 0.1);
        for (const side of [-1, 1]) {
          box(group, head, 0.34, 0.14, 0.05, x + side * 0.62, y + 0.72, z + TAXI_LONG / 2 + 0.01);
          box(group, tail, 0.3, 0.14, 0.05, x + side * 0.66, y + 0.76, z - TAXI_LONG / 2 - 0.01);
          for (const end of [-1, 1]) {
            const w = new Mesh(wheel, tyre);
            w.rotation.z = Math.PI / 2;
            w.position.set(x + side * 0.85, y + 0.34, z + end * 1.35);
            const cap = new Mesh(hubDisc, hubcap);
            cap.rotation.y = (side * Math.PI) / 2;
            cap.position.set(x + side * 0.965, y + 0.34, z + end * 1.35);
            group.add(w, cap);
          }
        }
        // The lead cab signals to pull out: indicators at its road-side corners, front and back.
        if (k === 0) {
          for (const end of [-1, 1]) {
            const cz = z + end * (TAXI_LONG / 2 + 0.02);
            box(group, blink, 0.3, 0.2, 0.08, x - 0.76, y + 0.92, cz);
            box(group, blink, 0.06, 0.2, 0.4, x - 0.92, y + 0.92, z + end * (TAXI_LONG / 2 - 0.3));
            const halo = new Mesh(blinkPlane, blinkGlow);
            halo.position.set(x - 0.8, y + 0.92, cz + end * 0.3);
            group.add(halo);
          }
        }
        // Headlight beams pooled on the paving ahead of each cab.
        this.streak(group, '#f4f7ff', x, y + 0.02, z + TAXI_LONG / 2 + 2, 4, 1.6, 0.5);
      }
      // The rank sign on its post at the head of the row.
      const post = new Mesh(unit, glass);
      post.scale.set(0.1, 2.6, 0.1);
      post.position.set(x - 1.3, KERB + 1.3, TAXI_LONG / 2 + 1);
      group.add(post);
      const plate = new Mesh(board, rank);
      plate.position.set(x - 1.3, KERB + 2.6, TAXI_LONG / 2 + 1.06);
      group.add(plate);
      this.group.add(group);
      this.taxiRanks.push({ group, offset });
    }
  }

  /**
   * Rain puddles on both pavements: shallow pools of water holding the neon above, smeared
   * pink, cyan and amber reflections inside a soft, uneven rim.
   */
  private addPuddles(roadHalf: number): void {
    const random = seeded(397);
    const geometry = new PlaneGeometry(1, 1);
    this.disposables.push(geometry);
    const materials = [0, 1, 2, 3].map((k) => {
      const material = new MeshBasicMaterial({
        // Brightened, as the water's sheen is lit by the signs above.
        color: new Color(0xffffff).multiplyScalar(2.2),
        map: this.track(puddleTexture(seeded(401 + k))),
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        toneMapped: false,
      });
      this.disposables.push(material);
      return material;
    });
    for (let i = 0; i < PUDDLES; i++) {
      const side = random() < 0.5 ? -1 : 1;
      const mesh = new Mesh(geometry, materials[i % materials.length]!);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = (random() - 0.5) * 0.8;
      mesh.scale.set(2 + random() * 2.6, 3.5 + random() * 4.5, 1);
      mesh.position.set(
        side * (roadHalf + PUDDLE_NEAR + random() * (PUDDLE_FAR - PUDDLE_NEAR)),
        KERB + 0.012,
        0,
      );
      this.group.add(mesh);
      this.puddles.push({ mesh, offset: random() * LOOP });
    }
    // Puddles out on the road too, in the lanes the riders pass over, from their own sequence
    // so the pavements' puddles stay where they were.
    const road = seeded(479);
    for (let i = 0; i < ROAD_PUDDLES; i++) {
      const mesh = new Mesh(geometry, materials[i % materials.length]!);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = (road() - 0.5) * 0.6;
      mesh.scale.set(1.6 + road() * 2.2, 3 + road() * 4, 1);
      mesh.position.set((road() * 2 - 1) * (roadHalf - 1.4), 0.014, 0);
      this.group.add(mesh);
      this.puddles.push({ mesh, offset: road() * LOOP });
    }
  }

  /**
   * Glass skybridges joining the towers across the street: a dark frame round a band of warm
   * lit windows, mullions, cyan strips along both edges and people crossing, with its light
   * pooled on the road below.
   */
  private addSkybridges(roadHalf: number): void {
    const frame = new MeshStandardMaterial({ color: 0x141826, metalness: 0.6, roughness: 0.4 });
    const windows = new MeshBasicMaterial({
      color: new Color('#ffd9a8').multiplyScalar(1.3),
      toneMapped: false,
    });
    const cyan = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(2),
      toneMapped: false,
    });
    const shadow = new MeshBasicMaterial({ color: 0x14101c });
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(frame, windows, cyan, shadow, unit);
    const random = seeded(409);
    for (const [offset, height] of SKYBRIDGES) {
      const group = new Group();
      const harbour = offset >= HARBOUR_FROM && offset < HARBOUR_TO;
      const right = roadHalf + SETBACK + 1;
      const left = harbour ? -(roadHalf + LIFT_OUT) : -right;
      const span = right - left;
      const middle = (left + right) / 2;
      const box = (
        material: Material,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z = 0,
      ) => {
        const mesh = new Mesh(unit, material);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y, z);
        group.add(mesh);
      };
      box(frame, span, 0.9, 4.4, middle, height - 0.45);
      box(frame, span, 0.7, 4.4, middle, height + 3.35);
      box(windows, span, 2.6, 4, middle, height + 1.3);
      box(cyan, span, 0.14, 4.5, middle, height - 0.05);
      box(cyan, span, 0.14, 4.5, middle, height + 3.05);
      for (let x = left + 1; x < right; x += 2.2) box(frame, 0.16, 2.6, 4.1, x, height + 1.3);
      if (harbour) {
        // The lift tower on the promenade: a dark glass shaft with a lit seam up its face.
        const shaft = height + 3.7;
        box(frame, 3, shaft, 3.4, left - 1.5, shaft / 2);
        box(windows, 0.5, shaft - 1.5, 3.45, left - 1.5, shaft / 2);
        box(cyan, 3.05, 0.14, 3.45, left - 1.5, 2.6);
      }
      // People crossing, dark against the lit glass.
      for (let k = 0; k < 5; k++) {
        const x = middle + (random() - 0.5) * (span - 6);
        box(shadow, 0.45, 1.5, 0.3, x, height + 0.75, 2.05);
        box(shadow, 0.3, 0.3, 0.3, x, height + 1.68, 2.05);
      }
      this.streak(group, '#ffd9a8', 0, 0.02, 0, 6, 2 * roadHalf, 0.45);
      group.visible = false;
      this.group.add(group);
      this.skybridges.push({ group, offset });
    }
  }

  private addStalls(): void {
    // The booth is clad in dark timber slats, pasted with gig posters and stickers.
    const cladding = this.track(boothTexture());
    const body = new MeshStandardMaterial({
      map: cladding,
      emissiveMap: cladding,
      emissive: new Color(0xffffff),
      emissiveIntensity: 0.35,
      roughness: 0.7,
    });
    // The open hatch: a warm kitchen with shelves of jars, pans on the hob and a cook at work.
    const hatch = new MeshBasicMaterial({
      color: new Color(0xffffff).multiplyScalar(1.05),
      map: this.track(hatchTexture()),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const awnings = STALL_COLOURS.map((hex) => {
      const texture = this.track(awningTexture(hex));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.4,
      });
    });
    const strips = STALL_COLOURS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.5), toneMapped: false }),
    );
    // One shared steam material, added to what lies behind so the hatch-lit steam glows; each
    // puff swells in and shrinks away rather than fading.
    this.glow ??= this.track(glowTexture());
    const steam = new MeshBasicMaterial({
      color: new Color('#ffa860').multiplyScalar(1.8),
      map: this.glow,
      toneMapped: false,
      transparent: true,
      opacity: 0.75,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const puff = new PlaneGeometry(1, 1);
    this.disposables.push(body, hatch, unit, ...awnings, ...strips, steam, puff);
    // Red paper lanterns hung from the awning's edge, each in a soft glow.
    const paper = new MeshBasicMaterial({
      map: this.track(paperLanternTexture()),
      color: new Color('#ffffff').multiplyScalar(1.1),
      toneMapped: false,
    });
    // Each lantern has black lacquer caps, a cord up to the awning and a gold tassel below.
    const lacquer = new MeshStandardMaterial({ color: 0x0d0b0c, roughness: 0.35 });
    const gold = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color(LANTERN_TASSEL),
      emissiveIntensity: 0.7,
    });
    const cap = new CylinderGeometry(0.12, 0.14, 0.07, 12);
    const cord = new CylinderGeometry(0.012, 0.012, 1, 4);
    const tassel = new CylinderGeometry(0.012, 0.03, 0.2, 6);
    this.disposables.push(lacquer, gold, cap, cord, tassel);
    const paperGlow = new MeshBasicMaterial({
      color: new Color(STALL_LANTERN).multiplyScalar(1.6),
      map: this.glow,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const lantern = new SphereGeometry(0.22, 12, 8);
    // A lit menu board on the booth's end, facing the riders as they come.
    const menus = STALL_MENUS.map((dishes, k) =>
      this.track(menuTexture(dishes, STALL_COLOURS[k % STALL_COLOURS.length]!)),
    ).map((texture) => new MeshBasicMaterial({ map: texture, toneMapped: false }));
    const board = new PlaneGeometry(1.9, 1.15);
    const chalkboards = STALL_SPECIALS.map(
      ([dish, price]) =>
        new MeshBasicMaterial({
          map: this.track(chalkboardTexture(dish, price)),
          color: new Color(0xffffff).multiplyScalar(1.4),
          toneMapped: false,
          side: DoubleSide,
        }),
    );
    const chalkPlane = new PlaneGeometry(AFRAME_WIDE, AFRAME_TALL);
    this.disposables.push(...chalkboards, chalkPlane);
    this.disposables.push(paper, paperGlow, lantern, ...menus, board);
    // Seating out front: a low plastic table and stools, with a diner hunched over a bowl.
    const plastics = SEAT_COLOURS.map(
      (hex) => new MeshStandardMaterial({ color: hex, roughness: 0.45, metalness: 0.05 }),
    );
    const coats = DINER_COATS.map(
      (hex) => new MeshStandardMaterial({ color: hex, roughness: 0.8 }),
    );
    const hats = DINER_HATS.map(
      (hex) =>
        new MeshStandardMaterial({ color: hex, emissive: new Color(hex), emissiveIntensity: 0.35 }),
    );
    const jeans = new MeshStandardMaterial({ color: 0x1c2233, roughness: 0.8 });
    const wood = new MeshStandardMaterial({ color: 0xd9b27a, roughness: 0.6 });
    const torso = new CylinderGeometry(0.15, 0.2, 1, 10);
    const limb = new CylinderGeometry(0.05, 0.05, 1, 6);
    const stick = new CylinderGeometry(0.008, 0.008, 1, 4);
    const beanie = new SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(...coats, ...hats, jeans, wood, torso, limb, stick, beanie);
    const skin = new MeshStandardMaterial({ color: 0xc89a7a, roughness: 0.7 });
    const bowlLight = new MeshBasicMaterial({
      color: new Color('#fff1d6').multiplyScalar(1.4),
      toneMapped: false,
    });
    // A street-food stool: a round moulded seat with a grip hole, four splayed legs and a brace.
    const seat = new CylinderGeometry(0.19, 0.18, 0.04, 16);
    const stoolLeg = new CylinderGeometry(0.022, 0.022, 1, 6);
    const brace = new TorusGeometry(0.15, 0.012, 4, 20).rotateX(Math.PI / 2);
    const grip = new CircleGeometry(0.04, 10).rotateX(-Math.PI / 2);
    const gripShadow = new MeshBasicMaterial({ color: 0x0a0a10 });
    this.disposables.push(stoolLeg, brace, grip, gripShadow);
    const top = new CylinderGeometry(0.34, 0.3, 0.05, 14);
    const leg = new CylinderGeometry(0.05, 0.08, 0.5, 6);
    const head = new SphereGeometry(0.12, 10, 8);
    const bowl = new SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    this.disposables.push(...plastics, skin, bowlLight, seat, top, leg, head, bowl);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    STALLS.forEach((offset, i) => {
      const group = new Group();
      const colour = i % STALL_COLOURS.length;
      const x = STALL_X;
      // The booth, its back to the harbour and its hatch to the road.
      group.add(box(body, 2.2, 2.6, 3.2, x, KERB + 1.3, 0));
      group.add(box(hatch, 0.05, 1, 2.6, x + 1.11, KERB + 1.45, 0));
      group.add(box(body, 0.5, 0.12, 3, x + 1.3, KERB + 0.95, 0));
      group.add(box(strips[colour]!, 0.12, 0.12, 3.2, x + 1.12, KERB + 2.62, 0));
      // The awning slopes out over the counter.
      const awning = new Mesh(unit, awnings[colour]!);
      awning.scale.set(1.8, 0.05, 3.4);
      awning.rotation.z = -0.4;
      awning.position.set(x + 1.85, KERB + 2.35, 0);
      group.add(awning);
      this.streak(group, '#ffcf8a', x + 3, KERB, 0, 4, 3.5, 0.8);
      for (const z of [-1.15, 0, 1.15]) {
        const ball = new Mesh(lantern, paper);
        ball.scale.y = 1.25;
        ball.position.set(x + 2.55, KERB + 1.72, z);
        const lid = new Mesh(cap, lacquer);
        lid.position.set(x + 2.55, KERB + 1.72 + 0.29, z);
        const foot = new Mesh(cap, lacquer);
        foot.rotation.x = Math.PI;
        foot.position.set(x + 2.55, KERB + 1.72 - 0.29, z);
        const string = new Mesh(cord, lacquer);
        string.scale.y = 0.3;
        string.position.set(x + 2.55, KERB + 1.72 + 0.46, z);
        const tail = new Mesh(tassel, gold);
        tail.position.set(x + 2.55, KERB + 1.72 - 0.42, z);
        group.add(lid, foot, string, tail);
        const glow = new Mesh(puff, paperGlow);
        glow.scale.setScalar(1.1);
        glow.position.set(x + 2.55, KERB + 1.72, z + 0.25);
        group.add(ball, glow);
      }
      // A chalkboard A-frame out on the pavement, chalked with the day's special for the riders.
      const aframe = new Group();
      for (const lean of [-1, 1]) {
        const face = new Mesh(chalkPlane, chalkboards[i % chalkboards.length]!);
        face.rotation.set(-lean * AFRAME_LEAN, lean > 0 ? 0 : Math.PI, 0);
        face.position.set(0, AFRAME_TALL / 2, lean * 0.2);
        aframe.add(face);
      }
      aframe.position.set(x + AFRAME_OUT, KERB, AFRAME_Z);
      group.add(aframe);
      const menu = new Mesh(board, menus[i % menus.length]!);
      menu.position.set(x + 0.1, KERB + 1.65, 1.61);
      group.add(menu);
      // The table out front, a stool either side of it, and a diner on the near one.
      const plastic = plastics[i % plastics.length]!;
      const tx = x + SEAT_OUT;
      const table = new Mesh(top, plastic);
      table.position.set(tx, KERB + 0.52, SEAT_Z);
      const stem = new Mesh(leg, plastic);
      stem.position.set(tx, KERB + 0.25, SEAT_Z);
      const dish = new Mesh(bowl, bowlLight);
      dish.rotation.x = Math.PI;
      dish.position.set(tx, KERB + 0.6, SEAT_Z + 0.12);
      group.add(table, stem, dish);
      for (const dz of [-0.62, 0.62]) {
        const tint = plastics[(i + 1) % plastics.length]!;
        const stool = new Group();
        const top = new Mesh(seat, tint);
        top.position.y = 0.4;
        const hole = new Mesh(grip, gripShadow);
        hole.position.y = 0.421;
        const ring = new Mesh(brace, tint);
        ring.position.y = 0.14;
        stool.add(top, hole, ring);
        for (const [lx, lz] of [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ] as const) {
          const foot = new Vector3(lx * 0.17, 0, lz * 0.17);
          stool.add(span(stoolLeg, tint, new Vector3(lx * 0.11, 0.39, lz * 0.11), foot));
        }
        stool.position.set(tx, KERB, SEAT_Z + dz);
        group.add(stool);
      }
      // The diner sits hunched over the bowl, chopsticks raised from it to their mouth.
      const at = (dx: number, dy: number, dz: number) =>
        new Vector3(tx + dx, KERB + dy, SEAT_Z + dz);
      const coat = coats[i % coats.length]!;
      const neck = at(0, 0.98, 0.42);
      group.add(span(torso, coat, at(0, 0.44, 0.66), neck));
      for (const side of [-1, 1]) {
        const knee = at(side * 0.1, 0.48, 0.3);
        group.add(span(limb, jeans, at(side * 0.1, 0.46, 0.64), knee));
        group.add(span(limb, jeans, knee, at(side * 0.1, 0.03, 0.26)));
        const hand = at(side * 0.09, 0.74, 0.16);
        group.add(span(limb, coat, at(side * 0.2, 0.9, 0.44), hand));
      }
      const face = new Mesh(head, skin);
      face.position.copy(neck).add(new Vector3(0, 0.14, -0.06));
      const hat = new Mesh(beanie, hats[i % hats.length]!);
      hat.position.copy(face.position).add(new Vector3(0, 0.03, 0.01));
      group.add(face, hat);
      for (const dx of [0.07, 0.1]) {
        group.add(span(stick, wood, at(dx - 0.03, 0.62, 0.1), at(dx, 0.98, 0.3)));
      }
      // Steam from the cooking rises off the booth's roof, lit warm by the hatch below.
      for (let k = 0; k < STALL_PUFFS; k++) {
        const mesh = new Mesh(puff, steam);
        mesh.position.set(x + 0.4, 0, (k % 2 === 0 ? -0.5 : 0.6) + (i % 3) * 0.2);
        group.add(mesh);
        this.stallSteam.push({
          mesh,
          phase: (k + i * 0.37) / STALL_PUFFS,
          drift: k % 2 === 0 ? 1 : -1,
        });
      }
      this.group.add(group);
      this.stalls.push({ group, offset });
    });
  }

  /**
   * People out in the rain: figures in dark coats under umbrellas in the city's neon colours,
   * waiting at the stalls' counters and standing about on the pavement under the towers.
   */
  private addWalkers(roadHalf: number): void {
    const coats = [0x1d1a26, 0x2a2233, 0x1a2430, 0x30241d].map(
      (color) => new MeshStandardMaterial({ color, roughness: 0.8 }),
    );
    const skin = new MeshStandardMaterial({ color: 0xc89878, roughness: 0.7 });
    const umbrellas = WALKER_COLOURS.map(
      (hex) =>
        new MeshStandardMaterial({
          color: new Color(hex),
          emissive: new Color(hex),
          emissiveIntensity: 0.6,
          roughness: 0.35,
          side: DoubleSide,
        }),
    );
    const shaft = new MeshStandardMaterial({ color: 0x111111 });
    const body = new CylinderGeometry(0.2, 0.27, 1.25, 10);
    // A leg hangs from its hip, so it swings about the top.
    const legs = new CylinderGeometry(0.085, 0.07, 0.6, 8).translate(0, -0.3, 0);
    const head = new SphereGeometry(0.13, 12, 10);
    const canopy = new ConeGeometry(0.62, 0.28, 12, 1, true);
    const pole = new CylinderGeometry(0.015, 0.015, 0.8, 4);
    this.disposables.push(...coats, skin, ...umbrellas, shaft, body, legs, head, canopy, pole);
    // Sleeves, one arm up to the umbrella and one hanging, hair, and a scarf in a neon colour.
    const sleeve = new CylinderGeometry(0.06, 0.055, 1, 6);
    const hand = new SphereGeometry(0.055, 6, 4);
    const hairCap = new SphereGeometry(0.14, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const scarf = new CylinderGeometry(0.15, 0.17, 0.1, 10);
    const hair = new MeshStandardMaterial({ color: 0x1a1210, roughness: 0.9 });
    const scarves = WALKER_SCARVES.map(
      (hex) =>
        new MeshStandardMaterial({ color: hex, emissive: new Color(hex), emissiveIntensity: 0.4 }),
    );
    this.disposables.push(sleeve, hand, hairCap, scarf, hair, ...scarves);
    // Their scarves draw from their own sequence, so the walkers' layout is unchanged.
    const scarfRandom = seeded(509);
    const random = seeded(281);
    const person = (x: number, facing: number) => {
      const group = new Group();
      const coat = coats[Math.floor(random() * coats.length)]!;
      const hips = [-0.09, 0.09].map((x) => {
        const leg = new Mesh(legs, coats[0]!);
        leg.position.set(x, KERB + 0.6, 0);
        return leg;
      });
      const b = new Mesh(body, coat);
      b.position.y = KERB + 0.6 + 0.62;
      const h = new Mesh(head, skin);
      h.position.y = KERB + 2.0;
      const u = new Mesh(canopy, umbrellas[Math.floor(random() * umbrellas.length)]!);
      u.position.set(0.1, KERB + 2.45, 0);
      const p = new Mesh(pole, shaft);
      p.position.set(0.1, KERB + 2.0, 0);
      group.add(...hips, b, h, u, p);
      const at = (x: number, y: number, z: number) => new Vector3(x, KERB + y, z);
      // The umbrella arm bends at the elbow, its hand on the pole; the other hangs at the side.
      const elbow = at(0.27, 1.42, 0.1);
      const grip = at(0.1, 1.62, 0.02);
      group.add(span(sleeve, coat, at(0.2, 1.74, 0), elbow), span(sleeve, coat, elbow, grip));
      const fist = new Mesh(hand, skin);
      fist.position.copy(grip);
      const loose = at(-0.27, 1.18, 0.03);
      group.add(fist, span(sleeve, coat, at(-0.2, 1.74, 0), loose));
      const palm = new Mesh(hand, skin);
      palm.position.copy(loose);
      const cap = new Mesh(hairCap, hair);
      cap.position.set(0, KERB + 2.03, -0.015);
      const wrap = new Mesh(scarf, scarves[Math.floor(scarfRandom() * scarves.length)]!);
      wrap.position.y = KERB + 1.83;
      group.add(palm, cap, wrap);
      group.userData['legs'] = hips;
      group.position.x = x;
      group.rotation.y = facing;
      return group;
    };
    // At the stalls' counters, facing in to be served.
    STALLS.forEach((offset) => {
      if (random() < 0.35) return;
      const group = new Group();
      group.add(person(STALL_X + 2.3, -Math.PI / 2));
      group.children[0]!.position.z = (random() - 0.5) * 1.6;
      this.group.add(group);
      this.walkers.push({ group, offset });
    });
    // On the pavement across the street, under the towers, strolling up or down it.
    for (let i = 0; i < WALKERS; i++) {
      const group = new Group();
      const way = random() < 0.5 ? -1 : 1;
      const walker = person(roadHalf + 2.5 + random() * 6, 0);
      group.add(walker);
      this.strollers.push({ person: walker, speed: way * (0.9 + random() * 0.6), phase: random() });
      this.group.add(group);
      this.walkers.push({ group, offset: random() * LOOP });
    }
    // Waiting at the kerb of each crossing, both sides, facing across the road for the lights.
    // They draw from their own sequence, so the walkers above are unchanged.
    const waitRandom = seeded(661);
    for (const offset of CROSSINGS) {
      const group = new Group();
      for (const side of [-1, 1]) {
        const count = 2 + Math.floor(waitRandom() * (CROSSING_WAITERS - 1));
        for (let k = 0; k < count; k++) {
          const x = side * (roadHalf + KERB_WIDTH + 0.7 + waitRandom() * 1.2);
          const waiter = person(x, (-side * Math.PI) / 2 + (waitRandom() - 0.5) * 0.4);
          waiter.position.z = (k - (count - 1) / 2) * 1.3 + (waitRandom() - 0.5) * 0.4;
          group.add(waiter);
        }
      }
      this.group.add(group);
      this.walkers.push({ group, offset });
    }
  }

  /**
   * Walks each stroller up and down its stretch of pavement, STROLL metres long, turning round
   * at either end, its legs swinging and a slight bob in its step.
   */
  private stroll(seconds: number): void {
    for (const { person, speed, phase } of this.strollers) {
      const lap = (((phase * 2 + (seconds * speed) / STROLL) % 2) + 2) % 2;
      const along = lap < 1 ? lap : 2 - lap;
      const forward = lap < 1 === speed > 0;
      person.position.z = (along - 0.5) * STROLL;
      // It faces the way it walks: a positive speed walks towards +z first.
      person.rotation.y = forward ? 0 : Math.PI;
      const step = seconds * 5.5 + phase * 9;
      person.position.y = Math.abs(Math.sin(step)) * 0.05;
      const [left, right] = person.userData['legs'] as Mesh[];
      left!.rotation.x = Math.sin(step) * 0.45;
      right!.rotation.x = -Math.sin(step) * 0.45;
    }
  }

  /**
   * Air traffic over the city: small craft crossing the sky in lanes between the towers, each
   * with a glowing underside, red and green navigation lights and a white strobe that blinks.
   */
  private addAirTraffic(): void {
    const hull = new MeshStandardMaterial({ color: 0x14141c, metalness: 0.6, roughness: 0.4 });
    const light = (hex: string, k = 2) =>
      new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(k),
        toneMapped: false,
        fog: false,
      });
    const glows = ['#3fe0ff', '#ff4fb8', '#ffb347'].map((hex) => light(hex, 1.6));
    const red = light('#ff2a2a');
    const green = light('#2aff6a');
    const white = light('#ffffff', 3);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(hull, ...glows, red, green, white, unit);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    SKYLANES.forEach((lane, i) => {
      const group = new Group();
      group.add(box(hull, 5, 1.2, 2.4, 0, 0, 0));
      group.add(box(hull, 2.2, 0.8, 1.8, 0.4, 0.9, 0));
      group.add(box(glows[i % glows.length]!, 4.4, 0.15, 2, 0, -0.65, 0));
      group.add(box(red, 0.5, 0.5, 0.5, 0, 0, 1.45));
      group.add(box(green, 0.5, 0.5, 0.5, 0, 0, -1.45));
      const strobe = box(white, 0.6, 0.6, 0.6, -2.6, 0.3, 0);
      group.add(strobe);
      // It flies nose first along its lane.
      group.rotation.y = lane.speed > 0 ? 0 : Math.PI;
      group.scale.setScalar(lane.size);
      this.group.add(group);
      this.craft.push({ group, strobe, lane });
    });
  }

  /** Flies each craft along its lane, round again past the far side, its strobe blinking. */
  private fly(seconds: number): void {
    for (const { group, strobe, lane } of this.craft) {
      const span = SKYLANE_SPAN;
      const x = ((((lane.phase * span + seconds * lane.speed) % span) + span) % span) - span / 2;
      group.position.set(x, lane.y, lane.z);
      strobe.visible = (seconds + lane.phase * 3) % 1.4 < 0.12;
    }
  }

  /**
   * Neon gates over the road, ridden under: two dark steel posts at the kerbs and a beam across,
   * outlined in glowing tubes of the gate's colour, with a lit name plate in the middle. Their
   * light falls on the wet road either side.
   */
  private addGates(roadHalf: number): void {
    const steel = new MeshStandardMaterial({ color: 0x15161e, metalness: 0.7, roughness: 0.4 });
    const unit = new BoxGeometry(1, 1, 1);
    const tubes = GATE_COLOURS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.6), toneMapped: false }),
    );
    const plates = GATE_COLOURS.map((hex) => {
      const texture = this.track(plateTexture('DOCKLANDS', hex));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    this.disposables.push(steel, unit, ...tubes, ...plates);
    // The posts stand out on the pavements, clear of the road, so riding under a gate frames
    // the street rather than filling the view.
    const half = roadHalf + GATE_OUT;
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z = 0,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    GATES.forEach((offset, i) => {
      const group = new Group();
      const tube = tubes[i % tubes.length]!;
      for (const side of [-1, 1]) {
        group.add(box(steel, 0.6, GATE_HEIGHT, 0.6, side * half, GATE_HEIGHT / 2));
        // A tube up the inner face of each post.
        group.add(
          box(tube, 0.1, GATE_HEIGHT - 0.4, 0.1, side * (half - 0.32), GATE_HEIGHT / 2, 0.2),
        );
        group.add(
          box(tube, 0.1, GATE_HEIGHT - 0.4, 0.1, side * (half - 0.32), GATE_HEIGHT / 2, -0.2),
        );
        this.streak(
          group,
          GATE_COLOURS[i % GATE_COLOURS.length]!,
          side * (half - 1),
          0.02,
          0,
          10,
          1.4,
          1.4,
        );
      }
      group.add(box(steel, half * 2 + 0.6, 0.8, 0.6, 0, GATE_HEIGHT));
      group.add(box(tube, half * 2 - 0.4, 0.1, 0.1, 0, GATE_HEIGHT - 0.42, 0.2));
      group.add(box(tube, half * 2 - 0.4, 0.1, 0.1, 0, GATE_HEIGHT + 0.42, 0.2));
      // The name plate, centred over the road and facing the riders.
      const plate = new Mesh(new PlaneGeometry(5, 1.1), plates[i % plates.length]!);
      this.disposables.push(plate.geometry);
      plate.position.set(0, GATE_HEIGHT + 1.05, 0.05);
      group.add(plate, box(steel, 5.3, 1.3, 0.3, 0, GATE_HEIGHT + 1.05, -0.12));
      this.group.add(group);
      this.gates.push({ group, offset });
    });
  }

  /**
   * Vending machines in twos and threes against the towers across the street, facing the road:
   * white-lit fronts with rows of bright cans behind glass and a coloured header, throwing their
   * light across the wet pavement.
   */
  private addMachines(roadHalf: number): void {
    const fronts = MACHINE_COLOURS.map((hex, i) => {
      const texture = this.track(machineTexture(hex, i));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const shell = new MeshStandardMaterial({ color: 0x1a1b24, metalness: 0.4, roughness: 0.5 });
    const unit = new BoxGeometry(1, 1, 1);
    const face = new PlaneGeometry(MACHINE_WIDE - 0.12, MACHINE_TALL - 0.12);
    this.disposables.push(...fronts, shell, unit, face);
    const random = seeded(293);
    const x = roadHalf + SETBACK - MACHINE_DEEP / 2 - 0.1;
    for (const offset of MACHINES) {
      const group = new Group();
      const count = 2 + Math.floor(random() * 2);
      for (let k = 0; k < count; k++) {
        const z = (k - (count - 1) / 2) * (MACHINE_WIDE + 0.08);
        const body = new Mesh(unit, shell);
        body.scale.set(MACHINE_DEEP, MACHINE_TALL, MACHINE_WIDE);
        body.position.set(x, KERB + MACHINE_TALL / 2, z);
        const front = new Mesh(face, fronts[Math.floor(random() * fronts.length)]!);
        front.rotation.y = -Math.PI / 2;
        front.position.set(x - MACHINE_DEEP / 2 - 0.01, KERB + MACHINE_TALL / 2, z);
        group.add(body, front);
      }
      this.streak(group, '#e8f4ff', x - 4, KERB, 0, 8, count * MACHINE_WIDE + 1, 1.3);
      this.group.add(group);
      this.machines.push({ group, offset });
    }
  }

  private addVents(roadHalf: number): void {
    const texture = this.track(glowTexture());
    const grate = new MeshStandardMaterial({ color: 0x0c0d12, metalness: 0.6, roughness: 0.5 });
    const plate = new PlaneGeometry(1.4, 0.9);
    const puff = new PlaneGeometry(1, 1);
    this.disposables.push(grate, plate, puff);
    const random = seeded(241);
    for (const [i, [offset, side]] of VENTS.entries()) {
      const group = new Group();
      const x = side * (roadHalf - 0.9);
      const floor = new Mesh(plate, grate);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, 0.02, 0);
      group.add(floor);
      // A neon light under the grate, glowing up through it and colouring the steam.
      const hue = new Color(VENT_LIGHTS[i % VENT_LIGHTS.length]!);
      const under = new MeshBasicMaterial({
        color: hue.clone().multiplyScalar(1.6),
        map: texture,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        toneMapped: false,
      });
      this.disposables.push(under);
      const pool = new Mesh(puff, under);
      pool.rotation.x = -Math.PI / 2;
      pool.scale.set(3.4, 2.6, 1);
      pool.position.set(x, 0.03, 0);
      group.add(pool);
      const puffs: { mesh: Mesh; phase: number }[] = [];
      for (let k = 0; k < PUFFS; k++) {
        const material = new MeshBasicMaterial({
          color: new Color(STEAM_HAZE),
          map: texture,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        });
        this.disposables.push(material);
        const mesh = new Mesh(puff, material);
        mesh.position.x = x + (random() - 0.5) * 0.6;
        group.add(mesh);
        puffs.push({ mesh, phase: k / PUFFS });
      }
      group.visible = false;
      this.group.add(group);
      this.vents.push({ group, offset, puffs, hue });
    }
    this.steam(0);
  }

  /** Lets the steam rise for `seconds`: each puff climbs STEAM_HEIGHT, swelling as it thins. */
  private steam(seconds: number): void {
    for (const { mesh, phase, drift } of this.stallSteam) {
      const life = (phase + seconds / STALL_STEAM_LIFE) % 1;
      // Rising and swelling, drifting a little towards the road; gone as it reaches the top.
      mesh.position.y = KERB + 2.2 + life * STALL_STEAM_HEIGHT;
      mesh.position.x = STALL_X + 0.4 + life * 0.9;
      const size = (2 + life * 3.6) * Math.sin(Math.PI * (0.15 + life * 0.85)) + 0.01;
      mesh.scale.set(size * (1 + drift * 0.1), size, 1);
    }
    for (const vent of this.vents) {
      for (const { mesh, phase } of vent.puffs) {
        const life = (phase + seconds / STEAM_LIFE) % 1;
        mesh.position.y = 0.3 + life * STEAM_HEIGHT;
        const size = 1.6 + life * 4.2;
        mesh.scale.set(size, size, 1);
        const material = mesh.material as MeshBasicMaterial;
        material.opacity = 0.9 * Math.sin(Math.PI * life) ** 1.2;
        // Lit in the vent's neon low down, fading to the city's haze as it climbs.
        material.color
          .copy(vent.hue)
          .multiplyScalar(1.8)
          .lerp(this.steamHaze, Math.min(life * 1.6, 1));
      }
    }
  }

  /**
   * The bridges' own lamps, in pairs on both parapets every DECK_LAMP_EVERY metres: slim masts
   * whose arms reach over the road with cool white heads, their light pooling on the deck.
   */
  private addDeckLamps(roadHalf: number): void {
    const metal = new MeshStandardMaterial({ color: 0x1c2030, metalness: 0.7, roughness: 0.35 });
    const lamp = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#e8f0ff'),
      emissiveIntensity: 3,
    });
    const mast = new BoxGeometry(0.16, DECK_LAMP_HEIGHT, 0.16);
    const arm = new BoxGeometry(DECK_LAMP_ARM, 0.12, 0.12);
    const head = new BoxGeometry(0.9, 0.14, 0.32);
    this.disposables.push(metal, lamp, mast, arm, head);
    const edge = roadHalf + KERB_WIDTH;
    for (let i = 0; i < DECK_LAMPS; i++) {
      const pair = new Group();
      for (const side of [-1, 1]) {
        const pole = new Mesh(mast, metal);
        pole.position.set(side * (edge + 0.1), KERB + DECK_LAMP_HEIGHT / 2, 0);
        const reach = new Mesh(arm, metal);
        reach.position.set(side * (edge + 0.1 - DECK_LAMP_ARM / 2), KERB + DECK_LAMP_HEIGHT, 0);
        const light = new Mesh(head, lamp);
        light.position.set(
          side * (edge + 0.1 - DECK_LAMP_ARM + 0.45),
          KERB + DECK_LAMP_HEIGHT - 0.12,
          0,
        );
        pair.add(pole, reach, light);
        this.streak(pair, '#dfe8ff', side * (edge - DECK_LAMP_ARM + 0.6), 0, -1, 12, 2.4, 1.8);
      }
      pair.visible = false;
      this.deckLamps.push(pair);
      this.group.add(pair);
    }
  }

  /**
   * The bridge's pylon: an A-frame over the road whose legs stand on the deck's edges, lit
   * along its edges, with a beacon at the top. Its stays fan down to both parapets.
   */
  private addPylon(roadHalf: number): void {
    const concrete = new MeshStandardMaterial({ color: 0x2a2e3c, roughness: 0.6 });
    const edgeLight = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#3fe0ff'),
      emissiveIntensity: 2,
    });
    const beacon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3,
    });
    const foot = roadHalf + 1.2;
    const leg = new BoxGeometry(1.2, Math.hypot(PYLON, foot), 1.6);
    const strip = new BoxGeometry(0.14, Math.hypot(PYLON, foot), 0.14);
    const lamp = new BoxGeometry(1, 1, 1);
    const stays = new LineBasicMaterial({ color: 0x9fdcff });
    this.disposables.push(concrete, edgeLight, beacon, leg, strip, lamp, stays);
    const lean = Math.atan2(foot, PYLON);
    for (const side of [-1, 1]) {
      const mesh = new Mesh(leg, concrete);
      mesh.position.set((side * foot) / 2, PYLON / 2, 0);
      mesh.rotation.z = side * lean;
      mesh.castShadow = true;
      const light = new Mesh(strip, edgeLight);
      light.position.set((side * foot) / 2, PYLON / 2, 0.85);
      light.rotation.z = side * lean;
      this.pylon.add(mesh, light);
    }
    const top = new Mesh(lamp, beacon);
    top.position.y = PYLON + 0.6;
    this.pylon.add(top);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(2 * 2 * 2 * CABLES * 3), 3),
    );
    this.disposables.push(geometry);
    this.cables = new LineSegments(geometry, stays);
    this.cables.frustumCulled = false;
    this.pylon.visible = false;
    this.cables.visible = false;
    this.group.add(this.pylon, this.cables);
  }

  /**
   * The working dock under the bridges: gantry cranes in rust-red steel with amber lamps along
   * their booms and red beacons on top, and barges moored with lit decks. Their lamps reflect
   * on the dock water. The group stands on the water at the bridge's start.
   */
  private addDock(): void {
    const steel = new MeshStandardMaterial({ color: 0x5a2c22, metalness: 0.5, roughness: 0.55 });
    const hull = new MeshStandardMaterial({ color: 0x14161e, metalness: 0.3, roughness: 0.7 });
    const amber = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ffb347'),
      emissiveIntensity: 3,
    });
    const red = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3.2,
    });
    const deck = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ffe2b0'),
      emissiveIntensity: 2,
    });
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(steel, hull, amber, red, deck, unit);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    for (const { along, x } of CRANES) {
      const crane = new Group();
      // The boom reaches out over the water towards the road.
      const out = -Math.sign(x);
      for (const lx of [-7, 7]) {
        for (const lz of [-6, 6]) {
          crane.add(box(steel, 1.2, CRANE_HEIGHT, 1.2, lx, CRANE_HEIGHT / 2, lz));
        }
        crane.add(box(steel, 1, 1, 12, lx, 12, 0));
      }
      crane.add(box(steel, 16, 1.2, 1.2, 0, CRANE_HEIGHT - 4, -6));
      crane.add(box(steel, 16, 1.2, 1.2, 0, CRANE_HEIGHT - 4, 6));
      crane.add(box(steel, BOOM, 2.4, 3, out * (BOOM / 2 - 12), CRANE_HEIGHT, 0));
      crane.add(box(steel, 3, 10, 3, 0, CRANE_HEIGHT + 6, 0));
      crane.add(box(red, 1.2, 1.2, 1.2, 0, CRANE_HEIGHT + 11.6, 0));
      crane.add(box(red, 1, 1, 1, out * (BOOM - 12), CRANE_HEIGHT + 1.8, 0));
      for (let b = -8; b < BOOM - 12; b += 8) {
        crane.add(box(amber, 0.6, 0.6, 0.6, out * b, CRANE_HEIGHT - 1.6, 1.6));
      }
      crane.position.set(x, 0, -along);
      this.dock.add(crane);
      this.streak(this.dock, '#ffb347', x + out * 20, 0.05, -along, 60, 10, 0.9);
    }
    for (const { along, x, length } of BARGES) {
      const barge = new Group();
      barge.add(box(hull, 12, 3, length, 0, 1, 0));
      barge.add(box(hull, 9, 4, 8, 0, 4.5, length / 2 - 6));
      for (let z = -length / 2 + 4; z < length / 2 - 10; z += 6) {
        barge.add(box(deck, 0.5, 0.5, 0.5, 5.6, 2.8, z));
        barge.add(box(deck, 0.5, 0.5, 0.5, -5.6, 2.8, z));
      }
      barge.add(box(deck, 7, 1, 0.3, 0, 5, length / 2 - 10.1));
      barge.position.set(x, 0, -along);
      this.dock.add(barge);
      this.streak(this.dock, '#ffe2b0', x, 0.05, -along - length / 2, length + 30, 9, 0.7);
    }
    this.dock.visible = false;
    this.group.add(this.dock);
  }

  /**
   * The night over the harbour city, in place of the physical sky, which is black at night:
   * the city's violet glow along the horizon fading to deep navy overhead, with faint stars.
   * It is drawn first, behind everything, untouched by fog or tone mapping.
   */
  /**
   * Storm clouds low over the city: a broad ceiling of torn cloud, lit violet from beneath by the
   * city's glow, drifting slowly inland. It thins the stars and hangs fog-free over everything.
   */
  private addClouds(): void {
    const texture = this.track(cloudsTexture());
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cloudTexture = texture;
    const material = new MeshBasicMaterial({
      color: new Color('#8a6cc0'),
      alphaMap: texture,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      side: DoubleSide,
    });
    const plane = new PlaneGeometry(CLOUD_SPAN, CLOUD_SPAN);
    this.disposables.push(material, plane);
    const ceiling = new Mesh(plane, material);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CLOUD_HEIGHT, -CLOUD_SPAN / 4);
    ceiling.renderOrder = -1;
    this.group.add(ceiling);
  }

  /**
   * A pale moon over the harbour, high on the left, beyond the storm clouds that veil it as
   * they drift past, with a wide soft halo of moonlight in the wet air around it.
   */
  private addMoon(): void {
    const disc = new SpriteMaterial({
      map: this.track(moonTexture()),
      color: new Color('#f4f1ff').multiplyScalar(1.3),
      fog: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.glow ??= this.track(glowTexture());
    const halo = new SpriteMaterial({
      map: this.glow,
      color: new Color('#9a8ad8').multiplyScalar(0.55),
      blending: AdditiveBlending,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.disposables.push(disc, halo);
    const [x, y, z] = MOON_AT;
    const glow = new Sprite(halo);
    glow.scale.setScalar(MOON_SIZE * 7);
    glow.position.set(x, y, z);
    const moon = new Sprite(disc);
    moon.scale.setScalar(MOON_SIZE);
    moon.position.set(x, y, z);
    // Drawn just after the sky, before the clouds that pass in front of it.
    glow.renderOrder = -1;
    moon.renderOrder = -1;
    this.group.add(glow, moon);
  }

  /**
   * A giant neon sign high over the far end of the street: a cyclist drawn in glowing tubes,
   * wheels and frame in cyan, rider in pink, pedalling as the ride goes on. Untouched by fog,
   * it keeps its distance like the skyline it hangs on.
   */
  private addCyclistSign(): void {
    const cyan = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.8),
      fog: false,
      toneMapped: false,
    });
    const pink = new MeshBasicMaterial({
      color: new Color('#ff4fd8').multiplyScalar(1.8),
      fog: false,
      toneMapped: false,
    });
    const ring = new TorusGeometry(1, 0.06, 6, 40);
    const tube = new BoxGeometry(1, 0.12, 0.12);
    const ball = new SphereGeometry(0.32, 12, 10);
    this.disposables.push(cyan, pink, ring, tube, ball);
    // A tube from (x1, y1) to (x2, y2), centred so it can be pivoted from its start.
    const stroke = (material: Material, x1: number, y1: number, x2: number, y2: number) => {
      const mesh = new Mesh(tube, material);
      mesh.scale.x = Math.hypot(x2 - x1, y2 - y1);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
      mesh.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      return mesh;
    };
    const sign = new Group();
    for (const wx of [-2.1, 2.1]) {
      const w = new Mesh(ring, cyan);
      w.position.set(wx, 0, 0);
      sign.add(w);
    }
    sign.add(
      stroke(cyan, -2.1, 0, 0, 0),
      stroke(cyan, 0, 0, -0.6, 1.9),
      stroke(cyan, -0.6, 1.9, 1.5, 1.9),
      stroke(cyan, 0, 0, 1.5, 1.9),
      stroke(cyan, -2.1, 0, -0.6, 1.9),
      stroke(cyan, 1.5, 1.9, 2.1, 0),
      stroke(cyan, 1.5, 1.9, 1.7, 2.5),
      // The rider: back, arm and head, leaning to the bars.
      stroke(pink, -0.6, 2.2, 1.0, 3.5),
      stroke(pink, 1.0, 3.5, 1.7, 2.5),
    );
    const head = new Mesh(ball, pink);
    head.position.set(1.35, 4.0, 0);
    sign.add(head);
    // The cranks turn about the bottom bracket; each leg follows its pedal.
    const crank = new Group();
    const arm = stroke(cyan, -0.55, 0, 0.55, 0);
    crank.add(arm);
    sign.add(crank);
    const legs: { thigh: Mesh; shin: Mesh; side: number }[] = [];
    for (const side of [1, -1]) {
      const thigh = new Mesh(tube, pink);
      const shin = new Mesh(tube, pink);
      sign.add(thigh, shin);
      legs.push({ thigh, shin, side });
    }
    this.cyclist = { crank, legs };
    this.pedal(0);
    sign.scale.setScalar(CYCLIST_SIZE / 6);
    const [x, y, z] = CYCLIST_AT;
    sign.position.set(x, y, z);
    this.farShore.add(sign);
  }

  /**
   * Fireworks over the harbour: each shell climbs from the far shore, bursts into a sphere of
   * glowing sparks that spreads, sags and fades, then the next goes up. Held mid-burst when the
   * clock is still, as for reduced motion.
   */
  private addFireworks(): void {
    const random = seeded(389);
    this.glow ??= this.track(glowTexture());
    const glow = this.glow;
    const spark = new PlaneGeometry(FIREWORK_SPARK, FIREWORK_SPARK);
    this.disposables.push(spark);
    for (const { at, hex, from } of FIREWORKS) {
      const directions: number[] = [];
      for (let k = 0; k < FIREWORK_SPARKS; k++) {
        // Evenly over a sphere, each spark a little faster or slower than the rest.
        const y = random() * 2 - 1;
        const around = random() * Math.PI * 2;
        const flat = Math.sqrt(1 - y * y);
        const speed = 0.75 + random() * 0.25;
        directions.push(
          flat * Math.cos(around) * speed,
          y * speed,
          flat * Math.sin(around) * speed,
        );
      }
      // Each spark a small glowing quad facing the rider: point sizes are not honoured by every
      // renderer backend, so points would shrink to single pixels.
      const material = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(3),
        map: glow,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      });
      this.disposables.push(material);
      const sparks = new InstancedMesh(spark, material, FIREWORK_SPARKS);
      sparks.frustumCulled = false;
      this.farShore.add(sparks);
      this.fireworks.push({ sparks, at, from, directions });
    }
    this.burst(0, true);
  }

  /**
   * Lightning over the far shore: forked bolts of glowing light, each a jagged trunk with a
   * branch or two, drawn from their own sequence. One strikes every LIGHTNING_EVERY seconds.
   */
  private addLightning(): void {
    const random = seeded(433);
    const material = new MeshBasicMaterial({
      color: new Color('#e6dcff').multiplyScalar(3),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      side: DoubleSide,
    });
    this.disposables.push(material);
    for (const [x, z] of LIGHTNING_AT) {
      const quads: number[] = [];
      // A quad from (x1, y1) to (x2, y2), `w` wide, facing the rider.
      const segment = (x1: number, y1: number, x2: number, y2: number, w: number) => {
        const length = Math.hypot(x2 - x1, y2 - y1);
        const nx = (-(y2 - y1) / length) * (w / 2);
        const ny = ((x2 - x1) / length) * (w / 2);
        quads.push(
          x1 - nx,
          y1 - ny,
          0,
          x1 + nx,
          y1 + ny,
          0,
          x2 + nx,
          y2 + ny,
          0,
          x1 - nx,
          y1 - ny,
          0,
          x2 + nx,
          y2 + ny,
          0,
          x2 - nx,
          y2 - ny,
          0,
        );
      };
      const fork = (fx: number, fy: number, bottom: number, w: number, steps: number) => {
        let px = fx;
        let py = fy;
        const drop = (fy - bottom) / steps;
        for (let k = 0; k < steps; k++) {
          const nx = px + (random() - 0.5) * drop * 1.4;
          const ny = py - drop * (0.7 + random() * 0.6);
          segment(px, py, nx, ny, w);
          // Now and then a thinner branch splits off and dies away.
          if (w > 2 && random() < 0.22) fork(nx, ny, ny - drop * 4, w * 0.45, 4);
          px = nx;
          py = ny;
        }
      };
      fork(0, LIGHTNING_TOP, LIGHTNING_FOOT, LIGHTNING_WIDE, 16);
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(quads), 3));
      this.disposables.push(geometry);
      const bolt = new Mesh(geometry, material);
      bolt.position.set(x, 0, z);
      bolt.frustumCulled = false;
      bolt.visible = false;
      this.farShore.add(bolt);
      this.bolts.push(bolt);
    }
  }

  /**
   * Shows the bolt striking now, if any, and lights the sky with it for the first second of
   * its round. None for reduced motion.
   */
  private strike(seconds: number, still: boolean): void {
    const round = Math.floor(seconds / LIGHTNING_EVERY);
    const into = seconds - round * LIGHTNING_EVERY;
    const flash = !still && seconds >= LIGHTNING_EVERY && into < 1 ? 1 : 0;
    this.bolts.forEach((bolt, i) => {
      bolt.visible = flash > 0 && round % this.bolts.length === i;
    });
    this.skyMaterial?.color.setScalar(1 + flash * LIGHTNING_SKY);
  }

  /** Moves each firework's sparks to where they are `seconds` into the show. */
  private burst(seconds: number, still: boolean): void {
    const dummy = this.sparkDummy;
    for (const { sparks, at, from, directions } of this.fireworks) {
      const t = still ? 0.45 : (seconds / FIREWORK_PERIOD + from) % 1;
      const material = sparks.material as MeshBasicMaterial;
      const put = (k: number, px: number, py: number, pz: number) => {
        dummy.position.set(px, py, pz);
        dummy.updateMatrix();
        sparks.setMatrixAt(k, dummy.matrix);
      };
      const [x, y, z] = at;
      if (t < FIREWORK_RISE) {
        // The shell climbing: its sparks bunched in a short trail beneath it.
        const top = y - (1 - t / FIREWORK_RISE) * 110;
        for (let k = 0; k < FIREWORK_SPARKS; k++) {
          put(k, x, top - (k % 14) * 0.9, z);
        }
        material.opacity = 0.8;
      } else {
        const u = (t - FIREWORK_RISE) / (1 - FIREWORK_RISE);
        const reach = FIREWORK_REACH * (1 - (1 - u) ** 3);
        const sag = 50 * u * u;
        for (let k = 0; k < FIREWORK_SPARKS; k++) {
          put(
            k,
            x + directions[k * 3]! * reach,
            y + directions[k * 3 + 1]! * reach - sag,
            z + directions[k * 3 + 2]! * reach,
          );
        }
        material.opacity = (1 - u) ** 1.4;
      }
      sparks.instanceMatrix.needsUpdate = true;
    }
  }

  /** Runs the glass lifts up and down their towers, easing in and out at each end. */
  private ride(seconds: number): void {
    for (const { car, low, high, phase } of this.lifts) {
      const t = seconds / LIFT_PERIOD + phase;
      car.position.y = low + ((high - low) * (1 - Math.cos(t * Math.PI * 2))) / 2;
    }
  }

  /** Turns the neon cyclist's cranks and bends its legs to follow the pedals. */
  private pedal(seconds: number): void {
    if (!this.cyclist) return;
    const angle = -seconds * CYCLIST_CADENCE;
    this.cyclist.crank.rotation.z = angle;
    const hip = { x: -0.6, y: 2.2 };
    const thigh = 1.35;
    const shin = 1.35;
    const place = (mesh: Mesh, x1: number, y1: number, x2: number, y2: number) => {
      mesh.scale.x = Math.hypot(x2 - x1, y2 - y1);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
      mesh.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    };
    for (const leg of this.cyclist.legs) {
      const a = angle + (leg.side > 0 ? 0 : Math.PI);
      const px = Math.cos(a) * 0.55;
      const py = Math.sin(a) * 0.55;
      // The knee, solved from the hip and the pedal, bending forward.
      const dx = px - hip.x;
      const dy = py - hip.y;
      const d = Math.min(Math.hypot(dx, dy), thigh + shin - 0.01);
      const along = (thigh * thigh - shin * shin + d * d) / (2 * d);
      const up = Math.sqrt(Math.max(0, thigh * thigh - along * along));
      const ux = dx / d;
      const uy = dy / d;
      const kx = hip.x + ux * along - uy * up;
      const ky = hip.y + uy * along + ux * up;
      place(leg.thigh, hip.x, hip.y, kx, ky);
      place(leg.shin, kx, ky, px, py);
    }
  }

  private addSky(): void {
    const texture = this.track(nightSkyTexture());
    const material = new MeshBasicMaterial({
      map: texture,
      side: BackSide,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    });
    const dome = new SphereGeometry(SKY_RADIUS, 48, 24);
    this.disposables.push(material, dome);
    this.skyMaterial = material;
    const sky = new Mesh(dome, material);
    sky.renderOrder = -1;
    sky.frustumCulled = false;
    this.group.add(sky);
  }

  /**
   * A harbour ferry crossing the water: a dark hull with a lit stripe, two decks of warm lit
   * windows, a funnel, a mast light, and a pale wake trailing behind it.
   */
  private addFerry(): void {
    const hull = new MeshStandardMaterial({ color: 0x141826, roughness: 0.5 });
    const white = new MeshBasicMaterial({ color: new Color('#e8e6f0').multiplyScalar(0.8) });
    const stripe = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(2),
      toneMapped: false,
    });
    const windows = new MeshBasicMaterial({
      map: this.track(ferryWindowTexture()),
      color: new Color(0xffffff).multiplyScalar(1.6),
      toneMapped: false,
    });
    const lamp = new MeshBasicMaterial({
      color: new Color('#ffffff').multiplyScalar(3),
      toneMapped: false,
    });
    const wakeMaterial = new MeshBasicMaterial({
      map: this.track(wakeTexture()),
      color: new Color('#cfe8ff').multiplyScalar(0.9),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const wakePlane = new PlaneGeometry(1, 1);
    this.disposables.push(hull, white, stripe, windows, lamp, wakeMaterial, unit, wakePlane);
    const sailing = new Group();
    const part = (
      material: MeshBasicMaterial | MeshStandardMaterial,
      size: number[],
      at: number[],
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(size[0]!, size[1]!, size[2]!);
      mesh.position.set(at[0]!, at[1]!, at[2]!);
      sailing.add(mesh);
    };
    const long = FERRY_LONG;
    part(hull, [long, 2.6, 9], [0, 0.9, 0]);
    part(stripe, [long + 0.1, 0.3, 9.1], [0, 1.9, 0]);
    part(windows, [long * 0.8, 2.6, 7.6], [-1, 3.5, 0]);
    part(white, [long * 0.82, 0.3, 8], [-1, 4.9, 0]);
    part(windows, [long * 0.5, 2.2, 6.4], [-3, 6.1, 0]);
    part(white, [long * 0.52, 0.3, 6.8], [-3, 7.3, 0]);
    part(hull, [2.2, 3.4, 2.2], [-long * 0.28, 9, 0]);
    part(stripe, [2.3, 0.5, 2.3], [-long * 0.28, 10.2, 0]);
    part(white, [0.25, 6, 0.25], [long * 0.12, 10.3, 0]);
    part(lamp, [0.7, 0.7, 0.7], [long * 0.12, 13.4, 0]);
    const wake = new Mesh(wakePlane, wakeMaterial);
    wake.rotation.x = -Math.PI / 2;
    wake.scale.set(FERRY_WAKE, 8, 1);
    wake.position.y = 0.35;
    sailing.add(wake);
    const placed = new Group();
    placed.add(sailing);
    this.group.add(placed);
    this.ferry = { placed, sailing, wake };
  }

  /**
   * Sails the ferry out across the harbour and back, its bow and wake turning with it. At rest
   * it holds mid-crossing, near the quay.
   */
  private sail(seconds: number): void {
    if (!this.ferry) return;
    const { sailing, wake } = this.ferry;
    const t = (seconds / FERRY_PERIOD) * Math.PI * 2 + FERRY_PHASE;
    sailing.position.x = FERRY_MID + Math.sin(t) * FERRY_REACH;
    // Heading towards the road while the sine rises, out to sea while it falls.
    const way = Math.cos(t) >= 0 ? 1 : -1;
    sailing.scale.x = way;
    wake.position.x = -(FERRY_LONG + FERRY_WAKE) / 2 + 2;
  }

  /**
   * Boats moored along the harbour quay: white hulls, cabins lit in warm or neon light, a mast
   * lamp, and their light lying on the water. `back` is the quay's edge from the road's centre.
   */
  private addBoats(back: number): void {
    const hull = new MeshStandardMaterial({ color: 0xc9ccd6, roughness: 0.4, metalness: 0.1 });
    const trim = new MeshStandardMaterial({ color: 0x1a1d28, roughness: 0.5 });
    const unit = new BoxGeometry(1, 1, 1);
    const bow = new CylinderGeometry(0.5, 0.5, 1, 3, 1);
    this.disposables.push(hull, trim, unit, bow);
    const glow = new Map<string, MeshStandardMaterial>();
    const lit = (hex: string) => {
      let material = glow.get(hex);
      if (!material) {
        material = new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.4,
        });
        glow.set(hex, material);
        this.disposables.push(material);
      }
      return material;
    };
    for (const { offset, out, length, hex } of BOATS) {
      const boat = new Group();
      const beam = length * 0.3;
      const add = (
        geometry: BufferGeometry,
        material: Material,
        w: number,
        h: number,
        d: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(geometry, material);
        mesh.scale.set(w, h, d);
        mesh.position.set(0, y, z);
        boat.add(mesh);
        return mesh;
      };
      add(unit, hull, beam, 1.4, length * 0.8, 0.5, length * 0.1);
      // The bow comes to a point towards the rider's way.
      const point = add(bow, hull, beam / Math.sqrt(3), 1.4, beam * 0.5, 0.5, -length * 0.3);
      point.rotation.y = Math.PI / 6;
      point.scale.set((beam / Math.sqrt(3)) * 2, 1.4, length * 0.2 * 2);
      add(unit, trim, beam * 1.02, 0.25, length * 0.8, 1.15, length * 0.1);
      add(unit, hull, beam * 0.7, 1.6, length * 0.4, 2.1, length * 0.15);
      add(unit, lit(hex), beam * 0.72, 0.55, length * 0.38, 2.3, length * 0.15);
      add(unit, trim, 0.12, length * 0.3, 0.12, 2.9 + length * 0.15, length * 0.05);
      add(unit, lit('#f2f4ff'), 0.4, 0.4, 0.4, 3 + length * 0.3, length * 0.05);
      this.streak(boat, hex, 0, 0.26, 0, length * 2.5, beam * 0.9, 0.8);
      boat.position.x = -(back + out + beam / 2);
      boat.visible = false;
      this.group.add(boat);
      this.boats.push({ mesh: boat, offset });
    }
  }

  /**
   * An elevated railway across the street: a concrete deck on piers between the road and the
   * towers, lit cyan along its underside, with a train standing on it, its windows lit warm
   * and its ends lit with headlamps and tail lamps.
   */
  private addSkytrain(roadHalf: number): void {
    const concrete = new MeshStandardMaterial({ color: 0x2a2d3a, roughness: 0.7 });
    const body = new MeshStandardMaterial({ color: 0xb8bcc8, metalness: 0.5, roughness: 0.35 });
    const glow = (hex: string, intensity: number) =>
      new MeshStandardMaterial({
        color: 0x000000,
        emissive: new Color(hex),
        emissiveIntensity: intensity,
      });
    const cyan = glow('#3fe0ff', 2.6);
    const windows = glow('#ffe2b0', 2.2);
    const head = glow('#f2f4ff', 3.2);
    const tail = glow('#ff2a2a', 3);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(concrete, body, cyan, windows, head, tail, unit);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      parent: Group = this.skytrain,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, 0);
      parent.add(mesh);
    };
    // The deck runs from inside the far shore's towers, over the harbour and the street, into
    // the towers beyond the street, so the train comes and goes out of sight.
    const span = RAIL_EAST - RAIL_WEST;
    const middle = (RAIL_EAST + RAIL_WEST) / 2;
    box(concrete, span, 1.6, 7, middle, RAIL_DECK - 0.8);
    box(cyan, span, 0.12, 0.25, middle, RAIL_DECK - 1.65);
    box(concrete, span, 0.9, 0.3, middle, RAIL_DECK + 0.45);
    const piers = [-(roadHalf + 4), roadHalf + 4];
    for (let x = -60; x > RAIL_WEST + 20; x -= 60) piers.push(x);
    for (const x of piers) {
      box(concrete, 2.2, RAIL_DECK - 1.6, 2.2, x, (RAIL_DECK - 1.6) / 2);
    }
    // Where the line crosses the street: light bars under the deck, neon bands round the two
    // piers at the kerbs, and the line's lit name on the deck's face towards the riders.
    const pink = glow('#ff4fd8', 2.6);
    this.disposables.push(pink);
    for (let k = 0; k < 5; k++) {
      const bar = new Mesh(unit, k % 2 === 0 ? cyan : pink);
      bar.scale.set(2 * roadHalf + 4, 0.1, 0.22);
      bar.position.set(0, RAIL_DECK - 1.66, -2.8 + k * 1.4);
      this.skytrain.add(bar);
    }
    for (const x of piers.slice(0, 2)) {
      for (let k = 0; k < 3; k++) {
        const band = new Mesh(unit, k === 1 ? pink : cyan);
        band.scale.set(2.3, 0.18, 2.3);
        band.position.set(x, 2 + k * 3.2, 0);
        this.skytrain.add(band);
      }
    }
    const nameTexture = this.track(lineSignTexture());
    // Bright enough to read through the rain and haze at a hundred metres and more.
    const name = new MeshBasicMaterial({
      map: nameTexture,
      color: new Color(0xffffff).multiplyScalar(2.2),
      toneMapped: false,
    });
    const plate = new PlaneGeometry(LINE_SIGN_WIDE, LINE_SIGN_WIDE / 10);
    this.disposables.push(name, plate);
    for (const way of [1, -1]) {
      const sign = new Mesh(plate, name);
      sign.position.set(0, RAIL_DECK - 0.8, way * 3.52);
      if (way < 0) sign.rotation.y = Math.PI;
      this.skytrain.add(sign);
    }
    this.streak(this.skytrain, '#ff4fd8', 0, 0.02, 3, 8, 2 * roadHalf, 0.6);
    const train = this.train;
    // Three cars, nose to tail across the street, the lead car over the road's right half.
    const car = 19;
    for (let k = 0; k < 3; k++) {
      const x = 22 - k * (car + 1);
      box(body, car, 3.4, 3.2, x, RAIL_DECK + 2.1, train);
      box(windows, car - 2, 1.1, 3.25, x, RAIL_DECK + 2.6, train);
      box(cyan, car, 0.18, 3.25, x, RAIL_DECK + 1.1, train);
    }
    box(head, 0.2, 0.5, 2.4, 22 + car / 2 + 0.1, RAIL_DECK + 1.6, train);
    box(tail, 0.2, 0.5, 2.4, 22 - 2 * (car + 1) - car / 2 - 0.1, RAIL_DECK + 1.6, train);
    this.skytrain.add(train);
    this.streak(this.skytrain, '#3fe0ff', 0, 0.02, -3, 10, 2 * roadHalf, 0.7);
    this.skytrain.visible = false;
    this.group.add(this.skytrain);
  }

  /** Tells the street which stretches of the road ahead are bridge ramps. */
  setBridge(onBridge: (metres: number) => boolean, starts: readonly number[]): void {
    this.onBridge = onBridge;
    this.bridgeStarts = starts;
  }

  /** Stands the pylon PYLON_INTO metres onto the bridge in view, and hangs its stays. */
  private placePylon(heightAt: (metres: number) => number): void {
    const cables = this.cables;
    if (!cables) return;
    // The first bridge whose pylon is still in view, behind the camera or ahead.
    const start = this.bridgeStarts.find((m) => m + PYLON_INTO > -30 && m + PYLON_INTO < 300);
    const at = start === undefined ? 0 : start + PYLON_INTO;
    const visible = start !== undefined;
    this.pylon.visible = visible;
    cables.visible = visible;
    if (!visible) return;
    const base = heightAt(Math.max(at, 0));
    this.pylon.position.set(0, base, -at);
    const position = cables.geometry.getAttribute('position') as BufferAttribute;
    const edge = this.roadHalf + KERB_WIDTH;
    let v = 0;
    for (const side of [-1, 1]) {
      for (const way of [-1, 1]) {
        for (let k = 1; k <= CABLES; k++) {
          const m = at + way * k * CABLE_EVERY;
          position.setXYZ(v++, (side * 0.6 * (PYLON - k)) / PYLON, base + PYLON - 1 - k * 0.6, -at);
          position.setXYZ(v++, side * edge, heightAt(Math.max(m, 0)) + KERB + PARAPET, -m);
        }
      }
    }
    position.needsUpdate = true;
  }

  /** A strip along the road whose cross-section is `profile`: [x, height above the road]. */
  private ribbon(
    points: number,
    material: Material,
    profile: [number, number][],
    bridge?: [number, number][],
    sink = false,
  ): void {
    const n = profile.length;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(points * n * 3), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(points * n * 2), 2));
    const index: number[] = [];
    for (let i = 0; i < points - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        const a = i * n + j;
        index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
      }
    }
    geometry.setIndex(index);
    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    this.ribbons.push({ geometry, profile, bridge, sink });
    this.disposables.push(geometry);
  }

  /** Lays the quay over the road's points; its slabs move with the rider's distance `s`. */
  lay(points: readonly { metres: number; height: number }[], s: number): void {
    const bridged = points.map((p) => this.onBridge(Math.max(p.metres, 0)));
    this.dockLevel = Math.min(...points.map((p) => p.height)) - DOCK_DROP;
    for (const { geometry, profile, bridge, sink } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      const n = profile.length;
      points.forEach((p, i) => {
        const section = bridge && bridged[i] ? bridge : profile;
        const base = sink && bridged[i] ? this.dockLevel : p.height;
        section.forEach(([x, y], j) => {
          position.setXYZ(i * n + j, x, base + y, -p.metres);
          uv.setXY(i * n + j, x, p.metres + s);
        });
      });
      position.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
  }

  /**
   * Lowers the renderer's ground under each bridge below the dock water, so the deck stands
   * over open water. `ground` is laid over `points`, two vertices to a point.
   */
  sink(ground: BufferGeometry, points: readonly { metres: number }[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    let sunk = false;
    points.forEach((p, i) => {
      if (!this.onBridge(Math.max(p.metres, 0))) return;
      position.setY(i * 2, this.dockLevel - 1.5);
      position.setY(i * 2 + 1, this.dockLevel - 1.5);
      sunk = true;
    });
    if (!sunk) return;
    position.needsUpdate = true;
    ground.computeVertexNormals();
    ground.computeBoundingSphere();
  }

  /** Moves each tower to its place along the loop for the rider's distance `s`. */
  place(s: number, heightAt: (metres: number) => number): void {
    this.riderS = s;
    this.placeDrips(s, heightAt);
    for (const drop of this.splashes) {
      const metres = drop.at - s;
      drop.mesh.position.set(drop.x, heightAt(Math.max(metres, 0)) + 0.02, -metres);
    }
    for (const tower of this.towers) {
      const metres = ((((tower.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const height = tower.mesh.userData['height'] as number;
      // A bridge crosses open dock: no tower stands beside it.
      tower.mesh.visible = ![-tower.depth / 2, 0, tower.depth / 2].some((d) =>
        this.onBridge(Math.max(metres + d, 0)),
      );
      tower.mesh.position.set(
        tower.side * (this.roadHalf + SETBACK + tower.width / 2),
        heightAt(Math.max(metres, 0)) + (height - FOOTING) / 2,
        -metres,
      );
    }
    this.lamps.forEach((lamp, i) => {
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + LAMP_FIRST;
      lamp.position.set(i % 2 === 0 ? -LAMP_OUT : LAMP_OUT, heightAt(metres), -metres);
      lamp.visible = !this.onBridge(Math.max(metres, 0));
      // Close by, the globe is above the view and its halo would swell across the sky.
      (lamp.userData['bloom'] as Sprite).visible = metres > LAMP_HALO_NEAR;
    });
    const rail = ((((SKYTRAIN - s) % LOOP) + LOOP) % LOOP) - BEHIND;
    this.skytrain.visible = !this.onBridge(Math.max(rail, 0));
    this.skytrain.position.set(0, heightAt(Math.max(rail, 0)), -rail);
    this.rain?.position.set(0, heightAt(0), 0);
    if (this.ferry) {
      const metres = ((((FERRY_OFFSET - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      this.ferry.placed.visible = !this.onBridge(Math.max(metres, 0));
      this.ferry.placed.position.set(0, heightAt(Math.max(metres, 0)) - 0.3, -metres);
    }
    for (const boat of this.boats) {
      const metres = ((((boat.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      boat.mesh.visible = !this.onBridge(Math.max(metres, 0));
      // Boats ride on the harbour water, level with the quay.
      boat.mesh.position.y = heightAt(Math.max(metres, 0)) - 0.3;
      boat.mesh.position.z = -metres;
    }
    for (const school of this.koiSchools) {
      const metres = ((((school.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      school.group.visible = !this.onBridge(Math.max(metres, 0));
      school.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const walker of this.walkers) {
      const metres = ((((walker.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      walker.group.visible = !this.onBridge(Math.max(metres, 0));
      walker.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const machine of this.machines) {
      const metres = ((((machine.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      machine.group.visible = !this.onBridge(Math.max(metres, 0));
      machine.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const gate of this.gates) {
      const metres = ((((gate.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      gate.group.visible = !this.onBridge(Math.max(metres, 0));
      gate.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const crossing of this.crossings) {
      const metres = ((((crossing.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      crossing.group.visible = !this.onBridge(Math.max(metres, 0));
      crossing.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
      // Close up, a beacon's halo would swell to fill the view: it shows only further off.
      for (const bloom of crossing.blooms) bloom.visible = metres > BEACON_HALO_NEAR;
    }
    for (const symbol of this.laneSymbols) {
      const metres = ((((symbol.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      symbol.group.visible = !this.onBridge(Math.max(metres, 0));
      symbol.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const drone of this.drones) {
      const metres = ((((drone.at - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      drone.group.visible = metres < DRONE_REACH;
      drone.group.position.z = -metres;
      drone.group.userData['ground'] ??= drone.group.position.y;
      const cruise = drone.group.userData['ground'] as number;
      drone.group.position.y = cruise + climb(drone.at, cruise) + heightAt(Math.max(metres, 0));
    }
    for (const bridge of this.skybridges) {
      const metres = ((((bridge.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      bridge.group.visible = !this.onBridge(Math.max(metres, 0));
      bridge.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const puddle of this.puddles) {
      const metres = ((((puddle.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      puddle.mesh.visible = !this.onBridge(Math.max(metres, 0));
      puddle.mesh.position.z = -metres;
      puddle.mesh.userData['y'] ??= puddle.mesh.position.y;
      puddle.mesh.position.y =
        (puddle.mesh.userData['y'] as number) + heightAt(Math.max(metres, 0));
    }
    for (const rank of this.taxiRanks) {
      const metres = ((((rank.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      rank.group.visible = !this.onBridge(Math.max(metres, 0));
      rank.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const row of this.mopeds) {
      const metres = ((((row.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      row.group.visible = !this.onBridge(Math.max(metres, 0));
      row.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const rack of this.bikeRacks) {
      const metres = ((((rack.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      rack.group.visible = !this.onBridge(Math.max(metres, 0));
      rack.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const shelter of this.shelters) {
      const metres = ((((shelter.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      shelter.group.visible = !this.onBridge(Math.max(metres, 0));
      shelter.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const tree of this.trees) {
      const metres = ((((tree.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      tree.group.visible = !this.onBridge(Math.max(metres, 0));
      tree.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const bollard of this.bollards) {
      const metres = ((((bollard.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      bollard.metres = metres;
      bollard.group.visible = !this.onBridge(Math.max(metres, 0));
      bollard.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const stall of this.stalls) {
      const metres = ((((stall.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      stall.group.visible = !this.onBridge(Math.max(metres, 0));
      stall.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const lantern of this.lanterns) {
      const metres = ((((lantern.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      lantern.group.visible = !this.onBridge(Math.max(metres, 0));
      lantern.group.position.set(0, heightAt(Math.max(metres, 0)) + LANTERN_HEIGHT, -metres);
      // Overhead and close, a bulb's halo would swell to fill the sky: it shows only further off.
      const far = metres > LANTERN_HALO_NEAR;
      for (const bloom of lantern.blooms) bloom.visible = far;
    }
    for (const vent of this.vents) {
      const metres = ((((vent.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      vent.group.visible = !this.onBridge(Math.max(metres, 0));
      vent.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    this.deckLamps.forEach((pair, i) => {
      const metres = i * DECK_LAMP_EVERY - (s % DECK_LAMP_EVERY) + 4;
      pair.visible = this.onBridge(Math.max(metres, 0));
      pair.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    });
    this.placePylon(heightAt);
    // The dock stands on the water beside the bridge in view, from the bridge's start.
    const start = this.bridgeStarts.find((m) => m > -520 && m < 300);
    this.dock.visible = start !== undefined;
    if (start !== undefined) this.dock.position.set(0, this.dockLevel, -start);
    this.skyline.position.set(0, heightAt(1e6) - 4, -SKYLINE_AHEAD);
    this.farShore.position.set(0, heightAt(0), 0);
  }
}

/** A box whose side faces repeat the window tile once every TILE metres. */
function towerGeometry(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const uv = geometry.getAttribute('uv');
  // Four vertices per face, faces in the order +x, -x, +y, -y, +z, -z.
  const across = [depth, depth, width, width, width, width];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, (uv.getX(i) * across[face]!) / TILE, (uv.getY(i) * height) / TILE);
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * A façade at night: dark glazing in a grid of floors and bays, a `share` of the windows lit
 * in one of the `lit` colours. The same texture is the emissive map, so only the lit windows
 * glow.
 */
function windowTexture(base: string, lit: string[], share: number, seed: number): CanvasTexture {
  const size = 256;
  const cols = 16;
  const rows = 7;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const w = size / cols;
    const h = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = random() < share;
        ctx.fillStyle = on ? lit[Math.floor(random() * lit.length)]! : base;
        ctx.globalAlpha = on ? 0.55 + random() * 0.45 : 1;
        ctx.fillRect(c * w + 3, r * h + 6, w - 6, h - 16);
      }
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The haze's alpha up its height: dense at the foot, gone by the top. */
function hazeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Along a beam (v from the lamp to its far end): bright at the lamp, fading out into the sky. */
function beamTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Canvas y runs from the far end (top) down to the lamp (bottom).
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  return new CanvasTexture(canvas);
}

/**
 * The holographic globe's skin, wrapped round it: faint cyan meridians and parallels, and
 * continents in pink dots, on black that adds nothing.
 */
function holoGlobeTexture(): CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(95,242,255,0.55)';
    ctx.lineWidth = 3;
    for (let k = 0; k <= 12; k++) {
      ctx.beginPath();
      ctx.moveTo((k * w) / 12, 0);
      ctx.lineTo((k * w) / 12, h);
      ctx.stroke();
    }
    for (let k = 1; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(0, (k * h) / 6);
      ctx.lineTo(w, (k * h) / 6);
      ctx.stroke();
    }
    // Continents: clusters of dots scattered round a handful of centres, kept off the poles.
    const random = seeded(443);
    ctx.fillStyle = 'rgba(255,79,216,0.95)';
    for (let c = 0; c < 9; c++) {
      const cx = random() * w;
      const cy = h * (0.22 + random() * 0.56);
      const spread = 40 + random() * 70;
      for (let d = 0; d < 260; d++) {
        const a = random() * Math.PI * 2;
        const r = Math.sqrt(random()) * spread;
        const dx = Math.round((cx + Math.cos(a) * r * 1.6) / 8) * 8;
        const dy = Math.round((cy + Math.sin(a) * r) / 8) * 8;
        ctx.beginPath();
        ctx.arc(((dx % w) + w) % w, dy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The ring round the holographic globe: a bright inner edge, dashes, and a faint outer edge. */
function holoRingTexture(): CanvasTexture {
  // RingGeometry's uv maps the ring onto a square; draw the rings concentric in it.
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const c = size / 2;
    // The ring spans 1.3 to 1.55 radii, mapped so 1.55 meets the square's edge.
    const inner = (c * 1.3) / 1.55;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(c, c, inner + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([22, 12]);
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(c, c, (inner + c) / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(c, c, c - 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A koi's skin, wrapped round its body: a ground colour with soft patches of another. */
function koiTexture(ground: string, patch: string, random: () => number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, 128, 64);
    // Three bold blotches over the back, as on a kohaku or a sanke, and a few small ones.
    ctx.fillStyle = patch;
    for (let k = 0; k < 6; k++) {
      const big = k < 3;
      ctx.beginPath();
      ctx.ellipse(
        random() * 128,
        8 + random() * 48,
        big ? 22 + random() * 18 : 5 + random() * 5,
        big ? 9 + random() * 8 : 4 + random() * 3,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // Faint scales over it all.
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let y = 4; y < 64; y += 6) {
      for (let x = (y / 6) % 2 ? 0 : 3; x < 128; x += 6) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI);
        ctx.stroke();
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A laser beam's fade along its length: bright at the emitter (u = 0), gone at its far end. */
function laserTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The blimp's side screen: an advert in bright type on a gradient, framed in light. */
function blimpTexture(): CanvasTexture {
  const w = 512;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#2a0b4a');
    g.addColorStop(0.5, '#7a1f8f');
    g.addColorStop(1, '#2a0b4a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5ff2ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff4fd8';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HARBOUR NIGHTS', w / 2, h / 2 + 2, w - 40);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** A ferry deck's windows: a row of warm lit panes between dark frames. */
function ferryWindowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1a1726';
    ctx.fillRect(0, 0, 256, 32);
    for (let x = 4; x < 256; x += 16) {
      ctx.fillStyle = (x / 16) % 5 === 2 ? '#ffb86a' : '#ffe2b0';
      ctx.fillRect(x, 7, 11, 18);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** A wake on the water: bright foam at the stern (right) thinning to nothing (left). */
function wakeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const along = ctx.createLinearGradient(0, 0, 128, 0);
    along.addColorStop(0, 'rgba(255,255,255,0)');
    along.addColorStop(1, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = along;
    ctx.fillRect(0, 0, 128, 32);
    // Narrow towards the far end, as the wake spreads and fades.
    ctx.globalCompositeOperation = 'destination-in';
    const across = ctx.createLinearGradient(0, 0, 0, 32);
    across.addColorStop(0, 'rgba(0,0,0,0)');
    across.addColorStop(0.5, 'rgba(0,0,0,1)');
    across.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = across;
    ctx.fillRect(0, 0, 128, 32);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A lighthouse tower's bands: red and white, two of each up its height. */
function lighthouseTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = k % 2 ? '#f2eee6' : '#c8202e';
      ctx.fillRect(0, k * 16, 8, 16);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A lighthouse beam's fade: bright at the lantern (the cone's tip, v = 1), gone at its mouth. */
function lighthouseBeamTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.3)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A soft round glow, white at its heart and fading to nothing at its edge. */
function glowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

/**
 * A screen's face, twice as wide as it shows so it can scroll: bold words over a neon gradient
 * with scan lines, read from the street.
 */
function screenTexture(words: string, i: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 232;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const [from, to] = [
      ['#ff2d95', '#3a0ca3'],
      ['#00c8ff', '#0b2fa8'],
      ['#7a2dff', '#ff2d95'],
    ][i % 3]!;
    const g = ctx.createLinearGradient(0, 0, 1024, 232);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 232);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(words, 16, 120);
    ctx.fillText(words, 16 + ctx.measureText(words).width, 120);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < 232; y += 4) ctx.fillRect(0, y, 1024, 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A stall awning: broad stripes of its colour and white, across the slope. */
/** A cab's roof sign: TAXI in black on lit yellow, over a black-and-white checker band. */
function taxiSignTexture(): CanvasTexture {
  const w = 128;
  const h = 56;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff2a8';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) {
      ctx.fillStyle = k % 2 === 0 ? '#111111' : '#f4f4f4';
      ctx.fillRect(k * 8, h - 12, 8, 6);
      ctx.fillStyle = k % 2 === 1 ? '#111111' : '#f4f4f4';
      ctx.fillRect(k * 8, h - 6, 8, 6);
    }
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAXI', w / 2, 22);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A glass lift cab's walls: warm light behind a grid of dark glazing bars, a rail across at
 * waist height, and two riders standing inside as silhouettes.
 */
function liftCabTexture(): CanvasTexture {
  const w = 96;
  const h = 112;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fff3dc');
    g.addColorStop(1, '#f2b872');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Two riders, one a little taller, standing side by side.
    ctx.fillStyle = '#2a2230';
    for (const [x, top] of [
      [32, 34],
      [62, 40],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, top, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 12, h);
      ctx.lineTo(x - 11, top + 14);
      ctx.quadraticCurveTo(x, top + 8, x + 11, top + 14);
      ctx.lineTo(x + 12, h);
      ctx.closePath();
      ctx.fill();
    }
    // The handrail, then the glazing bars and the frame.
    ctx.fillStyle = '#5a4a3c';
    ctx.fillRect(0, 70, w, 4);
    ctx.fillStyle = '#1a1820';
    ctx.fillRect(w / 2 - 2, 0, 4, h);
    ctx.fillRect(0, h / 2 - 2 - 20, w, 3);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1a1820';
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A stall's open hatch, seen from the road: a warm-lit kitchen with shelves of jars and bottles,
 * pans steaming on the hob along the counter and a cook in a white cap behind it. Drawn on its
 * side, as the hatch's box faces the road along its length.
 */
function hatchTexture(): CanvasTexture {
  const w = 256;
  const h = 100;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffe2b0');
    g.addColorStop(1, '#e8963e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Two shelves of jars and bottles along the back.
    ctx.fillStyle = '#7a4520';
    for (const y of [24, 46]) ctx.fillRect(8, y, w - 16, 3);
    const jars = ['#c0392b', '#2e86ab', '#f4d35e', '#3c9d5d', '#8e5aa8'];
    for (let x = 14, k = 0; x < w - 18; x += 13, k++) {
      ctx.fillStyle = jars[k % jars.length]!;
      ctx.fillRect(x, 24 - 9 - (k % 3) * 2, 8, 9 + (k % 3) * 2);
      ctx.fillRect(x + 4, 46 - 8, 7, 8);
    }
    // The cook: a dark figure with a white cap, near the middle.
    ctx.fillStyle = '#2a1c18';
    ctx.beginPath();
    ctx.arc(150, 54, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(136, 62, 28, 30);
    ctx.fillStyle = '#f6f2ea';
    ctx.fillRect(141, 40, 18, 8);
    // The counter, with pans steaming on it.
    ctx.fillStyle = '#3a2a24';
    ctx.fillRect(0, 82, w, 18);
    ctx.fillStyle = '#1c1414';
    for (const x of [40, 92, 200]) {
      ctx.beginPath();
      ctx.ellipse(x, 80, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    for (const x of [40, 92, 200]) {
      ctx.beginPath();
      ctx.moveTo(x, 74);
      ctx.bezierCurveTo(x - 6, 66, x + 6, 62, x, 54);
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * How far a drone cruising at `cruise` metres climbs to clear the skybridges and the railway
 * viaduct when it is at `at` round the loop: over any of them in its path by DRONE_CLEARANCE,
 * easing up as it nears and back down once past.
 */
function climb(at: number, cruise: number): number {
  const here = ((at % LOOP) + LOOP) % LOOP;
  let lift = 0;
  const overhead: [number, number][] = [
    ...SKYBRIDGES.map(([offset, height]): [number, number] => [offset, height + SKYBRIDGE_TOP]),
    [SKYTRAIN, RAIL_DECK + TRAIN_TOP],
  ];
  for (const [offset, roof] of overhead) {
    const top = roof + DRONE_CLEARANCE;
    if (top <= cruise) continue;
    const apart = Math.abs(here - offset);
    const gap = Math.min(apart, LOOP - apart);
    const near = Math.min(Math.max((DRONE_CLIMB - gap) / (DRONE_CLIMB - SKYBRIDGE_HALF), 0), 1);
    const eased = near * near * (3 - 2 * near);
    lift = Math.max(lift, (top - cruise) * eased);
  }
  return lift;
}

/**
 * A red paper lantern's skin, wrapped round its sphere from top to bottom: lit red paper,
 * brightest at its waist where the candle sits, crossed by the dark bamboo ribs that hold its
 * shape, with a gold band near each end.
 */
function paperLanternTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const paper = ctx.createLinearGradient(0, 0, 0, canvas.height);
  paper.addColorStop(0, '#5a0c08');
  paper.addColorStop(0.5, STALL_LANTERN);
  paper.addColorStop(1, '#5a0c08');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A warm core behind the paper, at the waist.
  const core = ctx.createLinearGradient(0, 0, 0, canvas.height);
  core.addColorStop(0.3, 'rgba(255,170,90,0)');
  core.addColorStop(0.5, 'rgba(255,170,90,0.55)');
  core.addColorStop(0.7, 'rgba(255,170,90,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(40,6,4,0.75)';
  for (let k = 1; k < LANTERN_RIBS; k++) {
    ctx.fillRect(0, (k * canvas.height) / LANTERN_RIBS - 2, canvas.width, 4);
  }
  ctx.fillStyle = LANTERN_TASSEL;
  ctx.fillRect(0, canvas.height * 0.1, canvas.width, 6);
  ctx.fillRect(0, canvas.height * 0.9 - 6, canvas.width, 6);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A cab's windows, round its cabin: two tinted panes between dark pillars, lit from the street,
 * with heads in silhouette inside. Symmetrical, so it reads on every face.
 */
function taxiCabinTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#14161e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const left of [14, 134]) {
    const pane = ctx.createLinearGradient(0, 8, 0, 72);
    pane.addColorStop(0, '#6a7aa8');
    pane.addColorStop(0.55, '#2c3554');
    pane.addColorStop(1, '#1a1f33');
    ctx.fillStyle = pane;
    ctx.fillRect(left, 10, 108, 58);
    // A head and shoulders against the glass.
    ctx.fillStyle = '#0b0c12';
    ctx.beginPath();
    ctx.arc(left + 54, 36, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(left + 30, 52, 48, 16);
    // A streak of the street's neon across the glass.
    ctx.fillStyle = 'rgba(255,120,220,0.35)';
    ctx.fillRect(left, 18, 108, 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A cab's checker band: two rows of black and white squares. */
function checkerBandTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4f1e6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111111';
  for (let k = 0; k < canvas.width / 8; k++) {
    ctx.fillRect(k * 8, k % 2 === 0 ? 0 : 8, 8, 8);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A part stretched from one point to another, as a sleeve, a leg or a chopstick is: a unit-tall
 * shape along y, scaled to the distance and turned to lie between the two.
 */
function span(geometry: BufferGeometry, material: Material, from: Vector3, to: Vector3): Mesh {
  const mesh = new Mesh(geometry, material);
  const along = to.clone().sub(from);
  mesh.scale.y = along.length();
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), along.normalize());
  return mesh;
}

/**
 * A market booth's cladding: dark timber slats with their joints, and pasted over them a few
 * gig posters in the street's neon colours and scattered stickers, the posters a little torn.
 */
function boothTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const random = seeded(617);
  for (let x = 0; x < size; x += 16) {
    const shade = 34 + Math.floor(random() * 14);
    ctx.fillStyle = `rgb(${shade + 8},${shade},${shade + 4})`;
    ctx.fillRect(x, 0, 16, size);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, 0, 2, size);
  }
  BOOTH_POSTERS.forEach(([hex, px, py], i) => {
    const w = 52;
    const h = 72;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((random() - 0.5) * 0.12);
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, w, h);
    // A bold title and lines of small print.
    ctx.fillStyle = 'rgba(20,10,30,0.85)';
    ctx.fillRect(6, 8, w - 12, 12);
    for (let k = 0; k < 4; k++) ctx.fillRect(6, 30 + k * 8, w - 12 - (k % 2) * 10, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(w / 2, h - 12, 6 + (i % 2) * 2, 0, Math.PI * 2);
    ctx.fill();
    // A torn corner, showing the slats beneath.
    ctx.fillStyle = 'rgb(40,34,38)';
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w - 14, h);
    ctx.lineTo(w, h - 10);
    ctx.fill();
    ctx.restore();
  });
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = BOOTH_POSTERS[k % BOOTH_POSTERS.length]![0];
    ctx.fillRect(random() * size, 110 + random() * 30, 6 + random() * 4, 4 + random() * 3);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A chalkboard sandwich board: a wooden frame round a dark slate, chalked with TODAY, the dish,
 * its price and a little chalk star, in a few pastel chalks.
 */
function chalkboardTexture(dish: string, price: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6b4a2c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1b2421';
  ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);
  // A haze of old chalk, half wiped.
  ctx.fillStyle = 'rgba(220,230,225,0.06)';
  ctx.fillRect(14, 60, 100, 60);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd1e8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('TODAY', 64, 42);
  ctx.fillStyle = '#f2f5f0';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(dish, 64, 92);
  ctx.fillStyle = '#bff3ff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(price, 64, 134);
  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
    const px = 64 + Math.cos(a) * 10;
    const py = 162 + Math.sin(a) * 10;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A cab's hubcap: a silver rim and dish, five dark spoke slots and a centre badge. */
function hubcapTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const dish = ctx.createRadialGradient(c - 6, c - 6, 2, c, c, c);
  dish.addColorStop(0, '#f4f6fa');
  dish.addColorStop(1, '#8a909c');
  ctx.fillStyle = dish;
  ctx.beginPath();
  ctx.arc(c, c, c - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2d36';
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5;
    ctx.beginPath();
    ctx.arc(c, c, c - 8, a + 0.25, a + 0.95);
    ctx.arc(c, c, 12, a + 0.95, a + 0.25, true);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c21b';
  ctx.beginPath();
  ctx.arc(c, c, 6, 0, Math.PI * 2);
  ctx.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A delivery parcel's side: brown cardboard, a strip of packing tape and a shipping label. */
function parcelTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#c89a5c';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(120,80,40,0.35)';
  ctx.fillRect(0, 0, size, 3);
  ctx.fillRect(0, size - 3, size, 3);
  ctx.fillStyle = '#e8d8b0';
  ctx.fillRect(size / 2 - 6, 0, 12, size);
  ctx.fillStyle = '#f6f4ee';
  ctx.fillRect(8, 36, 22, 16);
  ctx.fillStyle = '#2a2a30';
  for (let k = 0; k < 3; k++) ctx.fillRect(11, 39 + k * 4, 16 - k * 3, 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A stall's lit menu board: its dishes in white on a dark board, framed in its own neon. */
function menuTexture(dishes: readonly string[], hex: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 156;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0d0c14';
    ctx.fillRect(0, 0, 256, 156);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 144);
    ctx.fillStyle = '#fff4e0';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    dishes.forEach((dish, k) => ctx.fillText(dish, 128, 38 + k * 40));
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function awningTexture(hex: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? hex : '#e8e4f0';
      ctx.fillRect(0, i * 16, 16, 16);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** One period of the centre line along v: DASH of line, then a gap to DASH_EVERY. */
function dashTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, (90 * DASH) / DASH_EVERY);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** One period of the cat's eyes along v: a stud STUD_LONG long, then road to STUD_EVERY. */
function studTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, Math.max(2, (160 * STUD_LONG) / STUD_EVERY));
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/**
 * The night sky as an equirectangular texture: v runs from the nadir (bottom) to the zenith
 * (top). Violet city glow hugs the horizon and fades to navy; stars thin out towards it.
 */
function nightSkyTexture(): CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Canvas y runs down from the zenith: the horizon is at the middle.
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#05060f');
    g.addColorStop(0.3, '#0b0c22');
    g.addColorStop(0.42, '#231a45');
    g.addColorStop(0.475, '#4a3470');
    g.addColorStop(0.5, '#6a4a8c');
    g.addColorStop(0.53, '#1a1530');
    g.addColorStop(1, '#07070f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    const random = seeded(313);
    for (let i = 0; i < 700; i++) {
      // Stars gather overhead and fade into the glow.
      const y = Math.pow(random(), 1.8) * height * 0.42;
      const x = random() * width;
      const fade = 1 - y / (height * 0.42);
      ctx.fillStyle = `rgba(230,235,255,${(0.25 + random() * 0.6) * fade})`;
      const size = random() < 0.08 ? 1.6 : 1;
      ctx.fillRect(x, y, size, size);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A reflection streak: white, brightest at its far (top) end and along its middle, fading to
 * nothing at its sides and towards the rider.
 */
function streakTexture(): CanvasTexture {
  const width = 64;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      // v runs from the far end (0) to the near end (1).
      const v = y / (height - 1);
      const along = Math.pow(1 - v, 1.6) * Math.min(1, v * 12 + 0.3);
      for (let x = 0; x < width; x++) {
        const u = (x / (width - 1)) * 2 - 1;
        const across = Math.exp(-u * u * 5);
        const a = Math.round(255 * along * across);
        const i = (y * width + x) * 4;
        image.data[i] = a;
        image.data[i + 1] = a;
        image.data[i + 2] = a;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A blade sign at night: `word` in neon tube letters stacked top to bottom on a dark panel,
 * with the tube's glow around them and a thin neon border.
 */
/** A vending machine's front: a coloured header, rows of bright cans behind glass, a slot below. */
function machineTexture(hex: string, i: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 110;
  canvas.height = 190;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 110, 190);
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(8, 28, 94, 92);
    const cans = ['#ff3b5c', '#2f7dff', '#ffd23f', '#2fd18a', '#ff8a3d', '#b05cff'];
    const random = seeded(301 + i);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        ctx.fillStyle = cans[Math.floor(random() * cans.length)]!;
        ctx.fillRect(12 + col * 15, 32 + row * 22, 10, 16);
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 6, 94, 14);
    ctx.fillStyle = '#14141c';
    ctx.fillRect(14, 140, 82, 26);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A bicycle above an arrow, white on clear, drawn so the arrow points up the texture: laid on
 * the road, that is away from the rider. Long, as road markings are, to read foreshortened.
 */
function laneSymbolTexture(): CanvasTexture {
  const w = 128;
  const h = 352;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // The arrow, nearest the top (furthest along the road).
    ctx.beginPath();
    ctx.moveTo(w / 2, 14);
    ctx.lineTo(w - 22, 70);
    ctx.lineTo(w / 2 + 14, 70);
    ctx.lineTo(w / 2 + 14, 130);
    ctx.lineTo(w / 2 - 14, 130);
    ctx.lineTo(w / 2 - 14, 70);
    ctx.lineTo(22, 70);
    ctx.closePath();
    ctx.fill();
    // The bicycle below it, stretched along the road: wheels, frame, bars and saddle.
    ctx.save();
    ctx.translate(w / 2, 250);
    ctx.scale(1, 1.6);
    ctx.rotate(-Math.PI / 2);
    ctx.beginPath();
    ctx.arc(-30, 0, 22, 0, Math.PI * 2);
    ctx.moveTo(52, 0);
    ctx.arc(30, 0, 22, 0, Math.PI * 2);
    ctx.moveTo(-30, 0);
    ctx.lineTo(-6, -30);
    ctx.lineTo(22, -30);
    ctx.lineTo(30, 0);
    ctx.moveTo(-30, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(-6, -30);
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -30);
    ctx.moveTo(-12, -38);
    ctx.lineTo(2, -38);
    ctx.moveTo(22, -30);
    ctx.lineTo(26, -42);
    ctx.stroke();
    ctx.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A backlit advert: a deep glowing gradient, its picture and a stacked headline. */
function advertTexture(title: string, hex: string, picture: AdvertPicture): CanvasTexture {
  const w = 128;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hex);
    g.addColorStop(1, '#14082a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    drawAdvertPicture(ctx, picture, w / 2, 62);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    title.split(' ').forEach((word, i) => ctx.fillText(word, w / 2, 130 + i * 24));
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Draws an advert's picture in white, centred on (x, y): a steaming bowl, a ferry or a bottle. */
function drawAdvertPicture(
  ctx: CanvasRenderingContext2D,
  picture: AdvertPicture,
  x: number,
  y: number,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineCap = 'round';
  if (picture === 'bowl') {
    // The bowl, chopsticks lifting noodles, and steam curling up.
    ctx.beginPath();
    ctx.moveTo(x - 34, y + 2);
    ctx.lineTo(x + 34, y + 2);
    ctx.arc(x, y + 2, 34, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(x - 12, y + 34, 24, 5);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 2);
    ctx.lineTo(x + 30, y - 34);
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + 40, y - 28);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (const dx of [-20, -6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y - 6);
      ctx.bezierCurveTo(x + dx - 8, y - 16, x + dx + 8, y - 22, x + dx, y - 32);
      ctx.stroke();
    }
  } else if (picture === 'ferry') {
    // A hull with a lit deckhouse and funnel, riding two waves.
    ctx.beginPath();
    ctx.moveTo(x - 40, y);
    ctx.lineTo(x + 40, y);
    ctx.lineTo(x + 30, y + 16);
    ctx.lineTo(x - 32, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - 22, y - 16, 40, 14);
    ctx.fillRect(x + 4, y - 32, 10, 16);
    ctx.lineWidth = 3;
    for (const dy of [24, 33]) {
      ctx.beginPath();
      for (let k = -4; k < 4; k++) {
        ctx.moveTo(x + k * 12, y + dy);
        ctx.quadraticCurveTo(x + k * 12 + 6, y + dy - 6, x + k * 12 + 12, y + dy);
      }
      ctx.stroke();
    }
  } else {
    // A tall bottle with a label band, fizz rising beside it.
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 38);
    ctx.lineTo(x + 6, y - 38);
    ctx.lineTo(x + 6, y - 20);
    ctx.quadraticCurveTo(x + 16, y - 12, x + 16, y);
    ctx.lineTo(x + 16, y + 36);
    ctx.lineTo(x - 16, y + 36);
    ctx.lineTo(x - 16, y);
    ctx.quadraticCurveTo(x - 16, y - 12, x - 6, y - 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(20,8,42,0.6)';
    ctx.fillRect(x - 16, y + 4, 32, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (const [dx, dy, r] of [
      [26, -10, 3],
      [32, -22, 2.5],
      [24, -32, 2],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A festival banner: a coloured cloth fading to deep violet, its words stacked down it. */
function bannerTexture(words: string, hex: string): CanvasTexture {
  const w = 96;
  const h = 236;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hex);
    g.addColorStop(1, '#1c0b33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    words.split(' ').forEach((word, i) => ctx.fillText(word, w / 2, 40 + i * 30));
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 46);
    ctx.lineTo(w / 2 + 16, h - 22);
    ctx.lineTo(w / 2 - 16, h - 22);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A shop sign: neon letters in the shop's colour, glowing on a dark panel with a lit border. */
function shopSignTexture(name: string, hex: string): CanvasTexture {
  const w = 384;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c0a14';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = hex;
    ctx.shadowBlur = 14;
    ctx.fillStyle = hex;
    ctx.fillText(name, w / 2, h / 2 + 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(name, w / 2, h / 2 + 2);
    ctx.fillStyle = hex;
    ctx.globalAlpha = 0.55;
    ctx.fillText(name, w / 2, h / 2 + 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The moon's face: a pale disc with soft grey seas, fading at its rim. */
function moonTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const r = size / 2 - 6;
    const g = ctx.createRadialGradient(c - 20, c - 20, 10, c, c, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.85, '#e4e2f2');
    g.addColorStop(1, '#c8c4e0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    const random = seeded(373);
    for (let i = 0; i < 9; i++) {
      const sx = c + (random() - 0.5) * r * 1.3;
      const sy = c + (random() - 0.5) * r * 1.3;
      const sr = 12 + random() * 30;
      const sea = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sea.addColorStop(0, 'rgba(120,118,150,0.45)');
      sea.addColorStop(1, 'rgba(120,118,150,0)');
      ctx.fillStyle = sea;
      ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
    ctx.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The elevated line's name board: a cyan roundel and the line's name on a dark panel. */
function lineSignTexture(): CanvasTexture {
  const w = 640;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3fe0ff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(40, h / 2, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ff4fd8';
    ctx.fillRect(14, h / 2 - 5, 52, 10);
    ctx.font = 'bold 30px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#3fe0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e8fbff';
    ctx.textAlign = 'center';
    ctx.fillText('HARBOUR LINE  ·  DOCKLANDS', (w + 70) / 2, h / 2 + 2, w - 90);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A puddle as the rider sees it: the neon above reflected in streaks that run towards the
 * viewer, inside a soft, uneven rim; clear beyond it.
 */
function puddleTexture(random: () => number): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    // The water's own sheen, then smeared reflections of the signs.
    ctx.fillStyle = 'rgba(90, 80, 150, 0.95)';
    ctx.fillRect(0, 0, size, size);
    const hues = ['#ff4fd8', '#3fe0ff', '#ffb347', '#b06bff'];
    for (let k = 0; k < 6; k++) {
      const x = random() * size;
      const w = 6 + random() * 18;
      const g = ctx.createLinearGradient(0, 0, 0, size);
      const hue = hues[Math.floor(random() * hues.length)]!;
      g.addColorStop(0, hue);
      g.addColorStop(0.6 + random() * 0.3, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.75 + random() * 0.25;
      ctx.fillRect(x - w / 2, 0, w, size);
    }
    ctx.globalAlpha = 1;
    // The rim: an uneven blob, soft at its edge, cut out of everything else.
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.18,
      size / 2,
      size / 2,
      size / 2,
    );
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mask;
    ctx.beginPath();
    for (let a = 0; a <= 16; a++) {
      const angle = (a / 16) * Math.PI * 2;
      const r = size * (0.36 + random() * 0.14);
      const px = size / 2 + Math.cos(angle) * r;
      const py = size / 2 + Math.sin(angle) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // Seen almost edge-on from the saddle, so it keeps its detail at a low angle.
  texture.anisotropy = 8;
  return texture;
}

/** The taxi rank's sign: TAXI in yellow over a dark plate with a lit border. */
function rankSignTexture(): CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffd23a';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffd23a';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffe36a';
    ctx.fillText('TAXI', w / 2, h / 2 + 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Torn cloud in alpha: soft overlapping puffs, tiling so the ceiling can drift. */
function cloudsTexture(): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const random = seeded(317);
    // Clumps of puffs with clear sky between them.
    for (let i = 0; i < 260; i++) {
      const clump = Math.floor(random() * 9);
      const cx = ((clump * 197) % size) + (random() - 0.5) * 120;
      const cy = ((clump * 311) % size) + (random() - 0.5) * 70;
      const x = cx;
      const y = cy;
      const r = 14 + random() * 40;
      const a = 0.18 + random() * 0.3;
      // Each puff drawn at its wrapped copies so the texture tiles.
      for (const dx of [-size, 0, size]) {
        for (const dy of [-size, 0, size]) {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          g.addColorStop(0, `rgba(255,255,255,${a})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
        }
      }
    }
  }
  return new CanvasTexture(canvas);
}

/** A gate's name plate: `word` in neon tube letters across a dark panel. */
function plateTexture(word: string, colour: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0c12';
    ctx.fillRect(0, 0, 512, 112);
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colour;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.strokeStyle = colour;
    ctx.strokeText(word, 256, 60);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fillText(word, 256, 60);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function bladeTexture(word: string, colour: string): CanvasTexture {
  const width = 96;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0c12';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    const letters = [...word];
    const step = (height - 40) / Math.max(letters.length, 4);
    ctx.font = `bold ${Math.floor(Math.min(step * 0.8, 70))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    const top = height / 2 - (step * letters.length) / 2 + step / 2;
    letters.forEach((letter, i) => {
      ctx.shadowBlur = 16;
      ctx.strokeText(letter, width / 2, top + i * step);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(letter, width / 2, top + i * step);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4;
      ctx.strokeStyle = colour;
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * One bay of a tower's street floor at night: tall glass panels in a dark frame, lit from
 * inside, with a darker transom above; some bays are dark. Through a lit panel the shop inside
 * shows: pendant lamps, shelves of goods along the back wall, and now and then a customer.
 */
function lobbyTexture(glass: string, frame: string, dark: number, seed: number): CanvasTexture {
  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    // The interiors draw from their own sequence, so which panels are lit is unchanged.
    const inside = seeded(seed + 7);
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, width, height);
    const panels = 4;
    const w = width / panels;
    for (let i = 0; i < panels; i++) {
      const lit = random() >= dark;
      const g = ctx.createLinearGradient(0, 20, 0, height);
      g.addColorStop(0, lit ? glass : '#1d2030');
      g.addColorStop(1, lit ? '#c99a7a' : '#2a2d3e');
      ctx.globalAlpha = lit ? 0.75 + random() * 0.25 : 1;
      ctx.fillStyle = g;
      ctx.fillRect(i * w + 4, 24, w - 8, height - 30);
      if (lit) {
        ctx.globalAlpha = 1;
        const left = i * w + 4;
        // Shelves along the back wall, stocked with goods in bright packaging.
        for (const shelf of [58, 80]) {
          ctx.fillStyle = 'rgba(40,30,40,0.55)';
          ctx.fillRect(left + 3, shelf, w - 14, 3);
          for (let gx = left + 4; gx < left + w - 14; gx += 5) {
            ctx.fillStyle = SHOP_GOODS[Math.floor(inside() * SHOP_GOODS.length)]!;
            ctx.fillRect(gx, shelf - 6 - Math.floor(inside() * 4), 4, 6);
          }
        }
        // Pendant lamps hung from the ceiling, glowing.
        for (const lx of [0.3, 0.7]) {
          ctx.fillStyle = 'rgba(30,24,30,0.6)';
          ctx.fillRect(left + (w - 8) * lx - 0.5, 24, 1, 8);
          ctx.fillStyle = '#fff6d8';
          ctx.beginPath();
          ctx.arc(left + (w - 8) * lx, 34, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // A counter across the front, and sometimes a customer at it.
        ctx.fillStyle = 'rgba(30,22,34,0.7)';
        ctx.fillRect(left, height - 26, w - 8, 20);
        if (inside() < 0.45) {
          const px = left + 8 + inside() * (w - 30);
          ctx.fillStyle = 'rgba(20,16,26,0.85)';
          ctx.beginPath();
          ctx.arc(px + 6, 70, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(px, 76, 12, 30);
        }
      }
      // A transom light over each panel.
      ctx.fillStyle = lit ? glass : '#1d2030';
      ctx.globalAlpha = lit ? 0.45 : 1;
      ctx.fillRect(i * w + 4, 6, w - 8, 12);
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Wet concrete slabs at night: two by two, with dark joints and a little grit. */
function slabTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(19);
    const slab = size / 2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const shade = 150 + Math.floor(random() * 30);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`;
        ctx.fillRect(col * slab, row * slab, slab, slab);
      }
    }
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.fillStyle = 'rgba(20,20,30,0.7)';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, slab, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(slab, 0, 2, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function seeded(seed: number): () => number {
  let state = seed % 2147483647 || 1;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}
