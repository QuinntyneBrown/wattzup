using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Feedback;

namespace Telo.Ride.Api.Feedback;

/// <summary>Feedback from a ride (L2-119). Needs a session (the fallback policy, AC2). One MediatR request per action.</summary>
[ApiController]
[Route("api/feedback")]
public sealed class FeedbackController(ISender sender) : ControllerBase
{
    /// <summary>
    /// A bug report's JSON carries up to 1 MB of packet log, escaped, beside its message and context; the rest of the API
    /// keeps the server's default.
    /// </summary>
    private const long MaxBodyBytes = 2 * 1024 * 1024;

    /// <summary>Stores the report: 201 with its id (AC1), 400 <c>validation_failed</c>, or 429 <c>rate_limited</c> (AC3).</summary>
    [HttpPost]
    [RequestSizeLimit(MaxBodyBytes)]
    public async Task<IActionResult> Submit(SubmitFeedbackRequest request, CancellationToken cancellationToken)
    {
        var received = await sender.Send(
            new SubmitFeedbackCommand(SignedIn, request.Kind, request.Message, request.Context, request.Diagnostics), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, received);
    }

    private Guid SignedIn => RiderSessionTicketStore.RiderId(User) ?? Guid.Empty;
}

/// <summary>What Send feedback posts (docs/detailed-designs/feedback/send-feedback).</summary>
public sealed record SubmitFeedbackRequest(
    string? Kind,
    string? Message,
    IReadOnlyList<FeedbackFactDto>? Context,
    FeedbackDiagnosticsDto? Diagnostics);
