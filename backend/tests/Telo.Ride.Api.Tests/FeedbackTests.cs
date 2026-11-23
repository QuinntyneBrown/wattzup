// Acceptance test
// Traces to: L2-119 AC1, AC2, AC3, AC4
// Description: a signed-in rider's feedback is stored with its kind, message, context, diagnostics for a bug, the
// rider's account and the time, and the API answers 201; the team reads it with the feedback command, the message and
// context exactly as sent. Without a session it is refused with 401. The 11th report from one rider in an hour is
// refused with 429, code rate_limited and the seconds to wait, while another rider is not held back. A report that is
// not feedback is refused with 400 validation_failed, naming its field.
using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Telo.Ride.Api.Commands;

namespace Telo.Ride.Api.Tests;

public sealed class FeedbackTests(SignInApi api) : IClassFixture<SignInApi>
{
    private const string Path = "/api/feedback";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private static readonly object[] Context =
    [
        new { term = "Workout", value = "HIIT · 8 × 0:30" },
        new { term = "Elapsed", value = "6:52 / 30:00" },
        new { term = "Last command", value = "RES 8 · plan · ack 41 ms" },
    ];

    private static object Note(string kind, string message, object? diagnostics = null) =>
        new { kind, message, context = Context, diagnostics };

    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        Assert.Equal(HttpStatusCode.Accepted, sent.StatusCode);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return browser;
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();

