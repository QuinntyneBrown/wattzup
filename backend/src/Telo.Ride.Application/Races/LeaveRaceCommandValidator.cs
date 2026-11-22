using FluentValidation;

namespace Telo.Ride.Application.Races;

/// <summary>The shape of the race session to leave (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class LeaveRaceCommandValidator : AbstractValidator<LeaveRaceCommand>
{
    public LeaveRaceCommandValidator()
    {
        RuleFor(request => request.SessionId).SessionId();
    }
}
