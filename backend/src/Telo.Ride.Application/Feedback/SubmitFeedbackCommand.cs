using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Feedback;

namespace Telo.Ride.Application.Feedback;

/// <summary>One line of the ride's context, as the app shows it under "Attached from Ride" (L2-117 AC2).</summary>
public sealed record FeedbackFactDto(string? Term, string? Value);

/// <summary>A bug report's diagnostics: the app version and the last 1 MB of the packet log (L2-117 AC4).</summary>
public sealed record FeedbackDiagnosticsDto(string? AppVersion, string? PacketLog);

/// <summary>
/// A signed-in rider's feedback (L2-119 AC1): its kind, message, context and, for a bug, diagnostics. The rider comes
/// from the session, never from the body.
/// </summary>
public sealed record SubmitFeedbackCommand(
    Guid RiderId,
    string? Kind,
    string? Message,
    IReadOnlyList<FeedbackFactDto>? Context,
    FeedbackDiagnosticsDto? Diagnostics) : IRequest<FeedbackReceivedDto>;

/// <summary>What the API answers once a report is stored: its id.</summary>
public sealed record FeedbackReceivedDto(Guid Id);

/// <summary>
/// Stores a rider's feedback with the rider's account and the time, its message and context exactly as sent (L2-119
/// AC1, AC4), and counts it by kind. A rider who has sent <see cref="ReportsPerHour"/> in the past hour is refused with
/// <c>rate_limited</c> and the wait until the oldest of them falls out of it (L2-119 AC3); the count is of stored
/// reports, so it holds across instances.
/// </summary>
public sealed class SubmitFeedbackCommandHandler(IAppDbContext db, TimeProvider time, IFeedbackMetrics metrics)
    : IRequestHandler<SubmitFeedbackCommand, FeedbackReceivedDto>
{
    public const int ReportsPerHour = 10;

    private static readonly TimeSpan Hour = TimeSpan.FromHours(1);

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<FeedbackReceivedDto> Handle(SubmitFeedbackCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        await KeepWithinTheHoursLimit(request.RiderId, now, cancellationToken);

        var report = new FeedbackReport
        {
            Id = Guid.NewGuid(),
            RiderId = request.RiderId,
            Kind = request.Kind!,
            Message = request.Message!,
            Context = JsonSerializer.Serialize(request.Context ?? [], Json),
            AppVersion = request.Diagnostics?.AppVersion,
            PacketLog = request.Diagnostics?.PacketLog,
            ReceivedAt = now,
        };
        db.FeedbackReports.Add(report);
        await db.SaveChangesAsync(cancellationToken);
        metrics.FeedbackReceived(report.Kind);
        return new(report.Id);
    }

    private async Task KeepWithinTheHoursLimit(Guid riderId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var since = now - Hour;
        var recent = await db.FeedbackReports
            .Where(report => report.RiderId == riderId && report.ReceivedAt > since)
            .OrderBy(report => report.ReceivedAt)
            .Select(report => report.ReceivedAt)
            .ToListAsync(cancellationToken);
        if (recent.Count < ReportsPerHour) return;

        var wait = recent[recent.Count - ReportsPerHour] + Hour - now;
        throw new DomainRuleException("rate_limited", RuleKind.TooManyRequests, "Too much feedback sent this hour.", wait);
    }
}
