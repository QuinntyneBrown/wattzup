using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Domain.Rides;

/// <summary>
/// A finished ride the backend has recorded for a rider, once for its ride id (L2-044 AC2, L2-125 AC3). It is named
/// <c>RecordedRide</c>, not <c>Ride</c>, because <c>Telo.Ride</c> is the solution's namespace. Its key is the rider and
/// the ride id together, which the app assigned when the ride started.
/// </summary>
public sealed class RecordedRide
{
    public required Guid RiderId { get; init; }

    public required Guid Id { get; init; }

    public required RideKind Kind { get; init; }

    /// <summary>The race's map; none for a class.</summary>
    public string? MapId { get; init; }

    /// <summary>The race's mode: <c>solo</c> or <c>bots</c>.</summary>
    public string? Mode { get; init; }

    /// <summary>The bots' pack strength; none in a solo race.</summary>
    public string? Pack { get; init; }

    /// <summary>The riders-online race session whose result gave this ride its place, time and output (L2-125 AC1).</summary>
    public string? SessionId { get; init; }

    public int? Place { get; init; }

    public int? FieldSize { get; init; }

    /// <summary>The class ridden; none for a race.</summary>
    public string? ClassId { get; init; }

    public required int ElapsedSeconds { get; init; }

    public required double DistanceMeters { get; init; }

    public required double OutputKj { get; init; }

    public required int MaxPowerWatts { get; init; }

    public required double MaxSpeedKmh { get; init; }

    /// <summary>The share of its running seconds within 10 % of target power, from 0 to 1 (L2-037 AC3).</summary>
    public double OnTargetShare { get; init; }

    /// <summary>The XP the ride earned, line by line (L2-037), kept so a repeat of its ride id answers the same.</summary>
    public IReadOnlyList<XpLine> XpLines { get; init; } = [];

    /// <summary>The rider's total XP once this ride was added, part of the same answer.</summary>
    public int TotalXp { get; init; }

    /// <summary>A race's stars held on its map once it was recorded, and those it earned (L2-075); none for a class.</summary>
    public MapStar? StarsHeld { get; init; }

    public MapStar? StarsEarned { get; init; }

    /// <summary>A race's best time on its map once it was recorded, the best before it, and whether it set a new one (L2-077).</summary>
    public int? BestSeconds { get; init; }

    public int? PreviousBestSeconds { get; init; }

    public bool IsNewBest { get; init; }

    /// <summary>The map the ride opened, the first in unlock order if it opened more than one (L2-040 AC5).</summary>
    public string? OpenedMapId { get; init; }

    /// <summary>When the ride ended on the device, and the device's IANA time zone for the rider's local day.</summary>
    public required DateTimeOffset FinishedAt { get; init; }

    public required string TimeZoneId { get; init; }

    /// <summary>When the backend recorded it; part of the answer every repeat of the ride id gets.</summary>
    public required DateTimeOffset RecordedAt { get; init; }
}
