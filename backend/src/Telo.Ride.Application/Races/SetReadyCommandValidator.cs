using FluentValidation;

namespace Telo.Ride.Application.Races;

/// <summary>The shape of the race session the rider is ready in (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class SetReadyCommandValidator : AbstractValidator<SetReadyCommand>
{
    public SetReadyCommandValidator()
    {
        RuleFor(request => request.SessionId).SessionId();
    }
}
