using Telo.Ride.Domain.Bots;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Domain.Races;

/// <summary>Who sits in a seat of a race's start grid.</summary>
public enum RaceSeatKind
{
    Rider,
    Bot,
}

/// <summary>
/// A taken seat of a race's start grid (L2-052): a rider, with the name others see, the seat's jersey (a design-system
/// jersey token) and their level when they joined; or a bot, in the jersey of its name and with no level. Ready once
/// they have pressed "I'm ready"; a bot is always ready (L2-054 AC2).
/// </summary>
public sealed record RaceSeat(RaceSeatKind Kind, Guid? RiderId, string Name, string Jersey, int? Level, bool Ready);

/// <summary>What leaving a race session comes to (L2-055).</summary>
/// <param name="Name">The leaver's name, for the notice; <c>null</c> when a bot took the seat at once.</param>
public sealed record RaceLeave(string? Name);

/// <summary>
/// One race session on a map (docs/detailed-designs/multiplayer/run-a-race-session): ten seats in order, and its start
/// 30 seconds after it opened (L2-121 AC1). A rider takes the first open seat in the next free jersey of
/// <see cref="GroupClassSession.Jerseys"/>; a rider already seated keeps their seat. While more than 10 seconds remain
/// it is open: a rider who leaves, or whose connection has been gone for 10 seconds, empties their seat again
/// (L2-055 AC1, L2-057 AC2). At 10 seconds to the start bots take every open seat, ready, in the bot list's order
/// (L2-121 AC2, L2-054 AC1, AC2); after that a leaver's seat goes to the next bot at once (L2-055 AC2), so it always
/// starts with 10 (L2-054 AC3). Safe to share between connections.
/// </summary>
public sealed class RaceSession(string mapId, DateTimeOffset startsAt)
{
    public const int Capacity = 10;

    /// <summary>How long a new session waits for riders (L2-121 AC1).</summary>
    public static readonly TimeSpan Lobby = TimeSpan.FromSeconds(30);

    /// <summary>How long before the start bots take the open seats (L2-121 AC2, L2-054 AC1).</summary>
    public static readonly TimeSpan BotFill = TimeSpan.FromSeconds(10);

    /// <summary>How long a lobby keeps the seat of a rider whose connection is gone (L2-057 AC2).</summary>
    public static readonly TimeSpan ConnectionGrace = TimeSpan.FromSeconds(10);

    private readonly RaceSeat?[] seats = new RaceSeat?[Capacity];
    private readonly Dictionary<Guid, DateTimeOffset> lost = [];
    private bool filled;

    public string MapId { get; } = mapId;

    public DateTimeOffset StartsAt { get; } = startsAt;

    public string Id => $"{MapId}@{StartsAt:yyyyMMdd'T'HHmmss'Z'}";

    /// <summary>The ten seats in order, <c>null</c> for an open one.</summary>
    public IReadOnlyList<RaceSeat?> Seats
    {
        get
        {
            lock (seats)
            {
                return [.. seats];
            }
        }
    }

    /// <summary>The riders seated, bots aside.</summary>
    public int RidersSeated
    {
        get
        {
            lock (seats)
            {
                return seats.Count(seat => seat?.Kind == RaceSeatKind.Rider);
            }
        }
    }

    /// <summary>Whether a rider asking for a race can be seated here: before the bots fill it, with a seat open.</summary>
    public bool IsOpen(DateTimeOffset now)
    {
        lock (seats)
        {
            return !filled && now < StartsAt - BotFill && Array.IndexOf(seats, null) >= 0;
        }
    }

    /// <summary>The seat number (1 to 10) the rider holds, or <c>null</c>.</summary>
    public int? SeatOf(Guid riderId)
    {
        lock (seats)
        {
            var index = Array.FindIndex(seats, seat => seat?.RiderId == riderId);
            return index < 0 ? null : index + 1;
        }
    }

