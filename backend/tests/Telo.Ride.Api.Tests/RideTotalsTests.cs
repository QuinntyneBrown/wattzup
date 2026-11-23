// Acceptance test
// Traces to: L2-109 AC1, AC2
// Description: GET /api/progress counts the rider's recorded rides and the kilometres they covered, for Profile's line
// ("23 rides · 412 km"): none and 0 for a new rider; each recorded ride adds one ride and its distance, a class adds a
// ride and no distance, and a ride sent again counts once. Kilometres are whole, to the nearest.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class RideTotalsTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
        });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return browser;
    }

    private static async Task<(int Rides, int Km)> Totals(HttpClient browser)
    {
        using var response = await browser.GetAsync("/api/progress", Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"{response.StatusCode}: {body.GetRawText()}");
        return (body.GetProperty("rideCount").GetInt32(), body.GetProperty("distanceKm").GetInt32());
    }

    private static async Task Record(HttpClient browser, object ride)
    {
        using var response = await browser.PostAsJsonAsync("/api/rides", ride, Cancel);
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {await response.Content.ReadAsStringAsync(Cancel)}");
    }

    [Fact]
    public async Task A_new_rider_has_no_rides_and_no_kilometres()
    {
        using var browser = await SignedIn("totals.new@example.com");

        Assert.Equal((0, 0), await Totals(browser));
    }

    [Fact]
    public async Task Each_recorded_ride_adds_one_ride_and_its_distance_and_a_repeat_counts_once()
    {
        using var browser = await SignedIn("totals.mid@example.com");
        var first = Guid.NewGuid();

        await Record(browser, RideBodies.Race(first));
        await Record(browser, RideBodies.Race(first));
        await Record(browser, RideBodies.Race(Guid.NewGuid()));
        await Record(browser, RideBodies.Class(Guid.NewGuid()));

        Assert.Equal((3, 28), await Totals(browser));
    }
}
