// Acceptance test
// Traces to: L2-123 AC1, AC2, AC3, AC4; L2-122 AC3; L2-083; L2-090 AC1
// Description: once a group session starts, the service fills it with bots up to 10 when fewer than 8 riders are
// seated, moves the bots on the pace model, ranks every rider by the output they report, and sends the same standings
// to every rider in the session once a second: name, jersey, level, kind, position, output and gap to the leader. A
// progress report less than 500 ms after the rider's previous one is ignored. Real sign-ins give each rider a session
// cookie, which a real SignalR client carries to the API hosted in memory; the fake clock drives the ticker.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class GroupSessionStandingsTests(GroupSessionStandingsApi api)
    : IClassFixture<GroupSessionStandingsApi>, IAsyncDisposable
{
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(10);
    private static readonly string[] Pacers = ["Pacer Nova", "Pacer Rook", "Pacer Juno", "Pacer Atlas", "Pacer Kite", "Pacer Vale", "Pacer Moss", "Pacer Flint", "Pacer Echo"];

    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];
    private int riders;

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task At_the_start_bots_fill_the_session_to_ten_and_every_rider_receives_the_standings()
    {
        var (lena, _) = await Rider("lena.k");
        var (marco, _) = await Rider("MarcoVelo");
        var (start, session) = NextSession("hiit-cardio-30");
        await Join(lena, "hiit-cardio-30", session);
        await Join(marco, "hiit-cardio-30", session);
        var lenaHears = Listen(lena);
        var marcoHears = Listen(marco);

        api.Clock.Advance(start.AddSeconds(1) - api.Clock.GetUtcNow());

        var standings = await lenaHears.Await(s => s.SessionId == session, Wait);
        Assert.Equal(standings.Rows, (await marcoHears.Await(s => s.SessionId == session, Wait)).Rows);
        Assert.Equal(Enumerable.Range(1, 10), standings.Rows.Select(row => row.Position));
        Assert.Equivalent(
            new[] { ("lena.k", "lena"), ("MarcoVelo", "marco") },
            standings.Rows.Where(row => row.Kind == "person").Select(row => (row.Name, row.Jersey)));
        Assert.Equivalent(
            Pacers[..8].Select(name => (name, name["Pacer ".Length..].ToLowerInvariant())),
            standings.Rows.Where(row => row.Kind == "bot").Select(row => (row.Name, row.Jersey)));
        Assert.All(standings.Rows.Where(row => row.Kind == "person"), row => Assert.Equal(1, row.Level));
        Assert.Equal(standings.Rows.Select(row => row.OutputKj).OrderDescending(), standings.Rows.Select(row => row.OutputKj));
    }

    [Fact]
    public async Task Riders_rank_by_the_output_they_report_with_each_gap_to_the_leader()
    {
        var (priya, _) = await Rider("priya_spins");
        var (ollie, _) = await Rider("Ollie R.");
        var (start, session) = NextSession("hiit-cardio-30");
        await Join(priya, "hiit-cardio-30", session);
        await Join(ollie, "hiit-cardio-30", session);
        var heard = Listen(priya);
        api.Clock.Advance(start.AddSeconds(1) - api.Clock.GetUtcNow());

        await Report(ollie, session, 12.5, 180);
        await Report(priya, session, 3.0, 120);
        api.Clock.Advance(TimeSpan.FromSeconds(1));

        var standings = await heard.Await(s => s.SessionId == session && s.Rows.Any(row => row.OutputKj == 12.5), Wait);
        Assert.Equal(("Ollie R.", 1, 12.5, 0.0), (standings.Rows[0].Name, standings.Rows[0].Position, standings.Rows[0].OutputKj, standings.Rows[0].GapKj));
        Assert.Equal(("priya_spins", 2, 3.0, 9.5), (standings.Rows[1].Name, standings.Rows[1].Position, standings.Rows[1].OutputKj, standings.Rows[1].GapKj));
    }

    [Fact]
    public async Task A_report_less_than_half_a_second_after_the_last_is_ignored()
    {
        var (kenji, _) = await Rider("kenji.cyc");
        var (start, session) = NextSession("hiit-cardio-30");
        await Join(kenji, "hiit-cardio-30", session);
        var heard = Listen(kenji);
        api.Clock.Advance(start.AddSeconds(1) - api.Clock.GetUtcNow());

        await Report(kenji, session, 20.0, 200);
        await Report(kenji, session, 40.0, 200);
        api.Clock.Advance(TimeSpan.FromSeconds(1));

        var standings = await heard.Await(s => s.SessionId == session && s.Rows.Any(row => row.OutputKj >= 20.0), Wait);
        Assert.Equal(20.0, standings.Rows.Single(row => row.Name == "kenji.cyc").OutputKj);
    }

    [Fact]
    public async Task The_bots_ride_on_the_pace_model_around_the_easy_pack()
    {
        var (ana, _) = await Rider("ana_rides");
        var (start, session) = NextSession("hiit-cardio-30");
        await Join(ana, "hiit-cardio-30", session);
        var heard = Listen(ana);
        api.Clock.Advance(start.AddSeconds(1) - api.Clock.GetUtcNow());
        await heard.Await(s => s.SessionId == session, Wait);

        api.Clock.Advance(TimeSpan.FromSeconds(59));

        var standings = await heard.Await(s => s.SessionId == session && s.Rows.Any(row => row.OutputKj > 1), Wait);
        var bots = standings.Rows.Where(row => row.Kind == "bot").ToList();
        Assert.Equal(9, bots.Count);
        Assert.All(bots, bot => Assert.InRange(bot.OutputKj, 60 * 130 * 0.78 / 1000, 60 * 130 * 1.22 / 1000));
        Assert.Equal(9, bots.Select(bot => bot.OutputKj).Distinct().Count());
    }

    [Fact]
    public async Task A_session_of_eight_riders_starts_without_bots()
    {
        List<HubConnection> seated = [];
        for (var i = 0; i < 8; i++) seated.Add((await Rider($"rider {i}")).Hub);
        var (start, session) = NextSession("threshold-builder-20");
        foreach (var rider in seated) await Join(rider, "threshold-builder-20", session);
        var heard = Listen(seated[0]);

        api.Clock.Advance(start.AddSeconds(1) - api.Clock.GetUtcNow());

        var standings = await heard.Await(s => s.SessionId == session, Wait);
        Assert.Equal(8, standings.Rows.Count);
        Assert.All(standings.Rows, row => Assert.Equal("person", row.Kind));
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    private static async Task Join(HubConnection hub, string classId, string sessionId) =>
        Assert.Null((await hub.InvokeAsync<Joined>("JoinClassSession", classId, sessionId, Cancel)).Code);

    private static Task Report(HubConnection hub, string sessionId, double outputKj, double powerWatts) =>
        hub.InvokeAsync("ReportProgress", sessionId, outputKj, powerWatts, Cancel);

    private static EventProbe<Standings> Listen(HubConnection hub)
    {
        var probe = new EventProbe<Standings>(s => $"{s.SessionId}: {string.Join(", ", s.Rows.Select(r => $"{r.Position} {r.Name} {r.OutputKj}"))}");
        hub.On<Standings>("StandingsUpdated", probe.Record);
        return probe;
    }

    /// <summary>Moves the fake clock to six minutes past a quarter hour; returns the next session's start and id.</summary>
    private (DateTimeOffset Start, string Id) NextSession(string classId)
    {
        var now = api.Clock.GetUtcNow();
        var quarter = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, now.Minute / 15 * 15, 0, TimeSpan.Zero).AddMinutes(15);
        api.Clock.Advance(quarter.AddMinutes(6) - now);
        var start = quarter.AddMinutes(15);
        return (start, $"{classId}@{start:yyyyMMdd'T'HHmm'Z'}");
    }

    /// <summary>Signs a new rider in with that display name, and connects their hub with the session cookie.</summary>
    private async Task<(HubConnection Hub, HttpClient Browser)> Rider(string displayName)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var email = $"rider{Interlocked.Increment(ref riders)}-{Guid.NewGuid():N}@example.com";
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
        return (hub, browser);
    }

    /// <summary>Moves the fake clock on to the next time that many minutes past a quarter hour; returns that quarter.</summary>
    private DateTimeOffset MoveTo(int minutesPastQuarter)
    {
        var now = api.Clock.GetUtcNow();
        var quarter = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, now.Minute / 15 * 15, 0, TimeSpan.Zero);
        var target = quarter.AddMinutes(minutesPastQuarter);
        if (target <= now)
        {
            quarter = quarter.AddMinutes(15);
            target = quarter.AddMinutes(minutesPastQuarter);
        }
        api.Clock.Advance(target - now);
        return quarter;
    }

    private sealed record Joined(string? Code);

    private sealed record Standings(string SessionId, IReadOnlyList<Row> Rows);

    private sealed record Row(int Position, string Name, string Jersey, int? Level, string Kind, double OutputKj, double GapKj);
}

/// <summary>A sign-in host of its own for the standings tests, so its sessions and seats are no other test's.</summary>
public sealed class GroupSessionStandingsApi : SignInApi;
