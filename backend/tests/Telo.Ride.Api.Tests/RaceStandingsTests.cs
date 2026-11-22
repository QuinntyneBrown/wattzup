// Acceptance test
// Traces to: L2-123 AC1, AC2, AC3, AC4
// Description: once a riders-online race starts, each rider reports the distance they have ridden and their power;
// the service moves the bots seated at 10 seconds to the start on the pace model around the medium pack, at the
// virtual speed of their power, ranks every rider by distance, and sends the same race standings to every rider in the
// session once a second: position, seat, name, jersey, level, kind, distance and the gap to the leader in seconds. A
// report less than 500 ms after the rider's previous one is ignored. Real sign-ins give each rider a session cookie,
// which a real SignalR client carries to the API hosted in memory; the fake clock drives the ticker.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Telo.Ride.Domain.Bots;

namespace Telo.Ride.Api.Tests;

public sealed class RaceStandingsTests(RaceStandingsApi api) : IClassFixture<RaceStandingsApi>, IAsyncDisposable
{
    private const string Map = "old-town-criterium";
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(10);
    private static readonly string[] Pacers = ["Pacer Nova", "Pacer Rook", "Pacer Juno", "Pacer Atlas", "Pacer Kite", "Pacer Vale", "Pacer Moss", "Pacer Flint", "Pacer Echo"];

    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];
    private int riders;

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Every_rider_receives_the_standings_ranked_by_the_distance_reported_with_each_gap_to_the_leader_in_seconds()
    {
        var lena = await Rider("lena.k");
        var marco = await Rider("MarcoVelo");
        var race = await Find(lena);
        await Find(marco);
        var lenaHears = Listen(lena);
        var marcoHears = Listen(marco);
        await Start(lena, race);

        await Report(lena, race.SessionId!, 100, 320);
        api.Clock.Advance(TimeSpan.FromSeconds(1));

        var standings = await lenaHears.Await(s => s.SessionId == race.SessionId && s.Rows[0].DistanceMetres == 100, Wait);
        Assert.Equal(standings.Rows, (await marcoHears.Await(s => s.SessionId == race.SessionId && s.Rows[0].DistanceMetres == 100, Wait)).Rows);
        Assert.Equal(Enumerable.Range(1, 10), standings.Rows.Select(row => row.Position));
        Assert.Equal((1, 1, "lena.k", "lena", (int?)1, "person", 0.0), Describe(standings.Rows[0]));
        Assert.Equal((10, 2, "MarcoVelo", "marco", (int?)1, "person", 2.0), Describe(standings.Rows[9]));
        Assert.Equal(0, standings.Rows[9].DistanceMetres);
        var bots = standings.Rows.Skip(1).Take(8).ToList();
        Assert.All(bots, row => Assert.Equal(("bot", (int?)null), (row.Kind, row.Level)));
        Assert.Subset(Pacers.ToHashSet(), bots.Select(row => row.Name).ToHashSet());
        Assert.All(bots, row => Assert.InRange(row.GapSeconds, 0.1, 1.9));
        Assert.Equal(bots.OrderByDescending(row => row.DistanceMetres).Select(row => row.Name), bots.Select(row => row.Name));
    }

    [Fact]
    public async Task The_bots_ride_the_pace_model_around_the_medium_pack_at_the_virtual_speed_of_their_power()
    {
        var jwatts = await Rider("jwatts");
        var race = await Find(jwatts);
        var heard = Listen(jwatts);
        await Start(jwatts, race);

        api.Clock.Advance(TimeSpan.FromSeconds(59));

        var standings = await heard.Await(s => s.SessionId == race.SessionId && s.Rows.Any(row => row.DistanceMetres > 300), Wait);
        foreach (var pace in BotPaceModel.Paces(race.SessionId!, "medium"))
        {
            var metres = Enumerable.Range(0, 60).Sum(second => VirtualSpeedModel.SpeedMs(BotPaceModel.Watts(pace, second)));
            Assert.Equal(Math.Round(metres, 2), standings.Rows.Single(row => row.Name == $"Pacer {pace.Name}").DistanceMetres, 2);
        }
    }

    [Fact]
    public async Task A_report_less_than_half_a_second_after_the_last_is_ignored()
    {
        var priya = await Rider("priya_spins");
        var race = await Find(priya);
        var heard = Listen(priya);
        await Start(priya, race);

        await Report(priya, race.SessionId!, 50, 300);
        await Report(priya, race.SessionId!, 80, 300);
        api.Clock.Advance(TimeSpan.FromSeconds(1));

        var standings = await heard.Await(s => s.SessionId == race.SessionId && s.Rows.Any(row => row.Name == "priya_spins" && row.DistanceMetres > 0), Wait);
        Assert.Equal(50, standings.Rows.Single(row => row.Name == "priya_spins").DistanceMetres);
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    /// <summary>
    /// Takes the clock to the bot fill, awaits it, then to one second after the start, and awaits the first standings
    /// (L164: one large advance skips the fill).
    /// </summary>
    private async Task Start(HubConnection hub, Found race)
    {
        var seats = new EventProbe<object>(_ => "seats");
        hub.On<object>("SeatsChanged", seats.Record);
        var standings = Listen(hub);
        api.Clock.Advance(race.StartsAt!.Value.AddSeconds(-10) - api.Clock.GetUtcNow());
        await seats.Await(_ => true, Wait);
        api.Clock.Advance(race.StartsAt.Value.AddSeconds(1) - api.Clock.GetUtcNow());
        await standings.Await(s => s.SessionId == race.SessionId, Wait);
    }

    private static Task<Found> Find(HubConnection hub) => hub.InvokeAsync<Found>("FindRace", Map, Cancel);

    private static Task Report(HubConnection hub, string sessionId, double metres, double watts) =>
        hub.InvokeAsync("ReportRaceProgress", sessionId, metres, watts, Cancel);

    private static (int, int, string, string, int?, string, double) Describe(Row row) =>
        (row.Position, row.Seat, row.Name, row.Jersey, row.Level, row.Kind, row.GapSeconds);

    private static EventProbe<RaceStandings> Listen(HubConnection hub)
    {
        var probe = new EventProbe<RaceStandings>(s => $"{s.SessionId}: {string.Join(", ", s.Rows.Select(row => $"{row.Position} {row.Name} {row.DistanceMetres} m +{row.GapSeconds} s"))}");
        hub.On<RaceStandings>("RaceStandingsUpdated", probe.Record);
        return probe;
    }

    /// <summary>Signs a new rider in with that display name, and connects their hub with the session cookie.</summary>
    private async Task<HubConnection> Rider(string displayName)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var email = $"standings{Interlocked.Increment(ref riders)}-{Guid.NewGuid():N}@example.com";
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        browsers.Add(browser);
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync("/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var cookie = confirmed.Headers.GetValues("Set-Cookie").Single(v => v.StartsWith("__Host-telo-session=", StringComparison.Ordinal)).Split(';')[0];
        using var named = await browser.PutAsJsonAsync("/api/riders/me/display-name", new { displayName }, Cancel);
        Assert.Equal(HttpStatusCode.OK, named.StatusCode);
        var hub = new HubConnectionBuilder()
            .WithUrl(new Uri("https://localhost/hubs/ride"), options =>
            {
                options.HttpMessageHandlerFactory = _ => api.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                options.Headers.Add("Cookie", cookie);
            })
            .Build();
        connections.Add(hub);
        await hub.StartAsync(Cancel);
        return hub;
    }

    private sealed record Found(string? Code, string? SessionId, DateTimeOffset? StartsAt, int? Seat);

    private sealed record RaceStandings(string SessionId, IReadOnlyList<Row> Rows);

    private sealed record Row(int Position, int Seat, string Name, string Jersey, int? Level, string Kind, double DistanceMetres, double GapSeconds);
}

/// <summary>A sign-in host of its own for the race standings tests, so its sessions are no other test's.</summary>
public sealed class RaceStandingsApi : SignInApi;
