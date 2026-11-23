using Telo.Ride.Application.Classes;
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Application.Maps;

/// <summary>
/// One map as the Ride app reads it (L2-045, L2-046, L2-047): its facts, world, thumbnail and photo, the goal that opens
/// it, or none, the map that goal is earned on, or none for a level goal, the level a level goal asks for (L2-033 AC4),
/// its plan and terrain for the race, and the real
/// place it follows, or none (L2-066 AC5).
/// </summary>
public sealed record MapDto(
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
    string? UnlockGoal,
    string? UnlockMapId,
    int? UnlockLevel,
    PlanDto Plan,
    MapTerrainDto Terrain,
    RealPlaceDto? RealPlace)
{
    public static MapDto From(MapDefinition map, IReadOnlyDictionary<string, string> names) => new(
        map.Id, map.Name, map.RouteName, map.Place, map.DistanceKm, map.ClimbingM, map.Rating, map.World,
        map.ThumbnailUrl, map.PhotoUrl, map.Unlock.Goal(names), map.Unlock.MapId,
        map.Unlock.Kind == MapUnlock.LevelKind ? map.Unlock.Level : null,
        new PlanDto([.. map.Plan.Select(s => new SegmentDto(s.Kind, s.Duration, s.Level, s.CadenceAim))]),
        new MapTerrainDto(map.Terrain.Grade, map.Terrain.Roll),
        map.RealPlace is { } place
            ? new RealPlaceDto(place.Name, place.Route, place.Latitude, place.Longitude)
            : null);
}

/// <summary>The real place a map follows: its name, the stretch it rides, and the latitude and longitude it centres on.</summary>
public sealed record RealPlaceDto(string Name, string Route, double Latitude, double Longitude);

/// <summary>A map's world as its road climbs: the grade for each segment kind, and the rolling grade over it.</summary>
public sealed record MapTerrainDto(IReadOnlyDictionary<string, double> Grade, double Roll);
