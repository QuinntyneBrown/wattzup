/**
 * Home's heading (L2-033 AC1, AC3): "Morning, {name}." before 12:00, "Afternoon, {name}." from 12:00 to 16:59 and
 * "Evening, {name}." from 17:00; a rider with no rides yet is welcomed with "Welcome, {name}. Your first race opens a new
 * map." A rider who has not chosen a name yet is greeted without one.
 */
export function homeGreeting(name: string | null, hour: number, isNewRider: boolean): string {
  const to = name ? `, ${name}` : '';
  if (isNewRider) return `Welcome${to}. Your first race opens a new map.`;
  const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${part}${to}.`;
}
