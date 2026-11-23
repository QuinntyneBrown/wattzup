using MediatR;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>A class's next two group sessions, for Class Start (L2-085, L2-086).</summary>
public sealed record GetClassSessionsQuery(string ClassId) : IRequest<IReadOnlyList<ClassSessionDto>>;

/// <summary>
/// Reads the next two sessions from <see cref="GroupSessionSchedule"/>, with the riders seated in each from the live
/// sessions (<see cref="IGroupSessionRegistry"/>). A class the catalogue does not serve is <c>class_not_found</c> (404).
/// </summary>
public sealed class GetClassSessionsQueryHandler(IClassCatalogue catalogue, IGroupSessionRegistry registry, TimeProvider time)
    : IRequestHandler<GetClassSessionsQuery, IReadOnlyList<ClassSessionDto>>
{
    public Task<IReadOnlyList<ClassSessionDto>> Handle(GetClassSessionsQuery request, CancellationToken cancellationToken)
    {
        var definition = catalogue.Classes.FirstOrDefault(c => c.Id == request.ClassId);
        if (definition is null || ClassPlanRules.BrokenRule(definition) is not null)
            throw new DomainRuleException("class_not_found", RuleKind.NotFound, $"The catalogue serves no class {request.ClassId}.");
        var now = time.GetUtcNow();
        IReadOnlyList<ClassSessionDto> sessions =
        [
            .. GroupSessionSchedule.Next(now, 2).Select(start =>
            {
                var id = GroupSessionSchedule.SessionId(definition.Id, start);
                var seats = registry.Find(id, now)?.Seats ?? [];
                return new ClassSessionDto(
                    id, start, seats.Count, GroupSessionSchedule.Capacity, seats.Count >= GroupSessionSchedule.Capacity,
                    [.. seats.Select(seat => new SessionRiderDto(seat.DisplayName, seat.Jersey))]);
            }),
        ];
        return Task.FromResult(sessions);
    }
}
