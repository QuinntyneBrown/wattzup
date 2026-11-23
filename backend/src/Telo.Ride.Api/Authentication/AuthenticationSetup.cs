using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Api.Authentication;

internal static class AuthenticationSetup
{
    /// <summary>The session cookie's name; <c>__Host-</c> pins it to the API's own host.</summary>
    public const string SessionCookie = "__Host-telo-session";

    /// <summary>
    /// Cookie authentication and a fallback policy requiring a signed-in rider on every endpoint
    /// that declares no policy of its own (L2-127 AC1). An API never redirects to a sign-in page:
    /// a request without a session gets 401 and one without permission 403, each as ProblemDetails.
    /// The session cookie, <c>__Host-telo-session</c>, is HttpOnly, Secure and SameSite=Lax (L2-004 AC2) and holds
    /// only a key to a <see cref="RiderSessionTicketStore"/> session, reissued on each use with the session's expiry.
    /// </summary>
    public static IServiceCollection AddTeloRideAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = SessionCookie;
                options.Cookie.Path = "/";
                options.ExpireTimeSpan = RiderSession.Lifetime;
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Events.OnRedirectToLogin = context =>
                    Refuse(context.HttpContext, StatusCodes.Status401Unauthorized, "Sign in to continue.", "unauthenticated");
                options.Events.OnRedirectToAccessDenied = context =>
                    Refuse(context.HttpContext, StatusCodes.Status403Forbidden, "This is not yours to see.", "forbidden");
                options.Events.OnValidatePrincipal = context =>
                {
                    context.ShouldRenew = true;
                    return Task.CompletedTask;
                };
            });
        services.AddSingleton<RiderSessionTicketStore>();
        services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
            .Configure<RiderSessionTicketStore, TimeProvider>((options, store, time) =>
            {
                options.SessionStore = store;
                options.TimeProvider = time;
            });
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
        return services;
    }

    private static async Task Refuse(HttpContext http, int status, string title, string code)
    {
        http.Response.StatusCode = status;
        var problem = new ProblemDetails { Status = status, Title = title, Extensions = { ["code"] = code } };
        await http.RequestServices.GetRequiredService<IProblemDetailsService>()
            .WriteAsync(new ProblemDetailsContext { HttpContext = http, ProblemDetails = problem });
    }
}
