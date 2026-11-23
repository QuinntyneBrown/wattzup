/**
 * One reading decoded from a bike notification (docs/detailed-designs/bike/read-bike-telemetry): when it arrived,
 * and whichever metrics that notification carried. An Echelon `D1` frame carries cadence, a `D2` frame resistance;
 * FTMS Indoor Bike Data carries the fields its flags mark present.
 */
export interface TelemetrySample {
  /** When the notification arrived, in milliseconds since the epoch. */
  readonly at: number;
  readonly cadence?: number;
  readonly resistance?: number;
  readonly speedKmh?: number;
  readonly powerW?: number;
  readonly heartRate?: number;
}
