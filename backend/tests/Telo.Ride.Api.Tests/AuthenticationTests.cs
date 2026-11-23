// Acceptance test
// Traces to: L2-127 AC1, L2-147 AC3
// Description: every endpoint that is not explicitly anonymous needs a signed-in rider; without a
// session the API refuses with 401 and a ProblemDetails body, never a redirect.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Telo.Ride.Api.Tests;

public sealed class AuthenticationTests(ProbeApi api) : IClassFixture<ProbeApi>
{
    [Fact]
    [Trait("Category", "Critical")]
    public async Task An_endpoint_with_no_policy_of_its_own_refuses_a_request_without_a_session()
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false });

        using var response = await client.GetAsync("/probe/echo?text=hello", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestContext.Current.CancellationToken);
        Assert.Equal(401, problem?.Status);
        Assert.Equal("unauthenticated", problem?.Extensions["code"]?.ToString());
    }

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task The_health_endpoints_answer_without_a_session(string path)
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false });

        using var response = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
