namespace Telo.Ride.Domain.Rides;

/// <summary>A total XP's level, the next level's threshold and the XP to it; both are null at level 30 (L2-038).</summary>
public sealed record LevelProgress(int Level, int TotalXp, int? NextThresholdXp, int? XpToNext);

/// <summary>
/// The rider levels, 1 to 30 (L2-038): a total's level is the highest whose threshold it reaches. Level 2 needs 400 XP,
/// level 8 needs 2,600 and level 19 needs 10,400; the rest are provisional until open question 1 of docs/specs/L2.md is
/// settled, and keep the mocks' mid rider (1,840 XP) at level 7 and their veteran (9,120 XP) at level 18.
/// </summary>
public static class LevelTable
{
    /// <summary>The XP each level needs, from level 1.</summary>
    private static readonly int[] Thresholds =
    [
        0, 400, 650, 900, 1150, 1450, 1800, 2600, 3200, 3800,
        4400, 5000, 5600, 6200, 6800, 7400, 8000, 8600, 10400, 11400,
        12400, 13400, 14400, 15400, 16400, 17400, 18400, 19400, 20400, 21400,
    ];

    /// <summary>The highest level whose threshold <paramref name="totalXp"/> reaches.</summary>
    public static int LevelFor(int totalXp) => Thresholds.Count(threshold => totalXp >= threshold);

    /// <summary>The level of <paramref name="totalXp"/>, the next level's threshold and the XP still to earn for it.</summary>
    public static LevelProgress Progress(int totalXp)
    {
        var level = LevelFor(totalXp);
        int? next = level < Thresholds.Length ? Thresholds[level] : null;
        return new(level, totalXp, next, next - totalXp);
    }
}
