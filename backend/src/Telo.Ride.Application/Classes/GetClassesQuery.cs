using MediatR;
using Microsoft.Extensions.Logging;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>Lists the class catalogue (L2-080).</summary>
public sealed record GetClassesQuery : IRequest<ClassCatalogueDto>;

/// <summary>
/// Serves the shelves and, in catalogue order, every class that passes <see cref="ClassPlanRules"/>; a class that
/// breaks one is left out and logged by its id (L2-080 AC4).
/// </summary>
public sealed partial class GetClassesQueryHandler(IClassCatalogue catalogue, ILogger<GetClassesQueryHandler> logger)
    : IRequestHandler<GetClassesQuery, ClassCatalogueDto>
{
    public Task<ClassCatalogueDto> Handle(GetClassesQuery request, CancellationToken cancellationToken) =>
        Task.FromResult(new ClassCatalogueDto(
            [.. catalogue.Shelves.Select(shelf => new ShelfDto(shelf.Id, shelf.Title, shelf.Tagline))],
            [.. catalogue.Classes.Where(IsServable).Select(ClassDto.From)]));

    private bool IsServable(ClassDefinition definition)
    {
        var broken = ClassPlanRules.BrokenRule(definition);
        if (broken is not null) LeftOut(definition.Id, broken);
        return broken is null;
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Class {ClassId} is left out of the catalogue: {Rule}")]
    private partial void LeftOut(string classId, string rule);
}
