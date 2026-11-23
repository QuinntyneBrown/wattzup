namespace Telo.Ride.Domain.Feedback;

/// <summary>
/// One piece of feedback a rider sent from a ride (docs/detailed-designs/feedback/receive-feedback, L2-119 AC1): its
/// kind, message and the ride's context, a bug report's diagnostics, the rider's account and when it arrived. The message
/// and context are kept exactly as they came, as data; any reader encodes them as text (L2-119 AC4).
/// </summary>
public sealed class FeedbackReport
{
    /// <summary>The longest message, after trimming (L2-116 AC3).</summary>
    public const int MaxMessageLength = 2_000;

    /// <summary>A bug report's share of the packet log: its last 1 MB (L2-117 AC4).</summary>
    public const int MaxPacketLogLength = 1_048_576;

    /// <summary>The longest app version, "2.0.0 · client a1b2c3d".</summary>
    public const int MaxAppVersionLength = 64;

    /// <summary>The most facts a context holds; a custom ride sends fourteen.</summary>
    public const int MaxFacts = 32;

    public const int MaxTermLength = 40;

    public const int MaxValueLength = 200;

    public required Guid Id { get; init; }

    public required Guid RiderId { get; init; }

    /// <summary><c>bug</c>, <c>improvement</c> or <c>kudos</c>.</summary>
    public required string Kind { get; init; }

    public required string Message { get; init; }

    /// <summary>The ride's facts as JSON, <c>[{"term":"Elapsed","value":"6:52 / 30:00"}]</c>, as the app sent them.</summary>
    public required string Context { get; init; }

    /// <summary>A bug report's app version; none without diagnostics.</summary>
    public string? AppVersion { get; init; }

    /// <summary>A bug report's packet log as JSON Lines; none without diagnostics.</summary>
    public string? PacketLog { get; init; }

    public required DateTimeOffset ReceivedAt { get; init; }
}
