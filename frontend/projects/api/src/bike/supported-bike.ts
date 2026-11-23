/** How fully Telo Ride drives a bike (L2-007): telemetry and resistance, or FTMS in beta. */
export type BikeSupportLevel = 'full-control' | 'beta';

/** One row of Connect Bike's "Works with" list. */
export interface SupportedBike {
  readonly label: string;
  readonly level: BikeSupportLevel;
}
