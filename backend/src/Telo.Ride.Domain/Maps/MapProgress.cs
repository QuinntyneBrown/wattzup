namespace Telo.Ride.Domain.Maps;

/// <summary>
/// A rider's progress on one map (docs/detailed-designs/progression/earn-stars-and-unlock-maps): the stars held, which
/// are never lost, the best time, and when a ride opened the map, for a map that opens by a goal (L2-040).
/// </summary>
public sealed class MapProgress
{
    public required Guid RiderId { get; init; }

    public required string MapId { get; init; }

    public MapStar Stars { get; private set; }

    /// <summary>Whole seconds of the fastest finish; none before the first.</summary>
    public int? BestSeconds { get; private set; }

    /// <summary>When a ride opened the map; none for a map open from the start or still locked.</summary>
    public DateTimeOffset? OpenedAt { get; private set; }

    /// <summary>When Home announced the map a ride opened (L2-036 AC3); none until then.</summary>
    public DateTimeOffset? UnlockSeenAt { get; private set; }

    public static MapProgress Start(Guid riderId, string mapId) => new() { RiderId = riderId, MapId = mapId };

    /// <summary>Sets the stars and best a rider already has, as a test's starting point.</summary>
    public void Restore(MapStar stars, int? bestSeconds)
    {
        Stars = stars;
        BestSeconds = bestSeconds;
    }

    /// <summary>Opens the map when a ride meets its goal (<see cref="UnlockRules"/>); a map opens once.</summary>
    public void Open(DateTimeOffset at) => OpenedAt ??= at;

    /// <summary>Home has announced the opened map; it is announced once, on whichever device opens Home first.</summary>
    public void MarkUnlockSeen(DateTimeOffset at) => UnlockSeenAt ??= at;

    /// <summary>
    /// Records a finish (L2-039, L2-077): a first finish sets the best, a faster one replaces it, and the stars the finish
    /// earns (<see cref="StarRules"/>) that the rider does not hold are added.
    /// </summary>
    public FinishRecord RecordFinish(RaceFinish finish)
    {
        var previousBest = BestSeconds;
        var isNewBest = previousBest is { } best && finish.Seconds < best;
        var earned = StarRules.Evaluate(finish, previousBest) & ~Stars;
        Stars |= earned;
        BestSeconds = previousBest is { } kept && kept <= finish.Seconds ? kept : finish.Seconds;
        return new FinishRecord(earned, BestSeconds.Value, previousBest, isNewBest);
    }
}
