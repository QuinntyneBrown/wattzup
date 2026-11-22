using MediatR;
using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Classes;
using Telo.Ride.Application.Live;
using Telo.Ride.Application.Races;

namespace Telo.Ride.Api.Hubs;

/// <summary>
/// The ride hub at <c>/hubs/ride</c>, for live races and group classes. It needs a signed-in rider,
/// like every endpoint not marked anonymous: a connection without a session is refused at
/// negotiation (L2-120 AC2, L2-127 AC1). Each method sends one MediatR request (L2-147 AC2); the
/// session methods arrive with the slices that use them (14.3 to 15).
/// </summary>
internal sealed class RideHub(ISender sender) : Hub
{
    public const string Path = "/hubs/ride";

    /// <summary>The service's time in Unix milliseconds, for the app's clock offset (L2-121 AC3).</summary>
    public Task<long> ServerTime() => sender.Send(new GetServerTimeQuery(), Context.ConnectionAborted);

    /// <summary>
    /// A seat in a class's group session, or the refusal's code and the session offered instead (L2-122). The hub's
    /// connections are all signed in (the fallback policy), so the user is always there.
    /// </summary>
    public Task<JoinClassSessionResult> JoinClassSession(string classId, string sessionId) =>
        sender.Send(
            new JoinClassSessionCommand(Rider, classId, sessionId, Context.ConnectionId),
            Context.ConnectionAborted);

    /// <summary>The rider's output in kJ and power in watts in a group session, about once a second (L2-123 AC1).</summary>
    public Task ReportProgress(string sessionId, double outputKj, double powerWatts) =>
        sender.Send(
            new ReportProgressCommand(Rider, sessionId, outputKj, powerWatts),
            Context.ConnectionAborted);

    /// <summary>"Find a race": a seat in a race session on the map, or the refusal's code (L2-121 AC1).</summary>
    public Task<FindRaceResult> FindRace(string mapId) =>
        sender.Send(new FindRaceCommand(Rider, mapId, Context.ConnectionId), Context.ConnectionAborted);

    /// <summary>"I'm ready", or "You're ready" again, in a race lobby (L2-053 AC1, AC2).</summary>
    public Task SetReady(string sessionId, bool ready) =>
        sender.Send(new SetReadyCommand(Rider, sessionId, ready), Context.ConnectionAborted);

    /// <summary>"Leave" in a race lobby, which releases the rider's seat (L2-057 AC1).</summary>
    public Task LeaveRace(string sessionId) =>
        sender.Send(new LeaveRaceCommand(Rider, sessionId), Context.ConnectionAborted);

    /// <summary>A gone connection frees the rider's lobby seat after 10 seconds (L2-057 AC2).</summary>
    public override Task OnDisconnectedAsync(Exception? exception) =>
        sender.Send(new RaceConnectionLostCommand(Rider), CancellationToken.None);

    /// <summary>The signed-in rider: the hub's connections are all signed in (the fallback policy).</summary>
    private Guid Rider => RiderSessionTicketStore.RiderId(Context.User!) ?? Guid.Empty;
}
