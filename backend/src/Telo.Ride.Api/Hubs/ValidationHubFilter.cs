using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Hubs;

/// <summary>
/// A hub message whose request breaks its validators is refused with a <see cref="HubException"/> naming
/// <c>validation_failed</c> and its fields, such as <c>validation_failed: powerWatts</c> (L2-129 AC1). Any other
/// failure keeps SignalR's own answer, which says only that the call failed (L2-129 AC4).
/// </summary>
internal sealed class ValidationHubFilter : IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
    {
        try
        {
            return await next(invocationContext);
        }
        catch (RequestValidationException invalid)
        {
            throw new HubException($"validation_failed: {string.Join(", ", invalid.Errors.Select(error => error.Field).Distinct())}");
        }
    }
}
