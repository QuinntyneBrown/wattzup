namespace Telo.Ride.Domain.Rides;

/// <summary>How a ride ended: finished, ended as a DNF, or discarded. Only a finished ride earns XP (L2-037 AC7).</summary>
public enum RideOutcome
{
    Finished,
    Dnf,
    Discarded,
}
