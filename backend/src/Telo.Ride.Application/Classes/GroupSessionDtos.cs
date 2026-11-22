namespace Telo.Ride.Application.Classes;

/// <summary>One rider seated in a group session: the name others see and the design-system jersey (`lena`).</summary>
public sealed record SessionRiderDto(string DisplayName, string Jersey);

/// <summary>One group session of a class (L2-083, L2-085): its start as server time, its seats and who holds them.</summary>
public sealed record ClassSessionDto(
    string Id,
    DateTimeOffset StartsAt,
    int SeatsTaken,
    int Capacity,
    bool Full,
    IReadOnlyList<SessionRiderDto> Riders);

/// <summary>A class's next group session, for the Class Library's chip ("Group in 9 min · 6/10", L2-083 AC2).</summary>
public sealed record NextGroupSessionDto(string ClassId, string SessionId, DateTimeOffset StartsAt, int SeatsTaken, int Capacity);

/// <summary>A session offered instead of the one refused: the next one (L2-122 AC2, L2-086 AC3).</summary>
public sealed record OfferedSessionDto(string Id, DateTimeOffset StartsAt);

/// <summary>
/// What joining a group session comes to: a seat, with <see cref="Code"/> <c>null</c> and the seat's
/// <see cref="Jersey"/>; or a refusal whose <see cref="Code"/> the app branches on (<c>session_full</c>,
/// <c>session_started</c>, <c>class_locked</c>, <c>session_not_found</c>), with the session offered instead when there is one.
/// </summary>
public sealed record JoinClassSessionResult(
    string? Code,
    string SessionId,
    DateTimeOffset? StartsAt,
    string? Jersey,
    OfferedSessionDto? Next);
