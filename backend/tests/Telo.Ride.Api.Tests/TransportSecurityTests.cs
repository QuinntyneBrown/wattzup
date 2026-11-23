// Acceptance test
// Traces to: L2-009 AC2
// Description: in production every plain http request is redirected to the same address on https, and every https
// response carries Strict-Transport-Security for a year, so a browser never reaches Telo Ride over http again.
using System.Net;

namespace Telo.Ride.Api.Tests;

public sealed class TransportSecurityTests(ProductionApi api) : IClassFixture<ProductionApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_plain_http_request_is_redirected_to_the_same_address_on_https()
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false, BaseAddress = ProductionApi.Address });

        using var response = await client.GetAsync("/classes/hiit-30?from=home", Cancel);

        Assert.Equal(HttpStatusCode.PermanentRedirect, response.StatusCode);
        Assert.Equal(new Uri("https://ride.telo.test/classes/hiit-30?from=home"), response.Headers.Location);
    }

    [Fact]
    public async Task An_https_response_carries_strict_transport_security_for_a_year()
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false, BaseAddress = ProductionApi.Address });
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health/live");
        request.Headers.Add("X-Forwarded-Proto", "https");

        using var response = await client.SendAsync(request, Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("max-age=31536000", string.Join(",", response.Headers.GetValues("Strict-Transport-Security")));
    }
}
