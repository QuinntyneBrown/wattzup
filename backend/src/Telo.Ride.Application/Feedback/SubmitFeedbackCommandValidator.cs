using FluentValidation;
using Telo.Ride.Domain.Feedback;

namespace Telo.Ride.Application.Feedback;

/// <summary>
/// Whether a report is feedback (L2-116, L2-117): a kind of <c>bug</c>, <c>improvement</c> or <c>kudos</c>; a message of 1
/// to 2,000 characters, not only spaces; at most 32 facts of context, each a term of up to 40 characters and a value of up to
/// 200; and diagnostics for a bug only, with an app version of up to 64 characters and at most 1 MB of packet log. Each
/// error names the field as the app sends it.
/// </summary>
public sealed class SubmitFeedbackCommandValidator : AbstractValidator<SubmitFeedbackCommand>
{
    private static readonly string[] Kinds = ["bug", "improvement", "kudos"];

    public SubmitFeedbackCommandValidator()
    {
        RuleFor(report => report.Kind).Must(kind => kind is not null && Kinds.Contains(kind))
            .WithMessage("Kind is bug, improvement or kudos.");
        RuleFor(report => report.Message)
            .Must(message => message is { Length: <= FeedbackReport.MaxMessageLength } && message.Trim().Length > 0)
            .WithMessage($"A message of 1 to {FeedbackReport.MaxMessageLength} characters.");
        RuleFor(report => report.Context).Must(context => context is null || context.Count <= FeedbackReport.MaxFacts)
            .WithMessage($"At most {FeedbackReport.MaxFacts} facts.");
        RuleForEach(report => report.Context).ChildRules(fact =>
        {
            fact.RuleFor(each => each.Term).NotEmpty().MaximumLength(FeedbackReport.MaxTermLength);
            fact.RuleFor(each => each.Value).NotNull().MaximumLength(FeedbackReport.MaxValueLength);
        });
        RuleFor(report => report.Diagnostics).Null().When(report => report.Kind != "bug")
            .WithMessage("Only a bug report carries diagnostics.");
        When(report => report.Kind == "bug" && report.Diagnostics is not null, () =>
        {
            RuleFor(report => report.Diagnostics!.AppVersion).NotEmpty().MaximumLength(FeedbackReport.MaxAppVersionLength)
                .OverridePropertyName("Diagnostics.AppVersion");
            RuleFor(report => report.Diagnostics!.PacketLog).NotNull().MaximumLength(FeedbackReport.MaxPacketLogLength)
                .OverridePropertyName("Diagnostics.PacketLog");
        });
    }
}
