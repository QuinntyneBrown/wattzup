using MediatR;

namespace Telo.Ride.Application.Races;

/// <summary>A rider's hub connection has gone (L2-057 AC2).</summary>
public sealed record RaceConnectionLostCommand(Guid RiderId) : IRequest;

/// <summary>
/// Notes the time in every lobby where the rider holds a seat; the once-a-second tick frees the seat once the connection
/// has been gone 10 seconds, and finding the race again keeps it (L2-057 AC2, L2-120 AC3).
/// </summary>
public sealed class RaceConnectionLostCommandHandler(IRaceSessionRegistry registry, TimeProvider time)
    : IRequestHandler<RaceConnectionLostCommand>
{
    public Task Handle(RaceConnectionLostCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        foreach (var session in registry.Lobbies(now)) session.ConnectionLost(request.RiderId, now);
        return Task.CompletedTask;
    }
}
