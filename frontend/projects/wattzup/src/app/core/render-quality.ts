// The World Ride scene's quality tiers, its techniques and its frame budget (L2-111, ADR 0021).
// Pure: the renderer asks which techniques are in force and holds no rule of its own.

export type Tier = 'low' | 'medium' | 'high' | 'ultra';
export type Backend = 'webgpu' | 'webgl2';

export interface Technique {
  /** The number of the technique in L2-111. */
  readonly id: number;
  readonly name: string;
  /** The lowest tier that draws it; null when it is not built. */
  readonly from: Tier | null;
  /** With reduced motion: drawn as usual, drawn without moving on its own, or not drawn. */
  readonly reducedMotion: 'kept' | 'still' | 'off';
  /** Drawn at `low` and no higher: the drawn look (AC11, ADR 0024). */
  readonly lowOnly?: boolean;
}

const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];

const t = (
  id: number,
  name: string,
  from: Tier | null,
  reducedMotion: Technique['reducedMotion'] = 'kept',
  lowOnly = false,
): Technique => ({ id, name, from, reducedMotion, ...(lowOnly ? { lowOnly } : {}) });

/** The table of L2-111, in its order. */
export const TECHNIQUES: readonly Technique[] = [
  t(1, 'Photogrammetric environment', 'high'),
  t(2, 'Scanned road surface', 'high'),
  t(3, 'Photometric-stereo materials', 'medium'),
  t(4, 'PBR microfacet shading', 'medium'),
  t(5, 'Baked lightmaps', 'medium'),
  t(6, 'HDR image-based lighting', 'medium'),
  t(7, 'Temporal anti-aliasing', 'high'),
  t(8, 'Anisotropic filtering and mipmaps', 'low'),
  t(9, 'Layered road material', 'medium'),
  t(10, 'Screen-space reflections with probes', 'high'),
  t(11, 'Atmospheric scattering sky', 'medium'),
  t(12, 'Cascaded shadow maps', 'medium'),
  t(13, 'Irradiance probes', 'high'),
  t(14, 'Wet-surface shading', 'medium'),
  t(15, 'Clear-coat frame paint', 'medium'),
  t(16, 'Specular anti-aliasing', 'high'),
  t(17, 'AgX tone mapping', 'low'),
  t(18, 'Hierarchical LOD with geomorphing', 'medium'),
  t(19, 'Stochastic texture tiling', 'medium'),
  t(20, 'Planar reflections', 'high'),
  t(21, 'Rear-view mirror', null),
  t(22, 'Road wear decals', 'medium'),
  t(23, 'Photometric lamps', 'medium'),
  t(24, 'Retroreflective markings', 'medium'),
  t(25, 'Volumetric clouds', 'ultra', 'still'),
  t(26, 'Froxel volumetric fog', 'ultra'),
  t(27, 'Surface-water simulation', 'high', 'still'),
  t(28, 'Tyre spray', 'high', 'off'),
  t(29, 'Windshield water', null),
  t(30, 'Two-sided foliage', 'medium'),
  t(31, 'Wind animation', 'medium', 'off'),
  t(32, 'Alpha-coverage mipmaps', 'medium'),
  t(33, 'Per-pixel motion blur', 'high', 'off'),
  t(34, 'Wheel rotational blur', 'medium', 'off'),
  t(35, 'Auto exposure', 'medium'),
  t(36, 'Ground-truth ambient occlusion', 'high'),
  t(37, 'Contact shadows', 'high'),
  t(38, 'Clustered forward lighting', 'high'),
  t(39, 'LTC area lights', 'medium'),
  t(40, 'Precomputed radiance transfer sky', 'ultra'),
  t(41, 'Virtual texturing', 'ultra'),
  t(42, 'Geometry clipmaps', 'high'),
  t(43, 'Octahedral impostors', 'medium'),
  t(44, '3D Gaussian splatting', 'ultra'),
  t(45, 'BVH ray-traced reflections', 'ultra'),
  t(46, 'Dynamic diffuse global illumination', 'ultra'),
  t(47, 'ReSTIR many-light sampling', 'ultra'),
  t(48, 'SVGF denoising', 'ultra'),
  t(49, 'Screen-space glare', 'medium'),
  t(50, 'Heat haze', 'high', 'off'),
  // The drawn look: at `low`, in place of PBR (AC11, ADR 0024).
  t(51, 'Banded toon shading', 'low', 'kept', true),
  t(52, 'Ink outlines', 'low', 'kept', true),
  t(53, 'Flat sky gradient', 'low', 'kept', true),
  t(54, 'Dithered foliage', 'low', 'kept', true),
];

