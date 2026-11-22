namespace Telo.Ride.Application.Live;

/// <summary>One rider on the board: <c>Kind</c> is <c>person</c> or <c>bot</c>, and a bot has no level (L2-123 AC3).</summary>
public sealed record StandingRowDto(int Position, string Name, string Jersey, int? Level, string Kind, double OutputKj, double GapKj);

/// <summary>A session's standings, ranked, as every rider in it receives them once a second (L2-123 AC3).</summary>
public sealed record StandingsDto(string SessionId, IReadOnlyList<StandingRowDto> Rows);
