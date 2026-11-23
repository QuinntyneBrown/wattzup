using System.Globalization;

namespace Telo.Ride.Domain.Rides;

/// <summary>
/// A ride's XP lines (L2-037), in order: "Finished" +100 for a finished ride; when the ride has places and its field more
/// than 2 riders, "{place} of {field}" +(field − place) × 20 and, for places 1 to 3, "Podium" +75; "{p}% on target"
/// +round(p × 0.8), p being the share as a whole percentage; and "{n}-day streak" +n × 10 when n > 0. A DNF or a
/// discarded ride earns no lines.
/// </summary>
public static class XpCalculator
{
    public const int Finished = 100;
    public const int PerPlaceAhead = 20;
    public const int Podium = 75;
    public const double PerPercentOnTarget = 0.8;
    public const int PerStreakDay = 10;

    /// <param name="result">The ride.</param>
    /// <param name="streakDays">The streak after the ride is recorded, so the line and the header agree (L2-042 AC4).</param>
    public static IReadOnlyList<XpLine> Compute(RideResult result, int streakDays)
    {
        if (result.Outcome != RideOutcome.Finished) return [];
        var lines = new List<XpLine> { new(XpLineKind.Finished, "Finished", Finished) };
        if (result is { HasPlaces: true, Place: { } place, FieldSize: { } field and > 2 })
        {
            lines.Add(new(XpLineKind.Place, Invariant($"{place} of {field}"), (field - place) * PerPlaceAhead));
            if (place <= 3) lines.Add(new(XpLineKind.Podium, "Podium", Podium));
        }

        var percent = (int)Math.Round(result.OnTargetShare * 100, MidpointRounding.AwayFromZero);
        lines.Add(new(XpLineKind.OnTarget, Invariant($"{percent}% on target"), (int)Math.Round(percent * PerPercentOnTarget, MidpointRounding.AwayFromZero)));
        if (streakDays > 0) lines.Add(new(XpLineKind.Streak, Invariant($"{streakDays}-day streak"), streakDays * PerStreakDay));
        return lines;
    }

    private static string Invariant(FormattableString text) => text.ToString(CultureInfo.InvariantCulture);
}
