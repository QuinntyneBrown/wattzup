// Unit test
// Traces to: L2-043 AC1
// Description: a class's tier is level 1, 5, 10 or 20, and no other level, one case per level from 0 to 21.
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Api.Tests;

public sealed class ClassTierRulesTests
{
    public static TheoryData<int, bool> Levels()
    {
        int[] tiers = [1, 5, 10, 20];
        var levels = new TheoryData<int, bool>();
        for (var level = 0; level <= 21; level++) levels.Add(level, tiers.Contains(level));
        return levels;
    }

    [Theory]
    [MemberData(nameof(Levels))]
    public void A_level_is_a_tier_only_when_it_is_1_5_10_or_20(int level, bool isTier) =>
        Assert.Equal(isTier, ClassTierRules.IsTier(level));
}
