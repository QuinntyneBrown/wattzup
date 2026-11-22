using MediatR;

namespace Telo.Ride.Application.Races;

/// <summary>The rider's distance ridden in metres and power in watts in a race session, about once a second (L2-123 AC1).</summary>
public sealed record ReportRaceProgressCommand(Guid RiderId, string SessionId, double DistanceMetres, double PowerWatts) : IRequest;

/// <summary>
/// Keeps the report in the rider's race session. A report for a session that is gone, from a rider without a seat,
/// before the start or less than 500 ms after the rider's last is dropped: the next one carries the same distance.
/// </summary>
public sealed class ReportRaceProgressCommandHandler(IRaceSessionRegistry registry, TimeProvider time) : IRequestHandler<ReportRaceProgressCommand>
{
    public Task Handle(ReportRaceProgressCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        registry.Find(request.SessionId, now)?.RecordProgress(request.RiderId, request.DistanceMetres, request.PowerWatts, now);
        return Task.CompletedTask;
    }
}
