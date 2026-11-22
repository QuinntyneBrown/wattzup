using MediatR;
using Telo.Ride.Application.Classes;
using Telo.Ride.Application.Maps;
using Telo.Ride.Application.Races;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Live;

/// <summary>The once-a-second tick of the live sessions (L2-123 AC3).</summary>
public sealed record TickLiveSessionsCommand : IRequest;

/// <summary>
/// For every group session that has started: fills it with bots at its first tick, moves them, ranks the field and
/// sends the standings to the session's riders (L2-122 AC3, L2-123 AC2, AC3, AC4). For every race lobby: frees the
/// seats of riders whose connection has been gone 10 seconds, fills the open seats with bots at 10 seconds to the start,
/// and sends the grid when it changed (L2-057 AC2, L2-121 AC2, L2-054 AC1). For every race that has started: rides
/// its bots and riders to the second, held at the route's length, ranks them and sends the race standings to the
/// session's riders (L2-123 AC2, AC3, AC4).
/// </summary>
public sealed class TickLiveSessionsCommandHandler(
    IGroupSessionRegistry registry, IRaceSessionRegistry races, IMapCatalogue maps, ISessionNotifier notifier, TimeProvider time)
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

        foreach (var lobby in races.Lobbies(now))
        {
            var (left, changed) = lobby.Tick(now);
            if (!changed) continue;
            var seats = RaceSeats.Of(lobby);
            // One message per rider who left, so each notice names them; otherwise one for the change.
            foreach (var name in left.DefaultIfEmpty())
                await notifier.SeatsChanged(new SeatsChangedDto(lobby.Id, seats, name), cancellationToken);
        }

        foreach (var race in races.Started(now))
        {
            var route = maps.Maps.FirstOrDefault(map => map.Id == race.MapId)?.DistanceKm * 1000 ?? double.PositiveInfinity;
            var rows = race.Ride(now, route);
            if (rows is null) continue;
            await notifier.RaceStandingsUpdated(RaceStandingsDto.Of(race.Id, rows), cancellationToken);
        }
    }

    private static StandingRowDto Row(StandingRow row) =>
        new(row.Position, row.Name, row.Jersey, row.Level, row.Kind == RiderKind.Bot ? "bot" : "person", row.OutputKj, row.GapKj);
}
