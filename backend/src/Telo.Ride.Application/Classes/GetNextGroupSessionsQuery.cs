using MediatR;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>Every served class's next group session, in catalogue order, for the Class Library (L2-083 AC2).</summary>
public sealed record GetNextGroupSessionsQuery : IRequest<IReadOnlyList<NextGroupSessionDto>>;

/// <summary>Reads each class's next session from <see cref="GroupSessionSchedule"/>, with its seats taken from the live sessions.</summary>
public sealed class GetNextGroupSessionsQueryHandler(IClassCatalogue catalogue, IGroupSessionRegistry registry, TimeProvider time)
    : IRequestHandler<GetNextGroupSessionsQuery, IReadOnlyList<NextGroupSessionDto>>
{
    public Task<IReadOnlyList<NextGroupSessionDto>> Handle(GetNextGroupSessionsQuery request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var start = GroupSessionSchedule.Next(now, 1)[0];
        IReadOnlyList<NextGroupSessionDto> next =
        [
            .. catalogue.Classes
                .Where(definition => ClassPlanRules.BrokenRule(definition) is null)
                .Select(definition =>
                {
                    var id = GroupSessionSchedule.SessionId(definition.Id, start);
                    return new NextGroupSessionDto(
                        definition.Id, id, start, registry.Find(id, now)?.SeatsTaken ?? 0, GroupSessionSchedule.Capacity);
                }),
        ];
        return Task.FromResult(next);
    }
}
