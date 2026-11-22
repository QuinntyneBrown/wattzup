using Microsoft.AspNetCore.Mvc;

namespace Telo.Ride.Api.Authentication;

/// <summary>
/// The same-origin proof of L2-127 AC2 (ADR 0033): every unsafe request (any method but GET, HEAD, OPTIONS and TRACE)
/// and every WebSocket upgrade that the browser marks as coming from another origin is refused with 403 and code
/// <c>cross_origin</c> before authentication, so a forged change never reaches a controller or the ride hub. The browser
/// sets <c>Sec-Fetch-Site</c> and <c>Origin</c> itself and a page cannot change them, so the app sends nothing extra.
/// </summary>
internal static class SameOriginRequests
{
    public const string Code = "cross_origin";

    public static IApplicationBuilder UseSameOriginRequests(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            var request = context.Request;
            var guarded = !(HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method) ||
                HttpMethods.IsOptions(request.Method) || HttpMethods.IsTrace(request.Method)) ||
                IsUpgrade(request);
            if (!guarded || IsSameOrigin(request))
            {
                await next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "This request did not come from Telo Ride.",
                Extensions = { ["code"] = Code },
            };
            await context.RequestServices.GetRequiredService<IProblemDetailsService>()
                .WriteAsync(new ProblemDetailsContext { HttpContext = context, ProblemDetails = problem });
        });

    /// <summary>
    /// A WebSocket upgrade, read from its header: SignalR adds the WebSocket feature only inside its own endpoint, after
    /// this check. An HTTP/2 WebSocket is a CONNECT, which is unsafe already.
    /// </summary>
    private static bool IsUpgrade(HttpRequest request) =>
        request.Headers.Upgrade.ToString().Contains("websocket", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// <c>Sec-Fetch-Site</c> decides when the browser sends it: <c>same-origin</c>, or <c>none</c> for what the rider
    /// did themselves. Without it, an <c>Origin</c> must be the request's own scheme and host. A request with neither
    /// comes from a client that is not a browser, which has no rider's cookie to borrow.
    /// </summary>
    private static bool IsSameOrigin(HttpRequest request)
    {
        var fetchSite = request.Headers["Sec-Fetch-Site"].ToString();
        if (fetchSite.Length > 0)
        {
            return fetchSite is "same-origin" or "none";
        }

        var origin = request.Headers.Origin.ToString();
        if (origin.Length == 0)
        {
            return true;
        }

        return Uri.TryCreate(origin, UriKind.Absolute, out var from) &&
            string.Equals(from.Scheme, request.Scheme, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(from.Authority, request.Host.Value, StringComparison.OrdinalIgnoreCase);
    }
}
