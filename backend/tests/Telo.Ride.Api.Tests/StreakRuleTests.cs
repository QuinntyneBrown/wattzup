// Direct test of a rule with a table of cases
// Traces to: L2-042 AC1, AC2, AC3
// Description: recording a ride day leaves the streak as it is for a second ride that day or a ride on an earlier day,
// adds one for the next day and starts again at 1 after a gap; the streak reads as it is while its last ride day is
// today or yesterday, and 0 after that. A ride's day is its finish in the time zone it was submitted with.
using System.Globalization;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Api.Tests;

public sealed class StreakRuleTests
{
    private static readonly DateOnly Monday = new(2026, 11, 23);

    [Theory]
    [InlineData(0, null, 0, 1)] // the first ride day starts it
    [InlineData(4, 0, 0, 4)] // a second ride on the same day
    [InlineData(4, 0, 1, 5)] // the next day
    [InlineData(4, 0, 2, 1)] // after a day with no ride
    [InlineData(4, 0, -1, 4)] // a ride on an earlier day, submitted late
    public void Recording_a_ride_day(int days, int? lastRideOffset, int rideOffset, int expected)
    {
        var streak = new Streak(days, lastRideOffset is { } offset ? Monday.AddDays(offset) : null);

        Assert.Equal(expected, streak.Record(Monday.AddDays(rideOffset)).Days);
    }

    [Theory]
    [InlineData(0, 4)] // the last ride day is today
    [InlineData(1, 4)] // yesterday
    [InlineData(2, 0)] // a whole day with no ride
    public void Reading_the_streak(int daysSinceLastRide, int expected)
    {
        Assert.Equal(expected, new Streak(4, Monday).DaysOn(Monday.AddDays(daysSinceLastRide)));
    }

    [Fact]
    public void A_rider_who_never_rode_has_none() => Assert.Equal(0, new Streak(0, null).DaysOn(Monday));

    [Theory]
    [InlineData("America/Toronto", "2026-11-21")]
    [InlineData("Europe/London", "2026-11-22")]
    [InlineData("Asia/Tokyo", "2026-11-22")]
    public void A_ride_day_is_the_finish_in_its_time_zone(string zone, string day)
    {
        var finish = DateTimeOffset.Parse("2026-11-22T04:30:00Z", CultureInfo.InvariantCulture);

        Assert.Equal(DateOnly.Parse(day, CultureInfo.InvariantCulture), RiderDay.LocalDay(finish, zone));
    }
}
