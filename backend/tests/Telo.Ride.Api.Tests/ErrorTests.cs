// Acceptance test
// Traces to: L2-147 AC2, AC3; L2-129
// Description: every refusal is ProblemDetails with a code the client branches on: invalid input,
// a domain rule, and an unexpected failure that reveals nothing.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Telo.Ride.Api.Tests.Probe;

namespace Telo.Ride.Api.Tests;

public sealed class ErrorTests(SignedInProbeApi api) : IClassFixture<SignedInProbeApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_valid_request_reaches_its_handler()
    {
        using var client = api.CreateClient();

        using var response = await client.PostAsJsonAsync("/probe/echo", new { powerWatts = "250" }, Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("250", await response.Content.ReadAsStringAsync(Cancel));
    }

    [Fact]
    public async Task Invalid_input_is_refused_with_400_validation_failed_and_errors_by_field()
    {
        using var client = api.CreateClient();

        using var response = await client.PostAsJsonAsync("/probe/echo", new { powerWatts = "12345" }, Cancel);

        var problem = await Problem(response, HttpStatusCode.BadRequest);
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").GetProperty("powerWatts").GetArrayLength() > 0);
    }

    [Fact]
    public async Task A_domain_rule_refuses_with_its_own_status_and_code()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/probe/refuse", Cancel);

        var problem = await Problem(response, HttpStatusCode.Conflict);
        Assert.Equal("session_full", problem.GetProperty("code").GetString());
    }

    [Fact]
    public async Task An_unexpected_failure_is_500_unexpected_with_a_trace_id_and_no_detail()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/probe/fail", Cancel);

        var body = await response.Content.ReadAsStringAsync(Cancel);
        var problem = await Problem(response, HttpStatusCode.InternalServerError);
        Assert.Equal("unexpected", problem.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(problem.GetProperty("traceId").GetString()));
        Assert.False(problem.TryGetProperty("detail", out _));
        Assert.DoesNotContain("rider@example.com", body, StringComparison.Ordinal);
        Assert.DoesNotContain(nameof(InvalidOperationException), body, StringComparison.Ordinal);
        Assert.DoesNotContain(" at ", body, StringComparison.Ordinal);
    }

    private static async Task<JsonElement> Problem(HttpResponseMessage response, HttpStatusCode status)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(Cancel);
        Assert.Equal((int)status, problem.GetProperty("status").GetInt32());
        return problem;
    }
}
