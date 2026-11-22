using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Workouts;

namespace Telo.Ride.Application.Workouts;

/// <summary>Start ride saves the signed-in rider's custom workout: its settings and the plan they expand to (L2-099 AC4).</summary>
public sealed record SaveCustomWorkoutCommand(Guid RiderId, JsonElement? Draft, IReadOnlyList<WorkoutSegment>? Segments) : IRequest;

/// <summary>
/// Keeps the rider's custom workout, replacing the one saved before, once its plan keeps the rules (L2-100 AC3); a
/// missing draft or plan, or one that breaks them, is refused with <c>plan_invalid</c> and the saved one stays.
/// </summary>
public sealed class SaveCustomWorkoutCommandHandler(IAppDbContext db, TimeProvider time) : IRequestHandler<SaveCustomWorkoutCommand>
{
    public async Task Handle(SaveCustomWorkoutCommand request, CancellationToken cancellationToken)
    {
        if (request.Draft is not { ValueKind: JsonValueKind.Object } draft || request.Segments is null)
        {
            throw new DomainRuleException("plan_invalid", RuleKind.Invalid, "A workout needs its settings and its plan.");
        }

        var workout = await db.CustomWorkouts.FirstOrDefaultAsync(saved => saved.RiderId == request.RiderId, cancellationToken);
        if (workout is null)
        {
            workout = CustomWorkout.For(request.RiderId);
            db.CustomWorkouts.Add(workout);
        }

        workout.Save(draft.GetRawText(), request.Segments, time.GetUtcNow());
        await db.SaveChangesAsync(cancellationToken);
    }
}
