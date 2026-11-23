import { bankersRound } from './bankers-round';

/** The Echelon reports no speed: it is cadence × 0.37497622 km/h, to one decimal (L2-022 AC1). */
export const SpeedModel = {
  KMH_PER_RPM: 0.37497622,
  speedKmh(cadence: number): number {
    return bankersRound(cadence * SpeedModel.KMH_PER_RPM, 1);
  },
} as const;
