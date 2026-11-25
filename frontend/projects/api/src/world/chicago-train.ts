/** Centre of the bidirectional four-car train in metres along the elevated Wabash tracks. */
export function chicagoTrainX(seconds: number): number {
  return 225 + 225 * Math.sin(seconds * 0.068 - 0.45);
}

/** Audible distance to the nearest car under the elevated line on the 1,750 m circuit. */
export function chicagoRailPass(metres: number, seconds: number): number {
  const d = (metres + 65) % 1750;
  const trackX = d > 1620 ? d - 1750 : d;
  if (trackX > 530 || trackX < -55) return 0;
  const gap = Math.max(0, Math.abs(chicagoTrainX(seconds) - trackX) - 27);
  return Math.max(0, 1 - gap / 145) ** 2;
}
