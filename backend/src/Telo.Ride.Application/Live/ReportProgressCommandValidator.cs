using FluentValidation;

namespace Telo.Ride.Application.Live;

/// <summary>The shape of the group session, the rider's output and power (L2-129 AC1, <see cref="InputRules"/>).</summary>
public sealed class ReportProgressCommandValidator : AbstractValidator<ReportProgressCommand>
{
    public ReportProgressCommandValidator()
    {
        RuleFor(request => request.SessionId).SessionId();
        RuleFor(request => request.OutputKj).NotNegative();
        RuleFor(request => request.PowerWatts).Power();
    }
}
