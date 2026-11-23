using MediatR;

namespace Telo.Ride.Application.Maps;

/// <summary>Lists the map catalogue (L2-045).</summary>
public sealed record GetMapsQuery : IRequest<IReadOnlyList<MapDto>>;

/// <summary>Serves every map in unlock order, each locked map with the goal its rule writes (L2-040 AC6).</summary>
public sealed class GetMapsQueryHandler(IMapCatalogue catalogue) : IRequestHandler<GetMapsQuery, IReadOnlyList<MapDto>>
{
    public Task<IReadOnlyList<MapDto>> Handle(GetMapsQuery request, CancellationToken cancellationToken)
    {
        var names = catalogue.Maps.ToDictionary(map => map.Id, map => map.Name);
        return Task.FromResult<IReadOnlyList<MapDto>>([.. catalogue.Maps.Select(map => MapDto.From(map, names))]);
    }
}
