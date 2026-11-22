// Unit test
// Traces to: L2-122 AC1, AC2, AC3; L2-086 AC3; L2-120 AC3; L2-123 AC1, AC2; L2-083
// Description: a group session seats a rider until it starts, while fewer than 10 are seated, each seat in the next
// jersey of the seat palette; a seated rider who joins again keeps their seat, even once it has started. A new rider is
// refused when it has started or is full. From the start it keeps each seated rider's report, unless the last came less
// than 500 ms ago; at its first tick bots fill it to 10 when fewer than 8 are seated, and it ranks everyone by output.
using System.Globalization;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Api.Tests;

public sealed class GroupClassSessionTests
{
    private static readonly DateTimeOffset Start = DateTimeOffset.Parse("2026-11-21T19:45:00Z", CultureInfo.InvariantCulture);
    private static readonly DateTimeOffset Before = Start.AddMinutes(-6);

    [Fact]
    public void The_first_riders_take_seats_in_the_palettes_order()
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);

        var lena = session.TrySeat(Rider(1), "lena.k", Before);
        var marco = session.TrySeat(Rider(2), "MarcoVelo", Before);

        Assert.Equal((JoinOutcome.Seated, new SessionSeat(Rider(1), "lena.k", "lena")), lena);
        Assert.Equal((JoinOutcome.Seated, new SessionSeat(Rider(2), "MarcoVelo", "marco")), marco);
        Assert.Equal("hiit-cardio-30@20261121T1945Z", session.Id);
        Assert.Equal([lena.Seat!, marco.Seat!], session.Seats);
    }

    [Theory]
    [InlineData(-6)]
    [InlineData(0)]
    [InlineData(10)]
    public void A_seated_rider_who_joins_again_keeps_their_seat(int minutesFromStart)
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);
        var first = session.TrySeat(Rider(1), "lena.k", Before);

        var again = session.TrySeat(Rider(1), "lena.k", Start.AddMinutes(minutesFromStart));

        Assert.Equal(first, again);
        Assert.Equal(1, session.SeatsTaken);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    public void A_new_rider_is_refused_once_the_session_has_started(int secondsFromStart)
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);

        var refused = session.TrySeat(Rider(1), "lena.k", Start.AddSeconds(secondsFromStart));

        Assert.Equal((JoinOutcome.Started, null), refused);
        Assert.Equal(0, session.SeatsTaken);
    }

    [Theory]
    [InlineData(9, JoinOutcome.Seated)]
    [InlineData(10, JoinOutcome.Full)]
    public void A_new_rider_is_seated_while_fewer_than_ten_are(int seated, JoinOutcome outcome)
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);
        for (var i = 1; i <= seated; i++) session.TrySeat(Rider(i), $"rider {i}", Before);

        var joined = session.TrySeat(Rider(99), "jwatts", Before);

        Assert.Equal(outcome, joined.Outcome);
        Assert.True(session.Full);
        Assert.Equal(10, session.SeatsTaken);
    }

    [Fact]
    public void The_tenth_seat_takes_the_palettes_tenth_jersey()
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);
        for (var i = 1; i <= 10; i++) session.TrySeat(Rider(i), $"rider {i}", Before);

        Assert.Equal(["lena", "marco", "priya", "jwatts", "ollie", "kenji", "ana", "nova", "rook", "juno"], session.Seats.Select(s => s.Jersey));
    }

    [Theory]
    [InlineData(1, true, -1000, false)]
    [InlineData(1, false, 0, false)]
    [InlineData(1, true, 0, true)]
    [InlineData(2, true, 499, false)]
    [InlineData(2, true, 500, true)]
    public void A_report_is_kept_from_a_seated_rider_from_the_start_and_half_a_second_after_the_last(
        int reports, bool seated, int millisecondsAfter, bool kept)
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);
        if (seated) session.TrySeat(Rider(1), "lena.k", Before);
        if (reports == 2) session.RecordProgress(Rider(1), 1, 100, Start);

        Assert.Equal(kept, session.RecordProgress(Rider(1), 2, 100, Start.AddMilliseconds(millisecondsAfter)));
    }

    [Theory]
    [InlineData(1, 9)]
    [InlineData(7, 3)]
    [InlineData(8, 0)]
    [InlineData(10, 0)]
    public void At_the_first_tick_bots_fill_the_seats_to_ten_when_fewer_than_eight_are_seated(int riders, int bots)
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);
        for (var i = 1; i <= riders; i++) session.TrySeat(Rider(i), $"rider {i}", Before);

        var rows = session.Tick(Start)!;

        Assert.Equal(riders + bots, rows.Count);
        Assert.Equal(bots, rows.Count(row => row.Kind == RiderKind.Bot));
    }

    [Fact]
    public void Before_the_start_there_are_no_standings() =>
        Assert.Null(new GroupClassSession("hiit-cardio-30", Start).Tick(Before));

    [Fact]
    public void The_standings_rank_by_output_with_the_gap_to_the_leader_and_seats_first_on_a_tie()
    {
        var session = new GroupClassSession("hiit-cardio-30", Start);
        for (var i = 1; i <= 8; i++) session.TrySeat(Rider(i), $"rider {i}", Before, level: i);
        session.RecordProgress(Rider(3), 12.5, 180, Start);
        session.RecordProgress(Rider(5), 3, 120, Start);

        var rows = session.Tick(Start.AddSeconds(1))!;

        Assert.Equal(new StandingRow(1, "rider 3", "priya", 3, RiderKind.Person, 12.5, 0), rows[0]);
        Assert.Equal(new StandingRow(2, "rider 5", "ollie", 5, RiderKind.Person, 3, 9.5), rows[1]);
        Assert.Equal(new StandingRow(3, "rider 1", "lena", 1, RiderKind.Person, 0, 12.5), rows[2]);
    }

    private static Guid Rider(int n) => new($"00000000-0000-0000-0000-{n:D12}");
}
