import type { NextGroupSessionDto } from '@telo/api';

/**
 * A card's group chip (L2-083 AC2): "Group in 9 min · 6/10", the whole minutes to the next session's start rounded up,
 * so the last minute reads 1, from the device's clock, and the seats taken.
 */
export function groupChip(next: NextGroupSessionDto, now: number): string {
  const minutes = Math.max(1, Math.ceil((Date.parse(next.startsAt) - now) / 60_000));
  return `Group in ${minutes} min · ${next.seatsTaken}/${next.capacity}`;
}