const rank = (tier: Tier) => TIERS.indexOf(tier);

/** The tier the scene opens at (L2-111 AC3). */
export function startTier(backend: Backend): Tier {
  return backend === 'webgpu' ? 'ultra' : 'high';
}

/** The ids of the techniques drawn (L2-111 AC2, AC5). */
export function techniquesAt(tier: Tier, backend: Backend, reducedMotion: boolean): Set<number> {
  const top = backend === 'webgl2' ? Math.min(rank(tier), rank('high')) : rank(tier);
  return new Set(
    TECHNIQUES.filter(
      (x) =>
        x.from !== null &&
        rank(x.from) <= top &&
        !(x.lowOnly && tier !== 'low') &&
        !(reducedMotion && x.reducedMotion === 'off'),
    ).map((x) => x.id),
  );
}

/** The tier a drop leads to, or null below `low` (#882). */
export function nextLower(tier: Tier): Tier | null {
  return rank(tier) > 0 ? TIERS[rank(tier) - 1]! : null;
}

/** A window is over budget when its median frame is this many frame periods or more. */
const OVER = 1.2;
/** A window this many frame periods or more is far over: the drop goes straight to `low` (#896). */
const FAR_OVER = 3;
const WINDOW_MS = 2000;

/**
 * Lowers the tier after two 2 s windows in a row whose median frame is over 1.2 × the display's
 * frame period: 20 ms at 60 Hz (AC4). When the second window's median is 3 frame periods or
 * more, the drop goes straight to `low`, so the rider sees one change of look, not three (#896).
 */
export class FrameBudget {
  private start: number | null = null;
  private frames: number[] = [];
  private overInARow = 0;
  private paused = false;

  /** `pinned`: the test-only hook fixed the tier, and no window ever lowers it (#672). */
  constructor(
    private current: Tier,
    private periodMs = 1000 / 60,
    private readonly options: { readonly pinned?: boolean } = {},
  ) {}

  get tier(): Tier {
    return this.current;
  }

  /** Judges against a newly measured frame period, starting the windows afresh (AC9). */
  setPeriod(ms: number): void {
    this.periodMs = ms;
    this.paused = false;
    this.restart();
  }

  /** Judges no window until the next `setPeriod`: the period is being measured again (AC9). */
  pause(): void {
    this.paused = true;
    this.restart();
  }

  /** Lowers the tier one step at once, pinned or not; false at `low` (the sweep's drop, #882). */
  lower(): boolean {
    const lower = nextLower(this.current);
    if (!lower) return false;
    this.current = lower;
    this.restart();
    return true;
  }

  /** Records one frame; returns `drop` when the tier has just been lowered. */
  sample(now: number, frameMs: number): 'keep' | 'drop' {
    if (this.paused || this.options.pinned) return 'keep';
    let verdict: 'keep' | 'drop' = 'keep';
    if (this.start === null) this.start = now;
    if (now - this.start >= WINDOW_MS) {
      verdict = this.close();
      this.start = now;
      this.frames = [];
    }
    this.frames.push(frameMs);
    return verdict;
  }

  private restart(): void {
    this.start = null;
    this.frames = [];
    this.overInARow = 0;
  }

  private close(): 'keep' | 'drop' {
    const sorted = [...this.frames].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    this.overInARow = median > OVER * this.periodMs ? this.overInARow + 1 : 0;
    if (this.overInARow < 2 || this.current === 'low') return 'keep';
    this.overInARow = 0;
    this.current = median >= FAR_OVER * this.periodMs ? 'low' : nextLower(this.current)!;
    return 'drop';
  }
}
