// Acceptance test
// Traces to: L2-045 AC1, AC2, AC3; L2-040 AC1, AC6; L2-047 AC1, AC3; L2-061 AC1; L2-062 AC1; ADR 0029
// Description: the map catalogue, read without a session, lists the seven maps of L2-045 AC1 in unlock order, each with
// its distance, climbing, rating, route and place, its world, its thumbnail and its photo; Prairie Paceline and Old
// Town Criterium are open from the start, and every other map names its one goal and the map it is earned on, or for a level goal its level; every
// map carries its 30:00 plan and its world's terrain.
using System.Net;
using System.Net.Http.Json;

namespace Telo.Ride.Api.Tests;

public sealed class MapCatalogueTests(TeloRideApiFactory api) : IClassFixture<TeloRideApiFactory>
{
    [Fact]
    public async Task Bondi_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "bondi-to-bronte");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 120, 21, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 120, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 30, 24, 100),
                new Segment("cool-down", 60, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task The_catalogue_lists_its_maps_in_unlock_order_without_a_session()
    {
        var maps = await ReadMaps();

        Assert.Equal(
            [
                new Listed("Prairie Paceline", 18.4, 90, "Easy", "Route 9 Wind Farm", "Open farmland at golden hour"),
                new Listed("Old Town Criterium", 14.2, 140, "Easy", "Cathedral Circuit", "A cobbled European old town on race day"),
                new Listed("Cliffside Coast", 32, 410, "Moderate", "Headland Road", "A clifftop road above the sea at sunset"),
                new Listed("Neon Docklands", 21.6, 120, "Moderate", "Harbour Bridges Loop", "A harbour city after dark"),
                new Listed("Dolomites", 38.5, 860, "Hard", "Val Gardena Valley Road", "An alpine valley under pale limestone peaks"),
                new Listed("Vice City", 24, 60, "Moderate", "Ocean Drive to the Causeway", "A neon beachfront city at a magenta sunset"),
                new Listed("Col du Granit", 16.1, 1240, "Brutal", null, "A high mountain pass at first light"),
                new Listed("Ibiza Sunset Strip", 8.4, 159, "Moderate", "Intervals to the Beat", "The waterfront strip of Sant Antoni at sunset"),
                new Listed("Sella Ronda", 11.7, 357, "Hard", "Over/Under Intervals on the Passo Sella", "Four Dolomite passes circling the Sella massif"),
                new Listed("Cinque Terre", 17.1, 335, "Hard", "3 Mins On, 2 Mins Off", "The corniche above the Ligurian Sea"),
                new Listed("Haleakalā", 15.8, 923, "Brutal", "Maximum Intensity Hill Climb Efforts", "The summit road from the Pacific coast to the crater rim"),
                new Listed("Bondi to Bronte", 6.15, 97, "Moderate", "The coast walk", "Sydney, Australia"),
            ],
            maps.Select(m => new Listed(m.Name, m.DistanceKm, m.ClimbingM, m.Rating, m.RouteName, m.Place)));
    }

    [Fact]
    public async Task Three_maps_are_open_from_the_start_and_every_other_names_its_goal()
    {
        var maps = await ReadMaps();

        Assert.Equal(
            [
                ("prairie-paceline", null),
                ("old-town-criterium", null),
                ("cliffside-coast", "Finish top 3 vs Bots on Prairie Paceline"),
                ("neon-docklands", "Finish top 3 vs Bots on Old Town Criterium"),
                ("dolomites", "Earn 2★ on Cliffside Coast"),
                ("vice-city", "Reach rider level 10"),
                ("col-du-granit", "Earn 3★ on Dolomites"),
                ("ibiza-sunset-strip", null),
                ("sella-ronda", null),
                ("cinqueterre", null),
                ("haleakala", null),
                ("bondi-to-bronte", null),
            ],
            maps.Select(m => (m.Id, m.UnlockGoal)));
    }

    [Fact]
    public async Task A_goal_names_the_map_it_is_earned_on_and_a_level_goal_none()
    {
        var maps = await ReadMaps();

        Assert.Equal(
            [
                ("prairie-paceline", null),
                ("old-town-criterium", null),
                ("cliffside-coast", "prairie-paceline"),
                ("neon-docklands", "old-town-criterium"),
                ("dolomites", "cliffside-coast"),
                ("vice-city", null),
                ("col-du-granit", "dolomites"),
                ("ibiza-sunset-strip", null),
                ("sella-ronda", null),
                ("cinqueterre", null),
                ("haleakala", null),
                ("bondi-to-bronte", null),
            ],
            maps.Select(m => (m.Id, m.UnlockMapId)));
    }

    [Fact]
    public async Task A_level_goal_names_its_level_and_no_other_goal_does() // L2-033 AC4
    {
        var maps = await ReadMaps();

        Assert.Equal(
            [null, null, null, null, null, 10, null, null, null, null, null, null],
            maps.Select(m => m.UnlockLevel));
    }

    [Fact]
    public async Task Every_map_carries_its_plan_and_its_worlds_terrain()
    {
        var maps = await ReadMaps();

        // A course rides the plan of the class it is modelled after (L2-166); every other map rides 30:00.
        Assert.All(
            maps,
            m => Assert.Equal(
                m.Id switch { "ibiza-sunset-strip" => 1200, "sella-ronda" => 1680, "cinqueterre" => 2400, "haleakala" => 2100, "bondi-to-bronte" => 810, _ => 1800 },
                m.Plan.Segments.Sum(s => s.Duration)));
        var oldTown = maps.Single(m => m.Id == "old-town-criterium");
        Assert.Equal(
            [new Segment("warm-up", 300, 8, 80), new Segment("work", 30, 24, 98), new Segment("recover", 180, 6, 72)],
            oldTown.Plan.Segments.Take(3));
        Assert.Equal(new Segment("cool-down", 360, 6, 70), oldTown.Plan.Segments[^1]);
        Assert.Equal(8, oldTown.Plan.Segments.Count(s => s.Kind == "work"));
        Assert.Equal(6, oldTown.Terrain.Grade["work"]);
        Assert.Equal(-1.5, oldTown.Terrain.Grade["recover"]);
        Assert.Equal(0.5, oldTown.Terrain.Roll);
    }

    [Fact]
    public async Task Every_map_names_its_world_and_its_thumbnail_and_photo_in_the_app()
    {
        var maps = await ReadMaps();

        Assert.Equal(
            ["prairie", "oldtown", "coast", "docklands", "dolomites", "vicecity", "granite", "ibiza", "sellaronda", "cinqueterre", "haleakala", "bondi"],
            maps.Select(m => m.World));
        Assert.All(maps, m => Assert.Equal($"maps/{m.Id}.jpg", m.ThumbnailUrl));
        Assert.All(maps, m => Assert.Equal($"maps/{m.Id}-photo.jpg", m.PhotoUrl));
    }

    [Fact]
    public async Task Only_old_town_criterium_follows_a_real_place_the_streets_of_bruges()
    {
        var maps = await ReadMaps();

        var place = Assert.Single(maps, m => m.RealPlace is not null);
        Assert.Equal("old-town-criterium", place.Id);
        Assert.Equal("Bruges", place.RealPlace!.Name);
        Assert.Equal("Steenstraat to the Markt", place.RealPlace.Route);
        Assert.InRange(place.RealPlace.Latitude, 51.20, 51.22);
        Assert.InRange(place.RealPlace.Longitude, 3.21, 3.24);
    }

    [Fact]
    public async Task The_corniche_rides_the_stages_of_three_minutes_on_two_minutes_off()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "cinqueterre");
        Assert.Equal("cinqueterre", map.World);
        Assert.Equal(new Segment("warm-up", 60, 11, 80), map.Plan.Segments[0]);
        Assert.Equal(7, map.Plan.Segments.Count(s => s == new Segment("work", 180, 22, 90)));
        Assert.Equal(new Segment("cool-down", 60, 11, 70), map.Plan.Segments[^1]);
    }

    [Fact]
    public async Task The_summit_road_rides_the_stages_of_maximum_intensity_hill_climb_efforts()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "haleakala");
        Assert.Equal("haleakala", map.World);
        Assert.Equal(new Segment("warm-up", 180, 13, 90), map.Plan.Segments[0]);
        Assert.Equal(3, map.Plan.Segments.Count(s => s.Kind == "work" && s.Level == 24));
        Assert.Equal(2, map.Plan.Segments.Count(s => s == new Segment("recover", 300, 16, 90)));
        Assert.Equal(new Segment("cool-down", 180, 13, 90), map.Plan.Segments[^1]);
    }

    private async Task<IReadOnlyList<CatalogueMap>> ReadMaps()
    {
        using var client = api.CreateClient();
        using var response = await client.GetAsync("/api/maps", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<IReadOnlyList<CatalogueMap>>(TestContext.Current.CancellationToken))!;
    }

    private sealed record Listed(string Name, double DistanceKm, int ClimbingM, string Rating, string? RouteName, string Place);

    private sealed record CatalogueMap(
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
        CataloguePlan Plan,
        CatalogueTerrain Terrain,
        CatalogueRealPlace? RealPlace);

    private sealed record CatalogueRealPlace(string Name, string Route, double Latitude, double Longitude);

    private sealed record CataloguePlan(IReadOnlyList<Segment> Segments);

    private sealed record Segment(string Kind, int Duration, int Level, int CadenceAim);

    private sealed record CatalogueTerrain(IReadOnlyDictionary<string, double> Grade, double Roll);
}
