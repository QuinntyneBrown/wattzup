using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Domain.Races;

/// <summary>
/// One rider on a race's board (L2-123 AC3): place, seat, name, jersey, level (none for a bot), kind, the distance
/// ridden in metres, the seconds behind the leader and whether they are riding, finished or DNF (L2-124).
/// </summary>
public sealed record RaceStandingRow(
    int Position, int Seat, string Name, string Jersey, int? Level, RiderKind Kind, double DistanceMetres, double GapSeconds, RaceStatus Status);

/// <summary>
/// Where a seat stands in a running race: riding, finished (held at the route's length), or DNF, having left, gone
/// silent 15 seconds or been gone 30 (L2-124 AC1, AC2, AC4).
/// </summary>
public enum RaceStatus
{
    Riding,
    Finished,
    Dnf,
}
