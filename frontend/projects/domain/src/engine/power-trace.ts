/**
 * The rider's power for each second of a ride, for the trace of power against the plan (L2-103 AC3): one slot per
 * second of the plan, allocated once, so nothing grows however long the ride (AGENTS.md, bound what grows). Seconds a
 * hidden tab skipped take the power of the moment; an unknown power counts as none.
 */
export class PowerTrace {
  private readonly watts: Float32Array;
  private filled = 0;

  constructor(readonly lengthSeconds: number) {
    this.watts = new Float32Array(lengthSeconds);
  }

  /** The seconds recorded so far. */
  get seconds(): number {
    return this.filled;
  }

  /** The ride has reached `second` at `watts`: every second since the last one recorded takes it. */
  record(second: number, watts: number | null): void {
    const to = Math.min(second, this.lengthSeconds);
    if (to <= this.filled) return;
    this.watts.fill(watts ?? 0, this.filled, to);
    this.filled = to;
  }

  /**
   * The average power of each `bucket` seconds recorded, the last bucket over the seconds it has so far: what the trace
   * draws, so a long ride draws as few points as a short one.
   */
  averages(bucket: number): number[] {
    const averages: number[] = [];
    for (let start = 0; start < this.filled; start += bucket) {
      const end = Math.min(start + bucket, this.filled);
      let sum = 0;
      for (let i = start; i < end; i++) sum += this.watts[i]!;
      averages.push(sum / (end - start));
    }
    return averages;
  }
}
