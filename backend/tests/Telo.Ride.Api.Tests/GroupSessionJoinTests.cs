// Acceptance test
// Traces to: L2-122 AC1, AC2; L2-086 AC3; L2-120 AC3; L2-085 AC2; L2-082
// Description: a signed-in rider joins a class's group session through the ride hub and takes a seat with a jersey;
// Class Start's sessions then list them. Joining again keeps the same seat (a rejoin after a reconnect). With 10 riders
// seated the session refuses with session_full and offers the one 15 minutes later; a session that has started refuses
// with session_started and offers the next; a class above the rider's level refuses with class_locked. Real sign-ins
// give each rider a session cookie, which a real SignalR client carries to the API hosted in memory.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class GroupSessionJoinTests(GroupSessionJoinApi api) : IClassFixture<GroupSessionJoinApi>, IAsyncDisposable
{
    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];
    private int riders;

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_rider_joins_the_next_session_and_Class_Start_lists_them_with_their_jersey()
    {
        var (lena, browser) = await Rider("lena.k");
        var quarter = MoveTo(minutesPastQuarter: 6);
        var next = Id("hiit-cardio-30", quarter.AddMinutes(15));

        var joined = await Join(lena, "hiit-cardio-30", next);

        Assert.Equal(new Joined(null, next, quarter.AddMinutes(15), "lena", null), joined);
        var sessions = await browser.GetFromJsonAsync<Session[]>("/api/classes/hiit-cardio-30/sessions", Cancel);
        Assert.Equal((1, false), (sessions![0].SeatsTaken, sessions[0].Full));
        Assert.Equal([new SessionRider("lena.k", "lena")], sessions[0].Riders);
        var chips = await browser.GetFromJsonAsync<NextSession[]>("/api/classes/sessions", Cancel);
        Assert.Equal(1, chips!.Single(c => c.ClassId == "hiit-cardio-30").SeatsTaken);
    }

    [Fact]
    public async Task Joining_again_keeps_the_same_seat_even_once_the_session_has_started()
    {
        var (marco, _) = await Rider("MarcoVelo");
        var (priya, browser) = await Rider("priya_spins");
        var quarter = MoveTo(minutesPastQuarter: 3);
        var next = Id("hiit-cardio-30", quarter.AddMinutes(15));
        await Join(marco, "hiit-cardio-30", next);
        var first = await Join(priya, "hiit-cardio-30", next);

        api.Clock.Advance(TimeSpan.FromMinutes(13));
        var again = await Join(priya, "hiit-cardio-30", next);

        Assert.Equal("marco", first.Jersey);
        Assert.Equal(first, again);
        var sessions = await browser.GetFromJsonAsync<Session[]>("/api/classes/hiit-cardio-30/sessions", Cancel);
        Assert.Equal(quarter.AddMinutes(30), sessions![0].StartsAt);
    }

    [Fact]
    public async Task A_full_session_refuses_with_session_full_and_offers_the_next_one()
    {
        List<HubConnection> seated = [];
        for (var i = 0; i < 10; i++) seated.Add((await Rider($"rider {i}")).Hub);
        var (eleventh, browser) = await Rider("jwatts");
        var quarter = MoveTo(minutesPastQuarter: 1);
        var next = Id("threshold-builder-20", quarter.AddMinutes(15));
        foreach (var rider in seated) Assert.Null((await Join(rider, "threshold-builder-20", next)).Code);

        var refused = await Join(eleventh, "threshold-builder-20", next);

        var later = quarter.AddMinutes(30);
        Assert.Equal(
            new Joined("session_full", next, quarter.AddMinutes(15), null, new Offered(Id("threshold-builder-20", later), later)),
            refused);
        var sessions = await browser.GetFromJsonAsync<Session[]>("/api/classes/threshold-builder-20/sessions", Cancel);
        Assert.Equal((10, true), (sessions![0].SeatsTaken, sessions[0].Full));
    }

    [Fact]
    public async Task A_started_session_refuses_with_session_started_and_offers_the_next_one()
    {
        var (ollie, _) = await Rider("Ollie R.");
        var quarter = MoveTo(minutesPastQuarter: 2);
        var started = Id("power-intervals-20", quarter);

        var refused = await Join(ollie, "power-intervals-20", started);

        var next = quarter.AddMinutes(15);
        Assert.Equal(new Joined("session_started", started, quarter, null, new Offered(Id("power-intervals-20", next), next)), refused);
    }

    [Fact]
    public async Task A_class_above_the_riders_level_refuses_with_class_locked()
    {
        var (kenji, _) = await Rider("kenji.cyc");
        var quarter = MoveTo(minutesPastQuarter: 4);
        var next = Id("tempo-paceline-30", quarter.AddMinutes(15));

        var refused = await Join(kenji, "tempo-paceline-30", next);

        Assert.Equal(new Joined("class_locked", next, null, null, null), refused);
    }

    [Theory]
    [InlineData("no-such-class", "no-such-class@20261121T1945Z")]
    [InlineData("hiit-cardio-30", "hiit-cardio-30@20261121T1946Z")]
    [InlineData("hiit-cardio-30", "power-intervals-20@20261121T1945Z")]
    public async Task A_session_the_schedule_does_not_hold_refuses_with_session_not_found(string classId, string sessionId)
    {
        var (rider, _) = await Rider("ana");

        var refused = await Join(rider, classId, sessionId);

        Assert.Equal(new Joined("session_not_found", sessionId, null, null, null), refused);
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    private static Task<Joined> Join(HubConnection hub, string classId, string sessionId) =>
        hub.InvokeAsync<Joined>("JoinClassSession", classId, sessionId, Cancel);

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

    private static string Id(string classId, DateTimeOffset start) => $"{classId}@{start:yyyyMMdd'T'HHmm'Z'}";

    private sealed record Joined(string? Code, string SessionId, DateTimeOffset? StartsAt, string? Jersey, Offered? Next);

    private sealed record Offered(string Id, DateTimeOffset StartsAt);

    private sealed record Session(string Id, DateTimeOffset StartsAt, int SeatsTaken, int Capacity, bool Full, SessionRider[] Riders);

    private sealed record SessionRider(string DisplayName, string Jersey);

    private sealed record NextSession(string ClassId, string SessionId, DateTimeOffset StartsAt, int SeatsTaken, int Capacity);
}

/// <summary>A sign-in host of its own for the group session tests, so its sessions and seats are no other test's.</summary>
public sealed class GroupSessionJoinApi : SignInApi;
