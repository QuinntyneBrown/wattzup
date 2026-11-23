using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Telo.Ride.Application.Accounts;

/// <summary>Erases every account whose deletion was requested (L2-006 AC3); answers how many were erased.</summary>
public sealed record ErasePendingAccountsCommand : IRequest<int>;

/// <summary>
/// Erases deleted accounts: each rider whose deletion was requested goes, with its sessions and its recorded rides (and,
/// as journey 10 keeps it, the rest of its progress), its custom workout and the feedback it sent (L2-119). A second run
/// finds nothing more to erase.
/// </summary>
public sealed class ErasePendingAccountsCommandHandler(IAppDbContext db) : IRequestHandler<ErasePendingAccountsCommand, int>
{
    public async Task<int> Handle(ErasePendingAccountsCommand request, CancellationToken cancellationToken)
    {
        var riders = await db.Riders.Where(rider => rider.DeletionRequestedAt != null).ToListAsync(cancellationToken);
        if (riders.Count == 0)
        {
            return 0;
        }

        var ids = riders.Select(rider => rider.Id).ToList();
        db.RiderSessions.RemoveRange(await db.RiderSessions.Where(session => ids.Contains(session.RiderId)).ToListAsync(cancellationToken));
        db.Rides.RemoveRange(await db.Rides.Where(ride => ids.Contains(ride.RiderId)).ToListAsync(cancellationToken));
        db.MapProgress.RemoveRange(await db.MapProgress.Where(progress => ids.Contains(progress.RiderId)).ToListAsync(cancellationToken));
        db.CustomWorkouts.RemoveRange(await db.CustomWorkouts.Where(workout => ids.Contains(workout.RiderId)).ToListAsync(cancellationToken));
        db.FeedbackReports.RemoveRange(await db.FeedbackReports.Where(report => ids.Contains(report.RiderId)).ToListAsync(cancellationToken));
        db.Riders.RemoveRange(riders);
        await db.SaveChangesAsync(cancellationToken);
        return riders.Count;
    }
}
