// Acceptance test
// Traces to: L2-127 AC1
// Description: every endpoint the API maps, its controllers, the ride hub, the health checks and the fallbacks, is
// asked without a session. Only the listed anonymous endpoints answer; every other one is refused with 401, so an
// endpoint added later needs a session unless someone marks it anonymous and adds it to this list.
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;

namespace Telo.Ride.Api.Tests;

public sealed class AnonymousEndpointsTests(HostedAppApi api) : IClassFixture<HostedAppApi>
{
    /// <summary>The anonymous endpoints of L2-127 AC1 and the design's table, as method and route.</summary>
    private static readonly HashSet<string> Anonymous =
    [
        "POST /api/auth/code",
        "POST /api/auth/code/confirm",
        "POST /api/auth/sign-out",
        "GET /api/classes",
        "GET /api/classes/{id}",
        "GET /api/maps",
        "GET /api/maps/{mapId}/queue",
        "GET /health/live",
        "GET /health/ready",
        "GET /{*path:nonfile}",
        "HEAD /{*path:nonfile}",
    ];

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Only_the_listed_endpoints_answer_without_a_session()
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false });
        var answered = new List<string>();
        var refused = new List<string>();

        foreach (var (key, path) in Endpoints())
        {
            using var request = new HttpRequestMessage(new HttpMethod(key[..key.IndexOf(' ')]), path);
            using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
            (response.StatusCode == HttpStatusCode.Unauthorized ? refused : answered).Add(key);
        }

        Assert.Equal(string.Join("\n", Anonymous.Order(StringComparer.Ordinal)), string.Join("\n", answered.Distinct().Order(StringComparer.Ordinal)));
        Assert.NotEmpty(refused);
        Assert.DoesNotContain(refused, Anonymous.Contains);
    }

    /// <summary>
    /// Every endpoint the API maps, as "METHOD /route" with an address that reaches it: each method it accepts (GET
    /// when it names none), each route parameter filled with a value its constraint takes.
    /// </summary>
    private IEnumerable<(string Key, string Path)> Endpoints()
    {
        var endpoints = api.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>();
        foreach (var endpoint in endpoints)
        {
            var route = "/" + endpoint.RoutePattern.RawText!.TrimStart('/');
            var methods = endpoint.Metadata.GetMetadata<IHttpMethodMetadata>()?.HttpMethods ?? [];
            foreach (var method in methods.Count == 0 ? ["GET"] : methods)
            {
                yield return ($"{method} {route}", Address(endpoint.RoutePattern));
            }
        }
    }

    private static string Address(RoutePattern pattern) =>
        "/" + string.Join('/', pattern.PathSegments.Select(segment => string.Concat(segment.Parts.Select(part => part switch
        {
            RoutePatternLiteralPart literal => literal.Content,
            RoutePatternParameterPart { IsCatchAll: true } => "a-page",
            RoutePatternParameterPart parameter when parameter.ParameterPolicies.Any(p => p.Content == "guid") =>
                Guid.NewGuid().ToString(),
            RoutePatternParameterPart => "a1",
            RoutePatternSeparatorPart separator => separator.Content,
            _ => "",
        }))));
}
