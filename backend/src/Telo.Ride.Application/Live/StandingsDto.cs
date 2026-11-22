using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Live;

/// <summary>One rider on the board: <c>Kind</c> is <c>person</c> or <c>bot</c>, and a bot has no level (L2-123 AC3).</summary>
public sealed record StandingRowDto(int Position, string Name, string Jersey, int? Level, string Kind, double OutputKj, double GapKj);

/// <summary>A session's standings, ranked, as every rider in it receives them once a second (L2-123 AC3).</summary>
public sealed record StandingsDto(string SessionId, IReadOnlyList<StandingRowDto> Rows)
{
    /// <summary>The session's standings as the hub sends them.</summary>
    public static StandingsDto Of(string sessionId, IEnumerable<StandingRow> rows) => new(sessionId, [.. rows.Select(Row)]);

    private static StandingRowDto Row(StandingRow row) =>
        new(row.Position, row.Name, row.Jersey, row.Level, row.Kind == RiderKind.Bot ? "bot" : "person", row.OutputKj, row.GapKj);
}
