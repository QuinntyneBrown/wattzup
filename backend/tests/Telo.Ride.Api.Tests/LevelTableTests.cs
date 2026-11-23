// Direct test of a rule with a table of cases
// Traces to: L2-038 AC1, AC2
// Description: a rider's level is the highest of 1 to 30 whose threshold the total XP reaches. Level 2 needs 400 XP,
// level 8 needs 2,600 and level 19 needs 10,400; the others are the provisional table of
// docs/detailed-designs/progression/earn-xp-and-rider-levels, which keeps the mid rider (1,840 XP) at level 7 and the
// veteran (9,120 XP) at level 18. At level 30 there is no next threshold and the level stays 30.
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Api.Tests;

public sealed class LevelTableTests
{
    [Theory]
    [InlineData(1, 0)]
    [InlineData(2, 400)]
    [InlineData(3, 650)]
    [InlineData(4, 900)]
    [InlineData(5, 1150)]
    [InlineData(6, 1450)]
    [InlineData(7, 1800)]
    [InlineData(8, 2600)]
    [InlineData(9, 3200)]
    [InlineData(10, 3800)]
    [InlineData(11, 4400)]
    [InlineData(12, 5000)]
    [InlineData(13, 5600)]
    [InlineData(14, 6200)]
    [InlineData(15, 6800)]
    [InlineData(16, 7400)]
    [InlineData(17, 8000)]
    [InlineData(18, 8600)]
    [InlineData(19, 10400)]
    [InlineData(20, 11400)]
    [InlineData(21, 12400)]
    [InlineData(22, 13400)]
    [InlineData(23, 14400)]
    [InlineData(24, 15400)]
    [InlineData(25, 16400)]
    [InlineData(26, 17400)]
    [InlineData(27, 18400)]
    [InlineData(28, 19400)]
    [InlineData(29, 20400)]
    [InlineData(30, 21400)]
    public void Each_level_starts_at_its_threshold(int level, int thresholdXp)
    {
        Assert.Equal(level, LevelTable.LevelFor(thresholdXp));
        if (level > 1) Assert.Equal(level - 1, LevelTable.LevelFor(thresholdXp - 1));
    }

    [Theory]
    [InlineData(0, 1, 400, 400)]
    [InlineData(1840, 7, 2600, 760)] // AC4: "760 XP to level 8"
    [InlineData(9120, 18, 10400, 1280)]
    public void Progress_names_the_next_threshold_and_the_xp_to_it(int totalXp, int level, int next, int toNext)
    {
        var progress = LevelTable.Progress(totalXp);

        Assert.Equal(new LevelProgress(level, totalXp, next, toNext), progress);
    }

    [Fact]
    public void At_level_30_the_total_grows_and_there_is_no_next_threshold() // AC2
    {
        Assert.Equal(new LevelProgress(30, 99_999, null, null), LevelTable.Progress(99_999));
    }
}
