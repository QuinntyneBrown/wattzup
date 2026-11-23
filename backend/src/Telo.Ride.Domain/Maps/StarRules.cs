namespace Telo.Ride.Domain.Maps;

/// <summary>
/// The stars a finished race meets (L2-039): "Finish the race" for any finish; "Top 3 against the medium pack" for places
/// 1 to 3 against bots at medium or hard; "Beat your best time" for a finish faster than the previous best, never on a
/// first finish.
/// </summary>
public static class StarRules
{
    public static MapStar Evaluate(RaceFinish finish, int? previousBestSeconds)
    {
        var stars = MapStar.Finish;
        if (finish.Mode == "bots" && finish.Pack is "medium" or "hard" && finish.Place <= 3) stars |= MapStar.TopThree;
        if (previousBestSeconds is { } best && finish.Seconds < best) stars |= MapStar.BeatBest;
        return stars;
    }
}
