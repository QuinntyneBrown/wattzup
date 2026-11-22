import type { CustomWorkoutDraft, HiitPresetId, Round } from '@telo/api';
import { CUSTOM_WORKOUT_LIMITS as L, HIIT_PRESETS } from './custom-workout';
import { clampOffset } from './video-link';

type Fields = Record<string, unknown>;

const isFields = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const within = (
  value: unknown,
  limit: { readonly min: number; readonly max: number },
): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= limit.min && value <= limit.max;

const round = (value: unknown): Round | null =>
  isFields(value) && within(value['effort'], L.effort) && within(value['recovery'], L.recovery)
    ? { effort: value['effort'], recovery: value['recovery'] }
    : null;

/**
 * A custom workout the backend kept, as Custom workout opens on it (L2-094 AC3), or `null` when it is not one this
 * version of the app can set up: an unknown mode or plan, a setting outside its bounds or of the wrong kind. The
 * backend keeps the settings as the app sent them, so they are checked before use.
 */
export function restoreCustomWorkout(saved: unknown): CustomWorkoutDraft | null {
  if (!isFields(saved)) return null;
  const { mode, preset, edited, rounds, workLevel, recoverLevel, warmUp, coolDown, flat, video } =
    saved;
  if (mode !== 'hiit' && mode !== 'flat') return null;
  if (!HIIT_PRESETS.some((known) => known.id === preset)) return null;
  if (typeof edited !== 'boolean') return null;
  if (!Array.isArray(rounds) || rounds.length < L.rounds.min || rounds.length > L.rounds.max)
    return null;
  const restored = rounds.map(round);
  if (restored.some((r) => r === null)) return null;
  if (!within(workLevel, L.level) || !within(recoverLevel, L.level)) return null;
  if (!within(warmUp, L.warmUp) || !within(coolDown, L.coolDown)) return null;
  if (!isFields(flat)) return null;
  const { level, minutes, cadence } = flat;
  if (!within(level, L.level) || !within(minutes, L.flatMinutes) || !within(cadence, L.flatCadence))
    return null;
  if (!isFields(video)) return null;
  const { on, link, offset } = video;
  if (typeof on !== 'boolean' || typeof link !== 'string' || typeof offset !== 'number')
    return null;
  return {
    mode,
    preset: preset as HiitPresetId,
    edited,
    rounds: restored as Round[],
    workLevel,
    recoverLevel,
    warmUp,
    coolDown,
    flat: { level, minutes, cadence },
    video: { on, link, offset: clampOffset(offset) },
  };
}
