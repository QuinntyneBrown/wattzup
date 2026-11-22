using Microsoft.AspNetCore.SignalR;

namespace Telo.Ride.Api.Hubs;

/// <summary>
/// Puts each progress message through its connection's <see cref="ProgressRateGate"/> (L2-130 AC2): a dropped message is
/// not handled and not answered with an error, and a client over the limit for 10 seconds is disconnected. The gate
/// lives in the connection's items, so it goes when the connection closes.
/// </summary>
internal sealed class ProgressRateHubFilter(TimeProvider time) : IHubFilter
{
    private static readonly object GateKey = new();

    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
    {
        if (invocationContext.HubMethodName is not (nameof(RideHub.ReportProgress) or nameof(RideHub.ReportRaceProgress)))
        {
            return await next(invocationContext);
        }

        var connection = invocationContext.Context;
        if (connection.Items[GateKey] is not ProgressRateGate gate)
        {
            gate = new ProgressRateGate(time);
            connection.Items[GateKey] = gate;
        }

        switch (gate.Admit())
        {
            case GateDecision.Admit:
                return await next(invocationContext);
            case GateDecision.Disconnect:
                connection.Abort();
                return null;
            default:
                return null;
        }
    }
}
