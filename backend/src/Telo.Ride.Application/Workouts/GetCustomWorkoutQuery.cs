using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;

namespace Telo.Ride.Application.Workouts;

/// <summary>The signed-in rider's last saved custom workout, which Custom workout opens on (L2-094 AC3).</summary>
public sealed record GetCustomWorkoutQuery(Guid RiderId) : IRequest<CustomWorkoutDto>;

/// <summary>A saved custom workout: the app's settings, as it sent them.</summary>
public sealed record CustomWorkoutDto(JsonElement Draft);

/// <summary>Reads the rider's own workout; with none saved, 404 <c>custom_workout_not_found</c>.</summary>
public sealed class GetCustomWorkoutQueryHandler(IAppDbContext db) : IRequestHandler<GetCustomWorkoutQuery, CustomWorkoutDto>
{
    public async Task<CustomWorkoutDto> Handle(GetCustomWorkoutQuery request, CancellationToken cancellationToken)
    {
        var workout = await db.CustomWorkouts.AsNoTracking()
            .FirstOrDefaultAsync(saved => saved.RiderId == request.RiderId, cancellationToken)
            ?? throw new DomainRuleException("custom_workout_not_found", RuleKind.NotFound, "No custom workout is saved.");
        using var settings = JsonDocument.Parse(workout.Settings);
        return new CustomWorkoutDto(settings.RootElement.Clone());
    }
}
