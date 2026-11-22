using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application.Live;
using Telo.Ride.Application.Maps;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Races;

/// <summary>A rider presses "Find a race" on a map (L2-121 AC1), through the ride hub, from the lobby.</summary>
/// <remarks><c>ConnectionId</c> is the hub connection the session's changes go to.</remarks>
public sealed record FindRaceCommand(Guid RiderId, string MapId, string ConnectionId) : IRequest<FindRaceResult>;

/// <summary>
/// Seats the rider in the open session on the map with the most riders, or opens a new one that starts 30 seconds
/// later (L2-121 AC1); a rider already seated in a session on the map that has not started keeps that seat, so a
/// reconnect rejoins it (L2-120 AC3). A map the service does not know is refused with <c>map_not_found</c>. The rider's
/// connection joins the session's group, and every rider in it hears the new grid (L2-055 AC3).
/// </summary>
public sealed class FindRaceCommandHandler(
    IAppDbContext db, IMapCatalogue catalogue, IRaceSessionRegistry registry, ISessionNotifier notifier, TimeProvider time)
    : IRequestHandler<FindRaceCommand, FindRaceResult>
{
    private const string NoName = "Rider";

    public async Task<FindRaceResult> Handle(FindRaceCommand request, CancellationToken cancellationToken)
    {
        if (!catalogue.Maps.Any(map => map.Id == request.MapId))
            return new FindRaceResult("map_not_found", null, null, null, []);

        var now = time.GetUtcNow();
        var rider = await db.Riders.AsNoTracking().SingleAsync(r => r.Id == request.RiderId, cancellationToken);
        var name = rider.DisplayName ?? NoName;
        var level = LevelTable.LevelFor(rider.TotalXp);
        var waiting = registry.Waiting(request.MapId, now);
        var session = waiting.FirstOrDefault(s => s.SeatOf(rider.Id) is not null)
            ?? waiting.Where(s => s.IsOpen(now)).MaxBy(s => s.RidersSeated);
        // A session another rider filled meanwhile has no seat left; a new one always has.
        if (session?.TrySeat(rider.Id, name, level) is null)
        {
            session = registry.Open(request.MapId, now);
            session.TrySeat(rider.Id, name, level);
        }

        await notifier.AddToSession(request.ConnectionId, session.Id, cancellationToken);
        var seats = RaceSeats.Of(session);
        await notifier.SeatsChanged(new SeatsChangedDto(session.Id, seats, null), cancellationToken);
        return new FindRaceResult(null, session.Id, session.StartsAt, session.SeatOf(rider.Id), seats);
    }
}
