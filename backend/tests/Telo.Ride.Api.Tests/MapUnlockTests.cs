// Unit test (the rule's table of cases, beside MapCatalogueTests through the API)
// Traces to: L2-040 AC6
// Description: a locked map shows its one goal, written from its unlock rule with the name of the map the rule names;
// a map open from the start has none.
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Api.Tests;

public sealed class MapUnlockTests
{
    private static readonly Dictionary<string, string> Names = new()
    {
        ["prairie-paceline"] = "Prairie Paceline",
        ["cliffside-coast"] = "Cliffside Coast",
        ["dolomites"] = "Dolomites",
    };

    public static TheoryData<string, MapUnlock, string?> Cases => new()
    {
        { "open from the start", MapUnlock.FromTheStart, null },
        { "a top-3 bots finish", MapUnlock.TopThreeVsBots("prairie-paceline"), "Finish top 3 vs Bots on Prairie Paceline" },
        { "2 stars", MapUnlock.StarsOn("cliffside-coast", 2), "Earn 2★ on Cliffside Coast" },
        { "3 stars", MapUnlock.StarsOn("dolomites", 3), "Earn 3★ on Dolomites" },
        { "a rider level", MapUnlock.RiderLevel(10), "Reach rider level 10" },
    };

    [Theory]
    [MemberData(nameof(Cases))]
    public void Writes_the_goal_of_its_rule(string name, MapUnlock unlock, string? goal)
    {
        _ = name; // names the row in the test's display name
        Assert.Equal(goal, unlock.Goal(Names));
    }
}
