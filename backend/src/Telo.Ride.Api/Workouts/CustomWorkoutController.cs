using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Workouts;
using Telo.Ride.Domain.Workouts;

namespace Telo.Ride.Api.Workouts;

/// <summary>The signed-in rider's custom workout. Needs a session (the fallback policy). Each action sends one MediatR request.</summary>
[ApiController]
[Route("api/riders/me/custom-workout")]
public sealed class CustomWorkoutController(ISender sender) : ControllerBase
{
    /// <summary>The last saved workout (L2-094 AC3), or 404 <c>custom_workout_not_found</c>.</summary>
    [HttpGet]
    public Task<CustomWorkoutDto> Get(CancellationToken cancellationToken) =>
        sender.Send(new GetCustomWorkoutQuery(SignedIn), cancellationToken);

    /// <summary>Saves the workout Start ride rides (L2-099 AC4): 204, or 400 <c>plan_invalid</c>.</summary>
    [HttpPut]
    public async Task<IActionResult> Save(SaveCustomWorkoutRequest request, CancellationToken cancellationToken)
    {
        await sender.Send(new SaveCustomWorkoutCommand(SignedIn, request.Draft, request.Segments), cancellationToken);
        return NoContent();
    }

    private Guid SignedIn => RiderSessionTicketStore.RiderId(User) ?? Guid.Empty;
}

/// <summary>What Start ride sends: the app's draft, and the plan it expands to.</summary>
public sealed record SaveCustomWorkoutRequest(JsonElement? Draft, IReadOnlyList<WorkoutSegment>? Segments);
