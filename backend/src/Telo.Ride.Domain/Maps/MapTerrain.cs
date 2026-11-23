namespace Telo.Ride.Domain.Maps;

/// <summary>
/// A map's world as its road climbs (L2-045 AC2, from <c>main</c>'s <c>worlds.ts</c>): the grade in percent the road
/// eases towards for each segment kind of the plan, and the rolling grade laid over it.
/// </summary>
public sealed record MapTerrain(IReadOnlyDictionary<string, double> Grade, double Roll);
