// Ride sound's rules (L2-129): one moment of the live state in, the voices' numbers out. No Web
// Audio here; RideSound plays what this computes.

/** A freewheel running down from the last speed since `startedAt` (ms, monotonic). */
export interface FreewheelState {
  readonly fromKmh: number;
  readonly startedAt: number;
}

export interface RideSoundInput {
  readonly cadence: number | null;
  readonly speedKmh: number | null;
  readonly resistance: number | null;
  /** False while paused, hidden, the bike is lost or a video plays (AC8, AC9). */
  readonly audible: boolean;
  /** 0 to 1. */
  readonly volume: number;
  readonly freewheel: FreewheelState | null;
  /** True while a cue beep plays, and 0.15 s after it (AC7). */
  readonly ducked: boolean;
  /** ms, on the same clock as `freewheel.startedAt`. */
  readonly now: number;
}

export interface RideSoundParams {
  readonly chain: { readonly ticksPerSecond: number; readonly gain: number };
  readonly freewheel: { readonly clicksPerSecond: number; readonly gain: number };
  readonly wind: { readonly cutoffHz: number; readonly gain: number };
  readonly tyre: { readonly centreHz: number; readonly gain: number };
}

/** How long the flywheel takes to spin down (AC5). */
export const FREEWHEEL_MS = 3000;
const TOP_LEVEL = 32;
/** The share of its level ride sound keeps under a cue beep (AC7). */
export const DUCKED = 0.3;

/** The voices' rates, gains and filters for one moment (L2-129 AC4 to AC6, AC8, AC9). */
export function rideSoundParams(input: RideSoundInput): RideSoundParams {
  const cadence = Math.max(input.cadence ?? 0, 0);
  const speed = Math.max(input.speedKmh ?? 0, 0);
  // A closed gate silences; a cue beep ducks to 30 % (AC7, AC8, AC9).
  const volume = input.audible ? input.volume * (input.ducked ? DUCKED : 1) : 0;

  // One tick per pedal stroke, two strokes a turn; louder with resistance, a quarter at level 1.
  const ticksPerSecond = (cadence * 2) / 60;
  const level = input.resistance === null ? 1 : input.resistance;
  const share = 0.25 + (0.75 * (Math.min(Math.max(level, 1), TOP_LEVEL) - 1)) / (TOP_LEVEL - 1);
  const chainGain = ticksPerSecond > 0 ? volume * share : 0;

  // The freewheel slows and fades in a straight line over 3 s.
  const left = input.freewheel
    ? Math.max(1 - (input.now - input.freewheel.startedAt) / FREEWHEEL_MS, 0)
    : 0;
  const clicksPerSecond = input.freewheel ? input.freewheel.fromKmh * left : 0;

  return {
    chain: { ticksPerSecond, gain: chainGain },
    freewheel: { clicksPerSecond, gain: 0.5 * volume * left },
    wind: { cutoffHz: 300 + 40 * speed, gain: 0.6 * volume * Math.min(speed / 50, 1) },
    tyre: { centreHz: 150 + 10 * speed, gain: 0.3 * volume * Math.min(speed / 40, 1) },
  };
}

export interface FreewheelStep {
  /** The cadence of the state before this one; null before the first. */
  readonly previousCadence: number | null;
  readonly cadence: number | null;
  /** The last `speed_kmh` above 0. */
  readonly lastKmh: number;
  readonly now: number;
}

/**
 * The freewheel after this state (AC5): it starts when the cadence falls from above 0 to 0, holds
 * while it stays at 0, runs out after 3 s, and stops when the cadence rises again.
 */
export function nextFreewheel(
  previous: FreewheelState | null,
  step: FreewheelStep,
): FreewheelState | null {
  if ((step.cadence ?? 0) > 0) return null;
  if (previous) return step.now - previous.startedAt >= FREEWHEEL_MS ? null : previous;
  const fell = (step.previousCadence ?? 0) > 0 && step.lastKmh > 0;
  return fell ? { fromKmh: step.lastKmh, startedAt: step.now } : null;
}
