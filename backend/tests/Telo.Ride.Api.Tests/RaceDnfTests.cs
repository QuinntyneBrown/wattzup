// Acceptance test
// Traces to: L2-124 AC1, AC2, AC4
// Description: once a riders-online race has started, a rider who leaves it is marked DNF for everyone at once: every
// rider in the session receives standings with the leaver last, marked DNF, without waiting for the next second. A
// racing rider who sends no progress for 15 seconds is marked DNF. A rider whose connection has been gone for 30
// seconds is removed from the session: DNF on the board, and a later join is refused. Real sign-ins give each rider a
// session cookie, which a real SignalR client carries to the API hosted in memory; the fake clock drives the ticker.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class RaceDnfTests(RaceDnfApi api) : IClassFixture<RaceDnfApi>, IAsyncDisposable
{
    private const string Map = "old-town-criterium";
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(10);

    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];
    private readonly Dictionary<HubConnection, string> cookies = [];
    private int riders;

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_rider_who_leaves_a_running_race_is_marked_DNF_for_everyone_at_once()
    {
        var (lena, _) = await Rider("lena.k");
        var (marco, _) = await Rider("MarcoVelo");
        var race = await Find(lena);
        var lenaHears = Listen(lena);
        await Start(lena, marco, race);
        await Report(marco, race.SessionId!, 40, 300);
        api.Clock.Advance(TimeSpan.FromSeconds(1));
        await lenaHears.Await(s => s.Rows.Any(row => row.Name == "MarcoVelo" && row.DistanceMetres == 40), Wait);

        await marco.InvokeAsync("LeaveRace", race.SessionId, Cancel);

        var standings = await lenaHears.Await(s => s.Rows.Any(row => row.Status == "dnf"), Wait);
        Assert.Equal(("MarcoVelo", 10, 2, "dnf", 40.0), Describe(standings.Rows[^1]));
        Assert.All(standings.Rows.SkipLast(1), row => Assert.Equal("riding", row.Status));
    }

    [Fact]
    public async Task A_racing_rider_who_sends_no_progress_for_15_seconds_is_marked_DNF()
    {
        var (priya, _) = await Rider("priya_spins");
        var (ollie, _) = await Rider("Ollie R.");
        var race = await Find(priya);
        var heard = Listen(priya);
        await Start(priya, ollie, race);
        await Report(ollie, race.SessionId!, 8, 250);

        RaceStandings? standings = null;
        for (var second = 1; second <= 15; second++)
        {
            await Report(priya, race.SessionId!, second * 6, 250);
            api.Clock.Advance(TimeSpan.FromSeconds(1));
            standings = await heard.Await(s => s.Rows.Any(row => row.Name == "priya_spins" && row.DistanceMetres == second * 6), Wait);
            var expected = second < 15 ? "riding" : "dnf";
            Assert.Equal(expected, standings.Rows.Single(row => row.Name == "Ollie R.").Status);
        }

        Assert.Equal("riding", standings!.Rows.Single(row => row.Name == "priya_spins").Status);
    }

    [Fact]
    public async Task A_rider_whose_connection_is_gone_for_30_seconds_is_removed_and_cannot_join_again()
    {
        var (kenji, _) = await Rider("kenji.cyc");
        var (ana, browser) = await Rider("ana_rides");
        var race = await Find(kenji);
        var heard = Listen(kenji);
        await Start(kenji, ana, race);
        var cookie = cookies[ana];
        var anaId = (await browser.GetFromJsonAsync<Me>("/api/riders/me", Cancel))!.Id;
        await ana.StopAsync(Cancel);
        await api.ConnectionsLost.Await(id => id == anaId, Wait);

        RaceStandings? last = null;
        for (var second = 1; second <= 30; second++)
        {
            await Report(kenji, race.SessionId!, second * 6, 250);
            api.Clock.Advance(TimeSpan.FromSeconds(1));
            last = await heard.Await(s => s.Rows.Any(row => row.Name == "kenji.cyc" && row.DistanceMetres == second * 6), Wait);
        }

        var again = await Connect(cookie);
        var refused = await again.InvokeAsync<Found>("JoinRace", race.SessionId, Cancel);
        Assert.Equal("session_not_found", refused.Code);
        Assert.Equal("dnf", last!.Rows.Single(row => row.Name == "ana_rides").Status);
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    /// <summary>Takes the clock to the bot fill, awaits it, then to one second after the start, and awaits the first standings (L164).</summary>
    private async Task Start(HubConnection hub, HubConnection secondRider, Found race)
    {
        var seats = new EventProbe<Grid>(grid => $"{grid.SessionId}: {string.Join(", ", grid.Seats.Select(seat => seat.Kind))}");
        using var subscription = hub.On<Grid>("SeatsChanged", seats.Record);
        var standings = Listen(hub);
        Assert.Equal(race.SessionId, (await Find(secondRider)).SessionId);
        await seats.Await(grid => grid.SessionId == race.SessionId && grid.Seats.Count(seat => seat.Kind == "rider") == 2, Wait);
        api.Clock.Advance(race.StartsAt!.Value.AddSeconds(-10) - api.Clock.GetUtcNow());
        await seats.Await(grid => grid.SessionId == race.SessionId && grid.Seats.Any(seat => seat.Kind == "bot"), Wait);
        api.Clock.Advance(race.StartsAt.Value.AddSeconds(1) - api.Clock.GetUtcNow());
        await standings.Await(s => s.SessionId == race.SessionId, Wait);
    }

    private static Task<Found> Find(HubConnection hub) => hub.InvokeAsync<Found>("FindRace", Map, Cancel);

    private static Task Report(HubConnection hub, string sessionId, double metres, double watts) =>
        hub.InvokeAsync("ReportRaceProgress", sessionId, metres, watts, Cancel);

    private static (string, int, int, string, double) Describe(Row row) => (row.Name, row.Position, row.Seat, row.Status, row.DistanceMetres);

    private static EventProbe<RaceStandings> Listen(HubConnection hub)
    {
        var probe = new EventProbe<RaceStandings>(s => string.Join(", ", s.Rows.Select(row => $"{row.Position} {row.Name} {row.DistanceMetres} m {row.Status}")));
        hub.On<RaceStandings>("RaceStandingsUpdated", probe.Record);
        return probe;
    }

    /// <summary>Signs a new rider in with that display name, and connects their hub with the session cookie.</summary>
    private async Task<(HubConnection Hub, HttpClient Browser)> Rider(string displayName)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var email = $"dnf{Interlocked.Increment(ref riders)}-{Guid.NewGuid():N}@example.com";
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        browsers.Add(browser);
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync("/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var cookie = confirmed.Headers.GetValues("Set-Cookie").Single(v => v.StartsWith("__Host-telo-session=", StringComparison.Ordinal)).Split(';')[0];
        using var named = await browser.PutAsJsonAsync("/api/riders/me/display-name", new { displayName }, Cancel);
        Assert.Equal(HttpStatusCode.OK, named.StatusCode);
        return (await Connect(cookie), browser);
    }

    private async Task<HubConnection> Connect(string cookie)
    {
        var hub = new HubConnectionBuilder()
            .WithUrl(new Uri("https://localhost/hubs/ride"), options =>
            {
                options.HttpMessageHandlerFactory = _ => api.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                options.Headers.Add("Cookie", cookie);
            })
            .Build();
        connections.Add(hub);
        cookies[hub] = cookie;
        await hub.StartAsync(Cancel);
        return hub;
    }

    private sealed record Grid(string SessionId, IReadOnlyList<Seat> Seats);

    private sealed record Seat(string Kind);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Me(Guid Id);

    private sealed record Found(string? Code, string? SessionId, DateTimeOffset? StartsAt, int? Seat);

    private sealed record RaceStandings(string SessionId, IReadOnlyList<Row> Rows);

    private sealed record Row(int Position, int Seat, string Name, string Jersey, int? Level, string Kind, double DistanceMetres, double GapSeconds, string Status);
}

/// <summary>A sign-in host of its own for the race DNF tests, so its sessions are no other test's.</summary>
public sealed class RaceDnfApi : RaceDisconnectApi;
