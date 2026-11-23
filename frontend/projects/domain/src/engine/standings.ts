import type { FieldPosition } from './race-field';

/** The slowest speed a gap is measured at, m/s, so a stopped rider's gaps stay finite (L2-059 AC5). */
export const GAP_FLOOR_MS = 4;

/** One row of the standings: a rider or an opponent, its place and its gap to the rider in seconds. */
export interface Standing {
  readonly id: string;
  readonly name: string;
  readonly jersey: string;
  readonly bot: boolean;
  readonly you: boolean;
  /** 1 for the leader. */
  readonly place: number;
  /** Seconds the opponent is ahead (> 0) or behind (< 0) the rider; 0 for the rider. */
  readonly gap: number;
  /** Whether a riders-online race's service marked the rider DNF (L2-124). */
  readonly dnf?: boolean;
}

/** The rider's id among the standings. */
export const YOU = 'you';

/**
 * The race's standings (L2-060 AC1, L2-059 AC5): the rider and the field ordered by distance, the furthest first; riders
 * held at the finish line by the second they reached it (`crossings`, by id, the rider's as `YOU`, L2-071 AC1); a tie
 * keeping the rider ahead and then the field's order. Each gap is the distance between the opponent and the rider ÷ the
 * rider's speed, taken as at least 4 m/s.
 */
export function rankStandings(
  field: readonly FieldPosition[],
  yourMetres: number,
  yourSpeedMs: number | null,
  crossings: ReadonlyMap<string, number> = new Map(),
): Standing[] {
  const speed = Math.max(yourSpeedMs ?? 0, GAP_FLOOR_MS);
  const you = { id: YOU, name: 'You', jersey: 'you', bot: false, metres: yourMetres };
  return [you, ...field]
    .map((rider, order) => ({ rider, order }))
    .sort(
      (a, b) =>
        b.rider.metres - a.rider.metres ||
        (crossings.get(a.rider.id) ?? 0) - (crossings.get(b.rider.id) ?? 0) ||
        a.order - b.order,
    )
    .map(({ rider }, i) => ({
      id: rider.id,
      name: rider.name,
      jersey: rider.jersey,
      bot: rider.bot,
      you: rider.id === YOU,
      place: i + 1,
      gap: rider.id === YOU ? 0 : (rider.metres - yourMetres) / speed,
    }));
}

/** A gap in whole seconds: "+0:07" ahead, "−0:05" behind with a true minus, "0:00" level. */
export function formatGap(seconds: number): string {
  const whole = Math.round(Math.abs(seconds));
  const text = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  if (whole === 0) return text;
  return `${seconds > 0 ? '+' : '−'}${text}`;
}

/** A place as English reads it: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st. */
export function ordinal(place: number): string {
  const teen = place % 100 >= 11 && place % 100 <= 13;
  const suffix = teen
    ? 'th'
    : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[place % 10] ?? 'th');
  return `${place}${suffix}`;
}
