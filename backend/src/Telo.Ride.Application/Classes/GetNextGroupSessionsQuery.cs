using MediatR;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>Every served class's next group session, in catalogue order, for the Class Library (L2-083 AC2).</summary>
public sealed record GetNextGroupSessionsQuery : IRequest<IReadOnlyList<NextGroupSessionDto>>;

/// <summary>Reads each class's next session from <see cref="GroupSessionSchedule"/>; every seat is free until slice 14.3.</summary>
public sealed class GetNextGroupSessionsQueryHandler(IClassCatalogue catalogue, TimeProvider time)
    : IRequestHandler<GetNextGroupSessionsQuery, IReadOnlyList<NextGroupSessionDto>>
{
    public Task<IReadOnlyList<NextGroupSessionDto>> Handle(GetNextGroupSessionsQuery request, CancellationToken cancellationToken)
    {
        var start = GroupSessionSchedule.Next(time.GetUtcNow(), 1)[0];
        IReadOnlyList<NextGroupSessionDto> next =
        [
            .. catalogue.Classes
                .Where(definition => ClassPlanRules.BrokenRule(definition) is null)
                .Select(definition => new NextGroupSessionDto(
                    definition.Id, GroupSessionSchedule.SessionId(definition.Id, start), start, 0, GroupSessionSchedule.Capacity)),
        ];
        return Task.FromResult(next);
    }
}
