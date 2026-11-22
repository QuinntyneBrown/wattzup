using Telo.Ride.Domain.Bots;

namespace Telo.Ride.Domain.Classes;

/// <summary>What a join of a group session comes to (L2-122 AC1, AC2, L2-086 AC3).</summary>
public enum JoinOutcome
{
    /// <summary>The rider has a seat: a new one, or the one they already held.</summary>
    Seated,

    /// <summary>Ten riders are seated (<c>session_full</c>).</summary>
    Full,

    /// <summary>The session has started (<c>session_started</c>).</summary>
    Started,
}

/// <summary>
/// A rider's seat in a group session: the name others see, the jersey of the seat (a design-system jersey token) and
/// the rider's level when they joined.
/// </summary>
public sealed record SessionSeat(Guid RiderId, string DisplayName, string Jersey, int Level = 1);

/// <summary>
/// One group session of a class: its slot's start and up to 10 seats (L2-122 AC1). A rider is seated until it starts,
/// while fewer than 10 are seated, in the next jersey of <see cref="Jerseys"/>; a seated rider who joins again keeps
/// their seat, even once it has started, so a reconnect rejoins with the same seat (L2-120 AC3). From the start it
/// keeps each rider's last progress report, ignoring one less than 500 ms after the last (L2-123 AC1); at the first
/// tick after the start, when fewer than 8 riders are seated, bots fill it to 10 (L2-083, L2-122 AC3), and each tick
/// moves them on the pace model around the easy pack, seeded with the session's id (L2-123 AC4). The standings rank
/// every rider by output, highest first, seats before bots on a tie (L2-123 AC2). Safe to share between connections.
/// </summary>
public sealed class GroupClassSession(string classId, DateTimeOffset startsAt)
{
    /// <summary>The seats' jerseys, in seat order: design-system jersey tokens (<c>--jersey-lena</c>).</summary>
    public static readonly IReadOnlyList<string> Jerseys = ["lena", "marco", "priya", "jwatts", "ollie", "kenji", "ana", "nova", "rook", "juno"];

    /// <summary>The fewest riders a session starts with before bots fill it (L2-083).</summary>
    public const int RidersWithoutBots = 8;

    /// <summary>The pack strength a group session's bots ride around.</summary>
    public const string BotPack = "easy";

    /// <summary>The shortest time between two progress reports a session keeps (L2-123 AC1).</summary>
    public static readonly TimeSpan ReportInterval = TimeSpan.FromMilliseconds(500);

    private readonly List<SessionSeat> seats = [];
    private readonly Dictionary<Guid, (double OutputKj, DateTimeOffset At)> progress = [];
    private readonly List<(BotPace Pace, double OutputKj)> bots = [];
    private bool started;
    private int secondsRidden;

    public string ClassId { get; } = classId;

    public DateTimeOffset StartsAt { get; } = startsAt;

    public string Id => GroupSessionSchedule.SessionId(ClassId, StartsAt);

    /// <summary>The seats taken, in the order they were taken.</summary>
    public IReadOnlyList<SessionSeat> Seats
    {
        get
        {
            lock (seats)
            {
                return [.. seats];
            }
        }
    }

    public int SeatsTaken
    {
        get
        {
            lock (seats)
            {
                return seats.Count;
            }
        }
    }

    public bool Full => SeatsTaken >= GroupSessionSchedule.Capacity;

    /// <summary>Seats the rider, or says why not; a rider already seated keeps their seat.</summary>
    public (JoinOutcome Outcome, SessionSeat? Seat) TrySeat(Guid riderId, string displayName, DateTimeOffset now, int level = 1)
    {
        lock (seats)
        {
            var held = seats.Find(seat => seat.RiderId == riderId);
            if (held is not null) return (JoinOutcome.Seated, held);
            if (now >= StartsAt) return (JoinOutcome.Started, null);
            if (seats.Count >= GroupSessionSchedule.Capacity) return (JoinOutcome.Full, null);
            var seat = new SessionSeat(riderId, displayName, Jerseys[seats.Count], level);
            seats.Add(seat);
            return (JoinOutcome.Seated, seat);
        }
    }

    /// <summary>
    /// Keeps a seated rider's output and power from the start, unless their last report came less than 500 ms ago;
    /// says whether it was kept.
    /// </summary>
    public bool RecordProgress(Guid riderId, double outputKj, double powerWatts, DateTimeOffset now)
    {
        lock (seats)
        {
            if (now < StartsAt || !seats.Exists(seat => seat.RiderId == riderId) || !double.IsFinite(outputKj) || !double.IsFinite(powerWatts))
                return false;
            if (progress.TryGetValue(riderId, out var last) && now - last.At < ReportInterval) return false;
            progress[riderId] = (Math.Max(0, outputKj), now);
            return true;
        }
    }

    /// <summary>
    /// Once started: fills the empty seats with bots at the first tick, rides them each whole second since the start,
    /// and returns the standings; <c>null</c> before the start.
    /// </summary>
    public IReadOnlyList<StandingRow>? Tick(DateTimeOffset now)
    {
        lock (seats)
        {
            if (now < StartsAt) return null;
            if (!started)
            {
                started = true;
                if (seats.Count < RidersWithoutBots)
                {
                    var paces = BotPaceModel.Paces(Id, BotPack);
                    bots.AddRange(paces.Take(GroupSessionSchedule.Capacity - seats.Count).Select(pace => (pace, 0.0)));
                }
            }

            var elapsed = (int)Math.Floor((now - StartsAt).TotalSeconds);
            for (; secondsRidden < elapsed; secondsRidden++)
            {
                for (var i = 0; i < bots.Count; i++)
                    bots[i] = (bots[i].Pace, bots[i].OutputKj + (BotPaceModel.Watts(bots[i].Pace, secondsRidden) / 1000));
            }

            return Standings();
        }
    }

    private List<StandingRow> Standings()
    {
        var riders = seats
            .Select(seat => (Name: seat.DisplayName, seat.Jersey, Level: (int?)seat.Level, Kind: RiderKind.Person,
                OutputKj: progress.TryGetValue(seat.RiderId, out var last) ? last.OutputKj : 0))
            .Concat(bots.Select(bot => (Name: $"Pacer {bot.Pace.Name}", Jersey: bot.Pace.Name.ToLowerInvariant(), Level: (int?)null, Kind: RiderKind.Bot, bot.OutputKj)))
            .OrderByDescending(rider => rider.OutputKj)
            .ToList();
        var leader = riders.Count == 0 ? 0 : riders[0].OutputKj;
        return
        [
            .. riders.Select((rider, i) => new StandingRow(
                i + 1, rider.Name, rider.Jersey, rider.Level, rider.Kind,
                Math.Round(rider.OutputKj, 3), Math.Round(leader - rider.OutputKj, 3))),
        ];
    }
}
