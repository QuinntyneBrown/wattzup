// Unit test (the rule's table of cases)
// Traces to: L2-100 AC3
// Description: a custom workout's plan is kept only when every segment is at least 5 seconds, every level is 1 to 32
// and the total is 1 to 180 minutes; one case per row.
using Telo.Ride.Domain;
using Telo.Ride.Domain.Workouts;

namespace Telo.Ride.Api.Tests;

public sealed class WorkoutPlanRulesTests
{
    [Theory]
    [InlineData(new[] { 1800 }, new[] { 12 }, true)] // flat, 30 minutes at level 12
    [InlineData(new[] { 60 }, new[] { 1 }, true)] // the shortest ride, at the lowest level
    [InlineData(new[] { 10_800 }, new[] { 32 }, true)] // the longest ride, at the highest level
    [InlineData(new[] { 5, 55 }, new[] { 24, 6 }, true)] // a 5-second effort
    [InlineData(new[] { 4, 300 }, new[] { 24, 6 }, false)] // a segment under 5 seconds
    [InlineData(new[] { 1800 }, new[] { 0 }, false)] // a level under 1
    [InlineData(new[] { 1800 }, new[] { 33 }, false)] // a level over 32
    [InlineData(new[] { 59 }, new[] { 12 }, false)] // under a minute in all
    [InlineData(new[] { 10_801 }, new[] { 12 }, false)] // over 180 minutes in all
    [InlineData(new int[0], new int[0], false)] // no segments
    public void A_plan_is_kept_only_within_the_rules(int[] durations, int[] levels, bool kept)
    {
        var segments = durations.Select((duration, i) => new WorkoutSegment("steady", duration, levels[i], 85)).ToList();

        if (kept)
        {
            WorkoutPlanRules.Check(segments);
        }
        else
        {
            var refused = Assert.Throws<DomainRuleException>(() => WorkoutPlanRules.Check(segments));
            Assert.Equal("plan_invalid", refused.Code);
            Assert.Equal(RuleKind.Invalid, refused.Kind);
        }
    }
}
