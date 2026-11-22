// Acceptance test
// Traces to: L2-121 AC1, AC2, AC4; L2-051 AC3, AC5; L2-052 AC1, AC5; L2-053 AC1; L2-054 AC1, AC2; L2-055 AC1, AC2, AC3;
// L2-057 AC1, AC2
// Description: "Find a race" seats a rider in the open session for the map, or opens one that starts 30 seconds later.
// Every rider in the session hears the seats change: a rider joining takes the first open seat, a rider pressing ready
// shows ready, and a rider leaving before 0:10 opens their seat again with their name for the notice. At 10 seconds to
// the start bots take every open seat, ready, in the bot list's order; a rider who leaves after that is replaced by a
// bot at once. A rider whose connection is gone for 10 seconds in the lobby loses the seat. Race Setup reads the count
// of riders queuing for a map over HTTP. Real sign-ins give each rider a session cookie, which a real SignalR client
// carries to the API hosted in memory; the fake clock drives the ticker.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class RaceLobbyTests(RaceLobbyApi api) : IClassFixture<RaceLobbyApi>, IAsyncDisposable
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
    public async Task Find_a_race_seats_the_rider_in_a_session_that_starts_30_seconds_later_and_the_next_rider_joins_it()
    {
        var (lena, _) = await Rider("lena.k");
        var (marco, _) = await Rider("MarcoVelo");
        var now = api.Clock.GetUtcNow();

        var first = await Find(lena, Map);

        Assert.Null(first.Code);
        Assert.Equal(now.AddSeconds(30), first.StartsAt);
        Assert.Equal(1, first.Seat);
        Assert.Equal(10, first.Seats.Count);
        Assert.Equal(("rider", "lena.k", "lena", 1, false), Describe(first.Seats[0]));
        Assert.All(first.Seats.Skip(1), seat => Assert.Equal("open", seat.Kind));

        var lenaHears = Listen(lena);
        var second = await Find(marco, Map);

        Assert.Equal(first.SessionId, second.SessionId);
        Assert.Equal(2, second.Seat);
        var seats = await lenaHears.Await(s => s.SessionId == first.SessionId && s.Seats[1].Kind == "rider", Wait);
        Assert.Equal(("rider", "MarcoVelo", "marco", 1, false), Describe(seats.Seats[1]));
        Assert.Null(seats.Left);
    }

    [Fact]
    public async Task A_rider_who_finds_a_race_within_10_seconds_of_its_start_gets_a_new_session()
    {
        var (priya, _) = await Rider("priya_spins");
        var (ollie, _) = await Rider("Ollie R.");
        var first = await Find(priya, Map);

        api.Clock.Advance(TimeSpan.FromSeconds(21));
        var second = await Find(ollie, Map);

        Assert.NotEqual(first.SessionId, second.SessionId);
        Assert.Equal(1, second.Seat);
        Assert.Equal(api.Clock.GetUtcNow().AddSeconds(30), second.StartsAt);
    }

    [Fact]
    public async Task Ready_shows_on_the_rider_seat_for_everyone_in_the_session()
    {
        var (kenji, _) = await Rider("kenji.cyc");
        var (ana, _) = await Rider("ana_rides");
        var race = await Find(kenji, Map);
        await Find(ana, Map);
        var anaHears = Listen(ana);

        await kenji.InvokeAsync("SetReady", race.SessionId, true, Cancel);

        var seats = await anaHears.Await(s => s.SessionId == race.SessionId && s.Seats[0].Ready, Wait);
        Assert.Equal(("rider", "kenji.cyc", "lena", 1, true), Describe(seats.Seats[0]));

        await kenji.InvokeAsync("SetReady", race.SessionId, false, Cancel);
        await anaHears.Await(s => s.SessionId == race.SessionId && !s.Seats[0].Ready && s != seats, Wait);
    }

    [Fact]
    public async Task At_10_seconds_to_the_start_bots_take_every_open_seat_ready_in_list_order()
    {
        var (jwatts, _) = await Rider("jwatts");
        var race = await Find(jwatts, Map);
        var heard = Listen(jwatts);

        api.Clock.Advance(race.StartsAt!.Value.AddSeconds(-10) - api.Clock.GetUtcNow());

        var seats = await heard.Await(s => s.SessionId == race.SessionId && s.Seats.All(seat => seat.Kind != "open"), Wait);
        Assert.Equal("jwatts", seats.Seats[0].Name);
        Assert.Equal(Pacers, seats.Seats.Skip(1).Select(seat => seat.Name));
        Assert.All(seats.Seats.Skip(1), seat => Assert.Equal(("bot", true, null), (seat.Kind, seat.Ready, seat.Level)));
        Assert.Equal(Pacers.Select(name => name["Pacer ".Length..].ToLowerInvariant()), seats.Seats.Skip(1).Select(seat => seat.Jersey));
    }

    [Fact]
    public async Task A_rider_who_leaves_before_0_10_opens_their_seat_again_and_everyone_hears_their_name()
    {
        var (lena, _) = await Rider("lena.k");
        var (marco, _) = await Rider("MarcoVelo");
        var (priya, _) = await Rider("priya_spins");
        var race = await Find(lena, Map);
        await Find(marco, Map);
        await Find(priya, Map);
        var lenaHears = Listen(lena);

        await marco.InvokeAsync("LeaveRace", race.SessionId, Cancel);

        var seats = await lenaHears.Await(s => s.SessionId == race.SessionId && s.Left == "MarcoVelo", Wait);
        Assert.Equal("open", seats.Seats[1].Kind);
        Assert.Equal("priya_spins", seats.Seats[2].Name);
        Assert.Equal(2, seats.Seats.Count(seat => seat.Kind == "rider"));
    }

    [Fact]
    public async Task A_rider_who_leaves_after_0_10_is_replaced_by_a_bot_at_once()
    {
        var (ollie, _) = await Rider("Ollie R.");
        var (kenji, _) = await Rider("kenji.cyc");
        var race = await Find(ollie, Map);
        await Find(kenji, Map);
        var ollieHears = Listen(ollie);
        api.Clock.Advance(race.StartsAt!.Value.AddSeconds(-10) - api.Clock.GetUtcNow());
        await ollieHears.Await(s => s.SessionId == race.SessionId && s.Seats.All(seat => seat.Kind != "open"), Wait);

        await kenji.InvokeAsync("LeaveRace", race.SessionId, Cancel);

        var seats = await ollieHears.Await(s => s.SessionId == race.SessionId && s.Seats[1].Kind == "bot", Wait);
        Assert.Null(seats.Left);
        Assert.Equal(("bot", true), (seats.Seats[1].Kind, seats.Seats[1].Ready));
        Assert.DoesNotContain(seats.Seats, seat => seat.Name == "kenji.cyc");
        Assert.Equal(10, seats.Seats.Select(seat => seat.Name).Distinct().Count());
    }

    [Fact]
    public async Task A_rider_whose_connection_is_gone_for_10_seconds_in_the_lobby_loses_the_seat()
    {
        var (ana, _) = await Rider("ana_rides");
        var (jwatts, _) = await Rider("jwatts");
        var race = await Find(ana, Map);
        await Find(jwatts, Map);
        var anaHears = Listen(ana);

        await jwatts.StopAsync(Cancel);
        api.Clock.Advance(TimeSpan.FromSeconds(10));

        var seats = await anaHears.Await(s => s.SessionId == race.SessionId && s.Left == "jwatts", Wait);
        Assert.Equal("open", seats.Seats[1].Kind);
    }

    [Fact]
    public async Task Race_Setup_reads_how_many_riders_are_queuing_for_a_map()
    {
        var (lena, browser) = await Rider("lena.k");
        var (marco, _) = await Rider("MarcoVelo");
        await Find(lena, "prairie-paceline");
        await Find(marco, "prairie-paceline");

        var queue = await browser.GetFromJsonAsync<Queue>("/api/maps/prairie-paceline/queue", Cancel);
        var empty = await browser.GetFromJsonAsync<Queue>("/api/maps/cliffside-coast/queue", Cancel);

        Assert.Equal(2, queue!.Riders);
        Assert.Equal(0, empty!.Riders);
    }

    [Fact]
    public async Task Find_a_race_on_a_map_the_service_does_not_know_is_refused()
    {
        var (vale, _) = await Rider("vale");

        var refused = await Find(vale, "atlantis");

        Assert.Equal("map_not_found", refused.Code);
        Assert.Null(refused.SessionId);
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    private static Task<Found> Find(HubConnection hub, string mapId) => hub.InvokeAsync<Found>("FindRace", mapId, Cancel);

    private static (string, string?, string?, int?, bool) Describe(Seat seat) => (seat.Kind, seat.Name, seat.Jersey, seat.Level, seat.Ready);

    private static EventProbe<SeatsChanged> Listen(HubConnection hub)
    {
        var probe = new EventProbe<SeatsChanged>(s => $"{s.SessionId} left={s.Left}: {string.Join(", ", s.Seats.Select(seat => $"{seat.Number} {seat.Kind} {seat.Name} {(seat.Ready ? "ready" : "")}"))}");
        hub.On<SeatsChanged>("SeatsChanged", probe.Record);
        return probe;
    }

    /// <summary>Signs a new rider in with that display name, and connects their hub with the session cookie.</summary>
    private async Task<(HubConnection Hub, HttpClient Browser)> Rider(string displayName)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var email = $"racer{Interlocked.Increment(ref riders)}-{Guid.NewGuid():N}@example.com";
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

    private sealed record Found(string? Code, string? SessionId, DateTimeOffset? StartsAt, int? Seat, IReadOnlyList<Seat> Seats);

    private sealed record SeatsChanged(string SessionId, IReadOnlyList<Seat> Seats, string? Left);

    private sealed record Seat(int Number, string Kind, string? Name, string? Jersey, int? Level, string? Country, bool Ready);

    private sealed record Queue(int Riders);
}

/// <summary>A sign-in host of its own for the race lobby tests, so its sessions and seats are no other test's.</summary>
public sealed class RaceLobbyApi : SignInApi;
