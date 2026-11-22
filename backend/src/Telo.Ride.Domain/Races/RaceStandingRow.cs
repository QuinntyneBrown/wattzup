using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Domain.Races;

/// <summary>
/// One rider on a race's board (L2-123 AC3): place, seat, name, jersey, level (none for a bot), kind, the distance
/// ridden in metres and the seconds behind the leader.
/// </summary>
public sealed record RaceStandingRow(
    int Position, int Seat, string Name, string Jersey, int? Level, RiderKind Kind, double DistanceMetres, double GapSeconds);
