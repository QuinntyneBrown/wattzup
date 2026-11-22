using FluentValidation;

namespace Telo.Ride.Application.Races;

/// <summary>The shape of the race session to join again (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class JoinRaceCommandValidator : AbstractValidator<JoinRaceCommand>
{
    public JoinRaceCommandValidator()
    {
        RuleFor(request => request.SessionId).SessionId();
    }
}
