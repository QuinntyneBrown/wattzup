using MediatR;

namespace Telo.Ride.Application.Races;

/// <summary>How many riders are queuing for a map, for Race Setup's "Riders online" line (L2-048 AC3).</summary>
public sealed record GetRaceQueueQuery(string MapId) : IRequest<RaceQueueDto>;

/// <summary>Counts the riders seated in the map's sessions that are still open (L2-121 AC4).</summary>
public sealed class GetRaceQueueQueryHandler(IRaceSessionRegistry registry, TimeProvider time)
    : IRequestHandler<GetRaceQueueQuery, RaceQueueDto>
{
    public Task<RaceQueueDto> Handle(GetRaceQueueQuery request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var riders = registry.Waiting(request.MapId, now).Where(session => session.IsOpen(now)).Sum(session => session.RidersSeated);
        return Task.FromResult(new RaceQueueDto(riders));
    }
}
