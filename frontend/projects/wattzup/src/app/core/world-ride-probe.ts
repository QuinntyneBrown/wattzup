// A test-only hook into the World Ride renderer (#672). The performance sweep sets
// `window.__wzWorldRide = { tier }` before the app boots (e2e/fixtures/world-ride-probe.ts): the
// scene then draws at that tier from the first frame, its frame budget never drops it, and the
// renderer writes what it draws to `__wzWorldRide.report`. No rider can set it: it is not an
// option, not in the README, and nothing in the app sets it.
import type { Backend, Tier } from './render-quality';

/** The global the sweep sets before the app boots. */
export const PROBE_KEY = '__wzWorldRide';

const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];

/** What the sweep asked for: the tier to pin, and whether to draw with WebGL2 (#679). */
export interface WorldRideProbe {
  readonly tier: Tier;
  readonly forceWebGL: boolean;
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
  /** Shader programs alive. */
  programs: number;
  /** Shader programs alive when the scene had loaded, before its first frame (L2-111 AC10). */
  programsBeforeRide: number | null;
  /** The scene's distinct materials by type and features: where program variants come from. */
  materials: Record<string, number>;
}

/** The pinned tier, or null when the hook is not set (every rider's ride). */
export function readWorldRideProbe(value: unknown): WorldRideProbe | null {
  if (typeof value !== 'object' || value === null) return null;
  const { tier, backend } = value as { tier?: unknown; backend?: unknown };
  return TIERS.includes(tier as Tier)
    ? { tier: tier as Tier, forceWebGL: backend === 'webgl2' }
    : null;
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
