using FluentValidation;

namespace Telo.Ride.Application.Classes;

/// <summary>The shape of the class whose sessions it asks for (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class GetClassSessionsQueryValidator : AbstractValidator<GetClassSessionsQuery>
{
    public GetClassSessionsQueryValidator()
    {
        RuleFor(request => request.ClassId).CatalogueId();
    }
}
