using Telo.Ride.Domain.Races;

namespace Telo.Ride.Application.Races;

/// <summary>
/// The live race sessions, held in memory by the one API instance (docs/detailed-designs/multiplayer/run-a-race-session).
/// A session is kept from its opening until a while after its start, so what it holds stays bounded.
/// </summary>
public interface IRaceSessionRegistry
{
    /// <summary>The sessions on that map that have not started.</summary>
    IReadOnlyList<RaceSession> Waiting(string mapId, DateTimeOffset now);

    /// <summary>Opens a new session on that map, starting 30 seconds from now (L2-121 AC1).</summary>
    RaceSession Open(string mapId, DateTimeOffset now);

    /// <summary>The session with that id, or <c>null</c>.</summary>
    RaceSession? Find(string sessionId, DateTimeOffset now);

    /// <summary>Every session that has not started, for the once-a-second tick and a lost connection.</summary>
    IReadOnlyList<RaceSession> Lobbies(DateTimeOffset now);

    /// <summary>Every session that has started and not ended, for the once-a-second standings.</summary>
    IReadOnlyList<RaceSession> Started(DateTimeOffset now);
}
