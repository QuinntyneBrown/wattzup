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
    public async Task Angliru_rides_all_twenty_one_stages_of_five_gruelling_minutes()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "alto-angliru");
        Assert.Equal("angliru", map.World);
        Assert.Equal(17.625, map.DistanceKm);
        Assert.Equal(1102, map.ClimbingM);
        var heights = Assert.IsAssignableFrom<IReadOnlyList<double>>(map.Terrain.Elevation);
        Assert.Equal(map.ClimbingM, Math.Round(heights[^1] - heights[0]));
        var step = map.DistanceKm * 1000 / (heights.Count - 1);
        var crux = (int)(14975 / step);
        Assert.Equal(23.5, 100 * (heights[crux + 1] - heights[crux]) / step, 1);
        Assert.Equal(
            [
                new Segment("warm-up", 60, 11, 80),
                new Segment("work", 60, 14, 80),
                new Segment("recover", 60, 18, 85),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 600, 19, 90),
                new Segment("recover", 120, 16, 85),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 120, 16, 85),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 120, 16, 85),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("cool-down", 360, 11, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Antwerp_keeps_the_original_lead_out_efforts_on_the_quays()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "antwerp-port-sprint");
        Assert.Equal("antwerp", map.World);
        Assert.Equal(20.9, map.DistanceKm);
        Assert.Equal(18, map.ClimbingM);
        Assert.Equal(
            [
                new Segment("warm-up", 360, 13, 80),
                new Segment("work", 120, 16, 80),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 240, 21, 100),
                new Segment("recover", 180, 10, 80),
                new Segment("work", 240, 18, 80),
                new Segment("work", 180, 21, 100),
                new Segment("recover", 180, 10, 80),
                new Segment("work", 240, 18, 80),
                new Segment("work", 180, 19, 80),
                new Segment("work", 90, 22, 100),
                new Segment("recover", 180, 10, 80),
                new Segment("work", 240, 18, 80),
                new Segment("work", 180, 19, 80),
                new Segment("work", 90, 21, 80),
                new Segment("recover", 30, 24, 100),
                new Segment("cool-down", 210, 10, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Arenberg_rides_the_original_dont_get_dropped_timetable()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "arenberg-forest");
        Assert.Equal("arenberg", map.World);
        Assert.Equal(10.725, map.DistanceKm);
        Assert.Equal(34, map.ClimbingM);
        Assert.Equal(
            [
                new Segment("warm-up", 120, 10, 80),
                new Segment("work", 60, 13, 80),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 18, 85),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 30, 16, 85),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 10, 80),
                new Segment("recover", 60, 18, 85),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 30, 21, 90),
                new Segment("work", 30, 16, 85),
                new Segment("recover", 30, 22, 100),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 240, 18, 85),
                new Segment("recover", 60, 23, 100),
                new Segment("work", 120, 16, 85),
                new Segment("recover", 60, 19, 90),
                new Segment("cool-down", 120, 10, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Philadelphia_keeps_all_seven_efforts_of_HIIT_leg_buster()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "philadelphia-art-museum");
        Assert.Equal("artmuseum", map.World);
        Assert.Equal(8.175, map.DistanceKm);
        Assert.Equal(86, map.ClimbingM);
        var heights = Assert.IsAssignableFrom<IReadOnlyList<double>>(map.Terrain.Elevation);
        foreach (var terrace in new[] { 1900, 2600, 3300, 4000, 5025, 5850, 6675 })
            Assert.InRange(heights[terrace / 5], 12.20, 12.25);
        Assert.Equal(
            [
                new Segment("warm-up", 240, 10, 80),
                new Segment("work", 40, 19, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 40, 19, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 40, 19, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 40, 19, 90),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 90, 10, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 90, 10, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 90, 10, 80),
                new Segment("cool-down", 120, 21, 90)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Atacama_keeps_the_thirteen_stages_of_extreme_fat_burning_class()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "atacama-desert");
        Assert.Equal("atacama", map.World);
        Assert.Equal(21.275, map.DistanceKm);
        Assert.Equal(15, map.ClimbingM);
        Assert.Equal(
            [
                new Segment("warm-up", 450, 14, 84),
                new Segment("work", 195, 19, 80),
                new Segment("recover", 165, 18, 100),
                new Segment("work", 195, 19, 80),
                new Segment("recover", 165, 18, 100),
                new Segment("work", 195, 19, 80),
                new Segment("recover", 165, 18, 100),
                new Segment("work", 195, 19, 80),
                new Segment("recover", 165, 18, 100),
                new Segment("work", 195, 19, 80),
                new Segment("recover", 315, 18, 100),
                new Segment("work", 300, 19, 60),
                new Segment("cool-down", 300, 13, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Atlantic_road_keeps_the_nine_stages_of_FTP_HIIT_booster()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "atlantic-ocean-road");
        Assert.Equal("atlanticroad", map.World);
        Assert.Equal(13.125, map.DistanceKm);
        Assert.Equal(65, map.ClimbingM);
        var heights = Assert.IsAssignableFrom<IReadOnlyList<double>>(map.Terrain.Elevation);
        Assert.InRange(heights[1320 / 5], 25, 28);
        Assert.Equal(
            [
                new Segment("warm-up", 60, 13, 80),
                new Segment("work", 60, 16, 85),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 300, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 420, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 600, 21, 90),
                new Segment("cool-down", 120, 11, 80)
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
                new Listed("Adelaide Hills", 17.11, 265, "Moderate", "The Willunga road", "Summer vineyards and gum trees on the climb to Willunga Hill"),
                new Listed("Aguascalientes Velodrome", 12.875, 0, "Hard", "The pursuit line", "A banked timber pursuit track in a high-altitude Mexican arena"),
                new Listed("Algarve Cliffs", 16.8, 113, "Hard", "The clifftop road", "The limestone headlands of southern Portugal"),
                new Listed("Alpe d'Huez", 7.4, 328, "Hard", "The 21 hairpins", "The 21 bends above Bourg-d’Oisans"),
                new Listed("Amsterdam Canals", 8.0, 28, "Easy", "Herengracht", "The canal quays of Amsterdam"),
                new Listed("Els Àngels, Girona", 17.05, 505, "Hard", "Santuari dels Àngels", "Girona and the Gavarres"),
                new Listed("Angkor Temples", 25.15, 24, "Moderate", "Temple Road", "Angkor Wat and Angkor Thom at dawn"),
                new Listed("Angliru", 17.625, 1102, "Brutal", "Cueña les Cabres", "Sierra del Aramo, Asturias"),
                new Listed("Antwerp Port Sprint", 20.9, 18, "Hard", "Scheldt Quays", "Eilandje and the port of Antwerp"),
                new Listed("Arenberg Forest", 10.725, 34, "Hard", "Trouée d’Arenberg", "Wallers, Hauts-de-France"),
                new Listed("Philadelphia Art Museum Steps", 8.175, 86, "Hard", "Benjamin Franklin Parkway", "Philadelphia, Pennsylvania"),
                new Listed("Atacama Desert", 21.275, 15, "Hard", "The salar road", "Antofagasta, Chile"),
                new Listed("Atlantic Ocean Road", 13.125, 65, "Hard", "Storseisundet Bridge", "Møre og Romsdal, Norway"),
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
                ("adelaide-hills", null),
                ("aguascalientes", null),
                ("algarve-cliffs", null),
                ("alpe-dhuez", null),
                ("amsterdam-canals", null),
                ("els-angels", null),
                ("angkor-temples", null),
                ("alto-angliru", null),
                ("antwerp-port-sprint", null),
                ("arenberg-forest", null),
                ("philadelphia-art-museum", null),
                ("atacama-desert", null),
                ("atlantic-ocean-road", null),
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
                ("adelaide-hills", null),
                ("aguascalientes", null),
                ("algarve-cliffs", null),
                ("alpe-dhuez", null),
                ("amsterdam-canals", null),
                ("els-angels", null),
                ("angkor-temples", null),
                ("alto-angliru", null),
                ("antwerp-port-sprint", null),
                ("arenberg-forest", null),
                ("philadelphia-art-museum", null),
                ("atacama-desert", null),
                ("atlantic-ocean-road", null),
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
                m.Id switch { "ibiza-sunset-strip" => 1200, "sella-ronda" => 1680, "cinqueterre" => 2400, "haleakala" => 2100, "atacama-desert" => 3000, "philadelphia-art-museum" => 1180, "arenberg-forest" => 1500, "antwerp-port-sprint" => 3000, "alto-angliru" => 2400, "angkor-temples" => 3540, "els-angels" => 2400, "amsterdam-canals" => 1200, "alpe-dhuez" => 1200, "algarve-cliffs" => 2400, _ => 1800 },
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
            ["prairie", "oldtown", "coast", "docklands", "dolomites", "vicecity", "granite", "ibiza", "sellaronda", "cinqueterre", "haleakala", "adelaide", "aguascalientes", "algarve", "alpe", "amsterdam", "angels", "angkor", "angliru", "antwerp", "arenberg", "artmuseum", "atacama", "atlanticroad"],
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
    public async Task Adelaide_rides_the_recorded_Mitchelton_Scott_intervals()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "adelaide-hills");
        Assert.Equal("adelaide", map.World);
        Assert.Equal("The Willunga road", map.RouteName);
        Assert.Equal(265, map.ClimbingM);
        Assert.Equal(1800, map.Plan.Segments.Sum(s => s.Duration));
        Assert.Equal(new Segment("warm-up", 270, 14, 80), map.Plan.Segments[0]);
        Assert.Equal(5, map.Plan.Segments.Count(s => s == new Segment("work", 30, 24, 100)));
        Assert.Equal(new Segment("cool-down", 240, 11, 80), map.Plan.Segments[^1]);
    }

    [Fact]
    public async Task Olympic_pursuit_efforts_rides_the_flat_Aguascalientes_oval()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "aguascalientes");
        Assert.Equal("aguascalientes", map.World);
        Assert.Equal(0, map.ClimbingM);
        Assert.Equal(12.875, map.DistanceKm);
        Assert.Equal(1800, map.Plan.Segments.Sum(s => s.Duration));
        Assert.Equal(new Segment("warm-up", 240, 12, 80), map.Plan.Segments[0]);
        Assert.Contains(new Segment("work", 240, 24, 100), map.Plan.Segments);
        Assert.Equal(new Segment("cool-down", 120, 11, 80), map.Plan.Segments[^1]);
    }

    [Fact]
    public async Task Get_fit_in_40_follows_the_Algarve_headland_road()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "algarve-cliffs");
        Assert.Equal("algarve", map.World);
        Assert.Equal(113, map.ClimbingM);
        Assert.Equal(16.8, map.DistanceKm);
        Assert.Equal(2400, map.Plan.Segments.Sum(s => s.Duration));
        Assert.Equal(new Segment("warm-up", 120, 11, 80), map.Plan.Segments[0]);
        Assert.Equal(new Segment("cool-down", 180, 13, 80), map.Plan.Segments[^1]);
    }

    [Fact]
    public async Task Elevate_your_climbing_power_rides_the_21_Alpe_bends()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "alpe-dhuez");
        Assert.Equal("alpe", map.World);
        Assert.Equal(328, map.ClimbingM);
        Assert.Equal(7.4, map.DistanceKm);
        Assert.Equal(1200, map.Plan.Segments.Sum(s => s.Duration));
        Assert.Equal(14, map.Plan.Segments.Count);
        Assert.Equal(new Segment("warm-up", 120, 11, 80), map.Plan.Segments[0]);
    }

    [Fact]
    public async Task Herengracht_rides_the_original_beginner_training_session()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "amsterdam-canals");
        Assert.Equal("amsterdam", map.World);
        Assert.Equal(8.0, map.DistanceKm);
        Assert.Equal(28, map.ClimbingM);
        Assert.Equal(
            [
                new Segment("warm-up", 240, 12, 80),
                new Segment("work", 120, 14, 80),
                new Segment("recover", 120, 16, 80),
                new Segment("work", 120, 18, 80),
                new Segment("work", 120, 19, 80),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 120, 21, 80),
                new Segment("recover", 120, 16, 80),
                new Segment("cool-down", 120, 13, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Girona_rides_the_stages_of_drop_ollie_at_all_costs()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "els-angels");
        Assert.Equal("angels", map.World);
        Assert.Equal(17.05, map.DistanceKm);
        Assert.Equal(505, map.ClimbingM);
        Assert.Equal(
            [
                new Segment("warm-up", 240, 10, 80),
                new Segment("work", 120, 14, 82),
                new Segment("recover", 120, 19, 90),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 180, 10, 80),
                new Segment("work", 240, 18, 88),
                new Segment("recover", 120, 24, 100),
                new Segment("work", 300, 10, 80),
                new Segment("recover", 120, 20, 92),
                new Segment("work", 180, 10, 80),
                new Segment("recover", 60, 22, 97),
                new Segment("work", 120, 10, 80),
                new Segment("recover", 25, 24, 100),
                new Segment("work", 10, 10, 80),
                new Segment("recover", 25, 24, 100),
                new Segment("work", 120, 10, 80),
                new Segment("recover", 25, 24, 100),
                new Segment("work", 10, 10, 80),
                new Segment("recover", 25, 24, 100),
                new Segment("work", 120, 10, 80),
                new Segment("recover", 60, 24, 100),
                new Segment("cool-down", 120, 10, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Temple_road_rides_the_original_reverse_pyramid()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "angkor-temples");
        Assert.Equal("angkor", map.World);
        Assert.Equal(25.15, map.DistanceKm);
        Assert.Equal(24, map.ClimbingM);
        Assert.Equal(
            [
                new Segment("warm-up", 180, 13, 90),
                new Segment("work", 120, 16, 90),
                new Segment("recover", 180, 13, 90),
                new Segment("work", 60, 24, 100),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 180, 21, 90),
                new Segment("work", 240, 19, 85),
                new Segment("recover", 300, 18, 80),
                new Segment("work", 360, 16, 80),
                new Segment("recover", 180, 13, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 120, 22, 80),
                new Segment("work", 180, 21, 90),
                new Segment("recover", 240, 19, 85),
                new Segment("work", 300, 18, 80),
                new Segment("recover", 360, 16, 80),
                new Segment("cool-down", 360, 18, 90)
            ],
            map.Plan.Segments);
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

    private sealed record CatalogueTerrain(IReadOnlyDictionary<string, double> Grade, double Roll, IReadOnlyList<double>? Elevation);
}
