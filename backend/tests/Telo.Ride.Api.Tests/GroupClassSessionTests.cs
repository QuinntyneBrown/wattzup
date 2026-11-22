// Unit test
// Traces to: L2-122 AC1, AC2; L2-086 AC3; L2-120 AC3
// Description: a group session seats a rider until it starts, while fewer than 10 are seated, each seat in the next
// jersey of the seat palette; a seated rider who joins again keeps their seat, even once it has started. A new rider is
// refused when it has started or is full.
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

    private static Guid Rider(int n) => new($"00000000-0000-0000-0000-{n:D12}");
}
