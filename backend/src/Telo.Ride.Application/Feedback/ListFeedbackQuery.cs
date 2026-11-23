using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Telo.Ride.Application.Feedback;

/// <summary>Every report stored, oldest first, for the team (the <c>feedback</c> command).</summary>
public sealed record ListFeedbackQuery : IRequest<IReadOnlyList<FeedbackReportDto>>;

/// <summary>
/// A stored report as the team reads it: the rider's id, never a contact detail; the message and context exactly as
/// sent, as data (L2-119 AC4); and a bug report's diagnostics.
/// </summary>
public sealed record FeedbackReportDto(
    Guid Id,
    Guid RiderId,
    string Kind,
    string Message,
    IReadOnlyList<FeedbackFactDto> Context,
    string? AppVersion,
    string? PacketLog,
    DateTimeOffset ReceivedAt);

public sealed class ListFeedbackQueryHandler(IAppDbContext db) : IRequestHandler<ListFeedbackQuery, IReadOnlyList<FeedbackReportDto>>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<FeedbackReportDto>> Handle(ListFeedbackQuery request, CancellationToken cancellationToken)
    {
        var reports = await db.FeedbackReports.AsNoTracking().OrderBy(report => report.ReceivedAt).ToListAsync(cancellationToken);
        return reports.Select(report => new FeedbackReportDto(
            report.Id,
            report.RiderId,
            report.Kind,
            report.Message,
            JsonSerializer.Deserialize<List<FeedbackFactDto>>(report.Context, Json) ?? [],
            report.AppVersion,
            report.PacketLog,
            report.ReceivedAt)).ToList();
    }
}
