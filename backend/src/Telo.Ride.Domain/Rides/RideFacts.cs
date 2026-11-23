namespace Telo.Ride.Domain.Rides;

/// <summary>
/// What a submitted ride says of itself that the plausibility rule checks (L2-125 AC2): its seconds, the metres it
/// covered, its highest power and speed, and its speed in km/h for each second ridden.
/// </summary>
public sealed record RideFacts(
    int ElapsedSeconds,
    double DistanceMeters,
    int MaxPowerWatts,
    double MaxSpeedKmh,
    IReadOnlyList<double> SpeedSamplesKmh);
