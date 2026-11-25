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
    public async Task Knicks_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "knicks-championship-parade");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 11, 80),
                new Segment("work", 120, 16, 80),
                new Segment("work", 120, 19, 80),
                new Segment("work", 60, 21, 80),
                new Segment("work", 60, 22, 80),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 50, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 50, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 50, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 50, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 50, 11, 80),
                new Segment("work", 30, 22, 110),
                new Segment("cool-down", 90, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Iceland_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "iceland-ring-road");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 13, 80),
                new Segment("work", 60, 18, 80),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 60, 18, 80),
                new Segment("work", 30, 21, 80),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 16, 80),
                new Segment("work", 120, 19, 80),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 120, 21, 80),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 60, 24, 80),
                new Segment("cool-down", 90, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Independence_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "independence-pass");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 14, 80),
                new Segment("work", 60, 18, 80),
                new Segment("recover", 120, 14, 80),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("work", 90, 22, 90),
                new Segment("work", 90, 19, 90),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("work", 90, 22, 90),
                new Segment("recover", 90, 19, 90),
                new Segment("cool-down", 180, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Isleofman_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "isle-of-man-mountain-course");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 11, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("work", 10, 24, 100),
                new Segment("work", 50, 14, 80),
                new Segment("recover", 180, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 50, 14, 80),
                new Segment("cool-down", 360, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Iten_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "iten-kenya");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 13, 80),
                new Segment("work", 120, 21, 90),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 840, 19, 93),
                new Segment("work", 180, 22, 90),
                new Segment("work", 60, 24, 110),
                new Segment("recover", 300, 11, 80),
                new Segment("work", 60, 24, 110),
                new Segment("recover", 180, 11, 80),
                new Segment("work", 60, 24, 110),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 60, 24, 110),
                new Segment("cool-down", 120, 11, 80),
            ],
            map.Plan.Segments);
    }

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
    public async Task Aubisque_keeps_the_original_thirty_seven_torque_intervals_and_recoveries()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "col-aubisque");
        Assert.Equal("aubisque", map.World);
        Assert.Equal(12.6, map.DistanceKm);
        Assert.Equal(361, map.ClimbingM);
        var heights = Assert.IsAssignableFrom<IReadOnlyList<double>>(map.Terrain.Elevation);
        Assert.InRange(heights.Min(), -110, -100);
        Assert.InRange(heights[^1], 250, 252);
        Assert.Equal(
            [
                new Segment("warm-up", 300, 14, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 80, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 200, 11, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 80, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 80, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("recover", 20, 13, 80),
                new Segment("work", 40, 22, 70),
                new Segment("cool-down", 260, 11, 80)
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Austin_preserves_every_stage_of_Get_Pumped_With_Grace()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "sixth-street-austin");
        Assert.Equal(
            [
                new Segment("warm-up", 390, 16, 100),
                new Segment("work", 30, 21, 78),
                new Segment("recover", 60, 13, 90),
                new Segment("work", 30, 21, 78),
                new Segment("recover", 60, 13, 90),
                new Segment("work", 30, 21, 78),
                new Segment("recover", 60, 13, 90),
                new Segment("work", 30, 21, 78),
                new Segment("recover", 60, 13, 90),
                new Segment("work", 20, 19, 120),
                new Segment("recover", 40, 13, 90),
                new Segment("work", 20, 19, 120),
                new Segment("recover", 40, 13, 90),
                new Segment("work", 20, 19, 120),
                new Segment("recover", 40, 13, 90),
                new Segment("work", 20, 19, 120),
                new Segment("recover", 40, 13, 90),
                new Segment("work", 45, 21, 78),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 45, 21, 78),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 45, 21, 78),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 45, 21, 78),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 45, 21, 78),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 60, 13, 90),
                new Segment("work", 60, 21, 90),
                new Segment("cool-down", 160, 12, 84),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Bathsheba_preserves_every_stage_of_Take_It_Easy()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "bathsheba-barbados");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 14, 80),
                new Segment("work", 60, 18, 80),
                new Segment("work", 60, 14, 80),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 180, 14, 90),
                new Segment("recover", 240, 16, 90),
                new Segment("work", 300, 18, 90),
                new Segment("work", 120, 19, 90),
                new Segment("cool-down", 240, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Bay_of_Islands_preserves_every_stage_of_the_group_intervals()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "bay-of-islands");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 14, 90),
                new Segment("work", 360, 18, 98),
                new Segment("work", 60, 14, 90),
                new Segment("recover", 60, 18, 110),
                new Segment("work", 60, 14, 90),
                new Segment("recover", 60, 18, 110),
                new Segment("work", 90, 14, 90),
                new Segment("recover", 30, 24, 100),
                new Segment("work", 190, 21, 91),
                new Segment("recover", 240, 16, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 190, 21, 91),
                new Segment("work", 240, 16, 90),
                new Segment("recover", 30, 24, 100),
                new Segment("work", 190, 21, 91),
                new Segment("recover", 240, 16, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 180, 21, 90),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 210, 16, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 180, 21, 90),
                new Segment("cool-down", 670, 13, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Beach_Road_preserves_every_sprint_and_recovery()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "beach-road-melbourne");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 13, 80),
                new Segment("work", 390, 16, 85),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 90, 21, 90),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 90, 21, 90),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 90, 21, 90),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 15, 13, 80),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 135, 11, 80),
                new Segment("work", 210, 22, 91),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("cool-down", 380, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Bealach_na_Ba_preserves_every_strength_interval()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "bealach-na-ba");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 60, 22, 60),
                new Segment("work", 60, 21, 110),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 22, 60),
                new Segment("work", 60, 21, 110),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 22, 60),
                new Segment("work", 60, 21, 110),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 22, 60),
                new Segment("work", 60, 21, 110),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 22, 60),
                new Segment("recover", 60, 21, 110),
                new Segment("cool-down", 120, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Big_Sur_preserves_every_over_and_under_power_block()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "big-sur");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 13, 90),
                new Segment("work", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 180, 13, 95),
                new Segment("work", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("cool-down", 240, 13, 90),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Blackpool_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "blackpool-illuminations");
        Assert.Equal(
            [
                new Segment("warm-up", 60, 11, 75),
                new Segment("work", 60, 14, 80),
                new Segment("recover", 60, 19, 85),
                new Segment("work", 30, 22, 90),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 420, 19, 78),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 60, 24, 95),
                new Segment("cool-down", 90, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Bluemountains_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "blue-mountains-jamaica");
        Assert.Equal(
            [
                new Segment("warm-up", 240, 16, 87),
                new Segment("work", 35, 24, 108),
                new Segment("recover", 25, 13, 87),
                new Segment("work", 35, 24, 108),
                new Segment("recover", 25, 13, 87),
                new Segment("work", 20, 24, 108),
                new Segment("recover", 40, 13, 87),
                new Segment("work", 20, 21, 62),
                new Segment("recover", 20, 13, 87),
                new Segment("work", 30, 21, 62),
                new Segment("recover", 20, 13, 87),
                new Segment("work", 45, 21, 62),
                new Segment("recover", 60, 13, 87),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 22, 85),
                new Segment("recover", 60, 16, 80),
                new Segment("cool-down", 165, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Blueridge_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "blue-ridge-parkway");
        Assert.Equal(
            [
                new Segment("warm-up", 600, 13, 80),
                new Segment("work", 300, 21, 95),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 300, 21, 95),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 300, 21, 95),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 300, 21, 95),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 300, 21, 95),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 300, 21, 95),
                new Segment("cool-down", 300, 13, 80),
            ],
            map.Plan.Segments);
    }

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
    public async Task Bonneville_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "bonneville-salt-flats");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 14, 80),
                new Segment("work", 60, 18, 80),
                new Segment("recover", 120, 14, 80),
                new Segment("work", 30, 24, 80),
                new Segment("work", 60, 21, 80),
                new Segment("recover", 30, 16, 100),
                new Segment("work", 30, 24, 80),
                new Segment("work", 60, 21, 80),
                new Segment("recover", 30, 16, 100),
                new Segment("work", 30, 24, 80),
                new Segment("recover", 60, 21, 80),
                new Segment("work", 30, 16, 100),
                new Segment("recover", 30, 24, 80),
                new Segment("work", 60, 21, 80),
                new Segment("recover", 30, 16, 100),
                new Segment("work", 30, 24, 80),
                new Segment("recover", 60, 21, 80),
                new Segment("work", 30, 16, 100),
                new Segment("recover", 120, 14, 80),
                new Segment("cool-down", 120, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Brickyard_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "indianapolis-brickyard");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 12, 80),
                new Segment("work", 60, 18, 80),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 90, 21, 80),
                new Segment("work", 90, 16, 80),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 90, 16, 80),
                new Segment("work", 90, 21, 80),
                new Segment("recover", 90, 13, 80),
                new Segment("work", 90, 21, 80),
                new Segment("work", 90, 16, 80),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 90, 22, 80),
                new Segment("recover", 90, 18, 80),
                new Segment("work", 30, 13, 80),
                new Segment("recover", 90, 18, 80),
                new Segment("work", 90, 22, 80),
                new Segment("recover", 120, 10, 80),
                new Segment("cool-down", 120, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Brighton_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "brighton-pride");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 11, 80),
                new Segment("work", 180, 14, 80),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 90, 16, 85),
                new Segment("work", 180, 18, 85),
                new Segment("work", 120, 19, 90),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 90, 16, 85),
                new Segment("work", 180, 18, 85),
                new Segment("work", 180, 21, 90),
                new Segment("work", 180, 22, 100),
                new Segment("cool-down", 180, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Brooklyn_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "brooklyn-bridge-commute");
        Assert.Equal(
            [
                new Segment("warm-up", 60, 13, 80),
                new Segment("work", 30, 16, 80),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 16, 80),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 60, 19, 100),
                new Segment("recover", 180, 16, 80),
                new Segment("work", 60, 19, 100),
                new Segment("recover", 90, 13, 80),
                new Segment("work", 120, 21, 100),
                new Segment("work", 180, 18, 80),
                new Segment("recover", 90, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("work", 30, 19, 80),
                new Segment("recover", 60, 16, 80),
                new Segment("work", 60, 19, 100),
                new Segment("recover", 30, 16, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 60, 19, 100),
                new Segment("recover", 60, 16, 80),
                new Segment("cool-down", 60, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Bund_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "the-bund-shanghai");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 13, 80),
                new Segment("work", 15, 24, 105),
                new Segment("recover", 45, 11, 80),
                new Segment("work", 15, 24, 105),
                new Segment("recover", 45, 11, 80),
                new Segment("work", 15, 24, 105),
                new Segment("recover", 45, 11, 80),
                new Segment("work", 30, 24, 105),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 24, 105),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 24, 105),
                new Segment("recover", 330, 11, 80),
                new Segment("work", 45, 24, 105),
                new Segment("recover", 15, 11, 80),
                new Segment("work", 45, 24, 105),
                new Segment("recover", 15, 11, 80),
                new Segment("work", 45, 24, 105),
                new Segment("recover", 315, 11, 80),
                new Segment("work", 60, 24, 105),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 60, 24, 105),
                new Segment("cool-down", 213, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Calobra_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "sa-calobra-mallorca");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 14, 90),
                new Segment("work", 1180, 20, 72),
                new Segment("work", 20, 24, 110),
                new Segment("cool-down", 330, 11, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Campolongo_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "passo-campolongo");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 12, 80),
                new Segment("work", 120, 19, 75),
                new Segment("work", 83, 22, 70),
                new Segment("work", 107, 19, 75),
                new Segment("recover", 67, 13, 80),
                new Segment("work", 114, 19, 75),
                new Segment("work", 163, 22, 70),
                new Segment("recover", 123, 21, 75),
                new Segment("work", 120, 22, 70),
                new Segment("work", 33, 24, 80),
                new Segment("cool-down", 200, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Cabot_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "cabot-trail");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 180, 16, 80),
                new Segment("work", 1260, 19, 80),
                new Segment("recover", 240, 13, 90),
                new Segment("work", 1440, 21, 85),
                new Segment("work", 60, 24, 110),
                new Segment("cool-down", 300, 11, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Caribana_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "caribana-parade");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 60, 18, 85),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 16, 113),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 16, 113),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 16, 113),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 16, 113),
                new Segment("recover", 150, 11, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 30, 11, 80),
                new Segment("work", 30, 22, 100),
                new Segment("cool-down", 90, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Centralpark_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "central-park-loop");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 60, 16, 85),
                new Segment("work", 60, 18, 85),
                new Segment("work", 60, 19, 90),
                new Segment("work", 60, 21, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 16, 85),
                new Segment("work", 60, 18, 85),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 16, 85),
                new Segment("work", 30, 19, 90),
                new Segment("recover", 30, 24, 100),
                new Segment("cool-down", 60, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Cherryblossom_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "cherry-blossom-festival-dc");
        Assert.Equal(
            [
                new Segment("warm-up", 135, 13, 85),
                new Segment("work", 75, 19, 78),
                new Segment("recover", 15, 11, 85),
                new Segment("work", 75, 19, 78),
                new Segment("recover", 15, 11, 85),
                new Segment("work", 20, 22, 100),
                new Segment("recover", 40, 11, 90),
                new Segment("work", 20, 22, 100),
                new Segment("recover", 40, 11, 90),
                new Segment("work", 20, 22, 100),
                new Segment("recover", 40, 11, 90),
                new Segment("work", 20, 22, 100),
                new Segment("recover", 40, 11, 90),
                new Segment("work", 45, 21, 85),
                new Segment("recover", 35, 13, 85),
                new Segment("work", 45, 21, 85),
                new Segment("recover", 35, 13, 85),
                new Segment("work", 45, 21, 85),
                new Segment("recover", 35, 13, 85),
                new Segment("work", 60, 21, 63),
                new Segment("recover", 40, 13, 85),
                new Segment("work", 60, 21, 63),
                new Segment("recover", 40, 13, 85),
                new Segment("work", 60, 21, 63),
                new Segment("recover", 40, 13, 85),
                new Segment("work", 30, 22, 63),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 22, 63),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 22, 63),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 22, 63),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 22, 63),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 100),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 45, 21, 100),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 45, 21, 100),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 45, 21, 100),
                new Segment("recover", 30, 13, 90),
                new Segment("work", 60, 22, 70),
                new Segment("recover", 40, 13, 85),
                new Segment("work", 60, 22, 70),
                new Segment("recover", 40, 13, 85),
                new Segment("work", 60, 22, 70),
                new Segment("recover", 40, 13, 85),
                new Segment("work", 30, 24, 110),
                new Segment("recover", 30, 11, 90),
                new Segment("work", 30, 24, 110),
                new Segment("recover", 30, 11, 90),
                new Segment("work", 30, 24, 110),
                new Segment("recover", 30, 11, 90),
                new Segment("work", 30, 24, 110),
                new Segment("recover", 30, 11, 90),
                new Segment("work", 30, 24, 110),
                new Segment("cool-down", 135, 11, 82),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Champs_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "champs-elysees-finale");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 12, 80),
                new Segment("work", 60, 17, 85),
                new Segment("recover", 30, 19, 90),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 16, 85),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 19, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("cool-down", 150, 12, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Chicago_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "chicago-loop-crit");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 120, 16, 85),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 180, 19, 90),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 60, 24, 100),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 21, 90),
                new Segment("work", 60, 24, 100),
                new Segment("cool-down", 120, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Chichen_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "chichen-itza");
        Assert.Equal(
            [
                new Segment("warm-up", 240, 12, 80),
                new Segment("work", 120, 14, 80),
                new Segment("recover", 120, 18, 85),
                new Segment("work", 60, 21, 90),
                new Segment("work", 120, 13, 80),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 60, 13, 80),
                new Segment("recover", 60, 14, 80),
                new Segment("work", 60, 16, 85),
                new Segment("recover", 60, 18, 85),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 60, 21, 90),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 60, 24, 100),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 60, 21, 90),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 60, 18, 85),
                new Segment("work", 60, 16, 85),
                new Segment("recover", 60, 14, 80),
                new Segment("cool-down", 180, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Como_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "lake-como");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 180, 16, 80),
                new Segment("work", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 180, 11, 80),
                new Segment("work", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 80),
                new Segment("work", 30, 24, 100),
                new Segment("cool-down", 120, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Comuna13_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "comuna-13-medellin");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 13, 80),
                new Segment("work", 120, 16, 90),
                new Segment("work", 60, 18, 100),
                new Segment("recover", 100, 11, 80),
                new Segment("work", 120, 18, 85),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 18, 85),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 19, 90),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 20, 90),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 21, 90),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 22, 90),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 30, 14, 80),
                new Segment("work", 90, 24, 100),
                new Segment("cool-down", 100, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Coney_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "coney-island-boardwalk");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 10, 80),
                new Segment("work", 60, 13, 80),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 180, 19, 90),
                new Segment("recover", 60, 13, 105),
                new Segment("work", 120, 19, 90),
                new Segment("recover", 60, 13, 105),
                new Segment("work", 180, 19, 90),
                new Segment("recover", 60, 13, 105),
                new Segment("work", 120, 19, 90),
                new Segment("cool-down", 60, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Copacabana_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "copacabana-promenade");
        Assert.Equal(
            [
                new Segment("warm-up", 60, 11, 80),
                new Segment("work", 60, 16, 85),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 10, 21, 90),
                new Segment("recover", 10, 10, 80),
                new Segment("work", 20, 21, 90),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 30, 21, 90),
                new Segment("recover", 30, 10, 80),
                new Segment("work", 40, 21, 90),
                new Segment("recover", 40, 10, 80),
                new Segment("work", 50, 21, 90),
                new Segment("recover", 50, 10, 80),
                new Segment("work", 60, 23, 100),
                new Segment("recover", 30, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Copenhagen_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "copenhagen-cycle-superhighway");
        Assert.Equal(
            [
                new Segment("warm-up", 240, 12, 80),
                new Segment("work", 120, 14, 80),
                new Segment("recover", 60, 18, 90),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 60, 22, 90),
                new Segment("work", 120, 19, 90),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 60, 22, 90),
                new Segment("work", 120, 19, 90),
                new Segment("recover", 240, 13, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 60, 22, 90),
                new Segment("recover", 120, 19, 90),
                new Segment("cool-down", 120, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Cornwall_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "cornish-harbour");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 11, 80),
                new Segment("work", 60, 14, 80),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 20, 10, 80),
                new Segment("work", 10, 24, 100),
                new Segment("cool-down", 140, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Cypress_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "cypress-mountain");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 14, 80),
                new Segment("work", 90, 21, 90),
                new Segment("recover", 90, 10, 80),
                new Segment("work", 480, 16, 85),
                new Segment("work", 360, 18, 85),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 240, 19, 90),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 30, 24, 100),
                new Segment("cool-down", 480, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Dales_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "yorkshire-dales");
        Assert.Equal(
            [
                new Segment("warm-up", 180, 13, 90),
                new Segment("work", 15, 21, 120),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 15, 21, 120),
                new Segment("recover", 45, 13, 90),
                new Segment("work", 15, 21, 120),
                new Segment("recover", 173, 13, 90),
                new Segment("work", 220, 21, 92),
                new Segment("recover", 240, 13, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 190, 21, 91),
                new Segment("work", 240, 13, 90),
                new Segment("recover", 30, 24, 100),
                new Segment("work", 190, 21, 91),
                new Segment("recover", 240, 13, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 190, 21, 91),
                new Segment("work", 240, 13, 90),
                new Segment("recover", 30, 24, 100),
                new Segment("work", 190, 21, 91),
                new Segment("recover", 240, 13, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 190, 21, 91),
                new Segment("cool-down", 160, 11, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Daytona_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "daytona-beach-sand");
        Assert.Equal(
            [
                new Segment("warm-up", 60, 13, 80),
                new Segment("work", 120, 18, 85),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 120, 18, 85),
                new Segment("work", 60, 19, 90),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 85),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 85),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 85),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 85),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 60, 24, 85),
                new Segment("cool-down", 120, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Deathvalley_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "death-valley");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 11, 80),
                new Segment("work", 60, 14, 90),
                new Segment("recover", 30, 18, 100),
                new Segment("work", 135, 13, 80),
                new Segment("recover", 225, 18, 85),
                new Segment("work", 30, 21, 95),
                new Segment("recover", 90, 13, 80),
                new Segment("work", 60, 21, 100),
                new Segment("recover", 40, 13, 80),
                new Segment("work", 50, 21, 110),
                new Segment("recover", 90, 13, 80),
                new Segment("work", 60, 21, 95),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("cool-down", 120, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Diwali_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "diwali-marine-drive");
        Assert.Equal(
            [
                new Segment("warm-up", 150, 13, 80),
                new Segment("work", 90, 18, 68),
                new Segment("work", 60, 21, 68),
                new Segment("recover", 120, 18, 85),
                new Segment("work", 30, 22, 65),
                new Segment("recover", 30, 19, 75),
                new Segment("work", 30, 22, 65),
                new Segment("recover", 30, 19, 75),
                new Segment("work", 30, 22, 65),
                new Segment("recover", 30, 19, 75),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 60, 14, 80),
                new Segment("work", 120, 18, 100),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 180, 19, 82),
                new Segment("work", 60, 22, 80),
                new Segment("work", 20, 23, 100),
                new Segment("recover", 60, 22, 80),
                new Segment("work", 20, 23, 100),
                new Segment("recover", 60, 22, 80),
                new Segment("work", 20, 23, 100),
                new Segment("cool-down", 185, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Dubai_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "dubai-marina");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 60, 16, 85),
                new Segment("work", 30, 21, 90),
                new Segment("work", 180, 18, 85),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("work", 180, 19, 90),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 30, 13, 80),
                new Segment("work", 30, 21, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 180, 19, 90),
                new Segment("cool-down", 60, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Edinburgh_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "edinburgh-fringe");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 17, 85),
                new Segment("work", 120, 19, 90),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 120, 19, 90),
                new Segment("work", 10, 24, 100),
                new Segment("recover", 60, 10, 80),
                new Segment("cool-down", 130, 12, 82),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Engadin_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "engadin-lakes");
        Assert.Equal(
            [
                new Segment("warm-up", 420, 14, 85),
                new Segment("work", 120, 18, 70),
                new Segment("recover", 120, 16, 95),
                new Segment("work", 120, 18, 70),
                new Segment("recover", 120, 16, 95),
                new Segment("work", 120, 18, 70),
                new Segment("recover", 120, 16, 95),
                new Segment("work", 120, 18, 70),
                new Segment("recover", 120, 16, 95),
                new Segment("work", 120, 18, 70),
                new Segment("recover", 120, 16, 95),
                new Segment("work", 120, 18, 70),
                new Segment("recover", 120, 16, 95),
                new Segment("work", 90, 21, 70),
                new Segment("recover", 90, 16, 95),
                new Segment("work", 90, 21, 70),
                new Segment("recover", 90, 16, 95),
                new Segment("work", 90, 21, 70),
                new Segment("recover", 90, 16, 95),
                new Segment("work", 90, 21, 70),
                new Segment("recover", 90, 16, 95),
                new Segment("work", 90, 21, 70),
                new Segment("recover", 90, 16, 95),
                new Segment("work", 90, 21, 70),
                new Segment("recover", 90, 16, 95),
                new Segment("work", 300, 21, 65),
                new Segment("recover", 180, 18, 95),
                new Segment("cool-down", 180, 11, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Etna_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "mount-etna");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 14, 80),
                new Segment("work", 120, 18, 80),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 120, 19, 80),
                new Segment("work", 180, 14, 80),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 180, 24, 93),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 180, 24, 93),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 180, 24, 93),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 300, 24, 92),
                new Segment("cool-down", 120, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Fens_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "fenland-time-trial");
        Assert.Equal(
            [
                new Segment("warm-up", 240, 12, 80),
                new Segment("work", 120, 14, 80),
                new Segment("work", 60, 18, 80),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 600, 21, 90),
                new Segment("recover", 180, 11, 80),
                new Segment("work", 600, 21, 90),
                new Segment("cool-down", 180, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Fishhill_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "fish-hill-cotswolds");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 17, 80),
                new Segment("work", 60, 13, 70),
                new Segment("recover", 60, 22, 80),
                new Segment("work", 60, 13, 70),
                new Segment("recover", 60, 18, 50),
                new Segment("work", 60, 21, 100),
                new Segment("work", 180, 19, 80),
                new Segment("recover", 60, 13, 70),
                new Segment("work", 60, 18, 50),
                new Segment("work", 60, 21, 100),
                new Segment("work", 180, 19, 80),
                new Segment("recover", 60, 13, 70),
                new Segment("work", 60, 18, 50),
                new Segment("work", 60, 21, 100),
                new Segment("recover", 180, 19, 80),
                new Segment("cool-down", 300, 13, 78),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Fuji_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "mount-fuji-road");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 16, 90),
                new Segment("work", 60, 10, 60),
                new Segment("recover", 15, 24, 100),
                new Segment("work", 300, 21, 90),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 300, 21, 90),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 300, 21, 90),
                new Segment("work", 15, 24, 100),
                new Segment("recover", 300, 21, 90),
                new Segment("cool-down", 180, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Furka_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "furka-pass");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 14, 80),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 180, 13, 85),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 180, 13, 85),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 180, 13, 85),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 180, 13, 85),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 180, 13, 85),
                new Segment("work", 120, 23, 100),
                new Segment("recover", 180, 13, 85),
                new Segment("work", 300, 22, 90),
                new Segment("cool-down", 300, 11, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Galibier_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "col-du-galibier");
        Assert.Equal(
            [
                new Segment("warm-up", 300, 13, 80),
                new Segment("work", 300, 16, 85),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 120, 18, 85),
                new Segment("work", 120, 21, 90),
                new Segment("recover", 120, 18, 85),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 120, 23, 100),
                new Segment("work", 90, 11, 80),
                new Segment("recover", 360, 21, 90),
                new Segment("work", 120, 22, 100),
                new Segment("recover", 150, 19, 90),
                new Segment("work", 360, 11, 80),
                new Segment("recover", 150, 19, 90),
                new Segment("work", 150, 22, 90),
                new Segment("recover", 150, 19, 90),
                new Segment("work", 150, 22, 90),
                new Segment("recover", 240, 11, 80),
                new Segment("work", 240, 22, 90),
                new Segment("cool-down", 180, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Gardena_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "passo-gardena");
        Assert.Equal(
            [
                new Segment("warm-up", 360, 12, 90),
                new Segment("work", 90, 14, 90),
                new Segment("recover", 90, 16, 90),
                new Segment("work", 180, 18, 90),
                new Segment("work", 90, 19, 90),
                new Segment("work", 90, 20, 90),
                new Segment("work", 90, 21, 90),
                new Segment("work", 90, 22, 90),
                new Segment("work", 30, 24, 95),
                new Segment("cool-down", 90, 10, 85),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Ghent_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "ghent-six-day");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 11, 80),
                new Segment("work", 30, 18, 100),
                new Segment("work", 30, 21, 110),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 30, 18, 100),
                new Segment("work", 30, 21, 110),
                new Segment("work", 30, 24, 120),
                new Segment("recover", 60, 18, 80),
                new Segment("work", 30, 21, 100),
                new Segment("work", 60, 24, 115),
                new Segment("cool-down", 60, 10, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Giza_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "giza-plateau");
        Assert.Equal(
            [
                new Segment("warm-up", 240, 10, 80),
                new Segment("work", 120, 13, 80),
                new Segment("recover", 120, 14, 80),
                new Segment("work", 120, 16, 85),
                new Segment("work", 60, 18, 85),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 60, 18, 85),
                new Segment("work", 120, 16, 85),
                new Segment("recover", 120, 14, 80),
                new Segment("cool-down", 360, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Glasgow_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "glasgow-world-championships");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 10, 80),
                new Segment("work", 120, 16, 85),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 90, 24, 100),
                new Segment("work", 90, 19, 90),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 90, 19, 90),
                new Segment("work", 90, 24, 100),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 90, 24, 100),
                new Segment("work", 90, 19, 90),
                new Segment("recover", 120, 10, 80),
                new Segment("work", 150, 19, 90),
                new Segment("work", 150, 24, 100),
                new Segment("recover", 120, 10, 80),
                new Segment("cool-down", 120, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Glastonbury_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "glastonbury-fields");
        Assert.Equal(
            [
                new Segment("warm-up", 150, 14, 80),
                new Segment("work", 30, 19, 104),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 19, 104),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 19, 104),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 19, 104),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 19, 104),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 30, 19, 104),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 88),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 88),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 88),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 88),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 88),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 45, 21, 88),
                new Segment("recover", 30, 13, 85),
                new Segment("work", 40, 22, 65),
                new Segment("recover", 35, 11, 85),
                new Segment("work", 40, 22, 65),
                new Segment("recover", 35, 11, 85),
                new Segment("work", 40, 22, 65),
                new Segment("recover", 35, 11, 85),
                new Segment("work", 40, 22, 65),
                new Segment("recover", 35, 11, 85),
                new Segment("work", 40, 22, 65),
                new Segment("cool-down", 200, 11, 81),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Goldengate_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "golden-gate-park");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 11, 80),
                new Segment("work", 60, 16, 85),
                new Segment("recover", 72, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 24, 100),
                new Segment("cool-down", 78, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Grandcanyon_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "grand-canyon-south-rim");
        Assert.Equal(
            [
                new Segment("warm-up", 60, 11, 70),
                new Segment("work", 60, 14, 70),
                new Segment("recover", 60, 18, 75),
                new Segment("work", 60, 19, 80),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("work", 30, 22, 110),
                new Segment("recover", 60, 19, 90),
                new Segment("cool-down", 240, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Greatocean_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "great-ocean-road");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 10, 80),
                new Segment("work", 60, 14, 80),
                new Segment("work", 120, 16, 85),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 60, 19, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 60, 19, 90),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("cool-down", 120, 13, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Hanriver_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "han-river-parks");
        Assert.Equal(
            [
                new Segment("warm-up", 280, 13, 80),
                new Segment("work", 30, 22, 100),
                new Segment("recover", 90, 11, 80),
                new Segment("work", 45, 22, 100),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 60, 22, 100),
                new Segment("recover", 120, 11, 80),
                new Segment("work", 45, 23, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 55, 22, 100),
                new Segment("recover", 97, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("recover", 41, 11, 80),
                new Segment("work", 10, 24, 110),
                new Segment("cool-down", 177, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Hardknott_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "hardknott-pass");
        Assert.Equal(
            [
                new Segment("warm-up", 240, 13, 80),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 120, 13, 90),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 120, 13, 90),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 150, 13, 88),
                new Segment("work", 120, 22, 80),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 90, 24, 80),
                new Segment("cool-down", 180, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Havana_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "havana-malecon");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 60, 21, 90),
                new Segment("recover", 60, 10, 80),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("work", 30, 24, 100),
                new Segment("recover", 120, 19, 90),
                new Segment("cool-down", 60, 11, 80),
            ],
            map.Plan.Segments);
    }

    [Fact]
    public async Task Hoover_preserves_every_original_stage()
    {
        var map = Assert.Single(await ReadMaps(), m => m.Id == "hoover-dam");
        Assert.Equal(
            [
                new Segment("warm-up", 120, 13, 80),
                new Segment("work", 180, 16, 85),
                new Segment("recover", 120, 13, 80),
                new Segment("work", 120, 21, 90),
                new Segment("recover", 60, 13, 80),
                new Segment("work", 180, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 120, 24, 100),
                new Segment("recover", 60, 11, 80),
                new Segment("work", 600, 19, 90),
                new Segment("cool-down", 180, 13, 80),
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
                new Listed("Col d'Aubisque", 12.6, 361, "Hard", "Cirque du Litor", "Pyrénées-Atlantiques, France"),
                new Listed("Sixth Street, Austin", 15.45, 0, "Moderate", "Sixth Street night crit", "Austin, Texas"),
                new Listed("Bathsheba, Barbados", 10.7, 31, "Easy", "East Coast Road", "Saint Joseph, Barbados"),
                new Listed("Bay of Islands Group Ride", 27.95, 59, "Moderate", "Northland bay road", "Northland, New Zealand"),
                new Listed("Beach Road, Melbourne", 19.613, 17, "Moderate", "Port Phillip Bay", "Victoria, Australia"),
                new Listed("Bealach na Bà", 9.05, 623, "Hard", "Applecross pass", "Wester Ross, Scotland"),
                new Listed("Big Sur", 14.075, 286, "Moderate", "Pacific Coast Highway", "California, USA"),
                new Listed("Blackpool Illuminations", 5.63, 3, "Moderate", "The Promenade", "Lancashire, England"),
                new Listed("Blue Mountains, Jamaica", 14.593, 752, "Hard", "The coffee road", "Jamaica"),
                new Listed("Blue Ridge Parkway", 24.25, 391, "Hard", "The Parkway", "Virginia and North Carolina, USA"),
                new Listed("Bondi to Bronte", 6.15, 95, "Moderate", "The coast walk", "Sydney, Australia"),
                new Listed("Bonneville Salt Flats", 8.25, 0, "Moderate", "Speed Week", "Wendover, Utah"),
                new Listed("Indianapolis Brickyard", 12, 0, "Moderate", "The front straight", "Indianapolis, Indiana"),
                new Listed("Brighton Pride", 13.075, 37, "Moderate", "Madeira Drive", "Brighton, England"),
                new Listed("Brooklyn Bridge Commute", 10.7, 117, "Moderate", "The Brooklyn Bridge", "Brooklyn and Lower Manhattan, New York"),
                new Listed("The Bund, Shanghai", 12.8325, 0, "Moderate", "The Bund promenade", "Shanghai, China"),
                new Listed("Sa Calobra, Mallorca", 11.851, 671, "Hard", "The Sa Calobra climb", "Mallorca, Spain"),
                new Listed("Passo Campolongo", 8.235, 307, "Hard", "The road from Corvara", "Alta Badia, Italy"),
                new Listed("Cabot Trail", 25.075, 584, "Hard", "The Cabot Trail", "Cape Breton, Nova Scotia"),
                new Listed("Caribana Parade", 6.555, 151, "Moderate", "Lake Shore Boulevard", "Toronto, Canada"),
                new Listed("Central Park Loop", 6.45, 46, "Moderate", "Park Drive", "Manhattan, New York"),
                new Listed("Cherry Blossom Festival, D.C.", 16.853, 14, "Easy", "The Tidal Basin loop", "Washington, D.C."),
                new Listed("Champs-Élysées Finale", 10.4625, 93, "Moderate", "The Champs-Élysées", "Paris, France"),
                new Listed("Chicago Loop Crit", 8.75, 21, "Moderate", "Wabash Avenue", "Chicago, Illinois"),
                new Listed("Chichén Itzá", 12.7, 18, "Moderate", "The sacbé", "Yucatán, Mexico"),
                new Listed("Lake Como", 12.4, 83, "Moderate", "The shore road", "The western shore of Lake Como"),
                new Listed("Comuna 13, Medellín", 13.58, 672, "Hard", "The escalator streets", "San Javier, Medellín"),
                new Listed("Coney Island Boardwalk", 8.475, 5, "Easy", "The boardwalk", "Brooklyn, New York"),
                new Listed("Copacabana Promenade", 4.3, 14, "Easy", "Avenida Atlântica", "Rio de Janeiro, Brazil"),
                new Listed("Copenhagen Cycle Superhighway", 13.65, 47, "Easy", "The Supercykelsti", "Copenhagen, Denmark"),
                new Listed("Cornish Harbour", 7.2, 120, "Moderate", "The harbour quay", "Cornwall, England"),
                new Listed("Cypress Mountain", 18.125, 797, "Hard", "Cypress Bowl Road", "West Vancouver, Canada"),
                new Listed("Yorkshire Dales", 24.047, 334, "Hard", "The Buttertubs", "North Yorkshire, England"),
                new Listed("Daytona Beach Sand", 8.375, 0, "Easy", "Tide Line", "Daytona Beach, Florida"),
                new Listed("Death Valley", 9.781, 40, "Easy", "Badwater Road", "Death Valley, California"),
                new Listed("Diwali, Marine Drive", 10.163, 4, "Easy", "Marine Drive", "Mumbai, India"),
                new Listed("Dubai Marina", 8.6, 3, "Moderate", "The marina walk", "Dubai Marina, United Arab Emirates"),
                new Listed("Edinburgh Fringe", 8.655, 90, "Moderate", "The Royal Mile", "Edinburgh, Scotland"),
                new Listed("Engadin Lakes", 24.625, 118, "Moderate", "The lakes road", "Upper Engadin, Switzerland"),
                new Listed("Mount Etna", 12.885, 798, "Hard", "The Sapienza road", "Mount Etna, Sicily"),
                new Listed("Fenland Time Trial", 15, 9, "Easy", "The drove road", "Cambridgeshire, England"),
                new Listed("Fish Hill, Cotswolds", 11.6, 245, "Hard", "The Broadway escarpment", "Worcestershire, England"),
                new Listed("Mount Fuji Road", 13.25, 855, "Hard", "The Subaru Line", "Yamanashi, Japan"),
                new Listed("Furka Pass", 20.025, 672, "Hard", "The Furka hairpins", "Valais, Switzerland"),
                new Listed("Col du Galibier", 26.05, 942, "Hard", "The pass road", "French Alps, France"),
                new Listed("Passo Gardena", 8.975, 506, "Hard", "The road from Selva", "South Tyrol, Italy"),
                new Listed("Ghent Six-Day", 4.575, 0, "Moderate", "The Kuipke", "Ghent, Belgium"),
                new Listed("Giza Plateau", 9.4, 57, "Moderate", "Plateau Road", "Giza, Egypt"),
                new Listed("Glasgow World Championships", 13.1, 91, "Hard", "George Square circuit", "Glasgow, Scotland"),
                new Listed("Glastonbury Fields", 10.515, 84, "Moderate", "The trackway", "Worthy Farm, Somerset"),
                new Listed("Golden Gate Park", 6.375, 20, "Moderate", "JFK Drive", "San Francisco, California"),
                new Listed("Grand Canyon South Rim", 13.425, 171, "Hard", "Desert View Drive", "Grand Canyon, Arizona"),
                new Listed("Great Ocean Road", 8.45, 126, "Moderate", "The Great Ocean Road", "Victoria, Australia"),
                new Listed("Han River Parks, Seoul", 8.71, 12, "Easy", "The riverside path", "Seoul, South Korea"),
                new Listed("Hardknott Pass", 10.3, 387, "Brutal", "The lane over the fells", "Lake District, England"),
                new Listed("Havana Malecón", 8.95, 8, "Easy", "Malecón", "Havana, Cuba"),
                new Listed("Hoover Dam", 13.175, 65, "Moderate", "The dam road", "Black Canyon, Nevada and Arizona"),
                new Listed("Iceland Ring Road", 12, 91, "Moderate", "Route 1", "The South Coast from Seljalandsfoss to Jökulsárlón"),
                new Listed("Independence Pass", 15.2, 897, "Brutal", "Highway 82", "The Roaring Fork and the Continental Divide, Colorado"),
                new Listed("Isle of Man Mountain Course", 8.133, 206, "Hard", "The Mountain Course", "The A18, the Bungalow and Creg-ny-Baa"),
                new Listed("Iten, Kenya", 17.86, 378, "Hard", "The red-dirt road", "Iten and the Kerio Valley, Kenya"),
                new Listed("Knicks Championship Parade", 7, 14, "Hard", "Canyon of Heroes", "Lower Broadway, New York City"),
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
                ("col-aubisque", null),
                ("sixth-street-austin", null),
                ("bathsheba-barbados", null),
                ("bay-of-islands", null),
                ("beach-road-melbourne", null),
                ("bealach-na-ba", null),
                ("big-sur", null),
                ("blackpool-illuminations", null),
                ("blue-mountains-jamaica", null),
                ("blue-ridge-parkway", null),
                ("bondi-to-bronte", null),
                ("bonneville-salt-flats", null),
                ("indianapolis-brickyard", null),
                ("brighton-pride", null),
                ("brooklyn-bridge-commute", null),
                ("the-bund-shanghai", null),
                ("sa-calobra-mallorca", null),
                ("passo-campolongo", null),
                ("cabot-trail", null),
                ("caribana-parade", null),
                ("central-park-loop", null),
                ("cherry-blossom-festival-dc", null),
                ("champs-elysees-finale", null),
                ("chicago-loop-crit", null),
                ("chichen-itza", null),
                ("lake-como", null),
                ("comuna-13-medellin", null),
                ("coney-island-boardwalk", null),
                ("copacabana-promenade", null),
                ("copenhagen-cycle-superhighway", null),
                ("cornish-harbour", null),
                ("cypress-mountain", null),
                ("yorkshire-dales", null),
                ("daytona-beach-sand", null),
                ("death-valley", null),
                ("diwali-marine-drive", null),
                ("dubai-marina", null),
                ("edinburgh-fringe", null),
                ("engadin-lakes", null),
                ("mount-etna", null),
                ("fenland-time-trial", null),
                ("fish-hill-cotswolds", null),
                ("mount-fuji-road", null),
                ("furka-pass", null),
                ("col-du-galibier", null),
                ("passo-gardena", null),
                ("ghent-six-day", null),
                ("giza-plateau", null),
                ("glasgow-world-championships", null),
                ("glastonbury-fields", null),
                ("golden-gate-park", null),
                ("grand-canyon-south-rim", null),
                ("great-ocean-road", null),
                ("han-river-parks", null),
                ("hardknott-pass", null),
                ("havana-malecon", null),
                ("hoover-dam", null),
                ("iceland-ring-road", null),
                ("independence-pass", null),
                ("isle-of-man-mountain-course", null),
                ("iten-kenya", null),
                ("knicks-championship-parade", null),
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
                ("col-aubisque", null),
                ("sixth-street-austin", null),
                ("bathsheba-barbados", null),
                ("bay-of-islands", null),
                ("beach-road-melbourne", null),
                ("bealach-na-ba", null),
                ("big-sur", null),
                ("blackpool-illuminations", null),
                ("blue-mountains-jamaica", null),
                ("blue-ridge-parkway", null),
                ("bondi-to-bronte", null),
                ("bonneville-salt-flats", null),
                ("indianapolis-brickyard", null),
                ("brighton-pride", null),
                ("brooklyn-bridge-commute", null),
                ("the-bund-shanghai", null),
                ("sa-calobra-mallorca", null),
                ("passo-campolongo", null),
                ("cabot-trail", null),
                ("caribana-parade", null),
                ("central-park-loop", null),
                ("cherry-blossom-festival-dc", null),
                ("champs-elysees-finale", null),
                ("chicago-loop-crit", null),
                ("chichen-itza", null),
                ("lake-como", null),
                ("comuna-13-medellin", null),
                ("coney-island-boardwalk", null),
                ("copacabana-promenade", null),
                ("copenhagen-cycle-superhighway", null),
                ("cornish-harbour", null),
                ("cypress-mountain", null),
                ("yorkshire-dales", null),
                ("daytona-beach-sand", null),
                ("death-valley", null),
                ("diwali-marine-drive", null),
                ("dubai-marina", null),
                ("edinburgh-fringe", null),
                ("engadin-lakes", null),
                ("mount-etna", null),
                ("fenland-time-trial", null),
                ("fish-hill-cotswolds", null),
                ("mount-fuji-road", null),
                ("furka-pass", null),
                ("col-du-galibier", null),
                ("passo-gardena", null),
                ("ghent-six-day", null),
                ("giza-plateau", null),
                ("glasgow-world-championships", null),
                ("glastonbury-fields", null),
                ("golden-gate-park", null),
                ("grand-canyon-south-rim", null),
                ("great-ocean-road", null),
                ("han-river-parks", null),
                ("hardknott-pass", null),
                ("havana-malecon", null),
                ("hoover-dam", null),
                ("iceland-ring-road", null),
                ("independence-pass", null),
                ("isle-of-man-mountain-course", null),
                ("iten-kenya", null),
                ("knicks-championship-parade", null),
            ],
            maps.Select(m => (m.Id, m.UnlockMapId)));
    }

    [Fact]
    public async Task A_level_goal_names_its_level_and_no_other_goal_does() // L2-033 AC4
    {
        var maps = await ReadMaps();

        var levelMap = Assert.Single(maps, m => m.UnlockLevel.HasValue);
        Assert.Equal("vice-city", levelMap.Id);
        Assert.Equal(10, levelMap.UnlockLevel);
    }

    [Fact]
    public async Task Every_map_carries_its_plan_and_its_worlds_terrain()
    {
        var maps = await ReadMaps();

        // A course rides the plan of the class it is modelled after (L2-166); every other map rides 30:00.
        Assert.All(
            maps,
            m => Assert.Equal(
                m.Id switch { "ibiza-sunset-strip" => 1200, "sella-ronda" => 1680, "cinqueterre" => 2400, "haleakala" => 2100, "havana-malecon" => 1200, "hardknott-pass" => 1500, "han-river-parks" => 1240, "great-ocean-road" => 1200, "grand-canyon-south-rim" => 1800, "golden-gate-park" => 900, "glastonbury-fields" => 1500, "glasgow-world-championships" => 1800, "giza-plateau" => 1380, "ghent-six-day" => 600, "passo-gardena" => 1200, "col-du-galibier" => 3600, "furka-pass" => 2700, "mount-fuji-road" => 1800, "fish-hill-cotswolds" => 1800, "fenland-time-trial" => 2100, "mount-etna" => 1800, "engadin-lakes" => 3600, "edinburgh-fringe" => 1200, "dubai-marina" => 1200, "diwali-marine-drive" => 1505, "death-valley" => 1380, "daytona-beach-sand" => 1200, "yorkshire-dales" => 3168, "cypress-mountain" => 2580, "cornish-harbour" => 1020, "copenhagen-cycle-superhighway" => 1920, "copacabana-promenade" => 600, "coney-island-boardwalk" => 1140, "comuna-13-medellin" => 1850, "lake-como" => 1800, "chichen-itza" => 1800, "chicago-loop-crit" => 1200, "champs-elysees-finale" => 1500, "cherry-blossom-festival-dc" => 2400, "central-park-loop" => 900, "caribana-parade" => 900, "cabot-trail" => 3600, "passo-campolongo" => 1310, "sa-calobra-mallorca" => 1830, "the-bund-shanghai" => 1803, "brooklyn-bridge-commute" => 1500, "brighton-pride" => 1800, "bonneville-salt-flats" => 1200, "bondi-to-bronte" => 810, "blue-ridge-parkway" => 3300, "blue-mountains-jamaica" => 2100, "blackpool-illuminations" => 840, "big-sur" => 1800, "bealach-na-ba" => 1320, "beach-road-melbourne" => 2750, "bay-of-islands" => 3680, "bathsheba-barbados" => 1500, "sixth-street-austin" => 2020, "col-aubisque" => 1980, "atacama-desert" => 3000, "philadelphia-art-museum" => 1180, "arenberg-forest" => 1500, "antwerp-port-sprint" => 3000, "alto-angliru" => 2400, "angkor-temples" => 3540, "els-angels" => 2400, "amsterdam-canals" => 1200, "alpe-dhuez" => 1200, "algarve-cliffs" => 2400, "independence-pass" => 2100, "isle-of-man-mountain-course" => 1200, "iten-kenya" => 2400, "knicks-championship-parade" => 1020, _ => 1800 },
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
            ["prairie", "oldtown", "coast", "docklands", "dolomites", "vicecity", "granite", "ibiza", "sellaronda", "cinqueterre", "haleakala", "adelaide", "aguascalientes", "algarve", "alpe", "amsterdam", "angels", "angkor", "angliru", "antwerp", "arenberg", "artmuseum", "atacama", "atlanticroad", "aubisque", "austin", "bathsheba", "bayofislands", "beachroad", "bealach", "bigsur", "blackpool", "bluemountains", "blueridge", "bondi", "bonneville", "brickyard", "brighton", "brooklyn", "bund", "calobra", "campolongo", "cabot", "caribana", "centralpark", "cherryblossom", "champs", "chicago", "chichen", "como", "comuna13", "coney", "copacabana", "copenhagen", "cornwall", "cypress", "dales", "daytona", "deathvalley", "diwali", "dubai", "edinburgh", "engadin", "etna", "fens", "fishhill", "fuji", "furka", "galibier", "gardena", "ghent", "giza", "glasgow", "glastonbury", "goldengate", "grandcanyon", "greatocean", "hanriver", "hardknott", "havana", "hoover", "iceland", "independence", "isleofman", "iten", "knicks"],
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
