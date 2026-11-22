namespace Telo.Ride.Domain.Workouts;

/// <summary>One timed part of a custom workout's plan, as the app expands it: its kind, seconds, level and cadence aim.</summary>
public sealed record WorkoutSegment(string Kind, int Duration, int Level, int CadenceAim);
