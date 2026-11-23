using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Rides;

namespace Telo.Ride.Api.Rides;

/// <summary>
/// The signed-in rider's finished rides. Needs a session (the fallback policy). Each action sends one MediatR request.
/// </summary>
[ApiController]
[Route("api/rides")]
public sealed class RidesController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Records a finished ride once for its ride id (L2-044 AC2): 201 with the answer the first time, 200 with the same
    /// answer for a repeat (L2-125 AC3), 422 <c>ride_not_plausible</c> for a ride no one could ride (AC2), and 400
    /// <c>validation_failed</c> for a body that is not a ride.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Submit(SubmitRideRequest ride, CancellationToken cancellationToken)
    {
        var submission = await sender.Send(new SubmitRideCommand(SignedIn, ride), cancellationToken);
        return submission.Recorded ? StatusCode(StatusCodes.Status201Created, submission.Answer) : Ok(submission.Answer);
    }

    private Guid SignedIn => RiderSessionTicketStore.RiderId(User) ?? Guid.Empty;
}
