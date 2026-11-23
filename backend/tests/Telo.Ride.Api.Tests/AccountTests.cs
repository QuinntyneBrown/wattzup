// Acceptance test
// Traces to: L2-006 AC1, AC3, AC4
// Description: signing out ends this device's session on the backend at once and clears its cookie; the old cookie is
// then refused, and another device stays signed in. Deleting the account ends every session at once and clears the
// cookie; the same email then signs in to a new, empty account. Without a session, sign-out still answers 204 and
// deletion is refused with 401.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class AccountTests(SignInApi api) : IClassFixture<SignInApi>
{
    private const string Cookie = "__Host-telo-session";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private HttpClient Device() =>
        api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

    /// <summary>Signs <paramref name="email"/> in on a new device; returns the rider and the device's session cookie.</summary>
    private async Task<(JsonElement Rider, string Session)> SignIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        using var device = Device();
        using var sent = await device.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using var confirmed = await device.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return (await Json(confirmed), SessionCookie(confirmed) ?? throw new InvalidOperationException("No session cookie."));
    }

    private static string? SessionCookie(HttpResponseMessage response) =>
        response.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? cookies.FirstOrDefault(cookie => cookie.StartsWith(Cookie + "=", StringComparison.Ordinal))
            : null;

    private async Task<HttpResponseMessage> Send(HttpMethod method, string path, string? session, object? body = null)
    {
        using var device = Device();
        using var request = new HttpRequestMessage(method, path) { Content = body is null ? null : JsonContent.Create(body) };
        if (session is not null)
        {
            request.Headers.Add("Cookie", session.Split(';')[0]);
        }

        return await device.SendAsync(request, Cancel);
    }

    private Task<HttpResponseMessage> Me(string session) => Send(HttpMethod.Get, "/api/riders/me", session);

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();

    /// <summary>A Set-Cookie that clears the session: an empty value that expired long ago.</summary>
    private static void AssertCleared(HttpResponseMessage response)
    {
        var cleared = SessionCookie(response);
        Assert.NotNull(cleared);
        Assert.StartsWith(Cookie + "=;", cleared, StringComparison.Ordinal);
        Assert.Contains("expires=Thu, 01 Jan 1970", cleared, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Signing_out_ends_the_session_at_once_and_clears_its_cookie()
    {
        var (_, session) = await SignIn("ada.signs.out@example.com");

        using var signedOut = await Send(HttpMethod.Post, "/api/auth/sign-out", session);

        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
        AssertCleared(signedOut);
        using var replayed = await Me(session);
        Assert.Equal(HttpStatusCode.Unauthorized, replayed.StatusCode);
    }

    [Fact]
    public async Task Signing_out_leaves_the_other_devices_signed_in()
    {
        var (_, tablet) = await SignIn("ada.two.devices@example.com");
        var (_, laptop) = await SignIn("ada.two.devices@example.com");

        using var signedOut = await Send(HttpMethod.Post, "/api/auth/sign-out", tablet);

        using var stillIn = await Me(laptop);
        Assert.Equal(HttpStatusCode.OK, stillIn.StatusCode);
    }

    [Fact]
    public async Task Signing_out_without_a_session_answers_no_content()
    {
        using var signedOut = await Send(HttpMethod.Post, "/api/auth/sign-out", session: null);

        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Deleting_the_account_ends_every_session_and_clears_the_cookie()
    {
        var (_, tablet) = await SignIn("ada.deletes@example.com");
        var (_, laptop) = await SignIn("ada.deletes@example.com");

        using var deleted = await Send(HttpMethod.Delete, "/api/riders/me", tablet);

        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        AssertCleared(deleted);
        using var onTablet = await Me(tablet);
        Assert.Equal(HttpStatusCode.Unauthorized, onTablet.StatusCode);
        using var onLaptop = await Me(laptop);
        Assert.Equal(HttpStatusCode.Unauthorized, onLaptop.StatusCode);
    }

    [Fact]
    public async Task A_deleted_accounts_email_signs_in_to_a_new_empty_account()
    {
        var (before, session) = await SignIn("ada.returns@example.com");
        using var named = await Send(HttpMethod.Put, "/api/riders/me/display-name", session, new { displayName = "Ada" });
        Assert.Equal(HttpStatusCode.OK, named.StatusCode);
        using var deleted = await Send(HttpMethod.Delete, "/api/riders/me", session);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var (after, _) = await SignIn("ada.returns@example.com");

        Assert.True(after.GetProperty("isNewAccount").GetBoolean());
        Assert.NotEqual(before.GetProperty("riderId").GetString(), after.GetProperty("riderId").GetString());
        Assert.Equal(JsonValueKind.Null, after.GetProperty("displayName").ValueKind);
    }

    [Fact]
    public async Task Without_a_session_no_account_is_deleted()
    {
        using var refused = await Send(HttpMethod.Delete, "/api/riders/me", session: null);

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
    }
}
