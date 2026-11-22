using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain.Classes;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Classes;

/// <summary>A rider asks for a seat in a class's group session (L2-122 AC1, AC2, L2-086 AC3), through the ride hub.</summary>
public sealed record JoinClassSessionCommand(Guid RiderId, string ClassId, string SessionId) : IRequest<JoinClassSessionResult>;

/// <summary>
/// Seats the rider in the session, or refuses with a code: <c>session_not_found</c> for an id that is not one of the
/// class's slots, or a slot past the next two; <c>class_locked</c> below the class's opening level (L2-082);
/// <c>session_started</c> once its start has passed, offering the next session; <c>session_full</c> with 10 seated,
/// offering the one 15 minutes later. A rider already seated keeps their seat, so a rejoin after a reconnect keeps it
/// (L2-120 AC3).
/// </summary>
public sealed class JoinClassSessionCommandHandler(
    IAppDbContext db, IClassCatalogue catalogue, IGroupSessionRegistry registry, TimeProvider time)
    : IRequestHandler<JoinClassSessionCommand, JoinClassSessionResult>
{
    private const string NoName = "Rider";

    public async Task<JoinClassSessionResult> Handle(JoinClassSessionCommand request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var definition = catalogue.Classes.FirstOrDefault(c => c.Id == request.ClassId);
        if (definition is null || ClassPlanRules.BrokenRule(definition) is not null
            || !GroupSessionSchedule.TryParse(request.SessionId, out var classId, out var start)
            || classId != definition.Id || start > GroupSessionSchedule.Next(now, 2)[^1])
            return Refused("session_not_found", request.SessionId);

        var rider = await db.Riders.AsNoTracking().SingleAsync(r => r.Id == request.RiderId, cancellationToken);
        if (LevelTable.LevelFor(rider.TotalXp) < definition.OpensAtLevel)
            return Refused("class_locked", request.SessionId);

        var session = start <= now ? registry.Find(request.SessionId, now) : registry.GetOrCreate(classId, start, now);
        var (outcome, seat) = session is null
            ? (JoinOutcome.Started, null)
            : session.TrySeat(rider.Id, rider.DisplayName ?? NoName, now);
        return outcome switch
        {
            JoinOutcome.Seated => new JoinClassSessionResult(null, request.SessionId, start, seat!.Jersey, null),
            JoinOutcome.Full => Refused("session_full", request.SessionId, start, Offer(classId, start + GroupSessionSchedule.Interval)),
            _ => Refused("session_started", request.SessionId, start, Offer(classId, GroupSessionSchedule.Next(now, 1)[0])),
        };
    }

    private static JoinClassSessionResult Refused(
        string code, string sessionId, DateTimeOffset? start = null, OfferedSessionDto? next = null) =>
        new(code, sessionId, start, null, next);

    private static OfferedSessionDto Offer(string classId, DateTimeOffset start) =>
        new(GroupSessionSchedule.SessionId(classId, start), start);
}
