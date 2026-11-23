// Acceptance test
// Traces to: L2-001 AC4, AC6; L2-002 AC2, AC3, AC4, AC6; L2-003 AC2, AC3; L2-004 AC1, AC2, AC3
// Description: the six digits emailed to a rider sign them in. The answer names the rider (created on the first
// sign-in) and sets a session cookie scripts cannot read, sent only over HTTPS and not with other sites' requests.
// The session lasts 365 days from the last use. A wrong code, an old one, a used one and a superseded one are each
// refused; after five wrong codes even the right one is. Time moves with the fixture's clock; nothing sleeps.
using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Telo.Ride.Infrastructure.Live;

namespace Telo.Ride.Api.Tests;

public sealed class SessionTests(SessionApi api) : IClassFixture<SessionApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    /// <summary>A browser of its own: HTTPS, so the Secure cookie is kept and sent back.</summary>
    private HttpClient Browser() => api.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        HandleCookies = true,
    });

    private void StartAfresh() => api.Clock.Advance(TimeSpan.FromHours(2));

    private async Task<string> CodeFor(HttpClient browser, string email)
    {
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        return api.Mailbox.Sent[^1].Code;
    }

    private static Task<HttpResponseMessage> Confirm(HttpClient browser, string email, string code) =>
        browser.PostAsJsonAsync("/api/auth/code/confirm", new { email, code }, Cancel);

    private static string WrongFor(string code) =>
        ((int.Parse(code, CultureInfo.InvariantCulture) + 1) % 1_000_000).ToString("D6", CultureInfo.InvariantCulture);

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();

    private static async Task<string?> ProblemCode(HttpResponseMessage response) =>
        (await Json(response)).TryGetProperty("code", out var code) ? code.GetString() : null;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task The_emailed_code_signs_a_new_rider_in_with_a_session_cookie_scripts_cannot_read()
    {
        StartAfresh();
        using var browser = Browser();
        var code = await CodeFor(browser, "new.rider@example.com");

        using var confirmed = await Confirm(browser, " new.rider@EXAMPLE.com ", code);

        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var result = await Json(confirmed);
        Assert.True(result.GetProperty("isNewAccount").GetBoolean());
        Assert.Equal(JsonValueKind.Null, result.GetProperty("displayName").ValueKind);
        var cookie = Assert.Single(confirmed.Headers.GetValues("Set-Cookie"), value => value.StartsWith("__Host-telo-session=", StringComparison.Ordinal));
        var attributes = cookie.ToLowerInvariant();
        Assert.Contains("httponly", attributes, StringComparison.Ordinal);
        Assert.Contains("secure", attributes, StringComparison.Ordinal);
        Assert.Contains("samesite=lax", attributes, StringComparison.Ordinal);
        Assert.Contains("path=/", attributes, StringComparison.Ordinal);
        Assert.Contains("expires=", attributes, StringComparison.Ordinal);

        using var me = await browser.GetAsync("/api/riders/me", Cancel);

        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        Assert.Equal(result.GetProperty("riderId").GetString(), (await Json(me)).GetProperty("id").GetString());
    }

    [Fact]
    public async Task Signing_in_again_with_the_same_address_finds_the_same_rider()
    {
        StartAfresh();
        using var first = Browser();
        using var firstIn = await Confirm(first, "again@example.com", await CodeFor(first, "again@example.com"));
        api.Clock.Advance(TimeSpan.FromMinutes(1));
        using var second = Browser();

        using var secondIn = await Confirm(second, "again@Example.com", await CodeFor(second, "again@example.com"));

        Assert.Equal(HttpStatusCode.OK, secondIn.StatusCode);
        var result = await Json(secondIn);
        Assert.False(result.GetProperty("isNewAccount").GetBoolean());
        Assert.Equal((await Json(firstIn)).GetProperty("riderId").GetString(), result.GetProperty("riderId").GetString());
    }

    [Fact]
    public async Task A_wrong_code_is_refused_and_after_five_even_the_right_one_is()
    {
        StartAfresh();
        using var browser = Browser();
        var code = await CodeFor(browser, "guesser@example.com");

        for (var wrong = 0; wrong < 5; wrong++)
        {
            using var refused = await Confirm(browser, "guesser@example.com", WrongFor(code));
            Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
            Assert.Equal("code_mismatch", await ProblemCode(refused));
        }

        using var locked = await Confirm(browser, "guesser@example.com", code);

        Assert.Equal(HttpStatusCode.BadRequest, locked.StatusCode);
        Assert.Equal("code_locked", await ProblemCode(locked));
        using var me = await browser.GetAsync("/api/riders/me", Cancel);
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    [Fact]
    public async Task A_code_sent_more_than_10_minutes_ago_has_expired()
    {
        StartAfresh();
        using var browser = Browser();
        var code = await CodeFor(browser, "slow@example.com");
        api.Clock.Advance(TimeSpan.FromMinutes(10) + TimeSpan.FromSeconds(1));

        using var refused = await Confirm(browser, "slow@example.com", code);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("code_expired", await ProblemCode(refused));
    }

    [Fact]
    public async Task A_code_works_once()
    {
        StartAfresh();
        using var browser = Browser();
        var code = await CodeFor(browser, "once@example.com");
        using var first = await Confirm(browser, "once@example.com", code);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        using var again = await Confirm(Browser(), "once@example.com", code);

        Assert.Equal(HttpStatusCode.BadRequest, again.StatusCode);
        Assert.Equal("code_expired", await ProblemCode(again));
    }

    [Fact]
    public async Task A_new_code_stops_the_earlier_one_working()
    {
        StartAfresh();
        using var browser = Browser();
        var earlier = await CodeFor(browser, "twice@example.com");
        api.Clock.Advance(TimeSpan.FromSeconds(30));
        var newer = await CodeFor(browser, "twice@example.com");

        using var old = await Confirm(browser, "twice@example.com", earlier);
        using var current = await Confirm(browser, "twice@example.com", newer);

        // One time in a million the two codes are the same six digits; then the earlier one is the newer one.
        if (earlier != newer)
        {
            Assert.Equal("code_mismatch", await ProblemCode(old));
        }

        Assert.Equal(HttpStatusCode.OK, current.StatusCode);
    }

    [Fact]
    public async Task A_session_lasts_365_days_from_its_last_use()
    {
        StartAfresh();
        using var browser = Browser();
        using var signedIn = await Confirm(browser, "keeper@example.com", await CodeFor(browser, "keeper@example.com"));
        Assert.Equal(HttpStatusCode.OK, signedIn.StatusCode);

        api.Clock.Advance(TimeSpan.FromDays(364));
        using var stillIn = await browser.GetAsync("/api/riders/me", Cancel);
        api.Clock.Advance(TimeSpan.FromDays(364));
        using var usedAgain = await browser.GetAsync("/api/riders/me", Cancel);
        api.Clock.Advance(TimeSpan.FromDays(366));
        using var lapsed = await browser.GetAsync("/api/riders/me", Cancel);

        Assert.Equal(HttpStatusCode.OK, stillIn.StatusCode);
        Assert.Equal(HttpStatusCode.OK, usedAgain.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, lapsed.StatusCode);
        Assert.Equal("unauthenticated", await ProblemCode(lapsed));
    }
}

/// <summary>
/// A sign-in host without the live sessions' once-a-second ticker: these tests move the clock a year at a time, and the
/// fake clock would fire the ticker's timer for every second of it (L172).
/// </summary>
public sealed class SessionApi : SignInApi
{
    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        var ticker = services.Single(service => service.ServiceType == typeof(IHostedService) && service.ImplementationType == typeof(SessionTicker));
        services.Remove(ticker);
    }
}
