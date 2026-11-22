// Acceptance test
// Traces to: L2-083 AC1, L2-122 AC1
// Description: each open class has a group session every 15 minutes, on the quarter hours, seating up to 10 riders.
// A signed-in rider reads a class's next two sessions (Class Start) and each class's next session (the Class Library's
// chip); a session that starts now has started. Seats are taken from slice 14.3, so every seat is free here. A class the
// catalogue does not hold is 404 class_not_found, and a request without a session is 401.
using System.Net;
using System.Net.Http.Json;

namespace Telo.Ride.Api.Tests;

public sealed class GroupSessionsTests(SignedInProbeApi signedIn, TeloRideApiFactory anonymous)
    : IClassFixture<SignedInProbeApi>, IClassFixture<TeloRideApiFactory>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_rider_reads_the_next_two_sessions_of_a_class_on_the_quarter_hours()
    {
        var quarter = MoveTo(minutesPastQuarter: 6);
        using var client = signedIn.CreateClient();

        var sessions = await client.GetFromJsonAsync<Session[]>("/api/classes/hiit-cardio-30/sessions", Cancel);

        Assert.Equal(
            [
                new Session(Id("hiit-cardio-30", quarter.AddMinutes(15)), quarter.AddMinutes(15), 0, 10, false, []),
                new Session(Id("hiit-cardio-30", quarter.AddMinutes(30)), quarter.AddMinutes(30), 0, 10, false, []),
            ],
            sessions!.Select(s => s with { Riders = [] }));
        Assert.All(sessions!, s => Assert.Empty(s.Riders));
    }

    [Fact]
    public async Task A_session_that_starts_now_has_started()
    {
        var quarter = MoveTo(minutesPastQuarter: 0);
        using var client = signedIn.CreateClient();

        var sessions = await client.GetFromJsonAsync<Session[]>("/api/classes/hiit-cardio-30/sessions", Cancel);

        Assert.Equal([quarter.AddMinutes(15), quarter.AddMinutes(30)], sessions!.Select(s => s.StartsAt));
    }

    [Fact]
    public async Task A_rider_reads_the_next_session_of_every_class()
    {
        var quarter = MoveTo(minutesPastQuarter: 14);
        using var client = signedIn.CreateClient();

        var next = await client.GetFromJsonAsync<NextSession[]>("/api/classes/sessions", Cancel);

        Assert.Equal(
            ["power-intervals-20", "threshold-builder-20", "hiit-cardio-30", "tempo-paceline-30",
             "vice-city-pyramid-30", "dolomites-endurance-60", "coastal-endurance-surges-60"],
            next!.Select(n => n.ClassId));
        Assert.All(next!, n =>
        {
            Assert.Equal(quarter.AddMinutes(15), n.StartsAt);
            Assert.Equal(Id(n.ClassId, quarter.AddMinutes(15)), n.SessionId);
            Assert.Equal((0, 10), (n.SeatsTaken, n.Capacity));
        });
    }

    [Fact]
    public async Task A_class_the_catalogue_does_not_hold_has_no_sessions()
    {
        using var client = signedIn.CreateClient();

        using var response = await client.GetAsync("/api/classes/no-such-class/sessions", Cancel);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("class_not_found", (await response.Content.ReadFromJsonAsync<Problem>(Cancel))!.Code);
    }

    [Theory]
    [InlineData("/api/classes/hiit-cardio-30/sessions")]
    [InlineData("/api/classes/sessions")]
    public async Task The_sessions_need_a_signed_in_rider(string path)
    {
        using var client = anonymous.CreateClient();

        using var response = await client.GetAsync(path, Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    /// <summary>Moves the fake clock on to the next time that many minutes past a quarter hour; returns that quarter.</summary>
    private DateTimeOffset MoveTo(int minutesPastQuarter)
    {
        var now = signedIn.Clock.GetUtcNow();
        var quarter = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, now.Minute / 15 * 15, 0, TimeSpan.Zero);
        var target = quarter.AddMinutes(minutesPastQuarter);
        if (target <= now)
        {
            quarter = quarter.AddMinutes(15);
            target = quarter.AddMinutes(minutesPastQuarter);
        }
        signedIn.Clock.Advance(target - now);
        return quarter;
    }

    private static string Id(string classId, DateTimeOffset start) => $"{classId}@{start:yyyyMMdd'T'HHmm'Z'}";

    private sealed record Session(string Id, DateTimeOffset StartsAt, int SeatsTaken, int Capacity, bool Full, Rider[] Riders);

    private sealed record Rider(string DisplayName, string Jersey);

    private sealed record NextSession(string ClassId, string SessionId, DateTimeOffset StartsAt, int SeatsTaken, int Capacity);

    private sealed record Problem(string Code);
}
