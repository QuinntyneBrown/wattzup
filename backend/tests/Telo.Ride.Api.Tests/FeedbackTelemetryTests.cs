// Acceptance test
// Traces to: L2-119 AC1
// Description: feedback is counted on the Telo.Ride meter by its kind alone. Every span, metric point and log record the
// API writes while a rider signs in and sends a bug report is kept; none carries the report's message, its context, its
// packet log or the rider's email (AGENTS.md).
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class FeedbackTelemetryTests(PrivateTelemetryApi api) : IClassFixture<PrivateTelemetryApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Feedback_is_counted_by_kind_and_leaves_no_message_context_or_packet_log_in_telemetry()
    {
        using var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        const string email = "fay.feedback@example.com";
        using (var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel)) Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using (var confirmed = await browser.PostAsJsonAsync("/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel)) Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        const string Message = "Resistance-stuck-quietly-at-L8";
        const string Fact = "Workout-Secret-Ladder";
        const string Packets = "F0-B1-01-08-AA-private";

        using var feedback = await browser.PostAsJsonAsync("/api/feedback", new
        {
            kind = "bug",
            message = Message,
            context = new[] { new { term = "Workout", value = Fact } },
            diagnostics = new { appVersion = "2.0.0 · client dev", packetLog = Packets },
        }, Cancel);
        Assert.Equal(HttpStatusCode.Created, feedback.StatusCode);
        await api.Spans.Await(span => span.GetTagItem("http.route") is "api/feedback", TimeSpan.FromSeconds(5));
        api.FlushMetrics();

        var written = api.Written().ToList();
        foreach (var secret in new[] { Message, Fact, Packets, email })
        {
            Assert.DoesNotContain(written, text => text.Contains(secret, StringComparison.OrdinalIgnoreCase));
        }

        Assert.Contains("telo.ride.feedback kind=bug", written);
    }
}
