namespace Telo.Ride.Domain.Rides;

/// <summary>
/// Whether a submitted ride could have been ridden (L2-125 AC2). It is not when its power passes
/// <see cref="MaxPowerWatts"/>, its speed passes <see cref="MaxSpeedKmh"/> at its top or in any second, its distance
/// differs from the sum of its per-second speeds by more than <see cref="DistanceTolerance"/> of that sum, or a race is
/// finished faster than its distance takes at <see cref="MaxSpeedKmh"/>.
/// </summary>
public static class RidePlausibilityRule
{
    public const int MaxPowerWatts = 2_000;

    public const double MaxSpeedKmh = 100;

    public const double DistanceTolerance = 0.05;

    // A micrometre, so a distance exactly at the tolerance is not refused for the rounding of its arithmetic.
    private const double RoundingMeters = 1e-6;

    /// <param name="ride">What the ride says of itself.</param>
    /// <param name="raceMeters">The race's distance, or <c>null</c> for a ride that is not a race.</param>
    public static bool IsPlausible(RideFacts ride, double? raceMeters)
    {
        if (ride.MaxPowerWatts > MaxPowerWatts) return false;
        if (ride.MaxSpeedKmh > MaxSpeedKmh || ride.SpeedSamplesKmh.Any(kmh => kmh > MaxSpeedKmh)) return false;
        var sampledMeters = ride.SpeedSamplesKmh.Sum() / 3.6;
        if (Math.Abs(ride.DistanceMeters - sampledMeters) - (DistanceTolerance * sampledMeters) > RoundingMeters) return false;
        return raceMeters is not { } metres || ride.ElapsedSeconds >= metres * 3.6 / MaxSpeedKmh;
    }
}
