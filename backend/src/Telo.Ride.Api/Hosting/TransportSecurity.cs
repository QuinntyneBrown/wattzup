using Microsoft.AspNetCore.HttpOverrides;

namespace Telo.Ride.Api.Hosting;

/// <summary>
/// HTTPS only (L2-009 AC2). App Service ends TLS at its front end and forwards the request with
/// <c>X-Forwarded-Proto</c>, so the scheme is read from that header first; outside Development every plain http
/// request is redirected to the same address on https, and every https response carries Strict-Transport-Security.
/// </summary>
internal static class TransportSecurity
{
    /// <summary>One year, the least the browsers' preload lists accept; no subdomain is Telo Ride's to commit.</summary>
    public static readonly TimeSpan MaxAge = TimeSpan.FromDays(365);

    public static IServiceCollection AddTransportSecurity(this IServiceCollection services)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            // The client's address too, for the per-network sign-in limit (L2-003 AC5). With the default ForwardLimit of 1
            // only the rightmost X-Forwarded-For entry is read: the one App Service's front end appends, which a client
            // cannot forge.
            options.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor;
            // App Service's front end has no fixed address to trust by name.
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
        services.AddHttpsRedirection(options =>
        {
            options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
            options.HttpsPort = 443;
        });
        services.AddHsts(options => options.MaxAge = MaxAge);
        return services;
    }

    public static WebApplication UseTransportSecurity(this WebApplication app)
    {
        app.UseForwardedHeaders();
        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }

        return app;
    }
}
