namespace Telo.Ride.Domain.Rides;

/// <summary>
/// What a ride's XP is computed from (L2-037): its kind and race mode, how it ended, the place and field, and the share of
/// its running seconds on target, from 0 to 1. A bots race has places; a solo race and a class have none (AC6).
/// </summary>
public sealed record RideResult(RideKind Kind, string? Mode, RideOutcome Outcome, int? Place, int? FieldSize, double OnTargetShare)
{
    public bool HasPlaces => Kind == RideKind.Race && Mode is "bots" or "online";
}
