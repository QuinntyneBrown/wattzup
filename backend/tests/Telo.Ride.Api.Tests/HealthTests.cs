// Acceptance test
// Traces to: L2-127 AC4, L2-147 AC1, L2-148 AC2
// Description: the API answers its health endpoints without a session, with a status word and
// nothing else.
using System.Net;

namespace Telo.Ride.Api.Tests;

public sealed class HealthTests(TeloRideApiFactory api) : IClassFixture<TeloRideApiFactory>
{
    [Fact]
    public async Task Liveness_answers_Healthy_without_a_session()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/live", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task Readiness_answers_Healthy_when_the_database_can_be_reached()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/ready", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }
}

public sealed class UnreachableDatabaseHealthTests(UnreachableDatabaseApi api) : IClassFixture<UnreachableDatabaseApi>
{
    [Fact]
    public async Task Readiness_answers_503_Unhealthy_and_nothing_else_when_the_database_cannot_be_reached()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/ready", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("Unhealthy", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task Liveness_still_answers_Healthy_when_the_database_cannot_be_reached()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/live", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
