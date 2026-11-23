// Acceptance test
// Traces to: L2-147 AC4
// Description: telemetry goes through OpenTelemetry, with Telo Ride's own instruments on the
// Telo.Ride meter, and no span carries a query string or contact detail; a route is its template.
using System.Net;
using OpenTelemetry.Metrics;

namespace Telo.Ride.Api.Tests;

public sealed class TelemetryTests(TelemetryApi api) : IClassFixture<TelemetryApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_refusal_is_counted_on_the_Telo_Ride_meter_with_its_code_and_status()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/probe/refuse", Cancel);
        api.FlushMetrics();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problems = api.Metrics.Last(metric => metric.MeterName == "Telo.Ride" && metric.Name == "telo.ride.problems");
        var counted = false;
        foreach (ref readonly var point in problems.GetMetricPoints())
        {
            var tags = new Dictionary<string, object?>();
            foreach (var tag in point.Tags)
            {
                tags[tag.Key] = tag.Value;
            }

            counted |= Equals(tags.GetValueOrDefault("code"), "session_full") && Equals(tags.GetValueOrDefault("status"), 409)
                && point.GetSumLong() >= 1;
        }

        Assert.True(counted, "telo.ride.problems has no point for code session_full and status 409");
    }

    [Fact]
    public async Task A_span_records_the_route_template_and_never_the_query_string()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/probe/echo?text=rider%40example.com", Cancel);
        var span = await api.Spans.Await(span => span.GetTagItem("http.route") is "probe/echo", TimeSpan.FromSeconds(5));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Null(span.GetTagItem("url.query"));
        Assert.DoesNotContain(span.TagObjects, tag => tag.Value?.ToString()?.Contains("example.com", StringComparison.Ordinal) == true);
        Assert.DoesNotContain("example.com", span.DisplayName, StringComparison.Ordinal);
    }
}
