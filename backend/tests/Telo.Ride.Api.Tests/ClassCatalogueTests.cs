// Acceptance test
// Traces to: L2-080 AC1, AC2, AC5; L2-081 AC3; ADR 0028
// Description: the class catalogue, read without a session, lists the seven classes of L2-080 AC1 in
// catalogue order, each with its channel, focus, length and the rider level it opens at, a YouTube video,
// a sync offset, a summary, a plan as long as the class and its world, on the shelves of L2-081 AC3; one
// class is served by its id (30 Minute HIIT Cardio from 0:12.0, working at level 24, L2-084, L2-096), and an id the
// catalogue does not hold is 404 class_not_found.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Telo.Ride.Api.Tests;

public sealed class ClassCatalogueTests(TeloRideApiFactory api) : IClassFixture<TeloRideApiFactory>
{
    [Fact]
    public async Task The_catalogue_lists_the_seven_classes_in_order_without_a_session()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/api/classes", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var catalogue = await response.Content.ReadFromJsonAsync<Catalogue>(TestContext.Current.CancellationToken);
        Assert.Equal(
            [
                new Listed("20 Minute Power Intervals", "Telo Ride Studio", "VO₂ max", 1200, 1),
                new Listed("20 Min Threshold Builder", "Telo Ride Studio", "Threshold", 1200, 1),
                new Listed("30 Minute HIIT Cardio", "GCN Training", "HIIT", 1800, 1),
                new Listed("30 Min Tempo Paceline", "Telo Ride Studio", "Tempo", 2160, 5),
                new Listed("30 Min Vice City Pyramid", "Telo Ride Studio", "Pyramid", 1710, 10),
                new Listed("60 Min Dolomites Endurance", "Telo Ride Scenic", "Zone 2", 3600, 10),
                new Listed("60 Min Coastal Endurance + Surges", "Telo Ride Scenic", "Endurance", 3600, 20),
            ],
            catalogue!.Classes.Select(c => new Listed(c.Title, c.Channel, c.Focus, c.LengthSeconds, c.OpensAtLevel)));
    }

    [Fact]
    public async Task Every_class_has_a_video_a_sync_offset_a_summary_and_a_plan_as_long_as_the_class()
    {
        var catalogue = await ReadCatalogue();

        Assert.All(catalogue.Classes, c =>
        {
            Assert.Matches("^[A-Za-z0-9_-]{11}$", c.Video.VideoId);
            Assert.True(c.Video.SyncOffsetSeconds >= 0, $"{c.Id} starts before the video does");
            Assert.False(string.IsNullOrWhiteSpace(c.Summary), $"{c.Id} has no summary");
            Assert.Equal(c.LengthSeconds, c.Plan.Segments.Sum(s => s.Duration));
        });
    }

    [Fact]
    public async Task Every_class_rides_in_its_world()
    {
        var catalogue = await ReadCatalogue();

        Assert.Equal(
            [
                ("20 Minute Power Intervals", "docklands"),
                ("20 Min Threshold Builder", "granite"),
                ("30 Minute HIIT Cardio", "oldtown"),
                ("30 Min Tempo Paceline", "prairie"),
                ("30 Min Vice City Pyramid", "vicecity"),
                ("60 Min Dolomites Endurance", "dolomites"),
                ("60 Min Coastal Endurance + Surges", "coast"),
            ],
            catalogue.Classes.Select(c => (c.Title, c.World)));
    }

    [Fact]
    public async Task The_shelves_read_their_titles_and_taglines_and_hold_their_classes()
    {
        var catalogue = await ReadCatalogue();

        Assert.Equal(
            [
                new CatalogueShelf("20-min", "20 min", "Short and sharp — fits a lunch break."),
                new CatalogueShelf("30-min", "30 min", "Structured intervals with a proper warm-up."),
                new CatalogueShelf("60-min", "60 min endurance", "Long aerobic rides. Steady legs, steady heart."),
            ],
            catalogue.Shelves);
        Assert.Equal(
            ["20-min", "20-min", "30-min", "30-min", "30-min", "60-min", "60-min"],
            catalogue.Classes.Select(c => c.ShelfId));
    }

    [Fact]
    public async Task One_class_is_served_by_its_id_without_a_session()
    {
        using var client = api.CreateClient();

        var hiit = await client.GetFromJsonAsync<CatalogueClass>("/api/classes/hiit-cardio-30", TestContext.Current.CancellationToken);

        Assert.Equal("30 Minute HIIT Cardio", hiit!.Title);
        Assert.Equal("QUoToFsMNig", hiit.Video.VideoId);
        Assert.Equal(12.0, hiit.Video.SyncOffsetSeconds);
        Assert.Equal(17, hiit.Plan.Segments.Count);
        Assert.All(hiit.Plan.Segments.Where(s => s.Kind == "work"), s => Assert.Equal(24, s.Level));
    }

    [Fact]
    public async Task An_id_the_catalogue_does_not_hold_is_404_class_not_found()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/api/classes/no-such-class", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal("class_not_found", problem.GetProperty("code").GetString());
    }

    private async Task<Catalogue> ReadCatalogue()
    {
        using var client = api.CreateClient();
        var catalogue = await client.GetFromJsonAsync<Catalogue>("/api/classes", TestContext.Current.CancellationToken);
        return catalogue!;
    }

    private sealed record Listed(string Title, string Channel, string Focus, int LengthSeconds, int OpensAtLevel);
}

/// <summary>The catalogue as the API serves it, read back by the acceptance tests.</summary>
public sealed record Catalogue(IReadOnlyList<CatalogueShelf> Shelves, IReadOnlyList<CatalogueClass> Classes);

public sealed record CatalogueShelf(string Id, string Title, string Tagline);

public sealed record CatalogueClass(
    string Id,
    string Title,
    string Channel,
    string Focus,
    int LengthSeconds,
    int OpensAtLevel,
    string ShelfId,
    string Summary,
    string World,
    CatalogueVideo Video,
    CataloguePlan Plan);

public sealed record CatalogueVideo(string VideoId, double SyncOffsetSeconds);

public sealed record CataloguePlan(IReadOnlyList<CatalogueSegment> Segments);

public sealed record CatalogueSegment(string Kind, int Duration, int Level, int CadenceAim);
