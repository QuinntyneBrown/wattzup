// Acceptance test
// Traces to: L2-040 AC1, L2-041 AC1, AC2, AC3, L2-039 AC1
// Description: GET /api/progress answers the rider's maps: those open, in unlock order, the next unlock, and the stars
// held and best time on each map ridden. A new rider has Prairie Paceline and Old Town Criterium open and Cliffside
// Coast next; a top-3 bots race on Old Town Criterium opens Neon Docklands and leaves its stars and best. The mid
// rider's next unlock is Neon Docklands; the veteran's is Col du Granit.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;
using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Api.Tests;

public sealed class MapStandingTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private static readonly string[] Fields = ["openMapIds", "nextUnlockId", "stars", "bestTimeSeconds"];

    /// <summary>Signs in a new rider; each opened map given is opened on their progress with its stars and best.</summary>
    private async Task<HttpClient> SignedIn(string email, params (string MapId, MapStar Stars, int? Best)[] opened)
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
        foreach (var (mapId, stars, best) in opened)
        {
            var progress = MapProgress.Start(riderId, mapId);
            progress.Restore(stars, best);
            progress.Open(api.Clock.GetUtcNow());
            db.MapProgress.Add(progress);
        }
        await db.SaveChangesAsync(Cancel);
        return browser;
    }

    /// <summary>The maps part of the rider's progress, each field as <c>name=JSON</c>, joined by <c>;</c>.</summary>
    private static async Task<string> Maps(HttpClient browser)
    {
        using var response = await browser.GetAsync("/api/progress", Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.True(response.IsSuccessStatusCode, body.GetRawText());
        return string.Join(";", Fields.Select(name => $"{name}={body.GetProperty(name).GetRawText()}"));
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_new_rider_has_three_maps_open_and_a_top_three_race_opens_a_fourth() // L2-040 AC1, AC2, L2-041 AC1
    {
        using var browser = await SignedIn("ivy.maps@example.com");
        Assert.Equal(
            """openMapIds=["prairie-paceline","old-town-criterium","ibiza-sunset-strip","sella-ronda","cinqueterre","haleakala","adelaide-hills","aguascalientes","algarve-cliffs","alpe-dhuez","amsterdam-canals","els-angels","angkor-temples","alto-angliru","antwerp-port-sprint","arenberg-forest","philadelphia-art-museum","atacama-desert","atlantic-ocean-road","col-aubisque","sixth-street-austin","bathsheba-barbados","bay-of-islands","beach-road-melbourne","bealach-na-ba","big-sur","blackpool-illuminations","blue-mountains-jamaica","blue-ridge-parkway","bondi-to-bronte","bonneville-salt-flats","indianapolis-brickyard","brighton-pride","brooklyn-bridge-commute","the-bund-shanghai","sa-calobra-mallorca","passo-campolongo","cabot-trail","caribana-parade","central-park-loop","cherry-blossom-festival-dc","champs-elysees-finale","chicago-loop-crit","chichen-itza","lake-como","comuna-13-medellin","coney-island-boardwalk","copacabana-promenade","copenhagen-cycle-superhighway","cornish-harbour","cypress-mountain","yorkshire-dales","daytona-beach-sand","death-valley","diwali-marine-drive","dubai-marina","edinburgh-fringe","engadin-lakes","mount-etna","fenland-time-trial","fish-hill-cotswolds","mount-fuji-road","furka-pass","col-du-galibier","passo-gardena","ghent-six-day","giza-plateau","glasgow-world-championships","glastonbury-fields","golden-gate-park","grand-canyon-south-rim","great-ocean-road","han-river-parks","hardknott-pass","havana-malecon","hoover-dam","iceland-ring-road","independence-pass","isle-of-man-mountain-course","iten-kenya","serpentine-hyde-park"];nextUnlockId="cliffside-coast";stars={};bestTimeSeconds={}""",
            await Maps(browser));

        using var _ = await browser.PostAsJsonAsync("/api/rides", RideBodies.RaceIn(Guid.NewGuid(), 1800), Cancel);

        Assert.Equal(
            """openMapIds=["prairie-paceline","old-town-criterium","neon-docklands","ibiza-sunset-strip","sella-ronda","cinqueterre","haleakala","adelaide-hills","aguascalientes","algarve-cliffs","alpe-dhuez","amsterdam-canals","els-angels","angkor-temples","alto-angliru","antwerp-port-sprint","arenberg-forest","philadelphia-art-museum","atacama-desert","atlantic-ocean-road","col-aubisque","sixth-street-austin","bathsheba-barbados","bay-of-islands","beach-road-melbourne","bealach-na-ba","big-sur","blackpool-illuminations","blue-mountains-jamaica","blue-ridge-parkway","bondi-to-bronte","bonneville-salt-flats","indianapolis-brickyard","brighton-pride","brooklyn-bridge-commute","the-bund-shanghai","sa-calobra-mallorca","passo-campolongo","cabot-trail","caribana-parade","central-park-loop","cherry-blossom-festival-dc","champs-elysees-finale","chicago-loop-crit","chichen-itza","lake-como","comuna-13-medellin","coney-island-boardwalk","copacabana-promenade","copenhagen-cycle-superhighway","cornish-harbour","cypress-mountain","yorkshire-dales","daytona-beach-sand","death-valley","diwali-marine-drive","dubai-marina","edinburgh-fringe","engadin-lakes","mount-etna","fenland-time-trial","fish-hill-cotswolds","mount-fuji-road","furka-pass","col-du-galibier","passo-gardena","ghent-six-day","giza-plateau","glasgow-world-championships","glastonbury-fields","golden-gate-park","grand-canyon-south-rim","great-ocean-road","han-river-parks","hardknott-pass","havana-malecon","hoover-dam","iceland-ring-road","independence-pass","isle-of-man-mountain-course","iten-kenya","serpentine-hyde-park"];nextUnlockId="cliffside-coast";stars={"old-town-criterium":2};bestTimeSeconds={"old-town-criterium":1800}""",
            await Maps(browser));
    }

    [Fact]
    public async Task The_mid_riders_next_unlock_is_Neon_Docklands() // L2-041 AC2
    {
        using var browser = await SignedIn("ivy.mid@example.com", ("cliffside-coast", MapStar.Finish, 2140));

        Assert.Contains("nextUnlockId=\"neon-docklands\"", await Maps(browser));
    }

    [Fact]
    public async Task The_veterans_next_unlock_is_Col_du_Granit() // L2-041 AC3
    {
        using var browser = await SignedIn(
            "ivy.veteran@example.com",
            ("cliffside-coast", MapStar.All, 1735),
            ("neon-docklands", MapStar.All, 3160),
            ("dolomites", MapStar.Finish | MapStar.TopThree, 1992),
            ("vice-city", MapStar.Finish | MapStar.TopThree, 4280));

        Assert.Contains("nextUnlockId=\"col-du-granit\"", await Maps(browser));
    }
}
