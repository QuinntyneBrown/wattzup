using Microsoft.AspNetCore.Hosting;

namespace Telo.Ride.Api.Tests;

/// <summary>
/// The API as App Service runs it: the Production environment, reached at an address other than <c>localhost</c>
/// (which HSTS leaves out), with TLS ended at the front end, which says so in <c>X-Forwarded-Proto</c> (ADR 0026).
/// </summary>
public sealed class ProductionApi : TeloRideApiFactory
{
    public static readonly Uri Address = new("http://ride.telo.test");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseEnvironment("Production");
    }
}
