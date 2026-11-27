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
            if (mapId is not ("prairie-paceline" or "old-town-criterium" or "ibiza-sunset-strip" or "sella-ronda" or "cinqueterre" or "haleakala" or "adelaide-hills" or "aguascalientes" or "algarve-cliffs" or "alpe-dhuez" or "amsterdam-canals" or "els-angels" or "angkor-temples" or "alto-angliru" or "antwerp-port-sprint" or "arenberg-forest" or "philadelphia-art-museum" or "atacama-desert" or "atlantic-ocean-road" or "col-aubisque" or "sixth-street-austin" or "bathsheba-barbados" or "bay-of-islands" or "beach-road-melbourne" or "bealach-na-ba" or "big-sur" or "blackpool-illuminations" or "blue-mountains-jamaica" or "blue-ridge-parkway" or "bondi-to-bronte" or "bonneville-salt-flats" or "indianapolis-brickyard" or "brighton-pride" or "brooklyn-bridge-commute" or "the-bund-shanghai" or "sa-calobra-mallorca" or "passo-campolongo" or "cabot-trail" or "caribana-parade" or "central-park-loop" or "cherry-blossom-festival-dc" or "champs-elysees-finale" or "chicago-loop-crit" or "chichen-itza" or "lake-como" or "comuna-13-medellin" or "coney-island-boardwalk" or "copacabana-promenade" or "copenhagen-cycle-superhighway" or "cornish-harbour" or "cypress-mountain" or "yorkshire-dales" or "daytona-beach-sand" or "death-valley" or "diwali-marine-drive" or "dubai-marina" or "edinburgh-fringe" or "engadin-lakes" or "mount-etna" or "fenland-time-trial" or "fish-hill-cotswolds" or "mount-fuji-road" or "furka-pass" or "col-du-galibier" or "passo-gardena" or "ghent-six-day" or "giza-plateau" or "glasgow-world-championships" or "glastonbury-fields" or "golden-gate-park" or "grand-canyon-south-rim" or "great-ocean-road" or "han-river-parks" or "hardknott-pass" or "havana-malecon" or "hoover-dam" or "iceland-ring-road" or "independence-pass" or "isle-of-man-mountain-course" or "iten-kenya" or "holi-in-jaipur" or "trinidad-jouvert" or "joshua-tree" or "junkanoo-nassau" or "kilauea-lava-road" or "knicks-championship-parade" or "kona-ironman" or "koppenberg-cobbles" or "oude-kwaremont" or "kyoto-hanami" or "chicago-lakefront-trail" or "lake-louise" or "alto-de-letras" or "lisbon-tram-hills" or "loire-chateaux" or "machu-picchu-road" or "marina-bay-night" or "marrakech-medina" or "mardi-gras-new-orleans" or "mauna-kea" or "la-merce-barcelona" or "miami-neon-nights" or "moab-slickrock" or "monaco-street-circuit" or "montmartre" or "montreal-jazz-fest" or "mont-royal" or "mount-washington-auto-road" or "dia-de-muertos-parade" or "mulholland-drive" or "mur-de-huy" or "napa-vineyards" or "north-shore-oahu" or "notting-hill-carnival" or "avenida-9-de-julio" or "okinawa-coast-road" or "oktoberfest-munich" or "oregon-coast" or "outback-highway" or "overseas-highway" or "torres-del-paine" or "the-palouse" or "san-fermin-pamplona" or "ffordd-pen-llech" or "pike-place-at-dawn" or "playground-park-loop" or "prague-old-town" or "the-poggio" or "prospect-park" or "provence-lavender" or "andalusian-white-villages" or "old-quebec" or "la-redoute" or "rome-colosseum-loop" or "route-66-desert" or "saguaro-desert" or "rio-sambadrome" or "santa-monica-pier" or "sea-point-cape-town" or "passo-sella" or "serpentine-hyde-park" or "seven-sisters-cliffs" or "san-francisco-hills" or "shibuya-crossing" or "silverstone-track-day" or "isle-of-skye-fog" or "songkran-bangkok" or "south-beach-sunrise" or "calgary-stampede" or "stanley-park-seawall" or "great-st-bernard-pass" or "stelvio-pass" or "mongolian-steppe" or "st-patricks-day-dublin" or "strade-bianche" or "strasbourg-christmas-market" or "suburban-sunrise" or "surfers-paradise" or "sydney-harbour-fireworks" or "mount-teide" or "mount-tamalpais" or "lake-tahoe" or "tel-aviv-promenade" or "tempelhof-field" or "teotihuacan" or "times-square-new-years-eve" or "toronto-waterfront-trail" or "tremola-gotthard-pass" or "col-du-tourmalet" or "trollstigen" or "dutch-tulip-fields"))
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
            ("adelaide-hills", MapStar.All),
            ("aguascalientes", MapStar.All),
            ("algarve-cliffs", MapStar.All),
            ("alpe-dhuez", MapStar.All),
            ("amsterdam-canals", MapStar.All),
            ("els-angels", MapStar.All),
            ("angkor-temples", MapStar.All),
            ("alto-angliru", MapStar.All),
            ("antwerp-port-sprint", MapStar.All),
            ("arenberg-forest", MapStar.All),
            ("philadelphia-art-museum", MapStar.All),
            ("atacama-desert", MapStar.All),
            ("atlantic-ocean-road", MapStar.All),
            ("col-aubisque", MapStar.All),
            ("sixth-street-austin", MapStar.All),
            ("bathsheba-barbados", MapStar.All),
            ("bay-of-islands", MapStar.All),
            ("beach-road-melbourne", MapStar.All),
            ("bealach-na-ba", MapStar.All),
            ("big-sur", MapStar.All),
            ("blackpool-illuminations", MapStar.All),
            ("blue-mountains-jamaica", MapStar.All),
            ("blue-ridge-parkway", MapStar.All),
            ("bondi-to-bronte", MapStar.All),
            ("bonneville-salt-flats", MapStar.All),
            ("indianapolis-brickyard", MapStar.All),
            ("brighton-pride", MapStar.All),
            ("brooklyn-bridge-commute", MapStar.All),
            ("the-bund-shanghai", MapStar.All),
            ("sa-calobra-mallorca", MapStar.All),
            ("passo-campolongo", MapStar.All),
            ("cabot-trail", MapStar.All),
            ("caribana-parade", MapStar.All),
            ("central-park-loop", MapStar.All),
            ("cherry-blossom-festival-dc", MapStar.All),
            ("champs-elysees-finale", MapStar.All),
            ("chicago-loop-crit", MapStar.All),
            ("chichen-itza", MapStar.All),
            ("lake-como", MapStar.All),
            ("comuna-13-medellin", MapStar.All),
            ("coney-island-boardwalk", MapStar.All),
            ("copacabana-promenade", MapStar.All),
            ("copenhagen-cycle-superhighway", MapStar.All),
            ("cornish-harbour", MapStar.All),
            ("cypress-mountain", MapStar.All),
            ("yorkshire-dales", MapStar.All),
            ("daytona-beach-sand", MapStar.All),
            ("death-valley", MapStar.All),
            ("diwali-marine-drive", MapStar.All),
            ("dubai-marina", MapStar.All),
            ("edinburgh-fringe", MapStar.All),
            ("engadin-lakes", MapStar.All),
            ("mount-etna", MapStar.All),
            ("fenland-time-trial", MapStar.All),
            ("fish-hill-cotswolds", MapStar.All),
            ("mount-fuji-road", MapStar.All),
            ("furka-pass", MapStar.All),
            ("col-du-galibier", MapStar.All),
            ("passo-gardena", MapStar.All),
            ("ghent-six-day", MapStar.All),
            ("giza-plateau", MapStar.All),
            ("glasgow-world-championships", MapStar.All),
            ("glastonbury-fields", MapStar.All),
            ("golden-gate-park", MapStar.All),
            ("grand-canyon-south-rim", MapStar.All),
            ("great-ocean-road", MapStar.All),
            ("han-river-parks", MapStar.All),
            ("hardknott-pass", MapStar.All),
            ("havana-malecon", MapStar.All),
            ("hoover-dam", MapStar.All),
            ("iceland-ring-road", MapStar.All),
            ("independence-pass", MapStar.All),
            ("isle-of-man-mountain-course", MapStar.All),
            ("iten-kenya", MapStar.All),
            ("holi-in-jaipur", MapStar.All),
            ("trinidad-jouvert", MapStar.All),
            ("joshua-tree", MapStar.All),
            ("junkanoo-nassau", MapStar.All),
            ("kilauea-lava-road", MapStar.All),
            ("knicks-championship-parade", MapStar.All),
            ("kona-ironman", MapStar.All),
            ("koppenberg-cobbles", MapStar.All),
            ("oude-kwaremont", MapStar.All),
            ("kyoto-hanami", MapStar.All),
            ("chicago-lakefront-trail", MapStar.All),
            ("lake-louise", MapStar.All),
            ("alto-de-letras", MapStar.All),
            ("lisbon-tram-hills", MapStar.All),
            ("loire-chateaux", MapStar.All),
            ("machu-picchu-road", MapStar.All),
            ("marina-bay-night", MapStar.All),
            ("marrakech-medina", MapStar.All),
            ("mardi-gras-new-orleans", MapStar.All),
            ("mauna-kea", MapStar.All),
            ("la-merce-barcelona", MapStar.All),
            ("miami-neon-nights", MapStar.All),
            ("moab-slickrock", MapStar.All),
            ("monaco-street-circuit", MapStar.All),
            ("montmartre", MapStar.All),
            ("montreal-jazz-fest", MapStar.All),
            ("mont-royal", MapStar.All),
            ("mount-washington-auto-road", MapStar.All),
            ("dia-de-muertos-parade", MapStar.All),
            ("mulholland-drive", MapStar.All),
            ("mur-de-huy", MapStar.All),
            ("napa-vineyards", MapStar.All),
            ("north-shore-oahu", MapStar.All),
            ("notting-hill-carnival", MapStar.All),
            ("avenida-9-de-julio", MapStar.All),
            ("okinawa-coast-road", MapStar.All),
            ("oktoberfest-munich", MapStar.All),
            ("oregon-coast", MapStar.All),
            ("outback-highway", MapStar.All),
            ("overseas-highway", MapStar.All),
            ("torres-del-paine", MapStar.All),
            ("the-palouse", MapStar.All),
            ("san-fermin-pamplona", MapStar.All),
            ("ffordd-pen-llech", MapStar.All),
            ("pike-place-at-dawn", MapStar.All),
            ("playground-park-loop", MapStar.All),
            ("prague-old-town", MapStar.All),
            ("the-poggio", MapStar.All),
            ("prospect-park", MapStar.All),
            ("provence-lavender", MapStar.All),
            ("andalusian-white-villages", MapStar.All),
            ("old-quebec", MapStar.All),
            ("la-redoute", MapStar.All),
            ("rome-colosseum-loop", MapStar.All),
            ("route-66-desert", MapStar.All),
            ("saguaro-desert", MapStar.All),
            ("rio-sambadrome", MapStar.All),
            ("santa-monica-pier", MapStar.All),
            ("sea-point-cape-town", MapStar.All),
            ("passo-sella", MapStar.All),
            ("serpentine-hyde-park", MapStar.All),
            ("seven-sisters-cliffs", MapStar.All),
            ("san-francisco-hills", MapStar.All),
            ("shibuya-crossing", MapStar.All),
            ("silverstone-track-day", MapStar.All),
            ("isle-of-skye-fog", MapStar.All),
            ("songkran-bangkok", MapStar.All),
            ("south-beach-sunrise", MapStar.All),
            ("calgary-stampede", MapStar.All),
            ("stanley-park-seawall", MapStar.All),
            ("great-st-bernard-pass", MapStar.All),
            ("stelvio-pass", MapStar.All),
            ("mongolian-steppe", MapStar.All),
            ("st-patricks-day-dublin", MapStar.All),
            ("strade-bianche", MapStar.All),
            ("strasbourg-christmas-market", MapStar.All),
            ("suburban-sunrise", MapStar.All),
            ("surfers-paradise", MapStar.All),
            ("sydney-harbour-fireworks", MapStar.All),
            ("mount-teide", MapStar.All),
            ("mount-tamalpais", MapStar.All),
            ("lake-tahoe", MapStar.All),
            ("tel-aviv-promenade", MapStar.All),
            ("tempelhof-field", MapStar.All),
            ("teotihuacan", MapStar.All),
            ("times-square-new-years-eve", MapStar.All),
            ("toronto-waterfront-trail", MapStar.All),
            ("tremola-gotthard-pass", MapStar.All),
            ("col-du-tourmalet", MapStar.All),
            ("trollstigen", MapStar.All),
            ("dutch-tulip-fields", MapStar.All));

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
