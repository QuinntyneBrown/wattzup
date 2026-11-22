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
