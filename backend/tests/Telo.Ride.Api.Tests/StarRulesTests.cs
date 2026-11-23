// Unit test (the rule's table of cases, beside StarsAndBestTests through the API)
// Traces to: L2-039 AC1, AC2, AC3; L2-077 AC2, AC4
// Description: the stars a finished race earns on its map: "Finish the race" for any finish, "Top 3 against the medium
// pack" for places 1 to 3 against bots at medium or hard, "Beat your best time" for a finish faster than the previous
// best, never on a first finish; a star already held is never earned again, and none is lost.
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Api.Tests;

public sealed class StarRulesTests
{
    public static TheoryData<string, string, string?, int, int?, MapStar, MapStar> Cases => new()
    {
        { "a first finish solo", "solo", null, 1, null, MapStar.None, MapStar.Finish },
        { "2nd vs the medium pack", "bots", "medium", 2, null, MapStar.None, MapStar.Finish | MapStar.TopThree },
        { "3rd vs the hard pack", "bots", "hard", 3, null, MapStar.None, MapStar.Finish | MapStar.TopThree },
        { "1st vs the easy pack", "bots", "easy", 1, null, MapStar.None, MapStar.Finish },
        { "4th vs the medium pack", "bots", "medium", 4, null, MapStar.None, MapStar.Finish },
        { "top 3 online", "online", null, 1, null, MapStar.None, MapStar.Finish },
        { "faster than the best", "solo", null, 1, 1700, MapStar.Finish, MapStar.BeatBest },
        { "as fast as the best", "solo", null, 1, 1600, MapStar.Finish, MapStar.None },
        { "slower than the best", "solo", null, 1, 1500, MapStar.Finish, MapStar.None },
        { "every star already held", "bots", "medium", 1, 1700, MapStar.All, MapStar.None },
    };

    [Theory]
    [MemberData(nameof(Cases))]
    public void Earns_the_stars_the_finish_meets_and_does_not_hold(
        string name, string mode, string? pack, int place, int? previousBest, MapStar held, MapStar earned)
    {
        var progress = MapProgress.Start(Guid.NewGuid(), "old-town-criterium");
        progress.Restore(held, previousBest);

        var result = progress.RecordFinish(new RaceFinish(mode, pack, place, 1600));

        Assert.True(earned == result.Earned, name);
        Assert.Equal(held | earned, progress.Stars);
    }

    [Fact]
    public void Keeps_the_best_and_its_previous_value()
    {
        var progress = MapProgress.Start(Guid.NewGuid(), "old-town-criterium");

        var first = progress.RecordFinish(new RaceFinish("solo", null, 1, 1800));
        var faster = progress.RecordFinish(new RaceFinish("solo", null, 1, 1600));
        var slower = progress.RecordFinish(new RaceFinish("solo", null, 1, 1700));

        Assert.Equal((1800, (int?)null, false), (first.BestSeconds, first.PreviousBestSeconds, first.IsNewBest));
        Assert.Equal((1600, (int?)1800, true), (faster.BestSeconds, faster.PreviousBestSeconds, faster.IsNewBest));
        Assert.Equal((1600, (int?)1600, false), (slower.BestSeconds, slower.PreviousBestSeconds, slower.IsNewBest));
        Assert.Equal(1600, progress.BestSeconds);
    }
}
