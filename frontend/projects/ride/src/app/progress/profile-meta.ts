import type { ProgressDto } from '@telo/api';

const XP = new Intl.NumberFormat('en-GB');

/**
 * Profile's line under the headline (docs/mocks/pages/profile/): "760 XP to level 8 · 23 rides · 412 km · 4-day streak"
 * (L2-038 AC4, L2-042 AC4, L2-109 AC1, AC2); the streak reads 0 when there is none. At level 30 there is no next level,
 * so the line starts with the rides.
 */
export function profileMeta({
  level,
  totalXp,
  nextLevelXp,
  streakDays,
  rideCount,
  distanceKm,
}: Pick<
  ProgressDto,
  'level' | 'totalXp' | 'nextLevelXp' | 'streakDays' | 'rideCount' | 'distanceKm'
>): string {
  const parts = [
    `${XP.format(rideCount)} ${rideCount === 1 ? 'ride' : 'rides'}`,
    `${XP.format(distanceKm)} km`,
    `${streakDays}-day streak`,
  ];
  if (nextLevelXp !== null)
    parts.unshift(`${XP.format(nextLevelXp - totalXp)} XP to level ${level + 1}`);
  return parts.join(' · ');
}

/** The name of Profile's XP bar (L2-109 AC1): "1,840 of 2,600 XP", or the total alone at level 30. */
export function profileXpLabel({
  totalXp,
  nextLevelXp,
}: Pick<ProgressDto, 'totalXp' | 'nextLevelXp'>): string {
  return nextLevelXp === null
    ? `${XP.format(totalXp)} XP`
    : `${XP.format(totalXp)} of ${XP.format(nextLevelXp)} XP`;
}
