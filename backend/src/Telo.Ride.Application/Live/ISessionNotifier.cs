namespace Telo.Ride.Application.Live;

/// <summary>
/// What the ride hub sends to a live session's riders (docs/detailed-designs/multiplayer/share-progress-and-standings):
/// a seated rider's connection joins the session's group; the standings go to that group once a second, and a race
/// lobby's grid each time it changes.
/// </summary>
public interface ISessionNotifier
{
    /// <summary>Adds the connection to the session's group, so it receives what the session sends.</summary>
    Task AddToSession(string connectionId, string sessionId, CancellationToken cancellationToken);

    /// <summary>Sends <c>StandingsUpdated</c> to every rider in the session (L2-123 AC3).</summary>
    Task StandingsUpdated(StandingsDto standings, CancellationToken cancellationToken);

    /// <summary>Sends <c>SeatsChanged</c>, a race lobby's grid after a change, to every rider in the session (L2-055 AC3).</summary>
    Task SeatsChanged(Races.SeatsChangedDto seats, CancellationToken cancellationToken);

    /// <summary>Sends <c>RaceStandingsUpdated</c> to every rider in the race session (L2-123 AC3).</summary>
    Task RaceStandingsUpdated(Races.RaceStandingsDto standings, CancellationToken cancellationToken);
}
