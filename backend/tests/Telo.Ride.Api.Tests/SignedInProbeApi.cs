using System.Security.Claims;
using System.Text.Encodings.Web;
using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Telo.Ride.Api.Tests.Probe;

namespace Telo.Ride.Api.Tests;

/// <summary>The probe API with every request signed in as one rider, for tests of what a session allows rather than how one starts.</summary>
public class SignedInProbeApi : ProbeApi
{
    private const string SchemeName = "SignedIn";

    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.AddValidatorsFromAssemblyContaining<ProbeController>();
        services.AddAuthentication().AddScheme<AuthenticationSchemeOptions, SignedInRider>(SchemeName, null);
        services.PostConfigure<AuthenticationOptions>(options => options.DefaultAuthenticateScheme = SchemeName);
    }

    private sealed class SignedInRider(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var rider = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "rider-1")], SchemeName));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(rider, SchemeName)));
        }
    }
}
