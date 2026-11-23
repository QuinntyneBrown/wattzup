using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Telo.Ride.Application.Classes;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Api.Tests;

/// <summary>
/// The API serving a catalogue of its own instead of the embedded one: one valid class and one of each way a class
/// can break the rules of L2-080 AC4 and L2-043 AC1, in catalogue order.
/// </summary>
public sealed class StubCatalogueApi : TeloRideApiFactory
{
    public static readonly ClassDefinition Valid = Class("valid", 600, [Segment(300, 8), Segment(300, 12)]);

    public static readonly IReadOnlyList<ClassDefinition> Classes =
    [
        Class("level-too-high", 600, [Segment(300, 8), Segment(300, 33)]),
        Valid,
        Class("level-too-low", 600, [Segment(300, 0), Segment(300, 12)]),
        Class("plan-too-short", 600, [Segment(300, 8), Segment(240, 12)]),
        Class("plan-too-long", 600, [Segment(300, 8), Segment(360, 12)]),
        Class("bad-video", 600, [Segment(600, 8)]) with { VideoId = "not a video" },
        Class("tier-7", 600, [Segment(600, 8)]) with { OpensAtLevel = 7 },
    ];

    protected override void ConfigureServices(IServiceCollection services) =>
        services.Replace(ServiceDescriptor.Singleton<IClassCatalogue>(new StubCatalogue()));

    public static ClassDefinition Class(string id, int length, IReadOnlyList<ClassSegment> segments) =>
        new(id, id, "Telo Ride Studio", "Tempo", length, 1, "20-min", "A class.", "prairie", "QUoToFsMNig", 0, segments);

    public static ClassSegment Segment(int duration, int level) => new("steady", duration, level, 85);

    private sealed class StubCatalogue : IClassCatalogue
    {
        public IReadOnlyList<Shelf> Shelves { get; } = [new("20-min", "20 min", "Short and sharp — fits a lunch break.")];

        public IReadOnlyList<ClassDefinition> Classes => StubCatalogueApi.Classes;
    }
}
