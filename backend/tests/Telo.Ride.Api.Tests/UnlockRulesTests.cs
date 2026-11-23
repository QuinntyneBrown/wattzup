// Unit test (the rule's table of cases, beside UnlocksTests through the API)
// Traces to: L2-040 AC1, AC2, AC3, AC4
// Description: the maps a recorded ride opens, in unlock order: a locked map not yet opened whose goal the ride meets.
// A top-3 finish against bots on its map at any pack, the stars now held on its map, or the rider's level after the
// ride. A map open from the start or already opened never opens again.
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Api.Tests;

public sealed class UnlockRulesTests
{
    /// <summary>The catalogue's unlock order and goals (L2-040).</summary>
    private static readonly IReadOnlyList<(string MapId, MapUnlock Unlock)> Order =
    [
        ("prairie-paceline", MapUnlock.FromTheStart),
        ("old-town-criterium", MapUnlock.FromTheStart),
        ("cliffside-coast", MapUnlock.TopThreeVsBots("prairie-paceline")),
        ("neon-docklands", MapUnlock.TopThreeVsBots("old-town-criterium")),
        ("dolomites", MapUnlock.StarsOn("cliffside-coast", 2)),
        ("vice-city", MapUnlock.RiderLevel(10)),
        ("col-du-granit", MapUnlock.StarsOn("dolomites", 3)),
    ];

    private static RaceFinish Bots(int place, string pack = "medium") => new("bots", pack, place, 1800);

    public static TheoryData<string, string?, RaceFinish?, string?, MapStar, int, string[], string[]> Cases => new()
    {
        { "4th vs bots on Prairie Paceline", "prairie-paceline", Bots(4), null, MapStar.None, 1, [], [] },
        { "3rd vs the easy pack on Prairie Paceline", "prairie-paceline", Bots(3, "easy"), null, MapStar.None, 1, [], ["cliffside-coast"] },
        { "2nd vs bots on Old Town Criterium", "old-town-criterium", Bots(2), null, MapStar.None, 1, [], ["neon-docklands"] },
        { "1st solo on Old Town Criterium", "old-town-criterium", new RaceFinish("solo", null, 1, 1800), null, MapStar.None, 1, [], [] },
        { "1st online on Old Town Criterium", "old-town-criterium", new RaceFinish("online", null, 1, 1800), null, MapStar.None, 1, [], [] },
        { "2nd vs bots with Neon Docklands open", "old-town-criterium", Bots(2), null, MapStar.None, 1, ["neon-docklands"], [] },
        { "2 stars on Cliffside Coast", "cliffside-coast", Bots(5), "cliffside-coast", MapStar.Finish | MapStar.BeatBest, 1, ["cliffside-coast"], ["dolomites"] },
        { "1 star on Cliffside Coast", "cliffside-coast", Bots(5), "cliffside-coast", MapStar.Finish, 1, ["cliffside-coast"], [] },
        { "3 stars on Dolomites", "dolomites", Bots(5), "dolomites", MapStar.All, 1, ["cliffside-coast", "dolomites"], ["col-du-granit"] },
        { "level 10 after a class", null, null, null, MapStar.None, 10, [], ["vice-city"] },
        { "level 9 after a class", null, null, null, MapStar.None, 9, [], [] },
        { "level 10 with Vice City open", null, null, null, MapStar.None, 12, ["vice-city"], [] },
        { "2nd vs bots on Old Town Criterium at level 10", "old-town-criterium", Bots(2), null, MapStar.None, 10, [], ["neon-docklands", "vice-city"] },
    };

    [Theory]
    [MemberData(nameof(Cases))]
    public void Opens_the_locked_maps_whose_goal_the_ride_meets(
        string name, string? raceMapId, RaceFinish? finish, string? starsMapId, MapStar stars, int level, string[] opened, string[] opens)
    {
        _ = name; // names the row in the test's display name
        var held = starsMapId is null ? new Dictionary<string, MapStar>() : new Dictionary<string, MapStar> { [starsMapId] = stars };

        Assert.Equal(opens, UnlockRules.Evaluate(Order, raceMapId, finish, held, level, opened.ToHashSet()));
    }
}

// Unit test (the rule's table of cases, beside MapStandingTests through the API)
// Traces to: L2-041 AC1, AC2, AC3
// Description: the next unlock is the first locked map in unlock order whose goal the rider can work on now: its
// prerequisite map is open, or its goal is a level. None once every map is open.
public sealed class NextUnlockTests
{
    private static readonly IReadOnlyList<(string MapId, MapUnlock Unlock)> Order =
    [
        ("prairie-paceline", MapUnlock.FromTheStart),
        ("old-town-criterium", MapUnlock.FromTheStart),
        ("cliffside-coast", MapUnlock.TopThreeVsBots("prairie-paceline")),
        ("neon-docklands", MapUnlock.TopThreeVsBots("old-town-criterium")),
        ("dolomites", MapUnlock.StarsOn("cliffside-coast", 2)),
        ("vice-city", MapUnlock.RiderLevel(10)),
        ("col-du-granit", MapUnlock.StarsOn("dolomites", 3)),
    ];

