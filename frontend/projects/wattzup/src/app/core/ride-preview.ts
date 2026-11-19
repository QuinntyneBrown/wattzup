// The "Your ride" panel values, from the same plan expansion as the backend (L2-059).
import type { HiitPlan, IntervalsPlan, Segment, SegmentKind, WorkoutPlan } from '@wattzup/api';
import type { ProfileBar, ProfileTone, RidePreview, SummaryRow } from '@wattzup/components';
import { formatDuration } from './format-duration';
import { formatStart } from './video-link';
import {
  averageTargetPower,
  energyKcal,
  expandPlan,
  effortCount,
  totalSeconds,
} from './plan-expansion';

export type { ProfileBar, ProfileTone, RidePreview, SummaryRow };

export interface BikeRidePreview extends RidePreview {
  peakLevel: number;
  avgPower: number;
  kcal: number;
}

/** The profile view box is 32 units high: a level is one unit. */
const PROFILE_HEIGHT = 32;
const round2 = (v: number): number => Math.round(v * 100) / 100;

export function profileTone(kind: SegmentKind): ProfileTone {
  if (kind === 'work' || kind === 'steady') return 'is-work';
  if (kind === 'rest') return 'is-rest';
  return 'is-easy';
}

function profileOf(segments: readonly Segment[], height: (s: Segment) => number): ProfileBar[] {
  const inset = 0.002 * totalSeconds(segments);
  return segments.map((s) => ({
    x: round2(s.start + inset),
    width: round2(s.duration - 2 * inset),
    y: PROFILE_HEIGHT - height(s),
    height: height(s),
    tone: profileTone(s.kind),
  }));
}

function common(plan: WorkoutPlan, segments: readonly Segment[], structure: string) {
  const total = totalSeconds(segments);
  return {
    totalSeconds: total,
    total: formatDuration(total),
    structure,
    timeUnderLoad: plan.kind === 'flat' ? null : formatDuration(timeUnderLoad(segments)),
    legend: (plan.kind === 'flat' ? ['steady'] : ['work', 'rest']) as RidePreview['legend'],
  };
}

/** The sum of every effort's work time. */
function timeUnderLoad(segments: readonly Segment[]): number {
  return segments.filter((s) => s.kind === 'work').reduce((sum, s) => sum + s.duration, 0);
}

const plural = (n: number, one: string): string => `${n} ${one}${n === 1 ? '' : 's'}`;

/** `<sets> sets · <efforts> efforts` (L2-059 criterion 5). */
function intervalsStructure(plan: IntervalsPlan): string {
  return `${plural(plan.sets.length, 'set')} · ${plural(effortCount(plan), 'effort')}`;
}

function hiitStructure(plan: HiitPlan): string {
  return `${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`;
}

function rowsOf(base: { structure: string; timeUnderLoad: string | null }): SummaryRow[] {
  const rows = [{ term: 'Structure', value: base.structure }];
  if (base.timeUnderLoad) rows.push({ term: 'Time under load', value: base.timeUnderLoad });
  return rows;
}

export function previewOf(plan: WorkoutPlan): BikeRidePreview {
  const segments = expandPlan(plan);
  const structure =
    plan.kind === 'hiit'
      ? hiitStructure(plan)
      : plan.kind === 'intervals'
        ? intervalsStructure(plan)
        : `Level ${plan.level} throughout`;
  const base = common(plan, segments, structure);
  const avgPower = averageTargetPower(segments);
  const peakLevel = Math.max(...segments.map((s) => s.level));
  const kcal = energyKcal(avgPower, base.totalSeconds);
  return {
    ...base,
    peakLevel,
    avgPower,
    kcal,
    profileLabel: `Resistance profile: ${base.structure}`,
    profile: profileOf(segments, (s) => s.level),
    profileHeight: PROFILE_HEIGHT,
    rows: [
      ...rowsOf(base),
      { term: 'Peak resistance', value: `Level ${peakLevel}` },
      { term: 'Expected avg power', value: `~${avgPower} W` },
      { term: 'Expected energy', value: `~${kcal} kcal` },
    ],
  };
}

/**
 * The preview with `Video` `Synced from <m:ss.s>` after Time under load (after Structure when
 * there is none), while the plan carries a video; otherwise the preview unchanged (L2-059 AC6).
 */
export function withVideoRow<P extends RidePreview>(
  preview: P | null,
  start: number | null,
): P | null {
  if (!preview || start === null) return preview;
  const rows = [...preview.rows];
  const after = rows.findIndex((r) => r.term === 'Time under load');
  rows.splice((after < 0 ? 0 : after) + 1, 0, {
    term: 'Video',
    value: `Synced from ${formatStart(start)}`,
  });
  return { ...preview, rows };
}
