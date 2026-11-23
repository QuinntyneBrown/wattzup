using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Application.Accounts;

/// <summary>The six digits the rider entered for <paramref name="Email"/>.</summary>
public sealed record ConfirmSignInCodeCommand(string? Email, string? Code) : IRequest<ConfirmedRider>;

/// <summary>The rider a confirmed code signed in: found, or created on the first sign-in (L2-001 AC4).</summary>
public sealed record ConfirmedRider(Guid RiderId, string? DisplayName, bool IsNewAccount);

/// <summary>
/// Confirms a sign-in code (L2-002, L2-003 AC3). Only the newest code sent to the address counts (L2-003 AC2); a wrong
/// code is <c>code_mismatch</c> and counts against it, five wrong codes lock it (<c>code_locked</c>), and an old, used
/// or missing code is <c>code_expired</c>. The right code is used up, and the rider is found or created; the API then
/// starts the session.
/// </summary>
public sealed class ConfirmSignInCodeCommandHandler(IAppDbContext db, ISignInCodeHasher hasher, TimeProvider time)
    : IRequestHandler<ConfirmSignInCodeCommand, ConfirmedRider>
{
    public async Task<ConfirmedRider> Handle(ConfirmSignInCodeCommand request, CancellationToken cancellationToken)
    {
        var address = EmailAddress.Parse(request.Email ?? string.Empty);
        var now = time.GetUtcNow();
        var active = await db.SignInCodes
            .Where(code => code.Email == address.Value && code.SupersededAt == null)
            .OrderByDescending(code => code.IssuedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw Refused("code_expired");

        var digits = new string((request.Code ?? string.Empty).Where(char.IsAsciiDigit).ToArray());
        switch (active.Verify(hasher.CodeMatches(digits, active.CodeHash), now))
        {
            case CodeCheck.Mismatch:
                await db.SaveChangesAsync(cancellationToken);
                throw Refused("code_mismatch");
            case CodeCheck.Locked:
                throw Refused("code_locked");
            case CodeCheck.Expired or CodeCheck.Used:
                throw Refused("code_expired");
        }

        var rider = await db.Riders.FirstOrDefaultAsync(known => known.Email == address.Value, cancellationToken);
        var isNew = rider is null;
        if (rider is null)
        {
            rider = Rider.Create(address, now);
            db.Riders.Add(rider);
        }

        await db.SaveChangesAsync(cancellationToken);
        return new ConfirmedRider(rider.Id, rider.DisplayName, isNew);
    }

    private static DomainRuleException Refused(string code) =>
        new(code, RuleKind.Invalid, "The sign-in code was refused.");
}
