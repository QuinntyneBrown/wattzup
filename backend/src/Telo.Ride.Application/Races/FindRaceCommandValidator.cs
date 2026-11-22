using FluentValidation;

namespace Telo.Ride.Application.Races;

/// <summary>The shape of the map to race on (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class FindRaceCommandValidator : AbstractValidator<FindRaceCommand>
{
    public FindRaceCommandValidator()
    {
        RuleFor(request => request.MapId).CatalogueId();
    }
}
