using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;

namespace Telo.Ride.Application.Accounts;

/// <summary>The signed-in rider deletes their account.</summary>
public sealed record DeleteAccountCommand(Guid RiderId) : IRequest;

/// <summary>
/// Deletes an account (L2-006 AC3): the rider loses its email and display name, every session of it ends, and the codes
/// sent to its email go, all in one unit of work. <see cref="ErasePendingAccountsCommand"/> erases the rest within 30
/// days.
/// </summary>
public sealed class DeleteAccountCommandHandler(IAppDbContext db, TimeProvider time) : IRequestHandler<DeleteAccountCommand>
{
    public async Task Handle(DeleteAccountCommand request, CancellationToken cancellationToken)
    {
        var rider = await db.Riders.FirstOrDefaultAsync(known => known.Id == request.RiderId, cancellationToken)
            ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "The rider was not found.");
        var now = time.GetUtcNow();
        var email = rider.Email;

        rider.RequestDeletion(now);
        foreach (var session in await db.RiderSessions.Where(session => session.RiderId == rider.Id).ToListAsync(cancellationToken))
        {
            session.End(now);
        }

        if (email is not null)
        {
            db.SignInCodes.RemoveRange(await db.SignInCodes.Where(code => code.Email == email).ToListAsync(cancellationToken));
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
