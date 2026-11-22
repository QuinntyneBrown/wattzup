using MediatR;
using Telo.Ride.Application.Classes;

namespace Telo.Ride.Application.Live;

/// <summary>A rider's progress in a group session: output in kJ and power in watts, about once a second (L2-123 AC1).</summary>
public sealed record ReportProgressCommand(Guid RiderId, string SessionId, double OutputKj, double PowerWatts) : IRequest;

/// <summary>
/// Keeps the report in the rider's session. A report for a session nobody is in, from a rider without a seat, before
/// the start or less than 500 ms after the rider's last is dropped: the next one carries the same totals.
/// </summary>
public sealed class ReportProgressCommandHandler(IGroupSessionRegistry registry, TimeProvider time) : IRequestHandler<ReportProgressCommand>
{
    public Task Handle(ReportProgressCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        registry.Find(request.SessionId, now)?.RecordProgress(request.RiderId, request.OutputKj, request.PowerWatts, now);
        return Task.CompletedTask;
    }
}
