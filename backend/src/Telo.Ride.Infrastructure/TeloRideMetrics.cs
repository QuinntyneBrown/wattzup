using System.Diagnostics.Metrics;
using Telo.Ride.Application.Feedback;

namespace Telo.Ride.Infrastructure;

/// <summary>
/// Telo Ride's own instruments, on the OpenTelemetry meter <see cref="MeterName"/> (L2-147 AC4).
/// No tag carries a contact detail, token, message text, query string or body.
/// </summary>
public sealed class TeloRideMetrics : IFeedbackMetrics
{
    public const string MeterName = "Telo.Ride";

    private readonly Counter<long> problems;
    private readonly Counter<long> feedback;

    public TeloRideMetrics(IMeterFactory meters)
    {
        ArgumentNullException.ThrowIfNull(meters);
        var meter = meters.Create(MeterName);
        problems = meter.CreateCounter<long>("telo.ride.problems", unit: "{problem}", description: "ProblemDetails answered, by code and status.");
        feedback = meter.CreateCounter<long>("telo.ride.feedback", unit: "{report}", description: "Feedback received, by kind.");
    }

    /// <summary>Counts one ProblemDetails answered with <paramref name="code"/> and <paramref name="status"/>.</summary>
    public void ProblemAnswered(string code, int status) =>
        problems.Add(1, new KeyValuePair<string, object?>("code", code), new KeyValuePair<string, object?>("status", status));

    /// <summary>Counts one report of <paramref name="kind"/> (L2-119 AC1).</summary>
    public void FeedbackReceived(string kind) => feedback.Add(1, new KeyValuePair<string, object?>("kind", kind));
}
