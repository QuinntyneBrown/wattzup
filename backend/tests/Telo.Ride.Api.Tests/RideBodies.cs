namespace Telo.Ride.Api.Tests;

/// <summary>Bodies of <c>POST /api/rides</c>: a plausible race and class, changed fact by fact.</summary>
public static class RideBodies
{
    /// <summary>
    /// Old Town Criterium's 14.2 km in 30 minutes against a medium pack, 2nd of 10 and 84 % on target (L2-037 AC5):
    /// 28.4 km/h each second, which is the 14,200 m it reports. Each change replaces or, with a null, removes one fact.
    /// </summary>
    public static Dictionary<string, object?> Race(Guid rideId, params (string Fact, object? Value)[] changes)
    {
        var ride = new Dictionary<string, object?>
        {
            ["rideId"] = rideId,
            ["kind"] = "race",
            ["mapId"] = "old-town-criterium",
            ["mode"] = "bots",
            ["pack"] = "medium",
            ["place"] = 2,
            ["fieldSize"] = 10,
            ["elapsedSeconds"] = 1800,
            ["distanceMeters"] = 14_200.0,
            ["outputKj"] = 450.0,
            ["maxPowerWatts"] = 410,
            ["maxSpeedKmh"] = 28.4,
            ["onTargetShare"] = 0.84,
            ["speedSamplesKmh"] = Enumerable.Repeat(28.4, 1800).ToArray(),
            ["finishedAt"] = "2026-11-21T07:30:00+00:00",
            ["timeZoneId"] = "Europe/London",
        };
        foreach (var (fact, value) in changes)
        {
            if (value is null)
            {
                ride.Remove(fact);
            }
            else
            {
                ride[fact] = value;
            }
        }

        return ride;
    }

    /// <summary>
    /// Old Town Criterium's 14.2 km in <paramref name="seconds"/>, at the one speed that covers it in that time, with the
    /// other facts of <see cref="Race"/> changed as given.
    /// </summary>
    public static Dictionary<string, object?> RaceIn(Guid rideId, int seconds, params (string Fact, object? Value)[] changes)
    {
        var kmh = 14_200.0 / seconds * 3.6;
        return Race(rideId, [
            ("elapsedSeconds", seconds),
            ("maxSpeedKmh", kmh),
            ("speedSamplesKmh", Enumerable.Repeat(kmh, seconds).ToArray()),
            .. changes,
        ]);
    }

    /// <summary>The 20-minute Power Intervals class, half of it on target: no distance and no speed samples.</summary>
    public static Dictionary<string, object?> Class(Guid rideId) => new()
    {
        ["rideId"] = rideId,
        ["kind"] = "class",
        ["classId"] = "power-intervals-20",
        ["elapsedSeconds"] = 1200,
        ["distanceMeters"] = 0.0,
        ["outputKj"] = 240.0,
        ["maxPowerWatts"] = 380,
        ["maxSpeedKmh"] = 0.0,
        ["onTargetShare"] = 0.5,
        ["speedSamplesKmh"] = Array.Empty<double>(),
        ["finishedAt"] = "2026-11-21T07:20:00+00:00",
        ["timeZoneId"] = "America/Toronto",
    };

    /// <summary>
    /// A 30-minute custom workout at 27 km/h each second, which is the 13,500 m it reports, three quarters of it on
    /// target. A custom ride names no map or class.
    /// </summary>
    public static Dictionary<string, object?> Custom(Guid rideId) => new()
    {
        ["rideId"] = rideId,
        ["kind"] = "custom",
        ["elapsedSeconds"] = 1800,
        ["distanceMeters"] = 13_500.0,
        ["outputKj"] = 270.0,
        ["maxPowerWatts"] = 384,
        ["maxSpeedKmh"] = 27.0,
        ["onTargetShare"] = 0.75,
        ["speedSamplesKmh"] = Enumerable.Repeat(27.0, 1800).ToArray(),
        ["finishedAt"] = "2026-11-21T07:30:00+00:00",
        ["timeZoneId"] = "America/Toronto",
    };
}
