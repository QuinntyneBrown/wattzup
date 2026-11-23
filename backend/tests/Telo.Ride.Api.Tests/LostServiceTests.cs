// Acceptance test
// Traces to: L2-126 AC2; L2-120 AC3
// Description: a rider whose hub connection dropped mid-ride connects again and rejoins their session; the service
// sends the session's current standings to that connection at once, before the next once-a-second tick, so the board
// updates within a second: a group class's StandingsUpdated with the rider's last output, a race's RaceStandingsUpdated
// with the distance last received. Real sign-ins give the rider a session cookie, which a real SignalR client carries to
// the API hosted in memory; the fake clock drives the ticker and stands still while the rider rejoins.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class LostServiceTests(LostServiceApi api) : IClassFixture<LostServiceApi>, IAsyncDisposable
{
    private const string Map = "old-town-criterium";
    private const string Class = "hiit-cardio-30";
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(10);

    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];
    private int riders;

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_rider_rejoining_a_group_class_receives_its_standings_at_once()
    {
        var (lena, cookie) = await Rider("lena.k");
        var (start, session) = NextSession();
        Assert.Null((await lena.InvokeAsync<Joined>("JoinClassSession", Class, session, Cancel)).Code);
        var heard = ListenToClass(lena);
        api.Clock.Advance(start.AddSeconds(1) - api.Clock.GetUtcNow());
        await heard.Await(s => s.SessionId == session, Wait);
        await lena.InvokeAsync("ReportProgress", session, 12.5, 180, Cancel);
        api.Clock.Advance(TimeSpan.FromSeconds(1));
        await heard.Await(s => s.SessionId == session && s.Rows.Any(row => row.OutputKj == 12.5), Wait);
        await lena.StopAsync(Cancel);

        var again = await Connect(cookie);
        var rejoined = ListenToClass(again);
        Assert.Null((await again.InvokeAsync<Joined>("JoinClassSession", Class, session, Cancel)).Code);

        var standings = await rejoined.Await(s => s.SessionId == session, Wait);
        Assert.Equal(12.5, standings.Rows.Single(row => row.Name == "lena.k").OutputKj);
    }

    [Fact]
    public async Task A_rider_rejoining_a_race_receives_its_standings_at_once()
    {
        var (lena, cookie) = await Rider("lena.k");
        var race = await lena.InvokeAsync<Found>("FindRace", Map, Cancel);
        var heard = ListenToRace(lena);
        await Start(lena, race);
        await lena.InvokeAsync("ReportRaceProgress", race.SessionId, 100, 320, Cancel);
        api.Clock.Advance(TimeSpan.FromSeconds(1));
        await heard.Await(s => s.SessionId == race.SessionId && s.Rows.Any(row => row.Name == "lena.k" && row.DistanceMetres == 100), Wait);
        await lena.StopAsync(Cancel);

        var again = await Connect(cookie);
        var rejoined = ListenToRace(again);
        Assert.Null((await again.InvokeAsync<Found>("JoinRace", race.SessionId, Cancel)).Code);

        var standings = await rejoined.Await(s => s.SessionId == race.SessionId, Wait);
        Assert.Equal(100, standings.Rows.Single(row => row.Name == "lena.k").DistanceMetres);
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    /// <summary>Takes the clock to the bot fill, awaits it, then to one second after the start (L164).</summary>
    private async Task Start(HubConnection hub, Found race)
    {
        var seats = new EventProbe<object>(_ => "seats");
        hub.On<object>("SeatsChanged", seats.Record);
        var standings = ListenToRace(hub);
        api.Clock.Advance(race.StartsAt!.Value.AddSeconds(-10) - api.Clock.GetUtcNow());
        await seats.Await(_ => true, Wait);
        api.Clock.Advance(race.StartsAt.Value.AddSeconds(1) - api.Clock.GetUtcNow());
        await standings.Await(s => s.SessionId == race.SessionId, Wait);
    }

    private static EventProbe<ClassStandings> ListenToClass(HubConnection hub)
    {
        var probe = new EventProbe<ClassStandings>(s => $"{s.SessionId}: {string.Join(", ", s.Rows.Select(r => $"{r.Name} {r.OutputKj}"))}");
        hub.On<ClassStandings>("StandingsUpdated", probe.Record);
        return probe;
    }

    private static EventProbe<RaceStandings> ListenToRace(HubConnection hub)
    {
        var probe = new EventProbe<RaceStandings>(s => $"{s.SessionId}: {string.Join(", ", s.Rows.Select(r => $"{r.Name} {r.DistanceMetres} m"))}");
        hub.On<RaceStandings>("RaceStandingsUpdated", probe.Record);
        return probe;
    }

    /// <summary>Moves the fake clock to six minutes past a quarter hour; returns the next session's start and id.</summary>
    private (DateTimeOffset Start, string Id) NextSession()
    {
        var now = api.Clock.GetUtcNow();
        var quarter = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, now.Minute / 15 * 15, 0, TimeSpan.Zero).AddMinutes(15);
        api.Clock.Advance(quarter.AddMinutes(6) - now);
        var start = quarter.AddMinutes(15);
        return (start, $"{Class}@{start:yyyyMMdd'T'HHmm'Z'}");
    }

    /// <summary>Signs a new rider in with that display name, and connects their hub with the session cookie.</summary>
    private async Task<(HubConnection Hub, string Cookie)> Rider(string displayName)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var email = $"lost{Interlocked.Increment(ref riders)}-{Guid.NewGuid():N}@example.com";
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        browsers.Add(browser);
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync("/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var cookie = confirmed.Headers.GetValues("Set-Cookie").Single(v => v.StartsWith("__Host-telo-session=", StringComparison.Ordinal)).Split(';')[0];
        using var named = await browser.PutAsJsonAsync("/api/riders/me/display-name", new { displayName }, Cancel);
        Assert.Equal(HttpStatusCode.OK, named.StatusCode);
        return (await Connect(cookie), cookie);
    }

    /// <summary>A new hub connection carrying the rider's session cookie, as the app's after a reconnect.</summary>
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
        await hub.StartAsync(Cancel);
        return hub;
    }

    private sealed record Joined(string? Code);

    private sealed record Found(string? Code, string? SessionId, DateTimeOffset? StartsAt, int? Seat);

    private sealed record ClassStandings(string SessionId, IReadOnlyList<ClassRow> Rows);

    private sealed record ClassRow(string Name, double OutputKj);

    private sealed record RaceStandings(string SessionId, IReadOnlyList<RaceRow> Rows);

    private sealed record RaceRow(string Name, double DistanceMetres);
}

/// <summary>A sign-in host of its own for the lost-service tests, so its sessions are no other test's.</summary>
public sealed class LostServiceApi : SignInApi;
