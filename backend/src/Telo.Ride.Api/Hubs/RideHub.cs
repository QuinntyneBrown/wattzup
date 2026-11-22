using MediatR;
using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Classes;
using Telo.Ride.Application.Live;

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
            new JoinClassSessionCommand(RiderSessionTicketStore.RiderId(Context.User!) ?? Guid.Empty, classId, sessionId, Context.ConnectionId),
            Context.ConnectionAborted);

    /// <summary>The rider's output in kJ and power in watts in a group session, about once a second (L2-123 AC1).</summary>
    public Task ReportProgress(string sessionId, double outputKj, double powerWatts) =>
        sender.Send(
            new ReportProgressCommand(RiderSessionTicketStore.RiderId(Context.User!) ?? Guid.Empty, sessionId, outputKj, powerWatts),
            Context.ConnectionAborted);
}
