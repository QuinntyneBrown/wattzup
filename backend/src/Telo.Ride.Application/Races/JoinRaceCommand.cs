using MediatR;
using Telo.Ride.Application.Live;

namespace Telo.Ride.Application.Races;

/// <summary>The race joins the rider's session again at Go, on the race page's own connection (L2-056 AC3).</summary>
/// <remarks><c>ConnectionId</c> is the hub connection the session's messages go to.</remarks>
public sealed record JoinRaceCommand(Guid RiderId, string SessionId, string ConnectionId) : IRequest<FindRaceResult>;

/// <summary>
/// Gives the rider back the seat they hold in the session, before or after its start, with the start as server time,
/// so every rider's race clock starts at the same moment (L2-121 AC3); the connection joins the session's group. A
/// session the service does not hold, or one the rider has no seat in, is refused with <c>session_not_found</c>.
/// </summary>
public sealed class JoinRaceCommandHandler(IRaceSessionRegistry registry, ISessionNotifier notifier, TimeProvider time)
    : IRequestHandler<JoinRaceCommand, FindRaceResult>
{
    public async Task<FindRaceResult> Handle(JoinRaceCommand request, CancellationToken cancellationToken)
    {
        var session = registry.Find(request.SessionId, time.GetUtcNow());
        var seat = session?.Rejoin(request.RiderId);
        if (session is null || seat is null) return new FindRaceResult("session_not_found", null, null, null, []);
        await notifier.AddToSession(request.ConnectionId, session.Id, cancellationToken);
        return new FindRaceResult(null, session.Id, session.StartsAt, seat, RaceSeats.Of(session));
    }
}
