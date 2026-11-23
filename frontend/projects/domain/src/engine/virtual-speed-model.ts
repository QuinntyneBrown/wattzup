/**
 * The race's virtual speed from the rider's power: 20 × ∛(max(W, 1) ÷ 20) km/h, twice `main`'s expected-speed
 * formula (route-profile.ts), so 371 W rides at 52.9 km/h (L2-059 AC3) and a map's bends and hills come at a racing
 * pace. Grade does not change it yet (the design's open question against L2-064 AC2).
 */
export const VirtualSpeedModel = {
  speedKmh(watts: number): number {
    return 20 * Math.cbrt(Math.max(watts, 1) / 20);
  },
  /** The same speed in metres a second, which the route profile and the distance ridden step by. */
  speedMs(watts: number): number {
    return VirtualSpeedModel.speedKmh(watts) / 3.6;
  },
} as const;
