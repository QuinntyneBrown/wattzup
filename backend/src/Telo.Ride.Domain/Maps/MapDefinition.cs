using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Domain.Maps;

/// <summary>
/// A map of the catalogue (L2-045 AC1): its name, route and place, distance, climbing and rating, the world it rides
/// in, its thumbnail and its Race Setup photo in the app (L2-047 AC1), how it opens (L2-040), and, for the race (AC2),
/// its 30:00 plan and its world's terrain, from which the Ride app draws the route's profile (ADR 0029), and the real
/// place it follows, if any, which a rider may stream as photorealistic 3D Tiles (L2-066).
/// </summary>
public sealed record MapDefinition(
    string Id,
    string Name,
    string? RouteName,
    string Place,
    double DistanceKm,
    int ClimbingM,
    string Rating,
    string World,
    string ThumbnailUrl,
    string PhotoUrl,
    MapUnlock Unlock,
    IReadOnlyList<ClassSegment> Plan,
    MapTerrain Terrain,
    RealPlace? RealPlace = null);

/// <summary>The real place a map follows: its name, the stretch the route rides, and where the tiles centre.</summary>
public sealed record RealPlace(string Name, string Route, double Latitude, double Longitude);
