import { toLevelView } from './level-view';

// Traces to: L2-032 AC2; L2-038 AC2
// The header's level link from the backend's progress: the label "1,840 / 2,600 XP", the accessible name "Level 7,
// 1840 of 2600 XP", and a fill of the total over the next level's threshold, to one decimal. At level 30 there is no
// next threshold and the bar is full.
describe('toLevelView', () => {
  it('reads the mid rider as level 7 with 1,840 of 2,600 XP, filled to 70.8 %', () => {
    expect(toLevelView({ level: 7, totalXp: 1840, nextLevelXp: 2600, streakDays: 4 })).toEqual({
      level: 7,
      label: '1,840 / 2,600 XP',
      ariaLabel: 'Level 7, 1840 of 2600 XP',
      fillPercent: 70.8,
    });
  });

  it('reads a new rider as level 1 with 0 of 400 XP, empty', () => {
    expect(toLevelView({ level: 1, totalXp: 0, nextLevelXp: 400, streakDays: 0 })).toEqual({
      level: 1,
      label: '0 / 400 XP',
      ariaLabel: 'Level 1, 0 of 400 XP',
      fillPercent: 0,
    });
  });

  it('reads level 30 as its total alone, full', () => {
    expect(toLevelView({ level: 30, totalXp: 21400, nextLevelXp: null, streakDays: 0 })).toEqual({
      level: 30,
      label: '21,400 XP',
      ariaLabel: 'Level 30, 21400 XP',
      fillPercent: 100,
    });
  });
});
