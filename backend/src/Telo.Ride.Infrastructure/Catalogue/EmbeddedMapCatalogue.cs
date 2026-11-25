using System.Text.Json;
using Telo.Ride.Application.Maps;
using Telo.Ride.Domain.Classes;
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Infrastructure.Catalogue;

/// <summary>
/// <see cref="IMapCatalogue"/> on <c>Catalogue/maps.json</c>, embedded in this assembly (ADR 0029): read once, the
/// first time it is asked for. A change to the catalogue ships with the next deployment and changes no code.
/// </summary>
public sealed class EmbeddedMapCatalogue : IMapCatalogue
{
    private const string Resource = "Telo.Ride.Infrastructure.Catalogue.maps.json";
    private readonly Lazy<IReadOnlyList<MapDefinition>> file = new(Read);

    public IReadOnlyList<MapDefinition> Maps => file.Value;

    private static IReadOnlyList<MapDefinition> Read()
    {
        using var stream = typeof(EmbeddedMapCatalogue).Assembly.GetManifestResourceStream(Resource)
            ?? throw new InvalidOperationException($"The embedded catalogue {Resource} is missing.");
        var catalogue = JsonSerializer.Deserialize<CatalogueFile>(stream, JsonSerializerOptions.Web)
            ?? throw new InvalidOperationException("The embedded map catalogue is empty.");
        return [.. catalogue.Maps.Select(m => new MapDefinition(
            m.Id, m.Name, m.RouteName, m.Place, m.DistanceKm, m.ClimbingM, m.Rating, m.World, m.ThumbnailUrl,
            m.PhotoUrl, new MapUnlock(m.Unlock.Kind, m.Unlock.MapId, m.Unlock.Stars, m.Unlock.Level),
            [.. m.Plan.Segments.Select(s => new ClassSegment(s.Kind, s.Duration, s.Level, s.CadenceAim))],
            new MapTerrain(m.Terrain.Grade, m.Terrain.Roll, m.Terrain.Elevation),
            m.RealPlace is { } place
                ? new RealPlace(place.Name, place.Route, place.Latitude, place.Longitude)
                : null))];
    }

    private sealed record CatalogueFile(IReadOnlyList<MapEntry> Maps);

    private sealed record MapEntry(
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
        UnlockEntry Unlock,
        PlanEntry Plan,
        TerrainEntry Terrain,
        RealPlaceEntry? RealPlace);

    private sealed record RealPlaceEntry(string Name, string Route, double Latitude, double Longitude);

    private sealed record PlanEntry(IReadOnlyList<SegmentEntry> Segments);

    private sealed record SegmentEntry(string Kind, int Duration, int Level, int CadenceAim);

    private sealed record TerrainEntry(IReadOnlyDictionary<string, double> Grade, double Roll, IReadOnlyList<double>? Elevation = null);

    private sealed record UnlockEntry(string Kind, string? MapId, int? Stars, int? Level);
}
