import type { Standings } from '@telo/api';

/** One row of the group board as the page draws it. */
export interface GroupBoardRowView {
  readonly position: number;
  readonly name: string;
  readonly jersey: string;
  /** Output in whole kJ. */
  readonly kj: number;
  readonly you: boolean;
}

/** The group board as the page draws it (L2-090 AC1). */
export interface GroupBoardView {
  /** The rider's place, "5th"; `null` while they are not on the board. */
  readonly place: string | null;
  readonly total: number;
  readonly rows: readonly GroupBoardRowView[];
}

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st. */
export function ordinal(place: number): string {
  const teen = place % 100 >= 11 && place % 100 <= 13;
  const suffix = teen ? 'th' : (['th', 'st', 'nd', 'rd'][place % 10] ?? 'th');
  return `${place}${suffix}`;
}

/**
 * The board's view of the standings the hub sent: every rider in the order the hub ranked them, highest output first,
 * each output in whole kJ, and the rider's own row (the one in their seat's jersey) as "You" in the "you" jersey, with
 * their place over the field. `null` before the first standings.
 */
export function groupBoardView(
  standings: Standings | null,
  seatJersey: string | null,
): GroupBoardView | null {
  if (standings === null) return null;
  const rows = standings.rows.map((row) => {
    const you = row.jersey === seatJersey;
    return {
      position: row.position,
      name: you ? 'You' : row.name,
      jersey: you ? 'you' : row.jersey,
      kj: Math.round(row.outputKj),
      you,
    };
  });
  const mine = rows.find((row) => row.you);
  return { place: mine ? ordinal(mine.position) : null, total: rows.length, rows };
}