    /// <summary>
    /// Seats the rider in the first open seat and returns its number, or the seat they already hold, which a returning
    /// connection takes back (L2-120 AC3); <c>null</c> when none is open.
    /// </summary>
    public int? TrySeat(Guid riderId, string name, int level)
    {
        lock (seats)
        {
            lost.Remove(riderId);
            var held = Array.FindIndex(seats, seat => seat?.RiderId == riderId);
            if (held >= 0) return held + 1;
            var open = Array.IndexOf(seats, null);
            if (open < 0) return null;
            var jersey = GroupClassSession.Jerseys.First(j => !seats.Any(seat => seat?.Jersey == j));
            seats[open] = new RaceSeat(RaceSeatKind.Rider, riderId, name, jersey, level, false);
            return open + 1;
        }
    }

    /// <summary>
    /// The seat a returning connection of the rider takes back, before or after the start (L2-120 AC3, L2-121 AC3), so a
    /// lost connection no longer frees it; <c>null</c> when they hold none.
    /// </summary>
    public int? Rejoin(Guid riderId)
    {
        lock (seats)
        {
            var held = Array.FindIndex(seats, seat => seat?.RiderId == riderId);
            if (held < 0) return null;
            lost.Remove(riderId);
            return held + 1;
        }
    }

    /// <summary>Marks the rider ready or not (L2-053 AC1, AC2); <c>false</c> when they hold no seat.</summary>
    public bool SetReady(Guid riderId, bool ready)
    {
        lock (seats)
        {
            var index = Array.FindIndex(seats, seat => seat?.RiderId == riderId);
            if (index < 0) return false;
            seats[index] = seats[index]! with { Ready = ready };
            return true;
        }
    }

    /// <summary>
    /// Empties the rider's seat before the bots fill the session, or gives it to the next bot after (L2-055 AC1, AC2);
    /// <c>null</c> when they hold no seat.
    /// </summary>
    public RaceLeave? Release(Guid riderId)
    {
        lock (seats)
        {
            lost.Remove(riderId);
            var index = Array.FindIndex(seats, seat => seat?.RiderId == riderId);
            if (index < 0) return null;
            var name = seats[index]!.Name;
            seats[index] = null;
            if (!filled) return new RaceLeave(name);
            seats[index] = NextBots(1).SingleOrDefault();
            return new RaceLeave(null);
        }
    }

    /// <summary>Notes that the rider's connection has gone; a lobby frees the seat once it has been gone 10 seconds.</summary>
    public void ConnectionLost(Guid riderId, DateTimeOffset now)
    {
        lock (seats)
        {
            if (Array.Exists(seats, seat => seat?.RiderId == riderId)) lost[riderId] = now;
        }
    }

    /// <summary>
    /// The once-a-second rules of the lobby: frees the seats of riders gone 10 seconds or more, then, at 10 seconds to
    /// the start, seats bots in every open seat. Returns the names of the riders whose seats were freed, and whether the
    /// seats changed.
    /// </summary>
    public (IReadOnlyList<string> Left, bool Changed) Tick(DateTimeOffset now)
    {
        lock (seats)
        {
            List<string> left = [];
            var changed = false;
            if (now < StartsAt)
            {
                foreach (var (riderId, since) in lost.Where(entry => now - entry.Value >= ConnectionGrace).ToList())
                {
                    var leave = Release(riderId);
                    if (leave?.Name is not null) left.Add(leave.Name);
                    changed |= leave is not null;
                }
            }

            if (!filled && now >= StartsAt - BotFill)
            {
                var open = Enumerable.Range(0, Capacity).Where(index => seats[index] is null).ToList();
                foreach (var (index, bot) in open.Zip(NextBots(open.Count))) seats[index] = bot;
                filled = true;
                changed |= open.Count > 0;
            }

            return (left, changed);
        }
    }

    /// <summary>The next bots of the list not already seated, ready, each in the jersey of its name (L2-054 AC2).</summary>
    private List<RaceSeat> NextBots(int count) =>
        BotPaceModel.Names
            .Select(name => $"Pacer {name}")
            .Where(name => !seats.Any(seat => seat?.Kind == RaceSeatKind.Bot && seat.Name == name))
            .Take(count)
            .Select(name => new RaceSeat(RaceSeatKind.Bot, null, name, name["Pacer ".Length..].ToLowerInvariant(), null, true))
            .ToList();
}
