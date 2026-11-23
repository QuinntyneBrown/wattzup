// Acceptance test
// Traces to: L2-005 AC2, AC3
// Description: a signed-in rider saves a display name: it is kept trimmed and the current rider answers with it. A
// name that breaks the rule (2 to 24 characters of letters, digits, spaces, . _ and -) is refused with 400 and
// display_name_invalid, and the name already kept stays. Without a session the request is refused with 401.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class DisplayNameTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

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

    private static Task<HttpResponseMessage> Rename(HttpClient browser, string? displayName) =>
        browser.PutAsJsonAsync("/api/riders/me/display-name", new { displayName }, Cancel);

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();

    private static async Task<string?> DisplayNameOf(HttpClient browser)
    {
        using var me = await browser.GetAsync("/api/riders/me", Cancel);
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        return (await Json(me)).GetProperty("displayName").GetString();
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_saved_name_is_kept_trimmed_and_the_rider_answers_with_it()
    {
        using var browser = await SignedIn("sam.saves@example.com");

        using var saved = await Rename(browser, "  Sam  ");

        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.Equal("Sam", (await Json(saved)).GetProperty("displayName").GetString());
        Assert.Equal("Sam", await DisplayNameOf(browser));
    }

    [Fact]
    public async Task The_name_can_be_changed()
    {
        using var browser = await SignedIn("sam.changes@example.com");
        using var first = await Rename(browser, "Sam");

        using var second = await Rename(browser, "Sam R.");

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal("Sam R.", await DisplayNameOf(browser));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("S")]
    [InlineData("A name far too long to fit")]
    [InlineData("<b>Sam</b>")]
    [InlineData("sam@example.com")]
    public async Task A_name_that_breaks_the_rule_is_refused_and_the_kept_name_stays(string name)
    {
        using var browser = await SignedIn("sam.refused." + name.Length + "@example.com");
        using var kept = await Rename(browser, "Sam");

        using var refused = await Rename(browser, name);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("display_name_invalid", (await Json(refused)).GetProperty("code").GetString());
        Assert.Equal("Sam", await DisplayNameOf(browser));
    }

    [Fact]
    public async Task Without_a_session_no_name_is_saved()
    {
        using var visitor = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        using var refused = await Rename(visitor, "Sam");

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
    }
}
