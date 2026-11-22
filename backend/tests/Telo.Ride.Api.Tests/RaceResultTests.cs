// Acceptance test
// Traces to: L2-125 AC1; L2-071 AC3
// Description: when a riders-online race ends (every person has finished or is DNF, or 2 minutes after the first person
// finished), the service records each rider's place, time and output from the progress it received and tells the
// session. A rider's submitted ride then takes its place, field, time and output from that result, never from the
// submission; before the result exists the answer is 409 result_pending, and a session the rider has no entry in is
// 404 session_not_found. Real sign-ins give each rider a session cookie, which a real SignalR client and the rider's own
// HTTP client carry to the API hosted in memory; the fake clock drives the ticker.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class RaceResultTests(RaceResultApi api) : IClassFixture<RaceResultApi>, IAsyncDisposable
{
    private const string Map = "old-town-criterium";
    private const double Route = 14_200;
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(10);

    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];
    private int riders;

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_finished_race_records_the_service_places_and_a_submitted_ride_takes_them()
    {
        var lena = await Rider("lena.k");
        var marco = await Rider("MarcoVelo");
        var race = await Find(lena.Hub);
        await Find(marco.Hub);
        var ended = Ended(lena.Hub);
        var heard = await Start(lena.Hub, race);

        // lena rides at 25 m/s on 400 W and reaches the line at second 572; MarcoVelo at 24 m/s on 380 W, at 602.
        await RideUntil(heard, race, second => second > 601, (lena, 25, 400), (marco, 24, 380));

        Assert.Equal(race.SessionId, await ended.Await(_ => true, Wait));
        // MarcoVelo claims the win and half an hour; the service has them 2nd of 10 in 602 seconds.
        using var answer = await Submit(marco, RideBodies.RaceIn(Guid.NewGuid(), 1800, ("mode", "online"), ("pack", null),
            ("place", 1), ("sessionId", race.SessionId)));
        Assert.Equal(HttpStatusCode.Created, answer.StatusCode);
        var recorded = await answer.Content.ReadFromJsonAsync<JsonElement>(Cancel);
        Assert.Contains(recorded.GetProperty("xpLines").EnumerateArray(), line => line.GetProperty("label").GetString() == "2 of 10");
        Assert.Equal(602, recorded.GetProperty("best").GetProperty("bestSeconds").GetInt32());
    }

    [Fact]
    public async Task A_race_ends_2_minutes_after_the_first_person_finished_and_not_before()
    {
        var priya = await Rider("priya_spins");
        var ollie = await Rider("Ollie R.");
        var stranger = await Rider("kenji.cyc");
        var race = await Find(priya.Hub);
        await Find(ollie.Hub);
        var ended = Ended(priya.Hub);
        var heard = await Start(priya.Hub, race);

        // priya reaches the line at second 572; Ollie rides on at 10 m/s, short of it, until second 691.
        await RideUntil(heard, race, second => second >= 691, (priya, 25, 400), (ollie, 10, 200));

        using var early = await Submit(priya, Online(race.SessionId!));
        Assert.Equal(("result_pending", HttpStatusCode.Conflict), await Problem(early));

        api.Clock.Advance(TimeSpan.FromSeconds(1));
        Assert.Equal(race.SessionId, await ended.Await(_ => true, Wait));
        using var answer = await Submit(priya, Online(race.SessionId!));
        Assert.Equal(HttpStatusCode.Created, answer.StatusCode);
        var recorded = await answer.Content.ReadFromJsonAsync<JsonElement>(Cancel);
        Assert.Contains(recorded.GetProperty("xpLines").EnumerateArray(), line => line.GetProperty("label").GetString() == "1 of 10");
        using var refused = await Submit(stranger, Online(race.SessionId!));
        Assert.Equal(("session_not_found", HttpStatusCode.NotFound), await Problem(refused));
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    private static Dictionary<string, object?> Online(string sessionId) =>
        RideBodies.RaceIn(Guid.NewGuid(), 1800, ("mode", "online"), ("pack", null), ("place", 1), ("sessionId", sessionId));

    /// <summary>
    /// Each rider reports their distance at their speed (held at the line) and their power, then the clock moves on 10
    /// seconds and the standings that carry every report are awaited, until <paramref name="done"/> holds for the race
    /// second the clock reached; the last step stops there.
    /// </summary>
    private async Task RideUntil(
        EventProbe<RaceStandings> heard, Found race, Func<int, bool> done, params (Signed Rider, double Speed, double Watts)[] field)
    {
        var second = (int)(api.Clock.GetUtcNow() - race.StartsAt!.Value).TotalSeconds;
        while (!done(second))
        {
            var reported = new Dictionary<string, double>();
            foreach (var (rider, speed, watts) in field)
            {
                var metres = Math.Min(Route, speed * second);
                await rider.Hub.InvokeAsync("ReportRaceProgress", race.SessionId, metres, watts, Cancel);
                reported[rider.Name] = metres;
            }

            var step = done(second + 10) ? FirstDone(second, done) - second : 10;
            api.Clock.Advance(TimeSpan.FromSeconds(step));
            second += step;
            await heard.Await(s => reported.All(each => s.Rows.Any(row => row.Name == each.Key && row.DistanceMetres == each.Value)), Wait);
        }
    }

    private static int FirstDone(int second, Func<int, bool> done)
    {
        var next = second + 1;
        while (!done(next)) next++;
        return next;
    }

    /// <summary>Takes the clock to the bot fill, awaits it, then to one second after the start, and awaits the first standings (L164).</summary>
    private async Task<EventProbe<RaceStandings>> Start(HubConnection hub, Found race)
    {
        var seats = new EventProbe<object>(_ => "seats");
        hub.On<object>("SeatsChanged", seats.Record);
        var standings = new EventProbe<RaceStandings>(s => string.Join(", ", s.Rows.Select(row => $"{row.Position} {row.Name} {row.DistanceMetres} m {row.Status}")));
        hub.On<RaceStandings>("RaceStandingsUpdated", standings.Record);
        api.Clock.Advance(race.StartsAt!.Value.AddSeconds(-10) - api.Clock.GetUtcNow());
        await seats.Await(_ => true, Wait);
        api.Clock.Advance(race.StartsAt.Value.AddSeconds(1) - api.Clock.GetUtcNow());
        await standings.Await(s => s.SessionId == race.SessionId, Wait);
        return standings;
    }

    private static EventProbe<string> Ended(HubConnection hub)
    {
        var probe = new EventProbe<string>(id => id);
        hub.On<Ending>("SessionEnded", ending => probe.Record(ending.SessionId));
        return probe;
    }

    private static Task<Found> Find(HubConnection hub) => hub.InvokeAsync<Found>("FindRace", Map, Cancel);

    private static Task<HttpResponseMessage> Submit(Signed rider, Dictionary<string, object?> ride) =>
        rider.Browser.PostAsJsonAsync("/api/rides", ride, Cancel);

    private static async Task<(string?, HttpStatusCode)> Problem(HttpResponseMessage response)
    {
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(Cancel);
        return (problem.TryGetProperty("code", out var code) ? code.GetString() : null, response.StatusCode);
    }

    /// <summary>Signs a new rider in with that display name, and connects their hub with the session cookie.</summary>
    private async Task<Signed> Rider(string displayName)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var email = $"result{Interlocked.Increment(ref riders)}-{Guid.NewGuid():N}@example.com";
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
        return new(displayName, hub, browser);
    }

    private sealed record Signed(string Name, HubConnection Hub, HttpClient Browser);

    private sealed record Found(string? Code, string? SessionId, DateTimeOffset? StartsAt, int? Seat);

    private sealed record Ending(string SessionId);

    private sealed record RaceStandings(string SessionId, IReadOnlyList<Row> Rows);

    private sealed record Row(int Position, int Seat, string Name, double DistanceMetres, string Status);
}

/// <summary>A sign-in host of its own for the race result tests, so its sessions are no other test's.</summary>
public sealed class RaceResultApi : SignInApi;
