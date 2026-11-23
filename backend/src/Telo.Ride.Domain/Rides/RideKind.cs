namespace Telo.Ride.Domain.Rides;

/// <summary>Which door a ride came through: a race on a map, a class, or the rider's own custom workout.</summary>
public enum RideKind
{
    Race,
    Class,
    Custom,
}
