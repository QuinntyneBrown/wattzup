// Unit test
// Traces to: L2-121 AC1, AC2; L2-052 AC1, AC5; L2-053 AC1, AC2; L2-054 AC1, AC2, AC3; L2-055 AC1, AC2, AC3; L2-057 AC2;
// L2-120 AC3
// Description: a race session seats riders in the first open seat, each in the next free jersey, and a seated rider who
// asks again keeps their seat. It is open while a seat is free and more than 10 seconds remain. A leaver's seat opens
// again with their name before the bots fill it, and goes to the next bot after. At 10 seconds to the start bots take
// every open seat, ready, in the bot list's order. A seat whose rider's connection has been gone 10 seconds is freed.
using System.Globalization;
using Telo.Ride.Domain.Races;

namespace Telo.Ride.Api.Tests;

public sealed class RaceSessionTests
{
    private static readonly DateTimeOffset Opened = DateTimeOffset.Parse("2026-11-22T18:00:00Z", CultureInfo.InvariantCulture);
    private static readonly DateTimeOffset Start = Opened + RaceSession.Lobby;

    [Fact]
    public void Riders_take_the_first_open_seat_in_the_next_free_jersey_and_keep_it()
    {
        var session = new RaceSession("old-town-criterium", Start);

        Assert.Equal(1, session.TrySeat(Rider(1), "lena.k", 4));
        Assert.Equal(2, session.TrySeat(Rider(2), "MarcoVelo", 11));
        Assert.Equal(1, session.TrySeat(Rider(1), "lena.k", 4));
        Assert.Equal("old-town-criterium@20261122T180030Z", session.Id);
        Assert.Equal(new RaceSeat(RaceSeatKind.Rider, Rider(2), "MarcoVelo", "marco", 11, false), session.Seats[1]);

        session.Release(Rider(1));
        Assert.Equal(1, session.TrySeat(Rider(3), "priya_spins", 18));
        Assert.Equal("lena", session.Seats[0]!.Jersey);
    }

    [Theory]
    [InlineData(0, 1, true)]
    [InlineData(19, 1, true)]
    [InlineData(20, 1, false)]
    [InlineData(0, 10, false)]
    public void A_session_is_open_while_a_seat_is_free_and_more_than_10_seconds_remain(int secondsIn, int riders, bool open)
    {
        var session = new RaceSession("old-town-criterium", Start);
        for (var i = 1; i <= riders; i++) session.TrySeat(Rider(i), $"rider {i}", 1);

        Assert.Equal(open, session.IsOpen(Opened.AddSeconds(secondsIn)));
    }

    [Fact]
    public void Ready_marks_the_rider_seat_and_pressing_again_clears_it()
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);

        Assert.True(session.SetReady(Rider(1), true));
        Assert.True(session.Seats[0]!.Ready);
        Assert.True(session.SetReady(Rider(1), false));
        Assert.False(session.Seats[0]!.Ready);
        Assert.False(session.SetReady(Rider(9), true));
    }

    [Fact]
    public void At_10_seconds_to_the_start_bots_take_every_open_seat_ready_in_list_order()
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);
        session.TrySeat(Rider(2), "MarcoVelo", 11);
        session.Release(Rider(1));

        Assert.False(session.Tick(Start.AddSeconds(-11)).Changed);
        var (left, changed) = session.Tick(Start.AddSeconds(-10));

        Assert.True(changed);
        Assert.Empty(left);
        Assert.Equal(
            ["Pacer Nova", "MarcoVelo", "Pacer Rook", "Pacer Juno", "Pacer Atlas", "Pacer Kite", "Pacer Vale", "Pacer Moss", "Pacer Flint", "Pacer Echo"],
            session.Seats.Select(seat => seat!.Name));
        Assert.Equal(new RaceSeat(RaceSeatKind.Bot, null, "Pacer Nova", "nova", null, true), session.Seats[0]);
        Assert.False(session.Tick(Start.AddSeconds(-9)).Changed);
    }

    [Fact]
    public void A_leaver_before_the_fill_opens_the_seat_with_their_name_and_after_it_a_bot_takes_it()
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);
        session.TrySeat(Rider(2), "MarcoVelo", 11);
        session.TrySeat(Rider(3), "priya_spins", 18);

        Assert.Equal(new RaceLeave("MarcoVelo"), session.Release(Rider(2)));
        Assert.Null(session.Seats[1]);

        session.Tick(Start.AddSeconds(-10));
        Assert.Equal(new RaceLeave(null), session.Release(Rider(3)));
        Assert.Equal(new RaceSeat(RaceSeatKind.Bot, null, "Pacer Echo", "echo", null, true), session.Seats[2]);
        Assert.Null(session.Release(Rider(9)));
    }

    [Theory]
    [InlineData(9, false)]
    [InlineData(10, true)]
    public void A_seat_whose_connection_has_been_gone_10_seconds_is_freed(int secondsGone, bool freed)
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);
        session.TrySeat(Rider(2), "jwatts", 7);
        session.ConnectionLost(Rider(2), Opened);

        var (left, _) = session.Tick(Opened.AddSeconds(secondsGone));

        Assert.Equal(freed, session.Seats[1] is null);
        Assert.Equal(freed ? ["jwatts"] : [], left);
    }

    [Fact]
    public void Finding_the_race_again_keeps_the_seat_of_a_lost_connection()
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);
        session.ConnectionLost(Rider(1), Opened);

        Assert.Equal(1, session.TrySeat(Rider(1), "lena.k", 4));
        session.Tick(Opened.AddSeconds(15));

        Assert.Equal("lena.k", session.Seats[0]!.Name);
    }

    private static Guid Rider(int n) => new($"00000000-0000-0000-0000-{n:D12}");
}
