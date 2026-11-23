// Acceptance test
// Traces to: L2-038 AC1, AC2, AC3, AC4; L2-032 AC2; L2-044 AC1
// Description: the rider's level is the highest level whose threshold the total XP reaches. GET /api/progress answers
// the level, the total and the next level's threshold: 1, 0 and 400 for a new rider, 7, 1,840 and 2,600 for the mid
// rider (760 XP to level 8). A recorded ride answers with the level after it, whether it went up and the XP to the
// next level; a repeat answers the same. At level 30 the total grows, the level stays 30 and there is no next level.
// Progress needs a session.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Tests;

public sealed class ProgressTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<(HttpClient Browser, Guid RiderId)> SignedIn(string email, int totalXp = 0)
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
        var riderId = Guid.Parse(JsonDocument.Parse(await confirmed.Content.ReadAsStringAsync(Cancel))
            .RootElement.GetProperty("riderId").GetString()!);
        if (totalXp > 0)
        {
            using var scope = api.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
            (await db.Riders.SingleAsync(rider => rider.Id == riderId, Cancel)).AddXp(totalXp);
            await db.SaveChangesAsync(Cancel);
        }
        return (browser, riderId);
    }

    private static async Task<JsonElement> Read(HttpResponseMessage response, HttpStatusCode expected)
    {
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();
        Assert.True(response.StatusCode == expected, $"{response.StatusCode}: {body.GetRawText()}");
        return body;
    }

    private static async Task<JsonElement> Progress(HttpClient browser)
    {
        using var response = await browser.GetAsync("/api/progress", Cancel);
        return await Read(response, HttpStatusCode.OK);
    }

    private static async Task<JsonElement> Submit(HttpClient browser, object ride, HttpStatusCode expected = HttpStatusCode.Created)
    {
        using var response = await browser.PostAsJsonAsync("/api/rides", ride, Cancel);
        return await Read(response, expected);
    }

    private static int? Number(JsonElement body, string name) =>
        body.GetProperty(name).ValueKind == JsonValueKind.Null ? null : body.GetProperty(name).GetInt32();

    [Fact]
    public async Task A_new_rider_is_level_1_with_400_xp_to_level_2()
    {
        var (browser, _) = await SignedIn("lena.new@example.com");
        using (browser)
        {
            var progress = await Progress(browser);

            Assert.Equal(1, Number(progress, "level"));
            Assert.Equal(0, Number(progress, "totalXp"));
            Assert.Equal(400, Number(progress, "nextLevelXp"));
            Assert.Equal(0, Number(progress, "streakDays"));
        }
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task The_mid_rider_is_level_7_with_1840_of_2600_xp()
    {
        var (browser, _) = await SignedIn("lena.mid@example.com", totalXp: 1840);
        using (browser)
        {
            var progress = await Progress(browser);

            Assert.Equal(7, Number(progress, "level"));
            Assert.Equal(1840, Number(progress, "totalXp"));
            Assert.Equal(2600, Number(progress, "nextLevelXp"));
        }
    }

    [Fact]
    public async Task A_ride_past_a_threshold_answers_the_new_level_and_a_repeat_answers_the_same()
    {
        var (browser, _) = await SignedIn("lena.up@example.com");
        using (browser)
        {
            var ride = RideBodies.Race(Guid.NewGuid());

            var answer = await Submit(browser, ride);
            var repeat = await Submit(browser, ride, HttpStatusCode.OK);

            Assert.Equal(412, Number(answer, "totalXp"));
            Assert.Equal(2, Number(answer, "level"));
            Assert.True(answer.GetProperty("levelUp").GetBoolean());
            Assert.Equal(650, Number(answer, "nextLevelXp"));
            Assert.Equal(238, Number(answer, "xpToNextLevel"));
            Assert.Equal(answer.GetRawText(), repeat.GetRawText());
            Assert.Equal(2, Number(await Progress(browser), "level"));
        }
    }

    [Fact]
    public async Task A_ride_short_of_the_next_threshold_keeps_the_level()
    {
        var (browser, _) = await SignedIn("lena.same@example.com", totalXp: 1840);
        using (browser)
        {
            var answer = await Submit(browser, RideBodies.Class(Guid.NewGuid()));

            Assert.Equal(1990, Number(answer, "totalXp"));
            Assert.Equal(7, Number(answer, "level"));
            Assert.False(answer.GetProperty("levelUp").GetBoolean());
            Assert.Equal(610, Number(answer, "xpToNextLevel"));
        }
    }

    [Fact]
    public async Task At_level_30_the_total_grows_and_the_level_stays_30()
    {
        var (browser, _) = await SignedIn("lena.top@example.com", totalXp: 30_000);
        using (browser)
        {
            var answer = await Submit(browser, RideBodies.Class(Guid.NewGuid()));

            Assert.Equal(30_150, Number(answer, "totalXp"));
            Assert.Equal(30, Number(answer, "level"));
            Assert.False(answer.GetProperty("levelUp").GetBoolean());
            Assert.Null(Number(answer, "nextLevelXp"));
            Assert.Null(Number(answer, "xpToNextLevel"));
            var progress = await Progress(browser);
            Assert.Equal(30, Number(progress, "level"));
            Assert.Null(Number(progress, "nextLevelXp"));
        }
    }

    [Fact]
    public async Task Progress_needs_a_session()
    {
        using var visitor = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        using var response = await visitor.GetAsync("/api/progress", Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
