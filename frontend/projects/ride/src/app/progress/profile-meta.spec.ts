import { profileMeta, profileXpLabel } from './profile-meta';

// Traces to: L2-038 AC4; L2-042 AC4; L2-109 AC1, AC2
// Profile's line under the headline: the XP to the next level ("760 XP to level 8"), the rides and kilometres recorded
// ("23 rides · 412 km") and the streak ("4-day streak"), which reads 0 when there is none. At level 30 there is no next
// level, so the line starts with the rides. The XP bar is named by the XP: "1,840 of 2,600 XP", or the total at level 30.
describe('profileMeta', () => {
  const mid = {
    level: 7,
    totalXp: 1840,
    nextLevelXp: 2600,
    streakDays: 4,
    rideCount: 23,
    distanceKm: 412,
  };

  it('reads the mid rider as 760 XP to level 8, 23 rides, 412 km, on a 4-day streak', () => {
    expect(profileMeta(mid)).toBe('760 XP to level 8 · 23 rides · 412 km · 4-day streak');
  });

  it('reads a new rider as 400 XP to level 2, 0 rides, 0 km, on a 0-day streak', () => {
    expect(
      profileMeta({
        level: 1,
        totalXp: 0,
        nextLevelXp: 400,
        streakDays: 0,
        rideCount: 0,
        distanceKm: 0,
      }),
    ).toBe('400 XP to level 2 · 0 rides · 0 km · 0-day streak');
  });

  it('groups thousands, as the veteran’s 1,280 XP to level 19 and 3,870 km', () => {
    expect(
      profileMeta({
        level: 18,
        totalXp: 9120,
        nextLevelXp: 10400,
        streakDays: 21,
        rideCount: 146,
        distanceKm: 3870,
      }),
    ).toBe('1,280 XP to level 19 · 146 rides · 3,870 km · 21-day streak');
  });

  it('reads one ride in the singular', () => {
    expect(profileMeta({ ...mid, rideCount: 1, distanceKm: 14 })).toBe(
      '760 XP to level 8 · 1 ride · 14 km · 4-day streak',
    );
  });

  it('starts with the rides at level 30', () => {
    expect(
      profileMeta({ ...mid, level: 30, totalXp: 25000, nextLevelXp: null, streakDays: 2 }),
    ).toBe('23 rides · 412 km · 2-day streak');
  });
});

describe('profileXpLabel', () => {
  it('names the XP of the next level, grouped', () => {
    expect(profileXpLabel({ totalXp: 1840, nextLevelXp: 2600 })).toBe('1,840 of 2,600 XP');
    expect(profileXpLabel({ totalXp: 0, nextLevelXp: 400 })).toBe('0 of 400 XP');
  });

  it('names the total alone at level 30', () => {
    expect(profileXpLabel({ totalXp: 25000, nextLevelXp: null })).toBe('25,000 XP');
  });
});
