using Telo.Ride.Application.Races;
using Telo.Ride.Domain.Races;

namespace Telo.Ride.Infrastructure.Live;

/// <summary>
/// The live race sessions in this API instance's memory (one instance serves the hub, ADR 0025). A session goes three
/// hours after its start, longer than any race, so the registry holds only the lobbies waiting now and the races still
/// riding.
/// </summary>
internal sealed class InMemoryRaceSessionRegistry : IRaceSessionRegistry
{
    private static readonly TimeSpan Kept = TimeSpan.FromHours(3);

    private readonly List<RaceSession> sessions = [];

    public IReadOnlyList<RaceSession> Waiting(string mapId, DateTimeOffset now)
    {
        lock (sessions)
        {
            Prune(now);
            return [.. sessions.Where(session => session.MapId == mapId && session.StartsAt > now)];
        }
    }

    public RaceSession Open(string mapId, DateTimeOffset now)
    {
        var session = new RaceSession(mapId, now + RaceSession.Lobby);
        lock (sessions)
        {
            Prune(now);
            sessions.Add(session);
        }

        return session;
    }

    public RaceSession? Find(string sessionId, DateTimeOffset now)
    {
        lock (sessions)
        {
            Prune(now);
            return sessions.Find(session => session.Id == sessionId);
        }
    }

    public IReadOnlyList<RaceSession> Lobbies(DateTimeOffset now)
    {
        lock (sessions)
        {
            Prune(now);
            return [.. sessions.Where(session => session.StartsAt > now)];
        }
    }

    public IReadOnlyList<RaceSession> Started(DateTimeOffset now)
    {
        lock (sessions)
        {
            Prune(now);
            return [.. sessions.Where(session => session.StartsAt <= now && !session.Ended)];
        }
    }

    private void Prune(DateTimeOffset now) => sessions.RemoveAll(session => session.StartsAt + Kept < now);
}
