// Acceptance test
// Traces to: L2-042 AC1, AC2, AC3, AC4; L2-037 AC4
// Description: the backend keeps the rider's streak. Each calendar day, in the time zone the ride was submitted with,
// that has a finished ride extends it by one; a second ride that day leaves it as it is; once a whole day passes with
// no ride, it reads 0. The ride's "{n}-day streak" XP line and GET /api/progress give the same number.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class StreakTests(SignInApi api) : IClassFixture<SignInApi>
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

    /// <summary>Submits a class that finished at <paramref name="finishedAt"/> in <paramref name="zone"/>; its streak line.</summary>
    private static async Task<string?> Ride(HttpClient browser, DateTimeOffset finishedAt, string zone = "Europe/London")
    {
        var ride = RideBodies.Class(Guid.NewGuid());
        ride["finishedAt"] = finishedAt.ToString("o");
        ride["timeZoneId"] = zone;
        using var response = await browser.PostAsJsonAsync("/api/rides", ride, Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();
        Assert.True(response.StatusCode == HttpStatusCode.Created, body.GetRawText());
        return body.GetProperty("xpLines").EnumerateArray()
            .Where(line => line.GetProperty("kind").GetString() == "streak")
            .Select(line => $"{line.GetProperty("label").GetString()} +{line.GetProperty("xp").GetInt32()}")
            .SingleOrDefault();
    }

    private static async Task<int> StreakDays(HttpClient browser)
    {
        using var response = await browser.GetAsync("/api/progress", Cancel);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.GetProperty("streakDays").GetInt32();
    }

    private DateTimeOffset Now => api.Clock.GetUtcNow();

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Each_day_with_a_ride_extends_the_streak_and_the_xp_line_agrees() // AC1, AC4
    {
        using var browser = await SignedIn("rio.days@example.com");

        Assert.Equal("1-day streak +10", await Ride(browser, Now));
        api.Clock.Advance(TimeSpan.FromDays(1));
        Assert.Equal("2-day streak +20", await Ride(browser, Now));
        api.Clock.Advance(TimeSpan.FromDays(1));
        Assert.Equal("3-day streak +30", await Ride(browser, Now));

        Assert.Equal(3, await StreakDays(browser));
    }

    [Fact]
    public async Task Two_rides_on_one_day_grow_it_once() // AC3
    {
        using var browser = await SignedIn("rio.twice@example.com");

        Assert.Equal("1-day streak +10", await Ride(browser, Now - TimeSpan.FromMinutes(30)));
        Assert.Equal("1-day streak +10", await Ride(browser, Now));

        Assert.Equal(1, await StreakDays(browser));
    }

    [Fact]
    public async Task A_whole_day_with_no_ride_resets_it_to_0() // AC2
    {
        using var browser = await SignedIn("rio.missed@example.com");
        await Ride(browser, Now);
        var rideDay = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(Now, TimeZoneInfo.FindSystemTimeZoneById("Europe/London")).DateTime);
        var londonMidnight = new DateTimeOffset(rideDay.AddDays(1).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);

        api.Clock.Advance(londonMidnight.AddHours(23) - Now);
        Assert.Equal(1, await StreakDays(browser));
        api.Clock.Advance(TimeSpan.FromHours(2));
        Assert.Equal(0, await StreakDays(browser));
        Assert.Equal("1-day streak +10", await Ride(browser, Now));
    }

    [Fact]
    public async Task The_day_is_the_one_in_the_rides_time_zone() // AC1
    {
        using var browser = await SignedIn("rio.toronto@example.com");
        var toronto = TimeZoneInfo.FindSystemTimeZoneById("America/Toronto");
        var localNow = TimeZoneInfo.ConvertTime(Now, toronto);
        var nextMidnight = new DateTimeOffset(localNow.Date.AddDays(1), toronto.GetUtcOffset(localNow.Date.AddDays(1)));
        api.Clock.Advance(nextMidnight.AddHours(1) - Now);

        // 23:30 and 00:30 in Toronto: the same day in UTC, two days on the rider's calendar.
        Assert.Equal("1-day streak +10", await Ride(browser, nextMidnight.AddMinutes(-30), "America/Toronto"));
        Assert.Equal("2-day streak +20", await Ride(browser, nextMidnight.AddMinutes(30), "America/Toronto"));
        Assert.Equal(2, await StreakDays(browser));
    }
}
