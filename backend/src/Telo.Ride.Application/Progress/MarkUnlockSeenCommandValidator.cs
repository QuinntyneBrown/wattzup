using FluentValidation;

namespace Telo.Ride.Application.Progress;

/// <summary>The shape of the map whose unlock was seen (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class MarkUnlockSeenCommandValidator : AbstractValidator<MarkUnlockSeenCommand>
{
    public MarkUnlockSeenCommandValidator()
    {
        RuleFor(request => request.MapId).CatalogueId();
    }
}
