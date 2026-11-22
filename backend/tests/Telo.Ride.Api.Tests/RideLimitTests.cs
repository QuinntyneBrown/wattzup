// Acceptance test
// Traces to: L2-130 AC1, AC3
// Description: one rider records at most 60 rides in an hour. The 61st within the hour is refused with 429, code
// rate_limited and a Retry-After of the seconds until the hour's first ride falls out of it; a repeat of a ride already
// recorded is still answered with its first answer, and another rider is not held back. Once the wait has passed, the
// next ride is recorded.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class RideLimitTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return browser;
    }

    private static Task<HttpResponseMessage> Submit(HttpClient browser, Guid rideId) =>
        browser.PostAsJsonAsync("/api/rides", RideBodies.Custom(rideId), Cancel);

    [Fact]
    [Trait("Category", "Critical")]
    public async Task The_61st_ride_in_an_hour_is_refused_until_the_hours_first_ride_falls_out_of_it()
    {
        using var browser = await SignedIn("lou.limits@example.com");
        var first = Guid.NewGuid();
        using (var recorded = await Submit(browser, first)) Assert.True(recorded.IsSuccessStatusCode);
        api.Clock.Advance(TimeSpan.FromMinutes(10));
        for (var ride = 2; ride <= 60; ride++)
        {
            using var recorded = await Submit(browser, Guid.NewGuid());
            Assert.True(recorded.IsSuccessStatusCode, $"ride {ride}: {recorded.StatusCode}");
        }

        using var refused = await Submit(browser, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.TooManyRequests, refused.StatusCode);
        var problem = JsonDocument.Parse(await refused.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.Equal("rate_limited", problem.GetProperty("code").GetString());
        Assert.Equal("3000", refused.Headers.GetValues("Retry-After").Single());

        using var repeat = await Submit(browser, first);
        Assert.True(repeat.IsSuccessStatusCode, $"a repeat: {repeat.StatusCode}");

        using var other = await SignedIn("ola.other@example.com");
        using var others = await Submit(other, Guid.NewGuid());
        Assert.True(others.IsSuccessStatusCode, $"another rider: {others.StatusCode}");
    }

    [Fact]
    public async Task Once_the_wait_has_passed_the_next_ride_is_recorded()
    {
        using var browser = await SignedIn("wes.waits@example.com");
        for (var ride = 1; ride <= 60; ride++)
        {
            using var recorded = await Submit(browser, Guid.NewGuid());
            Assert.True(recorded.IsSuccessStatusCode);
        }

        using var refused = await Submit(browser, Guid.NewGuid());
        Assert.Equal(HttpStatusCode.TooManyRequests, refused.StatusCode);
        api.Clock.Advance(TimeSpan.FromSeconds(int.Parse(refused.Headers.GetValues("Retry-After").Single(), System.Globalization.CultureInfo.InvariantCulture)));

        using var recordedAfter = await Submit(browser, Guid.NewGuid());

        Assert.True(recordedAfter.IsSuccessStatusCode, $"after the wait: {recordedAfter.StatusCode}");
    }
}
