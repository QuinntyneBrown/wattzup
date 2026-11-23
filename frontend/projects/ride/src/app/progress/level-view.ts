import type { LevelView, ProgressDto } from '@telo/api';

const XP = new Intl.NumberFormat('en-GB');

/**
 * The header's level link from the backend's progress (L2-032 AC2): "1,840 / 2,600 XP", named "Level 7, 1840 of 2600
 * XP", and filled by the total over the next level's threshold to one decimal. At level 30 there is no next threshold:
 * the total stands alone and the bar is full (L2-038 AC2).
 */
export function toLevelView({
  level,
  totalXp,
  nextLevelXp,
}: Pick<ProgressDto, 'level' | 'totalXp' | 'nextLevelXp' | 'streakDays'>): LevelView {
  if (nextLevelXp === null) {
    return {
      level,
      label: `${XP.format(totalXp)} XP`,
      ariaLabel: `Level ${level}, ${totalXp} XP`,
      fillPercent: 100,
    };
  }
  return {
    level,
    label: `${XP.format(totalXp)} / ${XP.format(nextLevelXp)} XP`,
    ariaLabel: `Level ${level}, ${totalXp} of ${nextLevelXp} XP`,
    fillPercent: Math.min(100, Math.round((totalXp / nextLevelXp) * 1000) / 10),
  };
}
