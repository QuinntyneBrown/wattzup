using MediatR;
using Telo.Ride.Application.Classes;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Live;

/// <summary>The once-a-second tick of the live sessions (L2-123 AC3).</summary>
public sealed record TickLiveSessionsCommand : IRequest;

/// <summary>
/// For every group session that has started: fills it with bots at its first tick, moves them, ranks the field and
/// sends the standings to the session's riders (L2-122 AC3, L2-123 AC2, AC3, AC4).
/// </summary>
public sealed class TickLiveSessionsCommandHandler(IGroupSessionRegistry registry, ISessionNotifier notifier, TimeProvider time)
    : IRequestHandler<TickLiveSessionsCommand>
{
    public async Task Handle(TickLiveSessionsCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        foreach (var session in registry.Started(now))
        {
            var rows = session.Tick(now);
            if (rows is null) continue;
            await notifier.StandingsUpdated(new StandingsDto(session.Id, [.. rows.Select(Row)]), cancellationToken);
        }
    }

    private static StandingRowDto Row(StandingRow row) =>
        new(row.Position, row.Name, row.Jersey, row.Level, row.Kind == RiderKind.Bot ? "bot" : "person", row.OutputKj, row.GapKj);
}
