// A test-only hook into the World Ride renderer (#672). The performance sweep sets
// `window.__wzWorldRide = { tier }` before the app boots (e2e/fixtures/world-ride-probe.ts): the
// scene then draws at that tier from the first frame, its frame budget never drops it, and the
// renderer writes what it draws to `__wzWorldRide.report`. No rider can set it: it is not an
// option, not in the README, and nothing in the app sets it.
import type { Backend, Tier } from './render-quality';

/** The global the sweep sets before the app boots. */
export const PROBE_KEY = '__wzWorldRide';

const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];

/**
 * What the sweep asked for: the tier to pin, and whether to draw with WebGL2 (#679). `judged`: the tier is where the
 * ride opens, and the frame budget judges it as it does a rider's ride (L2-159 AC4).
 */
export interface WorldRideProbe {
  /** The tier pinned; null where a judged hook only watches a ride opened from the rider's settings (slice 20.2). */
  readonly tier: Tier | null;
  readonly forceWebGL: boolean;
  readonly judged: boolean;
}

/** What the renderer reports back to the sweep, kept current as it draws. */
export interface WorldRideProbeReport {
  tier: Tier;
  readonly backend: Backend;
  /** The time between each drawn frame and the one before, in ms, oldest first. */
  readonly frames: number[];
  /** GPU time of each frame, in ms, from timer queries; null where the browser offers none. */
  readonly gpuMs: number[] | null;
  /** Draw calls in the latest frame, every pass included. */
  drawCalls: number;
  paradeMetres?: number;
  /** Shader programs alive. */
  programs: number;
  /** Shader programs alive when the scene had loaded, before its first frame (L2-111 AC10). */
  programsBeforeRide: number | null;
  /** The scene's distinct materials by type and features: where program variants come from. */
  materials: Record<string, number>;
  /** Materials in the scene that should follow the bend but do not (L2-111 AC8). */
  unbent: number;
  /** Whether the post chain draws the ink outline pass (L2-111 technique 52). */
  outlines: boolean;
  /** Whether the sky is the flat three-stop gradient (L2-111 technique 53). */
  skyGradient: boolean;
  /** Materials cut by the ordered dither (L2-111 technique 54). */
  dithered: number;
  /** Shader programs and render pipelines the backend has built, ever: each one a compile. */
  compiled: number;
  /** The race's riders drawn in the latest frame, from furthest ahead (L2-064 AC3). */
  riders: DrawnRider[];
  /** `main`'s simulated pacers drawn in the latest frame: none in a race, which draws its own riders. */
  pacers: number;
}

/** A race rider the renderer drew: its jersey, its place, and the colour and opacity it wears. */
export interface DrawnRider {
  readonly jersey: string;
  /** Metres ahead of the rider; negative is behind. */
  readonly metres: number;
  /** `#rrggbb`. */
  readonly colour: string;
  readonly opacity: number;
}

/** The pinned tier, or null when the hook is not set (every rider's ride). */
export function readWorldRideProbe(value: unknown): WorldRideProbe | null {
  if (typeof value !== 'object' || value === null) return null;
  const { tier, backend, judged } = value as {
    tier?: unknown;
    backend?: unknown;
    judged?: unknown;
  };
  if (TIERS.includes(tier as Tier)) {
    return { tier: tier as Tier, forceWebGL: backend === 'webgl2', judged: judged === true };
  }
  return tier === undefined && judged === true
    ? { tier: null, forceWebGL: false, judged: true }
    : null;
}

/**
 * True once after the sweep sets `__wzWorldRide.drop`: the renderer lowers the tier one step, as
 * a slow frame budget would, so the sweep can see what a drop compiles (#882).
 */
export function takeDropRequest(): boolean {
  const probe = (globalThis as Record<string, unknown>)[PROBE_KEY];
  if (!readWorldRideProbe(probe) || !(probe as { drop?: unknown }).drop) return false;
  (probe as { drop?: unknown }).drop = false;
  return true;
}

/**
 * Hands the sweep the report the renderer keeps current, or null without the hook: a rider's
 * ride records nothing.
 */
export function probeReport(
  tier: Tier,
  backend: Backend,
  gpuTimed: boolean,
): WorldRideProbeReport | null {
  const probe = (globalThis as Record<string, unknown>)[PROBE_KEY];
  if (!readWorldRideProbe(probe)) return null;
  const report: WorldRideProbeReport = {
    tier,
    backend,
    frames: [],
    gpuMs: gpuTimed ? [] : null,
    drawCalls: 0,
    programs: 0,
    programsBeforeRide: null,
    materials: {},
    unbent: 0,
    outlines: false,
    skyGradient: false,
    dithered: 0,
    compiled: 0,
    riders: [],
    pacers: 0,
  };
  (probe as { report?: WorldRideProbeReport }).report = report;
  return report;
}

/** The parts of a material that set which program draws it. */
interface MaterialShape {
  readonly type: string;
  readonly transparent?: boolean;
  readonly side?: number;
  readonly map?: unknown;
  readonly normalMap?: unknown;
  readonly emissiveMap?: unknown;
  readonly envMap?: unknown;
  readonly alphaTest?: number;
  readonly vertexColors?: boolean;
  readonly clearcoat?: number;
  readonly transmission?: number;
}

/** `type+feature+…`: materials alike in these compile to the same program. */
function variant(m: MaterialShape): string {
  const features: [string, unknown][] = [
    ['transparent', m.transparent],
    ['double-sided', m.side === 2],
    ['map', m.map],
    ['normal-map', m.normalMap],
    ['emissive-map', m.emissiveMap],
    ['env-map', m.envMap],
    ['alpha-test', (m.alphaTest ?? 0) > 0],
    ['vertex-colours', m.vertexColors],
    ['clearcoat', (m.clearcoat ?? 0) > 0],
    ['transmission', (m.transmission ?? 0) > 0],
  ];
  return [m.type, ...features.filter(([, on]) => on).map(([name]) => name)].join('+');
}

/** How many distinct materials share each variant, most shared first (#679). */
export function materialVariants(materials: Iterable<MaterialShape>): Record<string, number> {
  const counts = new Map<string, number>();
  for (const m of new Set(materials)) counts.set(variant(m), (counts.get(variant(m)) ?? 0) + 1);
  return Object.fromEntries([...counts].sort((a, b) => b[1] - a[1]));
}
