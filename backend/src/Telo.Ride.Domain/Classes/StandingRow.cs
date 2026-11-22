namespace Telo.Ride.Domain.Classes;

/// <summary>Who a row on the board is: a rider in a seat, or a bot the service rides (L2-123 AC3).</summary>
public enum RiderKind
{
    Person,
    Bot,
}

/// <summary>
/// One rider on a group session's board (L2-123 AC3): place, name, jersey, level (none for a bot), kind, output in kJ
/// and the kJ behind the leader.
/// </summary>
public sealed record StandingRow(int Position, string Name, string Jersey, int? Level, RiderKind Kind, double OutputKj, double GapKj);
