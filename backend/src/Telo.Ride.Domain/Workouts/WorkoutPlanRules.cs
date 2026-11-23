namespace Telo.Ride.Domain.Workouts;

/// <summary>
/// The rules a custom workout's plan keeps (L2-100 AC3): every segment at least 5 seconds, every level 1 to 32, and the
/// total 1 to 180 minutes. A plan that breaks one is refused with <c>plan_invalid</c>.
/// </summary>
public static class WorkoutPlanRules
{
    public const int MinSegmentSeconds = 5;
    public const int MinLevel = 1;
    public const int MaxLevel = 32;
    public const int MinTotalSeconds = 60;
    public const int MaxTotalSeconds = 10_800;

    public static void Check(IReadOnlyCollection<WorkoutSegment> segments)
    {
        var total = segments.Sum(segment => (long)segment.Duration);
        var kept = segments.All(segment =>
                segment.Duration >= MinSegmentSeconds && segment.Level is >= MinLevel and <= MaxLevel)
            && total is >= MinTotalSeconds and <= MaxTotalSeconds;
        if (!kept)
        {
            throw new DomainRuleException(
                "plan_invalid",
                RuleKind.Invalid,
                "Every segment needs 5 seconds or more at level 1 to 32, and the plan 1 to 180 minutes.");
        }
    }
}
