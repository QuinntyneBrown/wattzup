/**
 * The cadence the simulated rider pedals each second (L2-024): a warm-up from 60 to 85 rpm over the first 30 seconds,
 * then 85 rpm rising and falling by 5 every 20 seconds, so the readouts move as they do on a real ride.
 */
export const SimulatedRiderProfile = {
  warmUpSeconds: 30,

  cadenceAt(second: number): number {
    if (second < this.warmUpSeconds) return Math.round(60 + (25 * second) / this.warmUpSeconds);
    return Math.round(85 + 5 * Math.sin((2 * Math.PI * (second - this.warmUpSeconds)) / 20));
  },
} as const;
