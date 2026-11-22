using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Application.Live;

namespace Telo.Ride.Api.Hubs;

/// <summary>Sends to a live session's riders through the ride hub's groups, one group per session.</summary>
internal sealed class RideHubNotifier(IHubContext<RideHub> hub) : ISessionNotifier
{
    public Task AddToSession(string connectionId, string sessionId, CancellationToken cancellationToken) =>
        hub.Groups.AddToGroupAsync(connectionId, Group(sessionId), cancellationToken);

    public Task StandingsUpdated(StandingsDto standings, CancellationToken cancellationToken) =>
        hub.Clients.Group(Group(standings.SessionId)).SendAsync("StandingsUpdated", standings, cancellationToken);

    private static string Group(string sessionId) => $"session:{sessionId}";
}
