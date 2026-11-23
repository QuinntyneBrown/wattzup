using MediatR;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>One class of the catalogue, by its id (ADR 0014, ADR 0028).</summary>
public sealed record GetClassQuery(string Id) : IRequest<ClassDto>;

/// <summary>
/// Serves the class with the id when it passes <see cref="ClassPlanRules"/>; an id the catalogue does not hold, or a
/// class it leaves out, is refused with <c>class_not_found</c> (404).
/// </summary>
public sealed class GetClassQueryHandler(IClassCatalogue catalogue) : IRequestHandler<GetClassQuery, ClassDto>
{
    public Task<ClassDto> Handle(GetClassQuery request, CancellationToken cancellationToken)
    {
        var definition = catalogue.Classes.FirstOrDefault(c => c.Id == request.Id);
        if (definition is null || ClassPlanRules.BrokenRule(definition) is not null)
            throw new DomainRuleException("class_not_found", RuleKind.NotFound, $"The catalogue serves no class {request.Id}.");
        return Task.FromResult(ClassDto.From(definition));
    }
}
