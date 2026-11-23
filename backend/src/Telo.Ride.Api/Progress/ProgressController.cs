using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Progress;

namespace Telo.Ride.Api.Progress;

/// <summary>The signed-in rider's progress. Needs a session (the fallback policy). Each action sends one MediatR request.</summary>
[ApiController]
[Route("api/progress")]
public sealed class ProgressController(ISender sender) : ControllerBase
{
    /// <summary>The rider's level, total XP, next level's threshold and streak (L2-032 AC2, L2-038).</summary>
    [HttpGet]
    public Task<ProgressDto> Get(CancellationToken cancellationToken) =>
        sender.Send(new GetProgressQuery(RiderSessionTicketStore.RiderId(User) ?? Guid.Empty), cancellationToken);

    /// <summary>Home has announced the map a ride opened (L2-036 AC3): 204, or 404 <c>unlock_not_found</c>.</summary>
    [HttpPost("unlocks/{mapId}/seen")]
    public async Task<IActionResult> MarkUnlockSeen(string mapId, CancellationToken cancellationToken)
    {
        await sender.Send(new MarkUnlockSeenCommand(RiderSessionTicketStore.RiderId(User) ?? Guid.Empty, mapId), cancellationToken);
        return NoContent();
    }
}
