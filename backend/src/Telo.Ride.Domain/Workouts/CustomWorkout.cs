namespace Telo.Ride.Domain.Workouts;

/// <summary>
/// A rider's last saved custom workout (docs/detailed-designs/custom-workout/set-up-a-custom-workout, L2-099 AC4): its
/// settings as the app sent them, which Custom workout opens on next time (L2-094 AC3), and when it was saved. One per
/// rider; saving again replaces it.
/// </summary>
public sealed class CustomWorkout
{
    /// <summary>The most the settings may take, as JSON text.</summary>
    public const int MaxSettingsLength = 8_000;

    public required Guid RiderId { get; init; }

    /// <summary>The app's draft as JSON, kept as it came: the server checks only the plan it expands to.</summary>
    public string Settings { get; private set; } = "{}";

    public DateTimeOffset SavedAt { get; private set; }

    public static CustomWorkout For(Guid riderId) => new() { RiderId = riderId };

    /// <summary>Keeps these settings, once their plan keeps the rules (<see cref="WorkoutPlanRules"/>).</summary>
    public void Save(string settings, IReadOnlyCollection<WorkoutSegment> plan, DateTimeOffset at)
    {
        WorkoutPlanRules.Check(plan);
        if (settings.Length > MaxSettingsLength)
        {
            throw new DomainRuleException("plan_invalid", RuleKind.Invalid, "The workout's settings are too long.");
        }

        Settings = settings;
        SavedAt = at;
    }
}
