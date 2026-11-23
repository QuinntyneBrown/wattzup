namespace Telo.Ride.Domain.Rides;

/// <summary>What an XP line is for, in the order lines are given.</summary>
public enum XpLineKind
{
    Finished,
    Place,
    Podium,
    OnTarget,
    Streak,
}

/// <summary>One line of a ride's XP, as Results shows it: "2 of 10" +160.</summary>
public sealed record XpLine(XpLineKind Kind, string Label, int Xp);
