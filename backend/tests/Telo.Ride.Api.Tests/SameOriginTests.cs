// Acceptance test
// Traces to: L2-127 AC2
// Description: a change the browser marks as coming from another origin is refused with 403 and code cross_origin
// before it reaches the endpoint, and the rider's data stays as it was: Sec-Fetch-Site cross-site or same-site, or,
// without Sec-Fetch-Site, an Origin that is not the API's own. The same holds for asking for a sign-in code and for
// negotiating a connection to the ride hub. A change from the app's own origin, and a request from a client that is
// not a browser (neither header), carry on; a read is never refused for its origin.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class SameOriginTests(SignInApi api) : IClassFixture<SignInApi>
{
    private const string App = "https://localhost";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    /// <summary>A browser signed in as a new rider with this address, named Sam.</summary>
    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri(App), HandleCookies = true });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        using var named = await browser.PutAsJsonAsync("/api/riders/me/display-name", new { displayName = "Sam" }, Cancel);
        Assert.Equal(HttpStatusCode.OK, named.StatusCode);
        return browser;
    }

    /// <summary>Renames the rider with the headers a browser adds: <c>Sec-Fetch-Site</c> and <c>Origin</c>, when given.</summary>
    private static Task<HttpResponseMessage> Rename(HttpClient browser, string? fetchSite, string? origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, "/api/riders/me/display-name")
        {
            Content = JsonContent.Create(new { displayName = "Forged" }),
        };
        Mark(request, fetchSite, origin);
        return browser.SendAsync(request, Cancel);
    }

    private static void Mark(HttpRequestMessage request, string? fetchSite, string? origin)
    {
        if (fetchSite is not null) request.Headers.Add("Sec-Fetch-Site", fetchSite);
        if (origin is not null) request.Headers.Add("Origin", origin);
    }

    private static async Task<string?> DisplayNameOf(HttpClient browser)
    {
        using var me = await browser.GetAsync("/api/riders/me", Cancel);
        return JsonDocument.Parse(await me.Content.ReadAsStringAsync(Cancel)).RootElement.GetProperty("displayName").GetString();
    }

    private static async Task AssertCrossOrigin(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.Equal("cross_origin", problem.GetProperty("code").GetString());
    }

    [Theory]
    [Trait("Category", "Critical")]
    [InlineData("cross-site", "https://elsewhere.example")]
    [InlineData("same-site", "https://shop.localhost")]
    [InlineData(null, "https://elsewhere.example")]
    [InlineData(null, "null")]
    [InlineData(null, "http://localhost")]
    public async Task A_change_from_another_origin_is_refused_and_changes_nothing(string? fetchSite, string origin)
    {
        using var browser = await SignedIn($"sam.{Guid.NewGuid():N}@example.com");

        using var forged = await Rename(browser, fetchSite, origin);

        await AssertCrossOrigin(forged);
        Assert.Equal("Sam", await DisplayNameOf(browser));
    }

    [Theory]
    [InlineData("same-origin", App)]
    [InlineData(null, App)]
    [InlineData(null, null)]
    public async Task A_change_from_the_apps_origin_or_from_a_client_that_is_not_a_browser_carries_on(
        string? fetchSite, string? origin)
    {
        using var browser = await SignedIn($"sam.{Guid.NewGuid():N}@example.com");

        using var renamed = await Rename(browser, fetchSite, origin);

        Assert.Equal(HttpStatusCode.OK, renamed.StatusCode);
        Assert.Equal("Forged", await DisplayNameOf(browser));
    }

    [Fact]
    public async Task Asking_for_a_sign_in_code_from_another_site_is_refused_and_sends_nothing()
    {
        using var visitor = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri(App) });
        var sentBefore = api.Mailbox.Sent.Count;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/code")
        {
            Content = JsonContent.Create(new { email = "someone@example.com" }),
        };
        Mark(request, "cross-site", "https://elsewhere.example");

        using var response = await visitor.SendAsync(request, Cancel);

        await AssertCrossOrigin(response);
        Assert.Equal(sentBefore, api.Mailbox.Sent.Count);
    }

    [Fact]
    public async Task Negotiating_with_the_ride_hub_from_another_site_is_refused()
    {
        using var browser = await SignedIn($"sam.{Guid.NewGuid():N}@example.com");
        using var request = new HttpRequestMessage(HttpMethod.Post, "/hubs/ride/negotiate?negotiateVersion=1");
        Mark(request, "cross-site", "https://elsewhere.example");

        using var response = await browser.SendAsync(request, Cancel);

        await AssertCrossOrigin(response);
    }

    [Fact]
    public async Task Opening_the_ride_hubs_WebSocket_from_another_site_is_refused()
    {
        var socket = api.Server.CreateWebSocketClient();
        socket.ConfigureRequest = request =>
        {
            request.Headers["Sec-Fetch-Site"] = "cross-site";
            request.Headers.Origin = "https://elsewhere.example";
        };

        var refused = await Assert.ThrowsAnyAsync<Exception>(() =>
            socket.ConnectAsync(new Uri("wss://localhost/hubs/ride?id=forged"), Cancel));

        Assert.Contains("403", refused.Message);
    }

    [Fact]
    public async Task A_read_from_another_site_is_answered()
    {
        using var visitor = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri(App) });
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/classes");
        Mark(request, "cross-site", "https://elsewhere.example");

        using var response = await visitor.SendAsync(request, Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
