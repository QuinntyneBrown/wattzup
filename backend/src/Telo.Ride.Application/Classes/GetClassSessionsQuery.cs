using MediatR;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>A class's next two group sessions, for Class Start (L2-085, L2-086).</summary>
public sealed record GetClassSessionsQuery(string ClassId) : IRequest<IReadOnlyList<ClassSessionDto>>;

/// <summary>
/// Reads the next two sessions from <see cref="GroupSessionSchedule"/>. Riders take seats from slice 14.3, so every
/// seat is free until then. A class the catalogue does not serve is <c>class_not_found</c> (404).
/// </summary>
public sealed class GetClassSessionsQueryHandler(IClassCatalogue catalogue, TimeProvider time)
    : IRequestHandler<GetClassSessionsQuery, IReadOnlyList<ClassSessionDto>>
{
    public Task<IReadOnlyList<ClassSessionDto>> Handle(GetClassSessionsQuery request, CancellationToken cancellationToken)
    {
        var definition = catalogue.Classes.FirstOrDefault(c => c.Id == request.ClassId);
        if (definition is null || ClassPlanRules.BrokenRule(definition) is not null)
            throw new DomainRuleException("class_not_found", RuleKind.NotFound, $"The catalogue serves no class {request.ClassId}.");
        IReadOnlyList<ClassSessionDto> sessions =
        [
            .. GroupSessionSchedule.Next(time.GetUtcNow(), 2).Select(start => new ClassSessionDto(
                GroupSessionSchedule.SessionId(definition.Id, start), start, 0, GroupSessionSchedule.Capacity, false, [])),
        ];
        return Task.FromResult(sessions);
    }
}
