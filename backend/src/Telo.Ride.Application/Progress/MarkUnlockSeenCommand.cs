using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;

namespace Telo.Ride.Application.Progress;

/// <summary>Home has announced a map a ride opened for the signed-in rider (L2-036 AC3).</summary>
public sealed record MarkUnlockSeenCommand(Guid RiderId, string MapId) : IRequest;

/// <summary>
/// Marks the rider's opened map seen, so the unlocked banner shows once per account, on whichever device opens Home
/// first. A map the rider has not opened is <c>unlock_not_found</c>.
/// </summary>
public sealed class MarkUnlockSeenCommandHandler(IAppDbContext db, TimeProvider time) : IRequestHandler<MarkUnlockSeenCommand>
{
    public async Task Handle(MarkUnlockSeenCommand request, CancellationToken cancellationToken)
    {
        var map = await db.MapProgress.FirstOrDefaultAsync(
                known => known.RiderId == request.RiderId && known.MapId == request.MapId && known.OpenedAt != null,
                cancellationToken)
            ?? throw new DomainRuleException("unlock_not_found", RuleKind.NotFound, "The rider has not opened that map.");
        map.MarkUnlockSeen(time.GetUtcNow());
        await db.SaveChangesAsync(cancellationToken);
    }
}
