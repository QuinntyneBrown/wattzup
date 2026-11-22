import type { RideFacts } from '@telo/api';

/** To two decimals: the speeds and the distance a ride sends. */
const hundredths = (value: number) => Math.round(value * 100) / 100;

/**
 * A ride's record from its start to its finish, for the backend to record it (Record a ride, L2-044 AC2). It gives the
 * ride its id when the ride starts. For each second ridden it keeps the speed the ride moves at (a race's virtual
 * speed, a class's bike speed) in a buffer sized for four hours, and adds the power to the output; seconds a hidden
 * tab skipped count at the power and speed of the moment, and an unknown power or speed counts as none. It counts the
 * seconds whose power was within 10 % of the target (L2-037 AC3) for the share on target. The distance is
 * what the speeds sent add up to, to the hundredth, so the backend's check of one against the other holds (L2-125 AC2).
 * Nothing is kept past four hours, the longest ride the backend records.
 */
export class RideRecorder {
  static readonly maxSeconds = 14_400;

  private readonly rideId = crypto.randomUUID();
  private readonly speedsKmh = new Float64Array(RideRecorder.maxSeconds);
  private seconds = 0;
  private joules = 0;
  private topPowerW = 0;
  private onTargetSeconds = 0;

  /** `seconds` seconds ridden at `powerW` and `speedKmh`, on target when that power was within 10 % of the target. */
  record(powerW: number | null, speedKmh: number | null, seconds = 1, onTarget = false): void {
    const power = powerW ?? 0;
    const speed = hundredths(speedKmh ?? 0);
    const kept = Math.min(seconds, RideRecorder.maxSeconds - this.seconds);
    if (kept <= 0) return;
    this.speedsKmh.fill(speed, this.seconds, this.seconds + kept);
    this.seconds += kept;
    if (onTarget) this.onTargetSeconds += kept;
    this.joules += power * kept;
    this.topPowerW = Math.max(this.topPowerW, power);
  }

  /** The output so far in kJ, the sum of each second's power ÷ 1000 (L2-023 AC5). */
  get outputKj(): number {
    return this.joules / 1000;
  }

  /** The ride's facts as the backend reads them, finished at `finishedAt` on this device's time zone. */
  facts(finishedAt: Date): RideFacts {
    const speedSamplesKmh = Array.from(this.speedsKmh.subarray(0, this.seconds));
    return {
      rideId: this.rideId,
      elapsedSeconds: this.seconds,
      distanceMeters: hundredths(speedSamplesKmh.reduce((metres, kmh) => metres + kmh / 3.6, 0)),
      outputKj: Math.round(this.joules) / 1000,
      maxPowerWatts: Math.round(this.topPowerW),
      maxSpeedKmh: speedSamplesKmh.reduce((top, kmh) => Math.max(top, kmh), 0),
      onTargetShare:
        this.seconds === 0 ? 0 : Math.round((this.onTargetSeconds / this.seconds) * 1000) / 1000,
      speedSamplesKmh,
      finishedAt: finishedAt.toISOString(),
      timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}
