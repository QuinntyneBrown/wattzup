// The simulated pacers of the Riders nearby board (L2-107). Computed here only: never sent to
// the backend, never kept in a session (L1-015).
import type { WorldRidePacer } from '@telo/api';

export interface Pacer {
  readonly name: string;
  /** The rider colour, `--color-rider-<n>`; 4 is You. */
  readonly jersey: number;
  /** Metres ahead on average; negative is behind. */
  readonly base: number;
  readonly amp: number;
  /** Seconds. */
  readonly period: number;
  readonly phase: number;
}

/** The six pacers, in the order of L2-107. */
export const PACERS: readonly Pacer[] = [
  { name: 'Maya Okafor', jersey: 2, base: 46, amp: 28, period: 140, phase: 0.3 },
  { name: 'Jonas Lindqvist', jersey: 3, base: 18, amp: 14, period: 95, phase: 2.1 },
  { name: 'Ana Ferreira', jersey: 5, base: -14, amp: 16, period: 120, phase: 1.2 },
  { name: 'Kenji Watanabe', jersey: 7, base: -48, amp: 30, period: 200, phase: 4.0 },
  { name: 'Sophie Dubois', jersey: 1, base: 92, amp: 40, period: 260, phase: 5.1 },
  { name: 'Ravi Patel', jersey: 6, base: -96, amp: 36, period: 230, phase: 0.9 },
];

const YOU_JERSEY = 4;
const MIN_SPEED = 3;

/** Metres ahead of the rider at second `t`; negative is behind. */
export function pacerGap(pacer: Pacer, t: number): number {
  return pacer.base + pacer.amp * Math.sin(t / pacer.period + pacer.phase);
}

/** `+m:ss` ahead, `−m:ss` (U+2212) behind, in whole seconds. */
export function formatGap(seconds: number): string {
  const whole = Math.round(seconds);
  const abs = Math.abs(whole);
  const text = `${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
  return whole < 0 ? `−${text}` : `+${text}`;
}

/** The pacers and You, from furthest ahead to furthest behind (L2-107 AC2, AC3). */
export function pacerBoard(t: number, speedKmh: number | null): WorldRidePacer[] {
  const speed = Math.max((speedKmh ?? 0) / 3.6, MIN_SPEED);
  const rows = PACERS.map((p) => ({ gap: pacerGap(p, t), pacer: p }));
  return [
    ...rows.map(({ gap, pacer }) => ({
      gap,
      row: { name: pacer.name, jersey: pacer.jersey, timeGap: formatGap(gap / speed), you: false },
    })),
    { gap: 0, row: { name: 'You', jersey: YOU_JERSEY, timeGap: null, you: true } },
  ]
    .sort((a, b) => b.gap - a.gap)
    .map(({ row }) => row);
}

/** A pacer drawn in the World Ride scene (L2-107 AC7). */
export interface PacerOnRoad {
  readonly jersey: number;
  /** Metres ahead of the rider; negative is behind. */
  readonly metres: number;
  /** Metres right of the road's centre line; negative is left. The rider rides on 0. */
  readonly lane: number;
}

export interface MutablePacerOnRoad {
  jersey: number;
  metres: number;
  lane: number;
}

/** Each pacer's line across the road, by jersey: clear of the rider and of each other. */
const LANES: Record<number, number> = { 1: -1.7, 2: 1.5, 3: -0.9, 5: 1.1, 6: -1.3, 7: 2.0 };
/** A pacer alongside is still drawn; one further behind is out of the chase camera's view. */
const ALONGSIDE = -4;
const PACER_POOL: MutablePacerOnRoad[] = Array.from({ length: 8 }, () => ({
  jersey: 0,
  metres: 0,
  lane: 0,
}));

/** The pacers from 4 m behind to `far` metres ahead, from furthest ahead (L2-107 AC7). */
export function pacersOnRoad(
  t: number,
  far: number,
  pacers: readonly Pacer[] = PACERS,
  out?: MutablePacerOnRoad[],
): PacerOnRoad[] {
  const dst = out ?? [];
  dst.length = 0;
  for (const p of pacers) {
    const metres = pacerGap(p, t);
    if (metres < ALONGSIDE || metres > far) continue;
    let slot: MutablePacerOnRoad;
    if (out) {
      slot = PACER_POOL[dst.length] ?? (PACER_POOL[dst.length] = { jersey: 0, metres: 0, lane: 0 });
      slot.jersey = p.jersey;
      slot.metres = metres;
      slot.lane = LANES[p.jersey] ?? 1;
    } else {
      slot = { jersey: p.jersey, metres, lane: LANES[p.jersey] ?? 1 };
    }
    dst.push(slot);
  }
  dst.sort((a, b) => b.metres - a.metres);
  return dst;
}
