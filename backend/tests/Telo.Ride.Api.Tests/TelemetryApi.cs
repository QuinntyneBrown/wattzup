using System.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Telo.Ride.Api.Tests;

/// <summary>The signed-in probe API with its spans and metrics exported to memory.</summary>
public sealed class TelemetryApi : SignedInProbeApi
{
    public SpanRecorder Spans { get; } = new();

    public List<Metric> Metrics { get; } = [];

    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.ConfigureOpenTelemetryTracerProvider(tracing => tracing.AddProcessor(Spans));
        services.ConfigureOpenTelemetryMeterProvider(metrics => metrics.AddInMemoryExporter(Metrics));
    }

    /// <summary>Exports the metrics recorded so far into <see cref="Metrics"/>.</summary>
    public void FlushMetrics() => Services.GetRequiredService<MeterProvider>().ForceFlush();
}

/// <summary>Records each finished span in an <see cref="EventProbe{T}"/>, so a test awaits one instead of sleeping.</summary>
public sealed class SpanRecorder : BaseProcessor<Activity>
{
    private readonly EventProbe<Activity> ended = new(span => span.DisplayName);

    public override void OnEnd(Activity data) => ended.Record(data);

    /// <summary>The first finished span matching <paramref name="match"/>, or a failure naming the spans that did end.</summary>
    public Task<Activity> Await(Func<Activity, bool> match, TimeSpan timeout) => ended.Await(match, timeout);
}
