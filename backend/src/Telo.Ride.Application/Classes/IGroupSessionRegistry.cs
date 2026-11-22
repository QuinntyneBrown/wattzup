using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>
/// The live group sessions, held in memory by the one API instance (docs/detailed-designs/multiplayer/run-a-group-class-
/// session). A session is kept from its first join until a while after its start, so what it holds stays bounded.
/// </summary>
public interface IGroupSessionRegistry
{
    /// <summary>The session of that class and slot, made on the first join.</summary>
    GroupClassSession GetOrCreate(string classId, DateTimeOffset startsAt, DateTimeOffset now);

    /// <summary>The session with that id, or <c>null</c> when nobody has joined it.</summary>
    GroupClassSession? Find(string sessionId, DateTimeOffset now);
}
