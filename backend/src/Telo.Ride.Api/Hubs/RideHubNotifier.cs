using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Application.Live;
using Telo.Ride.Application.Races;

namespace Telo.Ride.Api.Hubs;

/// <summary>Sends to a live session's riders through the ride hub's groups, one group per session.</summary>
internal sealed class RideHubNotifier(IHubContext<RideHub> hub) : ISessionNotifier
{
    public Task AddToSession(string connectionId, string sessionId, CancellationToken cancellationToken) =>
        hub.Groups.AddToGroupAsync(connectionId, Group(sessionId), cancellationToken);

    public Task StandingsUpdated(StandingsDto standings, CancellationToken cancellationToken) =>
        hub.Clients.Group(Group(standings.SessionId)).SendAsync("StandingsUpdated", standings, cancellationToken);

    public Task SeatsChanged(SeatsChangedDto seats, CancellationToken cancellationToken) =>
        hub.Clients.Group(Group(seats.SessionId)).SendAsync("SeatsChanged", seats, cancellationToken);

    public Task RaceStandingsUpdated(RaceStandingsDto standings, CancellationToken cancellationToken) =>
        hub.Clients.Group(Group(standings.SessionId)).SendAsync("RaceStandingsUpdated", standings, cancellationToken);

    private static string Group(string sessionId) => $"session:{sessionId}";
}