    /// <summary>What the team reads: the feedback command's JSON Lines, one report a line, oldest first.</summary>
    private async Task<List<JsonElement>> Read()
    {
        using var output = new StringWriter(CultureInfo.InvariantCulture);
        Assert.Equal(0, await FeedbackCommand.RunAsync(api.Services, output, Cancel));
        return output.ToString().Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(line => JsonDocument.Parse(line).RootElement.Clone()).ToList();
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_bug_report_is_stored_with_its_context_diagnostics_rider_and_time_and_the_team_reads_it()
    {
        using var browser = await SignedIn("bea.bugs@example.com");
        var riderId = (await Json(await browser.GetAsync("/api/riders/me", Cancel))).GetProperty("id").GetGuid();
        const string Log = "{\"time\":\"2026-11-23T08:00:00.000Z\",\"direction\":\"out\",\"frame\":\"B1\",\"hex\":\"F0 B1 01 08 AA\"}\n";

        using var sent = await browser.PostAsJsonAsync(
            Path, Note("bug", "Resistance stayed at L8.", new { appVersion = "2.0.0 · client a1b2c3d", packetLog = Log }), Cancel);

        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        var id = (await Json(sent)).GetProperty("id").GetGuid();
        var report = (await Read()).Single(stored => stored.GetProperty("id").GetGuid() == id);
        Assert.Equal(riderId, report.GetProperty("riderId").GetGuid());
        Assert.Equal("bug", report.GetProperty("kind").GetString());
        Assert.Equal("Resistance stayed at L8.", report.GetProperty("message").GetString());
        Assert.Equal(
            ["Workout: HIIT · 8 × 0:30", "Elapsed: 6:52 / 30:00", "Last command: RES 8 · plan · ack 41 ms"],
            report.GetProperty("context").EnumerateArray().Select(fact => $"{fact.GetProperty("term")}: {fact.GetProperty("value")}"));
        Assert.Equal("2.0.0 · client a1b2c3d", report.GetProperty("appVersion").GetString());
        Assert.Equal(Log, report.GetProperty("packetLog").GetString());
        Assert.Equal(api.Clock.GetUtcNow(), report.GetProperty("receivedAt").GetDateTimeOffset());
    }

    [Fact]
    public async Task Kudos_carry_no_diagnostics_and_the_message_and_context_are_kept_as_data()
    {
        using var browser = await SignedIn("kit.kudos@example.com");
        const string Markup = "<b>Great</b> <script>alert('hi')</script> & \"thanks\"";

        using var sent = await browser.PostAsJsonAsync(Path, new
        {
            kind = "kudos",
            message = Markup,
            context = new[] { new { term = "View", value = "<img src=x onerror=alert(1)>" } },
            diagnostics = (object?)null,
        }, Cancel);

        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        var id = (await Json(sent)).GetProperty("id").GetGuid();
        var report = (await Read()).Single(stored => stored.GetProperty("id").GetGuid() == id);
        Assert.Equal("kudos", report.GetProperty("kind").GetString());
        Assert.Equal(Markup, report.GetProperty("message").GetString());
        Assert.Equal("<img src=x onerror=alert(1)>", report.GetProperty("context")[0].GetProperty("value").GetString());
        Assert.Equal(JsonValueKind.Null, report.GetProperty("appVersion").ValueKind);
        Assert.Equal(JsonValueKind.Null, report.GetProperty("packetLog").ValueKind);
    }

    [Fact]
    public async Task Feedback_without_a_session_is_refused_with_401()
    {
        using var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        using var refused = await browser.PostAsJsonAsync(Path, Note("improvement", "Let me save a ride."), Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task The_11th_report_in_an_hour_is_refused_until_the_hours_first_falls_out_of_it()
    {
        // Each sign-in moves the clock on two hours, so both riders sign in before the hour's reports.
        using var other = await SignedIn("oz.other@example.com");
        using var browser = await SignedIn("rae.reports@example.com");
        using (var first = await browser.PostAsJsonAsync(Path, Note("improvement", "Idea 1"), Cancel)) Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        api.Clock.Advance(TimeSpan.FromMinutes(15));
        for (var report = 2; report <= 10; report++)
        {
            using var sent = await browser.PostAsJsonAsync(Path, Note("improvement", $"Idea {report}"), Cancel);
            Assert.True(sent.StatusCode == HttpStatusCode.Created, $"report {report}: {sent.StatusCode}");
        }

        using var refused = await browser.PostAsJsonAsync(Path, Note("improvement", "Idea 11"), Cancel);

        Assert.Equal(HttpStatusCode.TooManyRequests, refused.StatusCode);
        Assert.Equal("rate_limited", (await Json(refused)).GetProperty("code").GetString());
        Assert.Equal("2700", refused.Headers.GetValues("Retry-After").Single());
        using (var others = await other.PostAsJsonAsync(Path, Note("kudos", "Lovely."), Cancel)) Assert.Equal(HttpStatusCode.Created, others.StatusCode);

        api.Clock.Advance(TimeSpan.FromSeconds(2700));
        using var later = await browser.PostAsJsonAsync(Path, Note("improvement", "Idea 11"), Cancel);
        Assert.Equal(HttpStatusCode.Created, later.StatusCode);
    }

    public static TheoryData<string, object> NotFeedback => new()
    {
        { "kind", Note("praise", "Nice.") },
        { "message", Note("bug", "   ") },
        { "message", Note("bug", new string('x', 2001)) },
        { "message", Note("bug", $" {new string('x', 2000)}") },
        { "diagnostics", Note("kudos", "Nice.", new { appVersion = "2.0.0", packetLog = "" }) },
        { "diagnostics.packetLog", Note("bug", "Stuck.", new { appVersion = "2.0.0", packetLog = new string('x', 1_048_577) }) },
        { "diagnostics.appVersion", Note("bug", "Stuck.", new { appVersion = new string('9', 65), packetLog = "" }) },
        { "context", new { kind = "bug", message = "Stuck.", context = Enumerable.Range(0, 33).Select(i => new { term = $"T{i}", value = "v" }).ToArray() } },
        { "context[0].value", new { kind = "bug", message = "Stuck.", context = new[] { new { term = "View", value = new string('v', 201) } } } },
    };

    [Theory]
    [MemberData(nameof(NotFeedback))]
    public async Task A_report_that_is_not_feedback_is_refused_naming_its_field(string field, object body)
    {
        using var browser = await SignedIn($"vic.{Guid.NewGuid():N}@example.com");

        using var refused = await browser.PostAsJsonAsync(Path, body, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        var problem = await Json(refused);
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").TryGetProperty(field, out _), problem.GetProperty("errors").GetRawText());
    }
}
