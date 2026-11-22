import type { Segment, SegmentKind } from '../workout/plan';

/** The id of one of the worlds built into the frontend (`main`'s `WorldId`, from its class catalogue's schema). */
export type WorldId =
  | 'docklands'
  | 'granite'
  | 'oldtown'
  | 'prairie'
  | 'dolomites'
  | 'coast'
  | 'caribana'
  | 'westminster'
  | 'centralpark'
  | 'southbeach'
  | 'ghent'
  | 'blackpool'
  | 'suburbia'
  | 'nottinghill'
  | 'knicks'
  | 'vegas'
  | 'route66'
  | 'venice'
  | 'amsterdam'
  | 'giza'
  | 'daytona'
  | 'koppenberg'
  | 'ventoux'
  | 'chicago'
  | 'goldengate'
  | 'havana'
  | 'seapoint'
  | 'montreal'
  | 'stanleypark'
  | 'stelvio'
  | 'edinburgh'
  | 'northshore'
  | 'campolongo'
  | 'marinabay'
  | 'serpentine'
  | 'champs'
  | 'tulips'
  | 'tourmalet'
  | 'napa'
  | 'glastonbury'
  | 'pikeplace'
  | 'hardknott'
  | 'alpe'
  | 'saguaro'
  | 'trollstigen'
  | 'poggio'
  | 'montmartre'
  | 'brickyard'
  | 'chichen'
  | 'bonneville'
  | 'como'
  | 'yosemite'
  | 'etna'
  | 'timessquare'
  | 'tremola'
  | 'teide'
  | 'monaco'
  | 'tempelhof'
  | 'paine'
  | 'ibiza'
  | 'skye'
  | 'toronto'
  | 'prospect'
  | 'calobra'
  | 'strade'
  | 'wicklow'
  | 'haleakala'
  | 'dubai'
  | 'austin'
  | 'winnats'
  | 'redoute'
  | 'angliru'
  | 'velodrome'
  | 'cinqueterre'
  | 'angels'
  | 'coney'
  | 'winterlude'
  | 'letras'
  | 'santamonica'
  | 'antwerp'
  | 'tahoe'
  | 'deathvalley'
  | 'atacama'
  | 'angkor'
  | 'jouvert'
  | 'sambadrome'
  | 'lisbon'
  | 'cornwall'
  | 'copacabana'
  | 'bondi'
  | 'kilauea'
  | 'shibuya'
  | 'muertos'
  | 'pamplona'
  | 'greatocean'
  | 'sfhills'
  | 'mardigras'
  | 'victoria'
  | 'jaipur'
  | 'overseas'
  | 'isleofman'
  | 'artmuseum'
  | 'lakelouise'
  | 'bealach'
  | 'hanriver'
  | 'oktoberfest'
  | 'brooklyn'
  | 'strasbourg'
  | 'kyoto'
  | 'bathsheba'
  | 'machupicchu'
  | 'outback'
  | 'telaviv'
  | 'silverstone'
  | 'murdehuy'
  | 'arenberg'
  | 'lakefront'
  | 'diwali'
  | 'sella'
  | 'kona'
  | 'sevensisters'
  | 'brighton'
  | 'iceland'
  | 'sydneyharbour'
  | 'zoncolan'
  | 'valais'
  | 'loire'
  | 'copenhagen'
  | 'surfers'
  | 'moab'
  | 'glasgow'
  | 'mountwashington'
  | 'grandcanyon'
  | 'stampede'
  | 'merce'
  | 'stpatricks'
  | 'bigsur'
  | 'songkran'
  | 'playground'
  | 'hoover'
  | 'aguascalientes'
  | 'atlanticroad'
  | 'fishhill'
  | 'junkanoo'
  | 'quebec'
  | 'fuji'
  | 'bund'
  | 'comuna13'
  | 'adelaide'
  | 'sellaronda'
  | 'marrakech'
  | 'tamalpais'
  | 'independence'
  | 'fens'
  | 'vienna'
  | 'bluemountains'
  | 'aubisque'
  | 'rome'
  | 'stbernard'
  | 'nuevedejulio'
  | 'okinawa'
  | 'algarve'
  | 'mulholland'
  | 'provence'
  | 'cherryblossom'
  | 'kwaremont'
  | 'oregon'
  | 'cypress'
  | 'iten'
  | 'palouse'
  | 'prague'
  | 'penllech'
  | 'pueblos'
  | 'steppe'
  | 'teotihuacan'
  | 'furka'
  | 'beachroad'
  | 'blueridge'
  | 'verona'
  | 'valparaiso'
  | 'gardena'
  | 'maunakea'
  | 'montroyal'
  | 'utrecht'
  | 'galibier'
  | 'joshuatree'
  | 'cabot'
  | 'veleta'
  | 'bayofislands'
  | 'dales'
  | 'engadin'
  | 'miami';

/** A plan's segment with the second it starts at, as `main`'s scene reads segments (ADR 0030). */
export interface TimedSegment extends Segment {
  /** Whole seconds from the plan's start. */
  readonly start: number;
}

/** One of the race's other riders, as the scene draws them (L2-064 AC3). */
export interface SceneRider {
  /** The design-system jersey the rider wears (`nova`, `ghost`): the colour is `--jersey-<jersey>`. */
  readonly jersey: string;
  /** Metres ahead of the rider; negative is behind. */
  readonly metres: number;
}

/** A row of `main`'s Riders nearby board, which its pacers module builds (`main`'s components `WorldRidePacer`). */
export interface WorldRidePacer {
  readonly name: string;
  /** The rider colour, `--color-rider-<n>`. */
  readonly jersey: number;
  /** `+0:12` or `−0:04`; null for You. */
  readonly timeGap: string | null;
  readonly you: boolean;
}

/** The GPU API drawing the world: WebGPU, or WebGL 2 where no WebGPU adapter is granted (L2-065, ADR 0021). */
export type Backend = 'webgpu' | 'webgl2';

/** A ride's status as `main` names it (`main`'s api `WorkoutStatus`), which its world music reads (L2-163). */
export type WorkoutStatus =
  | 'waiting for bike'
  | 'running'
  | 'paused'
  | 'paused: bike disconnected'
  | 'stopped'
  | 'ended'
  | 'ended: bike shut off';

/** The ambience a world declares under the ride sound, as `main`'s ride-sound.ts names them (L2-163). */
export type AmbiencePreset = 'coast' | 'alpine' | 'city' | 'park';

/** One of the World Ride scenes built into the frontend (L2-101), as `main`'s `worlds.ts` describes it. */
export interface World {
  readonly id: WorldId;
  readonly name: string;
  readonly route: string;
  /** What a `work` segment is called in this world, e.g. `Cobbled sprint`. */
  readonly effortName: string;
  readonly description: string;
  /** The road's gradient, in percent, for each segment kind. */
  readonly grade: Readonly<Record<SegmentKind, number>>;
  /** The rolling gradient laid over it, in percent; above 0 in every scene (L2-101 AC7). */
  readonly roll: number;
  /**
   * How far the road bends either way, in degrees, and over how many metres (L2-101 AC6): the
   * heading is `angle × sin(s ÷ length) × cos(s ÷ (2.7 × length) + 1)`.
   */
  readonly bend: { readonly angle: number; readonly length: number };
}
