using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Telo.Ride.Api.Tests;

/// <summary>The API with the app's build in its web root, as the deploy puts it there (ADR 0026).</summary>
public sealed class HostedAppApi : TeloRideApiFactory
{
    public const string AppShell = "<!doctype html><title>Telo Ride</title><wz-root></wz-root>";

    protected override void ConfigureServices(IServiceCollection services) =>
        services.PostConfigure<StaticFileOptions>(options => options.FileProvider = new InMemoryWebRoot(
            new Dictionary<string, string>
            {
                ["index.html"] = AppShell,
                ["main-GJM55KKQ.js"] = "console.log('ride');",
                // The Angular service worker and its manifest, which the production build writes beside the app.
                ["ngsw-worker.js"] = "self.addEventListener('fetch', () => {});",
                ["ngsw.json"] = "{\"configVersion\":1}",
            }));
}
