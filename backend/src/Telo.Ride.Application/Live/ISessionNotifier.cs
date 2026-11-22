namespace Telo.Ride.Application.Live;

/// <summary>
/// What the ride hub sends to a live session's riders (docs/detailed-designs/multiplayer/share-progress-and-standings):
/// a seated rider's connection joins the session's group, and the standings go to that group once a second.
/// </summary>
public interface ISessionNotifier
{
    /// <summary>Adds the connection to the session's group, so it receives what the session sends.</summary>
    Task AddToSession(string connectionId, string sessionId, CancellationToken cancellationToken);

    /// <summary>Sends <c>StandingsUpdated</c> to every rider in the session (L2-123 AC3).</summary>
    Task StandingsUpdated(StandingsDto standings, CancellationToken cancellationToken);
}
