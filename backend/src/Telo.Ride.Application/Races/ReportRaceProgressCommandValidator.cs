using FluentValidation;

namespace Telo.Ride.Application.Races;

/// <summary>The shape of the race session, the rider's distance and power (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class ReportRaceProgressCommandValidator : AbstractValidator<ReportRaceProgressCommand>
{
    public ReportRaceProgressCommandValidator()
    {
        RuleFor(request => request.SessionId).SessionId();
        RuleFor(request => request.DistanceMetres).NotNegative();
        RuleFor(request => request.PowerWatts).Power();
    }
}
