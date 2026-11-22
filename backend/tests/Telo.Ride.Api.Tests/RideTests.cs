// Acceptance test
// Traces to: L2-044 AC2, AC4; L2-125 AC2, AC3
// Description: a signed-in rider's finished ride is recorded once by its ride id: the first submission answers 201 with
// the ride id and the instant it was recorded, and a repeat answers 200 with that first answer unchanged. A ride is
// refused with 422 ride_not_plausible when its power passes 2,000 W, its speed 100 km/h, its distance disagrees with
// its speed samples by more than 5 %, or a race is finished faster than its map allows at 100 km/h; a refused ride is
// not recorded. A body that is not a ride is refused with 400 validation_failed, any XP, stars or unlocks a body
// sends are not read, and without a session the request is refused with 401.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class RideTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private static readonly string[] OpenedMaps = ["cliffside-coast"];

    /// <summary>A browser signed in as a new rider with this address.</summary>
    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = Browser();
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return browser;
    }

    private HttpClient Browser() => api.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        HandleCookies = true,
    });

    private static Task<HttpResponseMessage> Submit(HttpClient browser, object ride) =>
        browser.PostAsJsonAsync("/api/rides", ride, Cancel);

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_finished_race_is_recorded_once_and_a_repeat_answers_with_the_first_answer()
    {
        using var browser = await SignedIn("rae.records@example.com");
        var rideId = Guid.NewGuid();
        var recordedAt = api.Clock.GetUtcNow();

        using var first = await Submit(browser, RideBodies.Race(rideId));
        api.Clock.Advance(TimeSpan.FromMinutes(5));
        using var repeat = await Submit(browser, RideBodies.Race(rideId));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var answer = await Json(first);
        Assert.Equal(rideId, answer.GetProperty("rideId").GetGuid());
        Assert.Equal(recordedAt, answer.GetProperty("recordedAt").GetDateTimeOffset());
        Assert.Equal(HttpStatusCode.OK, repeat.StatusCode);
        Assert.Equal(answer.GetRawText(), (await Json(repeat)).GetRawText());
    }

    [Fact]
    public async Task A_finished_class_is_recorded()
    {
        using var browser = await SignedIn("cal.classes@example.com");
        var rideId = Guid.NewGuid();

        using var recorded = await Submit(browser, RideBodies.Class(rideId));

        Assert.Equal(HttpStatusCode.Created, recorded.StatusCode);
        Assert.Equal(rideId, (await Json(recorded)).GetProperty("rideId").GetGuid());
    }

    [Fact]
    public async Task One_ride_id_is_recorded_for_each_rider_who_sends_it()
    {
        using var rae = await SignedIn("rae.shares@example.com");
        using var sam = await SignedIn("sam.shares@example.com");
        var rideId = Guid.NewGuid();

        using var raes = await Submit(rae, RideBodies.Race(rideId));
        using var sams = await Submit(sam, RideBodies.Race(rideId));

        Assert.Equal(HttpStatusCode.Created, raes.StatusCode);
        Assert.Equal(HttpStatusCode.Created, sams.StatusCode);
    }

    [Fact]
    public async Task Xp_stars_and_unlocks_the_body_sends_are_not_read()
    {
        using var browser = await SignedIn("xena.claims@example.com");
        var ride = RideBodies.Race(Guid.NewGuid(), ("xp", 99_999), ("stars", 3), ("unlockedMapIds", OpenedMaps));

        using var recorded = await Submit(browser, ride);

        Assert.Equal(HttpStatusCode.Created, recorded.StatusCode);
        var answer = await Json(recorded);
        Assert.False(answer.TryGetProperty("xp", out _));
        // The stars are the backend's for a first 2nd of 10 against the medium pack (L2-039), not the 3 the body claims.
        Assert.Equal("""{"held":2,"earned":2}""", answer.GetProperty("stars").GetRawText());
        Assert.False(answer.TryGetProperty("unlockedMapIds", out _));
    }

    public static TheoryData<string, string, object> NotPlausible => new()
    {
        { "power past 2,000 W", "maxPowerWatts", 2001 },
        { "a top speed past 100 km/h", "maxSpeedKmh", 100.5 },
        { "a second past 100 km/h", "speedSamplesKmh", Enumerable.Repeat(28.4, 1799).Append(100.5).ToArray() },
        { "a distance 6 % past the speed samples", "distanceMeters", 15_052.0 },
        { "a distance 6 % short of the speed samples", "distanceMeters", 13_348.0 },
    };

    [Theory]
    [MemberData(nameof(NotPlausible))]
    public async Task A_ride_that_is_not_plausible_is_refused_and_not_recorded(string because, string fact, object value)
    {
        using var browser = await SignedIn($"ivan.{fact.ToLowerInvariant()}.{value.GetHashCode():x}@example.com");
        var rideId = Guid.NewGuid();

        using var refused = await Submit(browser, RideBodies.Race(rideId, (fact, value)));
        using var corrected = await Submit(browser, RideBodies.Race(rideId));

        Assert.True(refused.StatusCode == HttpStatusCode.UnprocessableEntity, because);
        Assert.Equal("ride_not_plausible", (await Json(refused)).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Created, corrected.StatusCode);
    }

    [Fact]
    public async Task A_race_finished_faster_than_its_map_allows_at_100_kmh_is_refused()
    {
        using var browser = await SignedIn("quinn.quick@example.com");
        // 14.2 km at 100 km/h takes 511.2 s; 511 seconds at 100 km/h is 14,194 m, within 5 % of the 14,200 m reported.
        var ride = RideBodies.Race(Guid.NewGuid(), ("elapsedSeconds", 511), ("maxSpeedKmh", 100.0),
            ("speedSamplesKmh", Enumerable.Repeat(100.0, 511).ToArray()));

        using var refused = await Submit(browser, ride);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal("ride_not_plausible", (await Json(refused)).GetProperty("code").GetString());
    }

    public static TheoryData<string, string, object?> Malformed => new()
    {
        { "rideId", "rideId", Guid.Empty },
        { "kind", "kind", "sprint" },
        { "mapId", "mapId", "atlantis" },
        { "mapId", "mapId", null },
        { "mode", "mode", "tandem" },
        { "sessionId", "mode", "online" },
        { "pack", "pack", null },
        { "place", "place", 11 },
        { "elapsedSeconds", "elapsedSeconds", 0 },
        { "elapsedSeconds", "elapsedSeconds", 14_401 },
        { "distanceMeters", "distanceMeters", -1.0 },
        { "outputKj", "outputKj", -1.0 },
        { "speedSamplesKmh", "speedSamplesKmh", Enumerable.Repeat(28.4, 1801).ToArray() },
        { "timeZoneId", "timeZoneId", "Mars/Olympus_Mons" },
        { "finishedAt", "finishedAt", null },
    };

    [Theory]
    [MemberData(nameof(Malformed))]
    public async Task A_body_that_is_not_a_ride_is_refused_naming_the_fact(string field, string fact, object? value)
    {
        using var browser = await SignedIn($"mal.{field.ToLowerInvariant()}.{(value?.GetHashCode() ?? 0):x}@example.com");

        using var refused = await Submit(browser, RideBodies.Race(Guid.NewGuid(), (fact, value)));

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        var problem = await Json(refused);
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").TryGetProperty(field, out _), problem.GetRawText());
    }

    [Fact]
    public async Task A_class_ride_names_a_class_in_the_catalogue()
    {
        using var browser = await SignedIn("cal.unknown@example.com");
        var ride = RideBodies.Class(Guid.NewGuid());
        ride["classId"] = "underwater-spin";

        using var refused = await Submit(browser, ride);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.True((await Json(refused)).GetProperty("errors").TryGetProperty("classId", out _));
    }

    [Fact]
    public async Task Without_a_session_a_ride_is_refused_with_401()
    {
        using var browser = Browser();

        using var refused = await Submit(browser, RideBodies.Race(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
    }
}
