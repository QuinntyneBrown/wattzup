// Acceptance test
// Traces to: L2-132 AC3, AC4
// Description: a rider signs in with an email code, names themselves, reads their progress with a query string and
// signs out. Every span, metric point and log record the API writes on the way, at its configured levels, is kept; none
// carries the email, the code, the session token, the display name sent in a body, or the query string. A route is
// recorded as its template. The stored sign-in code is only its hash.
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Tests;

public sealed class PrivateTelemetryTests(PrivateTelemetryApi api) : IClassFixture<PrivateTelemetryApi>
{
    private const string Email = "sam.secret@example.com";
    private const string DisplayName = "Samwise Secretname";
    private const string Query = "whisper=hush-hush";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_sign_in_leaves_no_contact_detail_code_token_body_or_query_in_telemetry()
    {
        using var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        using (var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email = Email }, Cancel)) Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        var code = api.Mailbox.Sent[^1].Code;
        using var confirmed = await browser.PostAsJsonAsync("/api/auth/code/confirm", new { email = Email, code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var token = confirmed.Headers.GetValues("Set-Cookie").Single(v => v.StartsWith("__Host-telo-session=", StringComparison.Ordinal)).Split(';')[0]["__Host-telo-session=".Length..];
        using (var named = await browser.PutAsJsonAsync("/api/riders/me/display-name", new { displayName = DisplayName }, Cancel)) Assert.Equal(HttpStatusCode.OK, named.StatusCode);
        using (var progress = await browser.GetAsync($"/api/progress?{Query}", Cancel)) Assert.Equal(HttpStatusCode.OK, progress.StatusCode);
        using (var signedOut = await browser.PostAsync("/api/auth/sign-out", null, Cancel)) Assert.True(signedOut.IsSuccessStatusCode);
        var lastSpan = await api.Spans.Await(span => span.GetTagItem("http.route") is "api/auth/sign-out", TimeSpan.FromSeconds(5));
        api.FlushMetrics();

        var secrets = new[] { Email, "sam.secret", code, token, DisplayName, "hush-hush" };
        var written = api.Written().ToList();
        Assert.NotEmpty(written);
        foreach (var secret in secrets)
        {
            Assert.DoesNotContain(written, text => text.Contains(secret, StringComparison.OrdinalIgnoreCase));
        }

        Assert.Equal("api/auth/sign-out", lastSpan.GetTagItem("http.route"));
        Assert.Contains(written, text => text.Contains("api/progress", StringComparison.Ordinal));

        using var scope = api.Services.CreateScope();
        var stored = await scope.ServiceProvider.GetRequiredService<IAppDbContext>().SignInCodes.SingleAsync(Cancel);
        Assert.NotEqual(code, stored.CodeHash);
        Assert.DoesNotContain(code, stored.CodeHash, StringComparison.Ordinal);
    }
}

/// <summary>The sign-in API with every span, metric point and log record it writes kept in memory.</summary>
public sealed class PrivateTelemetryApi : SignInApi
{
    private readonly ConcurrentQueue<Activity> spans = new();
    private readonly List<Metric> metrics = [];
    private readonly LogRecorder logs = new();

    public EventProbe<Activity> Spans { get; } = new(span => span.DisplayName);

    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.ConfigureOpenTelemetryTracerProvider(tracing => tracing.AddProcessor(new Recorder(span =>
        {
            spans.Enqueue(span);
            Spans.Record(span);
        })));
        services.ConfigureOpenTelemetryMeterProvider(metrics => metrics.AddInMemoryExporter(this.metrics));
        services.AddLogging(logging => logging.AddProvider(logs));
    }

    public void FlushMetrics() => Services.GetRequiredService<MeterProvider>().ForceFlush();

    /// <summary>Every name, tag, event, attribute and message telemetry wrote, as text.</summary>
    public IEnumerable<string> Written()
    {
        foreach (var span in spans)
        {
            yield return span.DisplayName;
            yield return span.OperationName;
            foreach (var tag in span.TagObjects) yield return $"{tag.Key}={tag.Value}";
            foreach (var spanEvent in span.Events)
            {
                yield return spanEvent.Name;
                foreach (var tag in spanEvent.Tags) yield return $"{tag.Key}={tag.Value}";
            }
        }

        foreach (var metric in metrics)
        {
            foreach (var point in metric.GetMetricPoints())
            {
                foreach (var tag in point.Tags) yield return $"{metric.Name} {tag.Key}={tag.Value}";
            }
        }

        foreach (var line in logs.Lines) yield return line;
    }

    private sealed class Recorder(Action<Activity> ended) : BaseProcessor<Activity>
    {
        public override void OnEnd(Activity data) => ended(data);
    }

    /// <summary>Keeps each log record the API writes at its configured levels: its message, its values and its scopes.</summary>
    private sealed class LogRecorder : ILoggerProvider, ISupportExternalScope
    {
        private IExternalScopeProvider scopes = new LoggerExternalScopeProvider();

        public ConcurrentQueue<string> Lines { get; } = new();

        public ILogger CreateLogger(string categoryName) => new Logger(this, categoryName);

        public void SetScopeProvider(IExternalScopeProvider scopeProvider) => scopes = scopeProvider;

        public void Dispose()
        {
        }

        private sealed class Logger(LogRecorder recorder, string category) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state)
                where TState : notnull => recorder.scopes.Push(state);

            public bool IsEnabled(LogLevel logLevel) => logLevel != LogLevel.None;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            {
                recorder.Lines.Enqueue($"{category}: {formatter(state, exception)} {exception}");
                if (state is IEnumerable<KeyValuePair<string, object?>> values)
                {
                    foreach (var (key, value) in values) recorder.Lines.Enqueue($"{category}: {key}={value}");
                }

                recorder.scopes.ForEachScope((scope, lines) => lines.Enqueue($"{category} scope: {scope}"), recorder.Lines);
            }
        }
    }
}
