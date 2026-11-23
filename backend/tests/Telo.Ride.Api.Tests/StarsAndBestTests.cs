// Acceptance test
// Traces to: L2-075 AC1, AC2, AC3; L2-077 AC1, AC2, AC3, AC4; L2-039 AC1, AC2, AC3, AC4
// Description: the backend answers a race with the stars the rider holds on its map and those the ride earned, and with
// the best time: the best, the previous best and whether this ride set a new one. A first finish sets the best without
// earning "Beat your best time"; a faster finish in any mode earns it once. A class has neither. A repeat of a ride id
// answers as it did the first time, whatever came after.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class StarsAndBestTests(SignInApi api) : IClassFixture<SignInApi>
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

    /// <summary>Submits the ride; its <c>stars</c> and <c>best</c> as compact JSON.</summary>
    private static async Task<(string Stars, string Best)> Submit(HttpClient browser, Dictionary<string, object?> ride)
    {
        using var response = await browser.PostAsJsonAsync("/api/rides", ride, Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();
        Assert.True(response.IsSuccessStatusCode, body.GetRawText());
        return (body.GetProperty("stars").GetRawText(), body.GetProperty("best").GetRawText());
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_race_answers_the_stars_held_and_earned_and_the_best_time() // L2-075 AC1, L2-077 AC1, AC2, L2-039 AC1-AC3
    {
        using var browser = await SignedIn("ivy.stars@example.com");

        // 2nd of 10 against the medium pack in 30:00: the finish and the podium stars; the first best earns nothing more.
        Assert.Equal(
            ("""{"held":2,"earned":2}""", """{"bestSeconds":1800,"previousBestSeconds":null,"isNewBest":false}"""),
            await Submit(browser, RideBodies.RaceIn(Guid.NewGuid(), 1800)));
        // Solo in 26:40, faster than 30:00: a new personal best and "Beat your best time".
        Assert.Equal(
            ("""{"held":3,"earned":1}""", """{"bestSeconds":1600,"previousBestSeconds":1800,"isNewBest":true}"""),
            await Submit(browser, RideBodies.RaceIn(Guid.NewGuid(), 1600, ("mode", "solo"), ("pack", null), ("place", 1), ("fieldSize", 2))));
    }

    [Fact]
    public async Task A_slower_finish_keeps_the_best_and_earns_no_new_star() // L2-075 AC2, L2-077 AC3
    {
        using var browser = await SignedIn("ivy.slower@example.com");
        await Submit(browser, RideBodies.RaceIn(Guid.NewGuid(), 1600, ("mode", "solo"), ("pack", null), ("place", 1), ("fieldSize", 1)));

        Assert.Equal(
            ("""{"held":1,"earned":0}""", """{"bestSeconds":1600,"previousBestSeconds":1600,"isNewBest":false}"""),
            await Submit(browser, RideBodies.RaceIn(Guid.NewGuid(), 1700, ("mode", "solo"), ("pack", null), ("place", 1), ("fieldSize", 1))));
    }

    [Fact]
    public async Task A_class_has_no_stars_and_no_best() // L2-075 AC3, L2-039 AC4
    {
        using var browser = await SignedIn("ivy.class@example.com");

        Assert.Equal(("null", "null"), await Submit(browser, RideBodies.Class(Guid.NewGuid())));
    }

    [Fact]
    public async Task A_repeat_answers_the_stars_and_best_of_the_first_time() // L2-125 AC3
    {
        using var browser = await SignedIn("ivy.repeat@example.com");
        var first = RideBodies.RaceIn(Guid.NewGuid(), 1800);
        var answer = await Submit(browser, first);
        await Submit(browser, RideBodies.RaceIn(Guid.NewGuid(), 1600, ("mode", "solo"), ("pack", null), ("place", 1), ("fieldSize", 2)));

        Assert.Equal(answer, await Submit(browser, first));
    }
}
