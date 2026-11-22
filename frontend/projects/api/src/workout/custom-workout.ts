/** Custom workout's two training modes (L2-094 AC2). */
export type TrainingMode = 'hiit' | 'flat';

/** The HIIT plans a custom workout starts from (L2-095 AC1). */
export type HiitPresetId = 'gcn30' | 'tabata' | 'forty-twenty' | 'minute-on' | 'long-climbs';

/** One effort and the recovery after it, in seconds (L2-095). */
export interface Round {
  readonly effort: number;
  readonly recovery: number;
}

/** Flat resistance's settings (L2-097): one level for `minutes` at a cadence goal. */
export interface FlatSettings {
  readonly level: number;
  readonly minutes: number;
  readonly cadence: number;
}

/**
 * The custom workout the rider is setting up (L2-094 to L2-097): its mode, the HIIT plan it started from and whether
 * its rounds were changed since, the rounds, the work and recover levels, warm-up and cool-down in seconds, and flat
 * resistance's settings. Both modes' settings are kept, so switching back finds them as they were.
 */
export interface CustomWorkoutDraft {
  readonly mode: TrainingMode;
  readonly preset: HiitPresetId;
  readonly edited: boolean;
  readonly rounds: readonly Round[];
  readonly workLevel: number;
  readonly recoverLevel: number;
  readonly warmUp: number;
  readonly coolDown: number;
  readonly flat: FlatSettings;
}