    public static TheoryData<string, string[], string?> Cases => new()
    {
        { "a new rider", [], "cliffside-coast" },
        { "the mid rider, Cliffside Coast open", ["cliffside-coast"], "neon-docklands" },
        { "Neon Docklands open before Cliffside Coast", ["neon-docklands"], "cliffside-coast" },
        { "Cliffside Coast and Neon Docklands open", ["cliffside-coast", "neon-docklands"], "dolomites" },
        { "Dolomites locked behind Cliffside Coast, Neon Docklands open", ["neon-docklands"], "cliffside-coast" },
        { "up to Dolomites open", ["cliffside-coast", "neon-docklands", "dolomites"], "vice-city" },
        { "the veteran", ["cliffside-coast", "neon-docklands", "dolomites", "vice-city"], "col-du-granit" },
        { "every map open", ["cliffside-coast", "neon-docklands", "dolomites", "vice-city", "col-du-granit"], null },
    };

    [Theory]
    [MemberData(nameof(Cases))]
    public void Is_the_first_locked_map_whose_goal_can_be_worked_on(string name, string[] opened, string? next)
    {
        _ = name; // names the row in the test's display name
        Assert.Equal(next, UnlockRules.NextUnlock(Order, opened.ToHashSet()));
    }
}

/// <summary>
/// The map Home's Next ride card offers (L2-033 AC2 to AC5): for a top-3 or a stars goal, the map the goal is earned on;
/// for a level goal, the most recently opened map; with every map open, the open map with the fewest stars, the first in
/// unlock order on a tie. One case per row.
/// </summary>
public sealed class NextRideRuleTests
{
    private static readonly IReadOnlyList<(string MapId, MapUnlock Unlock)> Order =
    [
        ("prairie-paceline", MapUnlock.FromTheStart),
        ("old-town-criterium", MapUnlock.FromTheStart),
        ("cliffside-coast", MapUnlock.TopThreeVsBots("prairie-paceline")),
        ("neon-docklands", MapUnlock.TopThreeVsBots("old-town-criterium")),
        ("dolomites", MapUnlock.StarsOn("cliffside-coast", 2)),
        ("vice-city", MapUnlock.RiderLevel(10)),
        ("col-du-granit", MapUnlock.StarsOn("dolomites", 3)),
    ];

    private static readonly string[] Locked = ["cliffside-coast", "neon-docklands", "dolomites", "vice-city", "col-du-granit"];

    /// <summary>The case's name, the maps opened in the order they opened, the stars held as <c>map:n</c>, and the map offered.</summary>
    public static TheoryData<string, string[], string[], string> Cases => new()
    {
        { "a new rider: top 3 on Prairie Paceline opens Cliffside Coast", [], [], "prairie-paceline" },
        { "the mid rider: top 3 on Old Town Criterium opens Neon Docklands", ["cliffside-coast"], [], "old-town-criterium" },
        { "stars on Cliffside Coast open Dolomites", ["cliffside-coast", "neon-docklands"], [], "cliffside-coast" },
        { "a level goal next: the last map opened", ["cliffside-coast", "dolomites", "neon-docklands"], [], "neon-docklands" },
        { "the veteran: stars on Dolomites open Col du Granit", ["cliffside-coast", "neon-docklands", "dolomites", "vice-city"], [], "dolomites" },
        { "every map open: the fewest stars", Locked, ["prairie-paceline:3", "old-town-criterium:3", "cliffside-coast:2", "neon-docklands:1", "dolomites:2", "vice-city:1", "col-du-granit:3"], "neon-docklands" },
        { "every map open: a map never ridden holds none", Locked, ["prairie-paceline:3", "old-town-criterium:1"], "cliffside-coast" },
    };

    [Theory]
    [MemberData(nameof(Cases))]
    public void The_card_offers_the_map_that_moves_the_rider_on(string name, string[] opened, string[] stars, string offered)
    {
        var start = DateTimeOffset.UnixEpoch;
        var openedAt = opened.Select((mapId, i) => (mapId, at: start.AddHours(i))).ToDictionary(o => o.mapId, o => o.at);
        var held = stars.Select(s => s.Split(':')).ToDictionary(s => s[0], s => int.Parse(s[1], System.Globalization.CultureInfo.InvariantCulture));

        Assert.True(UnlockRules.NextRide(Order, openedAt, held) == offered, name);
    }
}
