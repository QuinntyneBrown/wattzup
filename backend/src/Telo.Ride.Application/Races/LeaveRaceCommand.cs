using MediatR;
using Telo.Ride.Application.Live;

namespace Telo.Ride.Application.Races;

/// <summary>A seated rider presses "Leave" in the lobby (L2-057 AC1) or in the race (L2-124 AC1), through the ride hub.</summary>
public sealed record LeaveRaceCommand(Guid RiderId, string SessionId) : IRequest;

/// <summary>
/// Releases the rider's seat: open again, with their name for the notice, before the bots fill the session; taken by a
/// bot at once after (L2-055 AC1, AC2). Every rider still in the session hears the grid. Once the race has started the
/// rider keeps the seat, marked DNF, and every rider hears the standings at once (L2-124 AC1).
/// </summary>
public sealed class LeaveRaceCommandHandler(IRaceSessionRegistry registry, ISessionNotifier notifier, TimeProvider time)
    : IRequestHandler<LeaveRaceCommand>
{
    public async Task Handle(LeaveRaceCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var session = registry.Find(request.SessionId, now);
        var leave = session?.Leave(request.RiderId, now);
        if (session is null || leave is null) return;
        if (now >= session.StartsAt)
            await notifier.RaceStandingsUpdated(RaceStandingsDto.Of(session.Id, session.Standings()), cancellationToken);
        else
            await notifier.SeatsChanged(new SeatsChangedDto(session.Id, RaceSeats.Of(session), leave.Name), cancellationToken);
    }
}
