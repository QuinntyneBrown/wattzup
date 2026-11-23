namespace Telo.Ride.Application.Feedback;

/// <summary>Counts the feedback received, by kind only: never its message, context, packet log or rider (AGENTS.md).</summary>
public interface IFeedbackMetrics
{
    void FeedbackReceived(string kind);
}
