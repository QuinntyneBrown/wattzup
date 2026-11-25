// Acceptance test
// Traces to: L2-033 AC2, AC3, AC4, AC5; L2-036 AC1, AC2, AC3
// Description: GET /api/progress answers the map Home's Next ride card offers and the map a ride opened that Home has
// not announced yet. A new rider is offered Prairie Paceline; a top-3 bots race on Old Town Criterium opens Neon
// Docklands, which stays unannounced until POST /api/progress/unlocks/neon-docklands/seen, and the card still offers
// Prairie Paceline. The mid rider is offered Old Town Criterium; with a level goal next, the most recently opened map;
// with every map open, the one with the fewest stars. Marking a map that is not open seen is 404 unlock_not_found.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Api.Tests;

public sealed class NextRideTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    /// <summary>
    /// Signs in a new rider. Each map given holds its stars; a map not open from the start is opened, one hour after the
    /// one before, in the order given.
    /// </summary>
    private async Task<HttpClient> SignedIn(string email, params (string MapId, MapStar Stars)[] maps)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
        });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var riderId = Guid.Parse(JsonDocument.Parse(await confirmed.Content.ReadAsStringAsync(Cancel))
            .RootElement.GetProperty("riderId").GetString()!);
        using var scope = api.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        foreach (var (mapId, stars) in maps)
        {
            var progress = MapProgress.Start(riderId, mapId);
            progress.Restore(stars, null);
            if (mapId is not ("prairie-paceline" or "old-town-criterium" or "ibiza-sunset-strip" or "sella-ronda" or "cinqueterre" or "haleakala" or "arenberg-forest"))
            {
                api.Clock.Advance(TimeSpan.FromHours(1));
                progress.Open(api.Clock.GetUtcNow());
            }
            db.MapProgress.Add(progress);
        }
        await db.SaveChangesAsync(Cancel);
        return browser;
    }

    /// <summary>The rider's next ride and unannounced unlock, as <c>nextRideMapId=JSON;unseenUnlockId=JSON</c>.</summary>
    private static async Task<string> Home(HttpClient browser)
    {
        using var response = await browser.GetAsync("/api/progress", Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.True(response.IsSuccessStatusCode, body.GetRawText());
        return $"nextRideMapId={Field(body, "nextRideMapId")};unseenUnlockId={Field(body, "unseenUnlockId")}";
    }

    private static string Field(JsonElement body, string name) =>
        body.TryGetProperty(name, out var value) ? value.GetRawText() : "absent";

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_ride_that_opens_a_map_leaves_it_unannounced_until_Home_marks_it_seen() // L2-033 AC3, L2-036
    {
        using var browser = await SignedIn("noor.home@example.com");
        Assert.Equal("""nextRideMapId="prairie-paceline";unseenUnlockId=null""", await Home(browser));

        using var _ = await browser.PostAsJsonAsync("/api/rides", RideBodies.RaceIn(Guid.NewGuid(), 1800), Cancel);
        Assert.Equal("nextRideMapId=\"prairie-paceline\";unseenUnlockId=\"neon-docklands\"", await Home(browser));

        using var seen = await browser.PostAsync("/api/progress/unlocks/neon-docklands/seen", null, Cancel);
        Assert.Equal(HttpStatusCode.NoContent, seen.StatusCode);
        Assert.Equal("""nextRideMapId="prairie-paceline";unseenUnlockId=null""", await Home(browser));
    }

    [Fact]
    public async Task The_mid_rider_is_offered_Old_Town_Criterium() // L2-033 AC2
    {
        using var browser = await SignedIn("noor.mid@example.com", ("cliffside-coast", MapStar.Finish));

        Assert.StartsWith("""nextRideMapId="old-town-criterium";""", await Home(browser));
    }

    [Fact]
    public async Task With_a_level_goal_next_the_most_recently_opened_map_is_offered() // L2-033 AC4
    {
        using var browser = await SignedIn(
            "noor.level@example.com",
            ("cliffside-coast", MapStar.All),
            ("dolomites", MapStar.Finish),
            ("neon-docklands", MapStar.Finish));

        Assert.StartsWith("""nextRideMapId="neon-docklands";""", await Home(browser));
    }

    [Fact]
    public async Task With_every_map_open_the_map_with_the_fewest_stars_is_offered() // L2-033 AC5
    {
        using var browser = await SignedIn(
            "noor.all@example.com",
            ("prairie-paceline", MapStar.All),
            ("old-town-criterium", MapStar.All),
            ("cliffside-coast", MapStar.All),
            ("neon-docklands", MapStar.Finish | MapStar.TopThree),
            ("dolomites", MapStar.Finish),
            ("vice-city", MapStar.Finish),
            ("col-du-granit", MapStar.All),
            ("ibiza-sunset-strip", MapStar.All),
            ("sella-ronda", MapStar.All),
            ("cinqueterre", MapStar.All),
            ("haleakala", MapStar.All),
            ("arenberg-forest", MapStar.All));

        Assert.StartsWith("""nextRideMapId="dolomites";""", await Home(browser));
    }

    [Fact]
    public async Task Marking_a_map_that_is_not_open_seen_is_404_unlock_not_found() // L2-036 AC3
    {
        using var browser = await SignedIn("noor.closed@example.com");

        using var response = await browser.PostAsync("/api/progress/unlocks/dolomites/seen", null, Cancel);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(Cancel);
        Assert.Equal("unlock_not_found", problem.GetProperty("code").GetString());
    }
}
