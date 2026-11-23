import { bankersRound } from './bankers-round';

const watts = (cadence: number, level: number): number =>
  Math.max(0, bankersRound(cadence * (0.55 + level * 0.155)));

/**
 * The Echelon reports no power: it is estimated as max(0, round(cadence × (0.55 + level × 0.155))) W (ADR 0003,
 * L2-023 AC1), unknown when cadence or resistance is (AC2). A segment's target power uses the same formula with its
 * cadence aim (AC3); power within 10 % of a target is on it (L2-059 AC2).
 */
export const PowerModel = {
  estimate(cadence: number | null, level: number | null): number | null {
    return cadence === null || level === null ? null : watts(cadence, level);
  },
  target(cadenceAim: number, level: number): number {
    return watts(cadenceAim, level);
  },
  /** Power within 10 % of its target reads "On target" (L2-059 AC2). */
  onTarget(power: number, target: number): boolean {
    return Math.abs(power - target) <= target * 0.1;
  },
} as const;
