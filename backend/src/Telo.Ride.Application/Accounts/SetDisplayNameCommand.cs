using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Application.Accounts;

/// <summary>Sets the signed-in rider's display name, as typed (Choose a display name, L2-005).</summary>
public sealed record SetDisplayNameCommand(Guid RiderId, string? DisplayName) : IRequest<RiderDto>;

public sealed class SetDisplayNameCommandHandler(IAppDbContext db) : IRequestHandler<SetDisplayNameCommand, RiderDto>
{
    public async Task<RiderDto> Handle(SetDisplayNameCommand request, CancellationToken cancellationToken)
    {
        var name = DisplayName.Parse(request.DisplayName);
        var rider = await db.Riders.FirstOrDefaultAsync(known => known.Id == request.RiderId, cancellationToken)
            ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "No such rider.");
        rider.Rename(name);
        await db.SaveChangesAsync(cancellationToken);
        return new RiderDto(rider.Id, rider.DisplayName);
    }
}
