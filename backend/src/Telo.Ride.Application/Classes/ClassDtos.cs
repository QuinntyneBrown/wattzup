using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>The catalogue as <c>GET /api/classes</c> serves it: the shelves and the classes that passed the rules.</summary>
public sealed record ClassCatalogueDto(IReadOnlyList<ShelfDto> Shelves, IReadOnlyList<ClassDto> Classes);

public sealed record ShelfDto(string Id, string Title, string Tagline);

/// <summary>One class as the Ride app reads it (docs/detailed-designs/classes/browse-the-class-library).</summary>
public sealed record ClassDto(
    string Id,
    string Title,
    string Channel,
    string Focus,
    int LengthSeconds,
    int OpensAtLevel,
    string ShelfId,
    string Summary,
    string World,
    VideoDto Video,
    PlanDto Plan)
{
    public static ClassDto From(ClassDefinition definition) => new(
        definition.Id,
        definition.Title,
        definition.Channel,
        definition.Focus,
        definition.LengthSeconds,
        definition.OpensAtLevel,
        definition.ShelfId,
        definition.Summary,
        definition.World,
        new VideoDto(definition.VideoId, definition.SyncOffsetSeconds),
        new PlanDto([.. definition.Segments.Select(s => new SegmentDto(s.Kind, s.Duration, s.Level, s.CadenceAim))]));
}

/// <summary>A class's YouTube video and the second of it at which the ride's 0:00 falls (L2-080 AC2).</summary>
public sealed record VideoDto(string VideoId, double SyncOffsetSeconds);

public sealed record PlanDto(IReadOnlyList<SegmentDto> Segments);

public sealed record SegmentDto(string Kind, int Duration, int Level, int CadenceAim);
