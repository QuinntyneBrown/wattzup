using Telo.Ride.Application.Classes;
using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Infrastructure.Live;

/// <summary>
/// The live group sessions in this API instance's memory (one instance serves the hub, ADR 0025). A session goes three
/// hours after its start, longer than any class, so the registry holds at most the next two slots of each class and the
/// sessions still riding.
/// </summary>
internal sealed class InMemoryGroupSessionRegistry : IGroupSessionRegistry
{
    private static readonly TimeSpan Kept = TimeSpan.FromHours(3);

    private readonly Dictionary<string, GroupClassSession> sessions = [];

    public GroupClassSession GetOrCreate(string classId, DateTimeOffset startsAt, DateTimeOffset now)
    {
        var id = GroupSessionSchedule.SessionId(classId, startsAt);
        lock (sessions)
        {
            Prune(now);
            if (!sessions.TryGetValue(id, out var session))
            {
                session = new GroupClassSession(classId, startsAt);
                sessions.Add(id, session);
            }

            return session;
        }
    }

    public GroupClassSession? Find(string sessionId, DateTimeOffset now)
    {
        lock (sessions)
        {
            Prune(now);
            return sessions.GetValueOrDefault(sessionId);
        }
    }

    public IReadOnlyList<GroupClassSession> Started(DateTimeOffset now)
    {
        lock (sessions)
        {
            Prune(now);
            return [.. sessions.Values.Where(session => session.StartsAt <= now)];
        }
    }

    private void Prune(DateTimeOffset now)
    {
        foreach (var (id, session) in sessions.Where(entry => entry.Value.StartsAt + Kept < now).ToList())
            sessions.Remove(id);
    }
}
