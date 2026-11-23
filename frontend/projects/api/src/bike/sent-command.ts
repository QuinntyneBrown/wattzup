/** Where a target resistance came from: the plan's segment, or the rider's own change (L2-029 AC1). */
export type ResistanceSource = 'plan' | 'manual';

/** One target resistance sent to the bike, as "Sent to bike" and Diagnostics show it (docs/detailed-designs/bike/control-resistance). */
export interface SentCommand {
  /** The ride time it was sent at, in seconds; `null` until a ride clock runs (slice 5.1). */
  readonly rideTime: number | null;
  readonly level: number;
  readonly source: ResistanceSource;
  /** The time from write to the bike's acknowledgement, in milliseconds (L2-025 AC4). */
  readonly ackMs: number | null;
}
