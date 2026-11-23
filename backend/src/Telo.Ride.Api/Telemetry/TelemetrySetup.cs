using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Telo.Ride.Infrastructure;

namespace Telo.Ride.Api.Telemetry;

internal static class TelemetrySetup
{
    /// <summary>
    /// OpenTelemetry tracing and metrics for ASP.NET Core and EF Core, plus the <c>Telo.Ride</c>
    /// meter (L2-147 AC4), exported over OTLP only when <c>OTEL_EXPORTER_OTLP_ENDPOINT</c> is set
    /// (docs/deployment.md). A span names its route by template and never carries the query string.
    /// </summary>
    public static IServiceCollection AddTeloRideTelemetry(this IServiceCollection services, IConfiguration configuration)
    {
        var telemetry = services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(configuration["OTEL_SERVICE_NAME"] ?? "telo-ride-api"))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(options =>
                    options.EnrichWithHttpRequest = (activity, _) => activity.SetTag("url.query", null))
                .AddEntityFrameworkCoreInstrumentation())
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddMeter(TeloRideMetrics.MeterName));
        if (!string.IsNullOrEmpty(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
        {
            telemetry.UseOtlpExporter();
        }

        return services;
    }
}
