using FluentValidation;

namespace Telo.Ride.Application.Races;

/// <summary>The shape of the map whose queue it counts (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class GetRaceQueueQueryValidator : AbstractValidator<GetRaceQueueQuery>
{
    public GetRaceQueueQueryValidator()
    {
        RuleFor(request => request.MapId).CatalogueId();
    }
}
