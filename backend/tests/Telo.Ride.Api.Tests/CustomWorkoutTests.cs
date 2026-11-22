// Acceptance test
// Traces to: L2-099 AC4; L2-094 AC3; L2-100 AC3
// Description: Start ride saves the rider's custom workout to the account, and Custom workout opens on it next time.
// The API keeps the workout's settings as the app sent them, once the plan they expand to keeps the rules: every
// segment at least 5 seconds, every level 1 to 32, the total 1 to 180 minutes; otherwise it refuses with 400 and
// plan_invalid and keeps the workout it had. A rider with none saved gets 404 custom_workout_not_found, a rider sees
// only their own, and without a session the request is refused with 401.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class CustomWorkoutTests(SignInApi api) : IClassFixture<SignInApi>
{
    private const string Path = "/api/riders/me/custom-workout";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private static readonly object Flat = new
    {
        mode = "flat",
        flat = new { level = 12, minutes = 30, cadence = 85 },
    };

    private static object Segment(string kind, int duration, int level, int cadenceAim = 85) =>
        new { kind, duration, level, cadenceAim };

    private static object Save(object draft, params object[] segments) => new { draft, segments };

    /// <summary>A browser signed in as a new rider with this address.</summary>
    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
        });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return browser;
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_saved_workout_is_what_the_rider_gets_back()
    {
        using var browser = await SignedIn("cass.saves@example.com");

        using var saved = await browser.PutAsJsonAsync(Path, Save(Flat, Segment("steady", 1800, 12)), Cancel);
        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);

        using var read = await browser.GetAsync(Path, Cancel);
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        var draft = (await Json(read)).GetProperty("draft");
        Assert.Equal("flat", draft.GetProperty("mode").GetString());
        Assert.Equal(12, draft.GetProperty("flat").GetProperty("level").GetInt32());
    }

    [Fact]
    public async Task A_rider_with_none_saved_gets_not_found()
    {
        using var browser = await SignedIn("nell.none@example.com");

        using var read = await browser.GetAsync(Path, Cancel);

        Assert.Equal(HttpStatusCode.NotFound, read.StatusCode);
        Assert.Equal("custom_workout_not_found", (await Json(read)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task A_plan_that_breaks_the_rules_is_refused_and_the_saved_workout_stays()
    {
        using var browser = await SignedIn("rex.refused@example.com");
        using var first = await browser.PutAsJsonAsync(Path, Save(Flat, Segment("steady", 1800, 12)), Cancel);
        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);

        using var refused = await browser.PutAsJsonAsync(
            Path, Save(new { mode = "hiit" }, Segment("work", 4, 24), Segment("cool-down", 300, 6)), Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("plan_invalid", (await Json(refused)).GetProperty("code").GetString());
        using var read = await browser.GetAsync(Path, Cancel);
        Assert.Equal("flat", (await Json(read)).GetProperty("draft").GetProperty("mode").GetString());
    }

    [Fact]
    public async Task A_rider_sees_only_their_own_workout()
    {
        using var saver = await SignedIn("ola.own@example.com");
        using var saved = await saver.PutAsJsonAsync(Path, Save(Flat, Segment("steady", 1800, 12)), Cancel);
        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        using var other = await SignedIn("pip.other@example.com");

        using var read = await other.GetAsync(Path, Cancel);

        Assert.Equal(HttpStatusCode.NotFound, read.StatusCode);
    }

    [Fact]
    public async Task Without_a_session_the_workout_is_refused()
    {
        using var visitor = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        using var read = await visitor.GetAsync(Path, Cancel);
        using var saved = await visitor.PutAsJsonAsync(Path, Save(Flat, Segment("steady", 1800, 12)), Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, read.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, saved.StatusCode);
    }
}
