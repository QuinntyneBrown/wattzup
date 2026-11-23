using System.Text.Json;
using Telo.Ride.Application.Classes;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Infrastructure.Catalogue;

/// <summary>
/// <see cref="IClassCatalogue"/> on <c>Catalogue/classes.json</c>, embedded in this assembly (ADR 0028): read once, the
/// first time it is asked for. A change to the catalogue ships with the next deployment and changes no code.
/// </summary>
public sealed class EmbeddedClassCatalogue : IClassCatalogue
{
    private const string Resource = "Telo.Ride.Infrastructure.Catalogue.classes.json";
    private readonly Lazy<(IReadOnlyList<Shelf> Shelves, IReadOnlyList<ClassDefinition> Classes)> file = new(Read);

    public IReadOnlyList<Shelf> Shelves => file.Value.Shelves;

    public IReadOnlyList<ClassDefinition> Classes => file.Value.Classes;

    private static (IReadOnlyList<Shelf>, IReadOnlyList<ClassDefinition>) Read()
    {
        using var stream = typeof(EmbeddedClassCatalogue).Assembly.GetManifestResourceStream(Resource)
            ?? throw new InvalidOperationException($"The embedded catalogue {Resource} is missing.");
        var catalogue = JsonSerializer.Deserialize<CatalogueFile>(stream, JsonSerializerOptions.Web)
            ?? throw new InvalidOperationException("The embedded catalogue is empty.");
        return (
            [.. catalogue.Shelves.Select(s => new Shelf(s.Id, s.Title, s.Tagline))],
            [.. catalogue.Classes.Select(c => new ClassDefinition(
                c.Id, c.Title, c.Channel, c.Focus, c.LengthSeconds, c.OpensAtLevel, c.ShelfId, c.Summary, c.World,
                c.Video.VideoId, c.Video.SyncOffsetSeconds,
                [.. c.Plan.Segments.Select(s => new ClassSegment(s.Kind, s.Duration, s.Level, s.CadenceAim))]))]);
    }

    private sealed record CatalogueFile(IReadOnlyList<ShelfEntry> Shelves, IReadOnlyList<ClassEntry> Classes);

    private sealed record ShelfEntry(string Id, string Title, string Tagline);

    private sealed record ClassEntry(
        string Id,
        string Title,
        string Channel,
        string Focus,
        int LengthSeconds,
        int OpensAtLevel,
        string ShelfId,
        string Summary,
        string World,
        VideoEntry Video,
        PlanEntry Plan);

    private sealed record VideoEntry(string VideoId, double SyncOffsetSeconds);

    private sealed record PlanEntry(IReadOnlyList<SegmentEntry> Segments);

    private sealed record SegmentEntry(string Kind, int Duration, int Level, int CadenceAim);
}
