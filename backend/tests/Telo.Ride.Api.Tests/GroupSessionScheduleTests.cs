// Unit test
// Traces to: L2-083 AC1, L2-122 AC1
// Description: the group sessions start on the quarter hours (UTC); the next one starts after now, so one starting
// now has started, and an evening's last quarter is followed by midnight. A session's id names its class and a
// quarter-hour start; any other id names no session.
using System.Globalization;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Api.Tests;

public sealed class GroupSessionScheduleTests
{
    [Theory]
    [InlineData("2026-11-21T19:30:00Z", "2026-11-21T19:45:00Z")]
    [InlineData("2026-11-21T19:30:01Z", "2026-11-21T19:45:00Z")]
    [InlineData("2026-11-21T19:44:59Z", "2026-11-21T19:45:00Z")]
    [InlineData("2026-11-21T19:45:00Z", "2026-11-21T20:00:00Z")]
    [InlineData("2026-11-21T23:50:00Z", "2026-11-22T00:00:00Z")]
    public void The_next_session_starts_on_the_quarter_hour_after_now(string now, string next)
    {
        var starts = GroupSessionSchedule.Next(At(now), 2);

        Assert.Equal([At(next), At(next).AddMinutes(15)], starts);
    }

    [Fact]
    public void A_session_seats_ten_and_is_named_by_its_class_and_start()
    {
        Assert.Equal(10, GroupSessionSchedule.Capacity);
        Assert.Equal(
            "hiit-cardio-30@20261121T1945Z",
            GroupSessionSchedule.SessionId("hiit-cardio-30", At("2026-11-21T19:45:00Z")));
    }

    [Theory]
    [InlineData("hiit-cardio-30@20261121T1945Z", "hiit-cardio-30", "2026-11-21T19:45:00Z")]
    [InlineData("power-intervals-20@20261122T0000Z", "power-intervals-20", "2026-11-22T00:00:00Z")]
    public void A_session_id_names_its_class_and_start(string id, string classId, string start)
    {
        Assert.True(GroupSessionSchedule.TryParse(id, out var parsedClass, out var parsedStart));
        Assert.Equal((classId, At(start)), (parsedClass, parsedStart));
    }

    [Theory]
    [InlineData("hiit-cardio-30")]
    [InlineData("hiit-cardio-30@")]
    [InlineData("@20261121T1945Z")]
    [InlineData("hiit-cardio-30@20261121T1946Z")]
    [InlineData("hiit-cardio-30@20261121T1945")]
    [InlineData("hiit-cardio-30@2026-11-21T19:45Z")]
    [InlineData("hiit-cardio-30@20261121T2560Z")]
    public void An_id_off_the_schedule_names_no_session(string id)
    {
        Assert.False(GroupSessionSchedule.TryParse(id, out _, out _));
    }

    private static DateTimeOffset At(string iso) => DateTimeOffset.Parse(iso, CultureInfo.InvariantCulture);
}
