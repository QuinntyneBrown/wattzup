/** A rider's gross efficiency, and the joules in a calorie (L2-023 AC4). */
const EFFICIENCY = 0.24;
const JOULES_PER_CALORIE = 4.184;

/**
 * Energy burned in kcal: the work done (average power × running seconds, in kJ) over a 24% efficient rider, in
 * kilocalories: round(208 × 760 ÷ 1000 ÷ 0.24 ÷ 4.184) = 157 kcal (L2-023 AC4).
 */
export const EnergyModel = {
  kcal(avgPowerW: number, runningSeconds: number): number {
    return Math.round((avgPowerW * runningSeconds) / 1000 / EFFICIENCY / JOULES_PER_CALORIE);
  },
} as const;
