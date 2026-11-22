using FluentValidation;

namespace Telo.Ride.Application.Classes;

/// <summary>The shape of the class it asks for (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class GetClassQueryValidator : AbstractValidator<GetClassQuery>
{
    public GetClassQueryValidator()
    {
        RuleFor(request => request.Id).CatalogueId();
    }
}
