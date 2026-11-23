/** Who sits in a seat of a race's start grid: the rider, a rider online, a bot, or nobody. */
export type LobbySeatKind = 'you' | 'rider' | 'bot' | 'open';

/**
 * One seat of a race's start grid (L2-052): its occupant's name ("You", "lena.k", "Pacer Nova" or "Open seat"), the
 * jersey token suffix of their dot (`nova` reads `--jersey-nova`; none for an open seat), the line beside the name
 * ("Lv 7", "DE · Lv 4" or "Bot"; none for an open seat) and whether they have pressed ready.
 */
export interface LobbySeat {
  readonly kind: LobbySeatKind;
  readonly name: string;
  readonly jersey: string | null;
  readonly meta: string | null;
  readonly ready: boolean;
}
