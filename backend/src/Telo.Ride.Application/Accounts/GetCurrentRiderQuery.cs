using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;

namespace Telo.Ride.Application.Accounts;

/// <summary>The signed-in rider, by the id their session carries.</summary>
public sealed record GetCurrentRiderQuery(Guid RiderId) : IRequest<RiderDto>;

/// <summary>Who is signed in: what the app asks at start-up (Stay signed in).</summary>
public sealed record RiderDto(Guid Id, string? DisplayName);

public sealed class GetCurrentRiderQueryHandler(IAppDbContext db) : IRequestHandler<GetCurrentRiderQuery, RiderDto>
{
    public async Task<RiderDto> Handle(GetCurrentRiderQuery request, CancellationToken cancellationToken) =>
        await db.Riders
            .Where(rider => rider.Id == request.RiderId)
            .Select(rider => new RiderDto(rider.Id, rider.DisplayName))
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "No such rider.");
}
