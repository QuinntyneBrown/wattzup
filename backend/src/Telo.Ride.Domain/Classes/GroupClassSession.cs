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

/// <summary>A rider's seat in a group session: the name others see and the jersey of the seat (a design-system jersey token).</summary>
public sealed record SessionSeat(Guid RiderId, string DisplayName, string Jersey);

/// <summary>
/// One group session of a class: its slot's start and up to 10 seats (L2-122 AC1). A rider is seated until it starts,
/// while fewer than 10 are seated, in the next jersey of <see cref="Jerseys"/>; a seated rider who joins again keeps
/// their seat, even once it has started, so a reconnect rejoins with the same seat (L2-120 AC3). Safe to share between
/// connections.
/// </summary>
public sealed class GroupClassSession(string classId, DateTimeOffset startsAt)
{
    /// <summary>The seats' jerseys, in seat order: design-system jersey tokens (<c>--jersey-lena</c>).</summary>
    public static readonly IReadOnlyList<string> Jerseys = ["lena", "marco", "priya", "jwatts", "ollie", "kenji", "ana", "nova", "rook", "juno"];

    private readonly List<SessionSeat> seats = [];

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
    public (JoinOutcome Outcome, SessionSeat? Seat) TrySeat(Guid riderId, string displayName, DateTimeOffset now)
    {
        lock (seats)
        {
            var held = seats.Find(seat => seat.RiderId == riderId);
            if (held is not null) return (JoinOutcome.Seated, held);
            if (now >= StartsAt) return (JoinOutcome.Started, null);
            if (seats.Count >= GroupSessionSchedule.Capacity) return (JoinOutcome.Full, null);
            var seat = new SessionSeat(riderId, displayName, Jerseys[seats.Count]);
            seats.Add(seat);
            return (JoinOutcome.Seated, seat);
        }
    }
}
