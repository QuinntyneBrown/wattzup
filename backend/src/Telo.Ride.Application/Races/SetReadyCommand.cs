using MediatR;
using Telo.Ride.Application.Live;

namespace Telo.Ride.Application.Races;

/// <summary>A seated rider presses "I'm ready", or "You're ready" again (L2-053 AC1, AC2), through the ride hub.</summary>
public sealed record SetReadyCommand(Guid RiderId, string SessionId, bool Ready) : IRequest;

/// <summary>Marks the rider's seat ready or not, and every rider in the session hears the grid (L2-053 AC1).</summary>
public sealed class SetReadyCommandHandler(IRaceSessionRegistry registry, ISessionNotifier notifier, TimeProvider time)
    : IRequestHandler<SetReadyCommand>
{
    public async Task Handle(SetReadyCommand request, CancellationToken cancellationToken)
    {
        var session = registry.Find(request.SessionId, time.GetUtcNow());
        if (session is null || !session.SetReady(request.RiderId, request.Ready)) return;
        await notifier.SeatsChanged(new SeatsChangedDto(session.Id, RaceSeats.Of(session), null), cancellationToken);
    }
}
