using FluentValidation;

namespace Telo.Ride.Application.Classes;

/// <summary>The shape of the class and the session to join (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class JoinClassSessionCommandValidator : AbstractValidator<JoinClassSessionCommand>
{
    public JoinClassSessionCommandValidator()
    {
        RuleFor(request => request.ClassId).CatalogueId();
        RuleFor(request => request.SessionId).SessionId();
    }
}
