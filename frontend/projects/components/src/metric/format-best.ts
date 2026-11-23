/**
 * A best time in whole seconds as Map Select and Race Setup write it: minutes and seconds, an hour or more too
 * ("27:10", "71:20"). A ride clock reads hours from an hour (`formatClock`).
 */
export function formatBest(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
