// Unit test
// Traces to: L2-121 AC1, AC2; L2-052 AC1, AC5; L2-053 AC1, AC2; L2-054 AC1, AC2, AC3; L2-055 AC1, AC2, AC3; L2-057 AC2;
// L2-120 AC3; L2-121 AC3; L2-123 AC1, AC2; L2-124 AC1, AC2, AC4; L2-125 AC1; L2-071 AC3
// Description: a race session seats riders in the first open seat, each in the next free jersey, and a seated rider who
// asks again keeps their seat. It is open while a seat is free and more than 10 seconds remain. A leaver's seat opens
// again with their name before the bots fill it, and goes to the next bot after. At 10 seconds to the start bots take
// every open seat, ready, in the bot list's order. A seat whose rider's connection has been gone 10 seconds is freed,
// unless the rider joins the session again. From the start it keeps each seated rider's distance, ignoring a report
// less than 500 ms after the last, and ranks by distance held at the route's length, a tie to whoever reached it first
// (L2-123 AC1, AC2), each gap the seconds since the leader reached the rider's distance, from a trace of the last 600.
// Once started, a leaver keeps the seat marked DNF, as does a racer silent 15 seconds; a rider gone 30 seconds is
// removed and refused a rejoin; DNF ranks last, and a rider held at the line is finished (L2-124 AC1, AC2, AC4).
// It ends when every person has finished or is DNF, or 2 minutes after the first person finished, with each seat's
// place, time and output from the progress it received; once ended it rides no further (L2-125 AC1, L2-071 AC3).
using System.Globalization;
using Telo.Ride.Domain.Classes;
using Telo.Ride.Domain.Races;
using Telo.Ride.Domain.Results;

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

    [Fact]
    public void Joining_again_gives_back_the_held_seat_and_keeps_it_from_a_lost_connection_and_a_stranger_gets_none()
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);
        session.TrySeat(Rider(2), "jwatts", 7);
        session.ConnectionLost(Rider(2), Opened);

        Assert.Equal(2, session.Rejoin(Rider(2)));
        Assert.Null(session.Rejoin(Rider(3)));
        session.Tick(Opened.AddSeconds(15));

        Assert.Equal("jwatts", session.Seats[1]!.Name);
    }

    [Fact]
    public void A_race_ranks_by_distance_held_at_the_route_length_a_tie_to_whoever_reached_it_first()
    {
        var session = Full();
        session.Ride(Start, RouteMetres);
        session.RecordProgress(Rider(3), 400, 300, Start.AddSeconds(0.5));
        session.Ride(Start.AddSeconds(1), RouteMetres);
        session.RecordProgress(Rider(5), 300, 300, Start.AddSeconds(1.5));
        session.RecordProgress(Rider(2), 120, 250, Start.AddSeconds(1.5));

        var rows = session.Ride(Start.AddSeconds(2), RouteMetres)!;

        Assert.Equal(
            [(1, 3, 300.0, 0.0), (2, 5, 300.0, 0.0), (3, 2, 120.0, 1.6), (4, 1, 0.0, 2.0)],
            rows.Take(4).Select(row => (row.Position, row.Seat, row.DistanceMetres, row.GapSeconds)));
        Assert.Equal([1, 4, 6, 7, 8, 9, 10], rows.Skip(3).Select(row => row.Seat));
        Assert.Equal(new RaceStandingRow(1, 3, "rider 3", "priya", 3, RiderKind.Person, 300, 0, RaceStatus.Finished), rows[0]);
    }

    [Fact]
    public void Progress_counts_from_a_seated_rider_from_the_start_half_a_second_or_more_after_their_last()
    {
        var session = Full();

        Assert.False(session.RecordProgress(Rider(1), 10, 200, Start.AddSeconds(-1)));
        Assert.False(session.RecordProgress(Rider(11), 10, 200, Start));
        Assert.False(session.RecordProgress(Rider(1), double.NaN, 200, Start));
        Assert.True(session.RecordProgress(Rider(1), 10, 200, Start));
        Assert.False(session.RecordProgress(Rider(1), 12, 200, Start.AddSeconds(0.4)));
        Assert.True(session.RecordProgress(Rider(1), 12, 200, Start.AddSeconds(0.5)));
    }

    [Fact]
    public void The_trace_keeps_the_last_600_seconds_so_a_gap_is_at_most_600()
    {
        var session = Full();
        for (var second = 0; second < 700; second++)
        {
            session.RecordProgress(Rider(1), second + 1, 200, Start.AddSeconds(second + 0.5));
            session.Ride(Start.AddSeconds(second + 1), 10_000);
        }

        var rows = session.Ride(Start.AddSeconds(700), 10_000)!;

        Assert.Equal((1, 0.0), (rows[0].Seat, rows[0].GapSeconds));
        Assert.Equal((2, 600.0), (rows[1].Seat, rows[1].GapSeconds));
    }

    [Fact]
    public void A_rider_who_leaves_a_running_race_keeps_the_seat_marked_DNF_ranked_last_at_their_distance()
    {
        var session = Full();
        session.Ride(Start, RouteMetres);
        session.RecordProgress(Rider(4), 90, 300, Start.AddSeconds(0.5));
        session.Ride(Start.AddSeconds(1), RouteMetres);

        Assert.Equal(new RaceLeave("rider 4"), session.Leave(Rider(4), Start.AddSeconds(1.5)));

        var rows = session.Standings();
        Assert.Equal((10, 4, 90.0, RaceStatus.Dnf), (rows[^1].Position, rows[^1].Seat, rows[^1].DistanceMetres, rows[^1].Status));
        Assert.All(rows.SkipLast(1), row => Assert.Equal(RaceStatus.Riding, row.Status));
        Assert.Equal("rider 4", session.Seats[3]!.Name);
    }

    [Theory]
    [InlineData(14, RaceStatus.Riding)]
    [InlineData(15, RaceStatus.Dnf)]
    public void A_racing_rider_silent_for_15_seconds_is_DNF(int silentSeconds, RaceStatus status)
    {
        var session = Full();
        session.RecordProgress(Rider(1), 20, 300, Start.AddSeconds(1));

        var rows = session.Ride(Start.AddSeconds(1 + silentSeconds), RouteMetres)!;

        Assert.Equal(status, rows.Single(row => row.Seat == 1).Status);
    }

    [Fact]
    public void A_rider_held_at_the_line_is_finished_and_never_DNF_however_long_silent()
    {
        var session = Full();
        session.RecordProgress(Rider(1), 400, 300, Start.AddSeconds(1));

        var rows = session.Ride(Start.AddSeconds(60), RouteMetres)!;

        Assert.Equal((1, RaceStatus.Finished), (rows[0].Seat, rows[0].Status));
        Assert.Equal(RaceStatus.Dnf, rows.Single(row => row.Seat == 2).Status);
    }

    [Fact]
    public void A_rider_gone_30_seconds_from_a_running_race_is_removed_and_cannot_rejoin()
    {
        var session = Full();
        session.ConnectionLost(Rider(1), Start.AddSeconds(2));
        session.ConnectionLost(Rider(2), Start.AddSeconds(2));
        Assert.Equal(2, session.Rejoin(Rider(2)));

        session.Ride(Start.AddSeconds(32), RouteMetres);

        Assert.Null(session.Rejoin(Rider(1)));
        Assert.Equal(2, session.Rejoin(Rider(2)));
        Assert.Equal(RaceStatus.Dnf, session.Standings().Single(row => row.Seat == 1).Status);
    }

    [Theory]
    [InlineData(14, false)]
    [InlineData(15, true)]
    public void A_race_ends_once_every_person_has_finished_or_is_DNF(int second, bool ended)
    {
        var session = Full();
        session.RecordProgress(Rider(1), 400, 300, Start.AddSeconds(1));

        session.Ride(Start.AddSeconds(second), RouteMetres);
        var result = session.Result(Start.AddSeconds(second));

        Assert.Equal(ended, result is not null);
        if (result is null) return;
        Assert.Equal((1, Rider(1), 1, 0.3, RaceStatus.Finished), Describe(result.Entries[0]));
        Assert.All(result.Entries.Skip(1), entry => Assert.Equal((null, 0.0, RaceStatus.Dnf), (entry.TimeSeconds, entry.OutputKj, entry.Status)));
    }

    [Theory]
    [InlineData(120, false)]
    [InlineData(121, true)]
    public void A_race_ends_2_minutes_after_the_first_person_finished_the_rest_placed_by_distance(int second, bool ended)
    {
        var session = new RaceSession("old-town-criterium", Start);
        session.TrySeat(Rider(1), "lena.k", 4);
        session.TrySeat(Rider(2), "MarcoVelo", 11);
        session.Tick(Start.AddSeconds(-10));
        session.RecordProgress(Rider(1), 400, 300, Start.AddSeconds(1));
        for (var t = 1; t <= second; t += 10)
        {
            session.RecordProgress(Rider(2), t, 200, Start.AddSeconds(t));
            session.Ride(Start.AddSeconds(Math.Min(t + 10, second)), RouteMetres);
        }

        var result = session.Result(Start.AddSeconds(second));

        Assert.Equal(ended, result is not null);
        if (result is null) return;
        Assert.Equal((1, Rider(1), 1, 0.3, RaceStatus.Finished), Describe(result.Entries[0]));
        var marco = result.Entries.Single(entry => entry.RiderId == Rider(2));
        Assert.Equal((10, null, RaceStatus.Riding), (marco.Place, marco.TimeSeconds, marco.Status));
        Assert.All(result.Entries.Where(entry => entry.Name.StartsWith("Pacer", StringComparison.Ordinal)), bot => Assert.Null(bot.RiderId));
    }

    [Fact]
    public void An_ended_race_rides_no_further_and_has_no_result_again()
    {
        var session = Full();
        session.RecordProgress(Rider(1), 400, 300, Start.AddSeconds(1));
        session.Ride(Start.AddSeconds(15), RouteMetres);
        Assert.NotNull(session.Result(Start.AddSeconds(15)));

        session.End();

        Assert.Null(session.Ride(Start.AddSeconds(16), RouteMetres));
        Assert.Null(session.Result(Start.AddSeconds(16)));
    }

    [Fact]
    public void Before_the_start_a_race_has_no_standings() => Assert.Null(Full().Ride(Start.AddSeconds(-1), RouteMetres));

    private const double RouteMetres = 300;

    /// <summary>A session of ten riders, "rider 1" to "rider 10" at level n, so no bot takes a seat.</summary>
    private static RaceSession Full()
    {
        var session = new RaceSession("old-town-criterium", Start);
        for (var n = 1; n <= RaceSession.Capacity; n++) session.TrySeat(Rider(n), $"rider {n}", n);
        return session;
    }

    private static (int, Guid?, int?, double, RaceStatus) Describe(SessionResultEntry entry) =>
        (entry.Place, entry.RiderId, entry.TimeSeconds, entry.OutputKj, entry.Status);

    private static Guid Rider(int n) => new($"00000000-0000-0000-0000-{n:D12}");
}
