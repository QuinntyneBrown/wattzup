// Acceptance test
// Traces to: L2-040 AC2, AC4, AC5; L2-076 AC1, AC3
// Description: the backend names the map a ride opened in its answer, once: a top-3 finish against bots on Old Town
// Criterium opens Neon Docklands, and the same finish again opens nothing; a repeat of the first ride id names it again.
// A finish outside the top 3 and a class below level 10 open nothing; a ride that takes the rider to level 10 opens
// Vice City, a class included.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Tests;

public sealed class UnlocksTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<HttpClient> SignedIn(string email, int totalXp = 0)
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
        if (totalXp > 0)
        {
            var riderId = Guid.Parse(JsonDocument.Parse(await confirmed.Content.ReadAsStringAsync(Cancel))
                .RootElement.GetProperty("riderId").GetString()!);
            using var scope = api.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
            (await db.Riders.SingleAsync(rider => rider.Id == riderId, Cancel)).AddXp(totalXp);
            await db.SaveChangesAsync(Cancel);
        }
        return browser;
    }

    /// <summary>Submits the ride; its <c>openedMapId</c> as compact JSON.</summary>
    private static async Task<string> Opened(HttpClient browser, Dictionary<string, object?> ride)
    {
        using var response = await browser.PostAsJsonAsync("/api/rides", ride, Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();
        Assert.True(response.IsSuccessStatusCode, body.GetRawText());
        return body.GetProperty("openedMapId").GetRawText();
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_top_three_finish_against_bots_names_the_map_it_opened_once() // L2-040 AC2, AC5, L2-076 AC1
    {
        using var browser = await SignedIn("ivy.unlock@example.com");
        var first = RideBodies.Race(Guid.NewGuid());

        Assert.Equal("\"neon-docklands\"", await Opened(browser, first));
        Assert.Equal("null", await Opened(browser, RideBodies.Race(Guid.NewGuid())));
        Assert.Equal("\"neon-docklands\"", await Opened(browser, first));
    }

    [Fact]
    public async Task A_finish_outside_the_top_three_and_a_class_open_nothing() // L2-076 AC3
    {
        using var browser = await SignedIn("ivy.nounlock@example.com");

        Assert.Equal("null", await Opened(browser, RideBodies.Race(Guid.NewGuid(), ("place", 4))));
        Assert.Equal("null", await Opened(browser, RideBodies.Class(Guid.NewGuid())));
    }

    [Fact]
    public async Task A_class_that_reaches_level_ten_opens_Vice_City() // L2-040 AC4
    {
        // 3,700 XP is level 9; the class's 177 XP takes the rider past 3,800, level 10.
        using var browser = await SignedIn("ivy.level@example.com", 3700);

        Assert.Equal("\"vice-city\"", await Opened(browser, RideBodies.Class(Guid.NewGuid())));
    }
}
