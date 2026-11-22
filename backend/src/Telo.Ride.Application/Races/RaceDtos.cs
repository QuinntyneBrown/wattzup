namespace Telo.Ride.Application.Races;

/// <summary>
/// One seat of a race's start grid as the app draws it (L2-052): its number, its kind (<c>rider</c>, <c>bot</c> or
/// <c>open</c>), and for a taken seat the name, jersey, level (none for a bot) and whether they are ready. The service
/// knows no rider's country, so <c>Country</c> is <c>null</c> (L2-052 AC2).
/// </summary>
public sealed record RaceSeatDto(int Number, string Kind, string? Name, string? Jersey, int? Level, string? Country, bool Ready);

/// <summary>
/// The answer to "Find a race" (L2-121 AC1): the session, its start in server time, the rider's seat number and the
/// grid; or a refusal's <c>Code</c> (<c>map_not_found</c>) with nothing else.
/// </summary>
public sealed record FindRaceResult(string? Code, string? SessionId, DateTimeOffset? StartsAt, int? Seat, IReadOnlyList<RaceSeatDto> Seats);

/// <summary>
/// The grid after a change, sent to every rider in the session (L2-055 AC3): who joined, who is ready, the bots' fill,
/// and, when a rider left and their seat is open again, the name for the notice (L2-055 AC1).
/// </summary>
public sealed record SeatsChangedDto(string SessionId, IReadOnlyList<RaceSeatDto> Seats, string? Left);

/// <summary>How many riders are queuing for a map: seated in its sessions still open (L2-121 AC4, L2-048 AC3).</summary>
public sealed record RaceQueueDto(int Riders);

/// <summary>
/// One rider on a race's board: <c>Kind</c> is <c>person</c> or <c>bot</c>, a bot has no level, and the seat finds the
/// rider's own row (L2-123 AC3).
/// </summary>
public sealed record RaceStandingRowDto(
    int Position, int Seat, string Name, string Jersey, int? Level, string Kind, double DistanceMetres, double GapSeconds);

/// <summary>A race session's standings, ranked, as every rider in it receives them once a second (L2-123 AC3).</summary>
public sealed record RaceStandingsDto(string SessionId, IReadOnlyList<RaceStandingRowDto> Rows);
