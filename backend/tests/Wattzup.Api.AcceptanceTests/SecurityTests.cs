// Acceptance Test
// Traces to: L2-034, L2-035, L2-036, L2-044
// Description: Loopback by default and no exposure without a key; the API key and single-use event token guard
// every /api endpoint; limits, headers and generic errors harden every response; the SPA is served with a fallback.

using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Wattzup.Core.Resistance;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.AcceptanceTests;

public sealed class SecurityTests
{
    private const string Key = "correct horse battery staple";

    private static WattzupApiFactory Keyed(IDictionary<string, string?>? extra = null)
    {
        var settings = new Dictionary<string, string?> { ["Wattzup:Security:ApiKey"] = Key };
        foreach (var (k, v) in extra ?? new Dictionary<string, string?>())
        {
            settings[k] = v;
        }

        return new WattzupApiFactory(settings);
    }

    [Fact]
    public void A_non_loopback_address_without_an_api_key_fails_host_start()
    {
        using var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Urls"] = "http://0.0.0.0:8787" });

        Assert.ThrowsAny<Exception>(() => factory.CreateClient());
    }

    [Fact]
    public async Task A_non_loopback_address_with_an_api_key_starts_and_reports_the_exposure()
    {
        using var factory = Keyed(new Dictionary<string, string?> { ["Wattzup:Urls"] = "http://0.0.0.0:8787" });
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);

        var state = await Bike.JsonAsync(await client.GetAsync(new Uri("/api/status", UriKind.Relative)));

        Assert.True(state.GetProperty("exposed").GetBoolean());
        Assert.Equal("0.0.0.0:8787", state.GetProperty("bind_address").GetString());
    }

    [Fact]
    public async Task Loopback_with_no_key_serves_the_api_anonymously()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/api/status", UriKind.Relative))).StatusCode);
    }

    [Theory]
    [InlineData("POST", "/api/resistance")]
    [InlineData("POST", "/api/workout/pause")]
    [InlineData("GET", "/api/workout/trace")]
    [InlineData("GET", "/api/diagnostics/packets")]
    [InlineData("GET", "/api/status")]
    [InlineData("POST", "/api/events/token")]
    public async Task With_a_key_configured_a_request_without_it_or_with_a_wrong_one_gets_401(string method, string path)
    {
        using var factory = Keyed();
        using var client = factory.CreateClient();

        foreach (var key in new[] { null, "wrong" })
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), new Uri(path, UriKind.Relative))
            {
                Content = method == "POST" ? new StringContent("""{"level":12}""", Encoding.UTF8, "application/json") : null,
            };
            if (key is not null)
            {
                request.Headers.Add("X-Api-Key", key);
            }

            using var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        Assert.DoesNotContain(factory.Simulation.Writes, w => w.Bytes.Length == 5 && w.Bytes[1] == 0xB1);
    }

    [Fact]
    public async Task With_the_correct_key_a_request_is_processed()
    {
        using var factory = Keyed();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/api/status", UriKind.Relative))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/health", UriKind.Relative))).StatusCode);
    }

    [Fact]
    public async Task An_event_token_opens_the_stream_once_and_expires_after_60_seconds()
    {
        using var factory = Keyed();
        using var client = factory.CreateClient();
        using var keyed = factory.CreateClient();
        keyed.DefaultRequestHeaders.Add("X-Api-Key", Key);

        var token = await IssueAsync(keyed);
        await using (var stream = await EventStreamReader.OpenAsync(client, $"/api/events?token={Uri.EscapeDataString(token)}"))
        {
            Assert.Equal(HttpStatusCode.OK, stream.Response.StatusCode);
            await stream.WaitForAsync(_ => true, "the first state");
        }

        await using (var reused = await EventStreamReader.OpenAsync(client, $"/api/events?token={Uri.EscapeDataString(token)}"))
        {
            Assert.Equal(HttpStatusCode.Unauthorized, reused.Response.StatusCode);
        }

        var stale = await IssueAsync(keyed);
        factory.Time.Advance(TimeSpan.FromSeconds(61));
        await using var expired = await EventStreamReader.OpenAsync(client, $"/api/events?token={Uri.EscapeDataString(stale)}");
        Assert.Equal(HttpStatusCode.Unauthorized, expired.Response.StatusCode);
    }

    [Fact]
    public async Task The_21st_control_request_in_a_window_gets_429_rate_limited()
    {
        using var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Security:ControlWindow"] = "01:00:00" });
        using var client = factory.CreateClient();

        for (var i = 0; i < 20; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsync(new Uri("/api/workout/stop", UriKind.Relative), null)).StatusCode);
        }

        using var limited = await client.PostAsync(new Uri("/api/workout/stop", UriKind.Relative), null);
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", (await Bike.JsonAsync(limited)).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/api/status", UriKind.Relative))).StatusCode);
    }

    [Fact]
    public async Task A_body_over_16_KB_gets_413()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();
        var body = $$"""{"kind":"flat","pad":"{{new string('x', 17 * 1024)}}"}""";

        using var response = await client.PostAsync(new Uri("/api/workout", UriKind.Relative), new StringContent(body, Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task A_wrong_content_type_gets_415_and_malformed_json_400_without_internal_detail()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        using var wrongType = await client.PostAsync(new Uri("/api/resistance", UriKind.Relative), new StringContent("level=12", Encoding.UTF8, "text/plain"));
        using var malformed = await client.PostAsync(new Uri("/api/resistance", UriKind.Relative), new StringContent("{oops", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.UnsupportedMediaType, wrongType.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
        Assert.DoesNotContain(" at ", await malformed.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Every_response_carries_the_security_headers()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        foreach (var path in new[] { "/api/status", "/health", "/api/nope" })
        {
            using var response = await client.GetAsync(new Uri(path, UriKind.Relative));
            Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
            Assert.Equal("no-referrer", response.Headers.GetValues("Referrer-Policy").Single());
            var csp = response.Headers.GetValues("Content-Security-Policy").Single();
            Assert.Contains("default-src 'self'", csp, StringComparison.Ordinal);
            Assert.Contains("script-src 'self'", csp, StringComparison.Ordinal);
            Assert.Contains("connect-src 'self'", csp, StringComparison.Ordinal);
        }
    }

    [Fact]
    public async Task Every_response_allows_only_the_YouTube_origins_beyond_self()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/api/status", UriKind.Relative));

        var directives = response.Headers.GetValues("Content-Security-Policy").Single()
            .Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .ToDictionary(d => d.Split(' ')[0], d => d[(d.IndexOf(' ', StringComparison.Ordinal) + 1)..], StringComparer.Ordinal);
        Assert.Equal("'self' https://www.youtube.com", directives["script-src"]);
        Assert.Equal("https://www.youtube-nocookie.com", directives["frame-src"]);
        Assert.Equal("'self'", directives["connect-src"]);
        Assert.Equal("'self'", directives["font-src"]);
        Assert.Equal("'self' data: https://i.ytimg.com", directives["img-src"]);
        Assert.Equal("'self'", directives["default-src"]);
        Assert.DoesNotContain("youtube", directives["style-src"], StringComparison.Ordinal);
    }

    [Fact]
    public async Task An_unhandled_exception_returns_a_generic_500_problem()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.WithWebHostBuilder(b => b.ConfigureTestServices(s => s.AddSingleton<IResistanceControl, ExplodingControl>())).CreateClient();

        using var response = await client.PostAsync(new Uri("/api/resistance", UriKind.Relative), new StringContent("""{"level":12}""", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain("secret detail", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task An_unknown_api_path_is_a_404_problem_and_an_unknown_client_route_loads_the_app_with_a_style_nonce()
    {
        var webRoot = Directory.CreateTempSubdirectory("wattzup-web-").FullName;
        await File.WriteAllTextAsync(Path.Combine(webRoot, "index.html"), "<!doctype html><html><body><wz-root></wz-root></body></html>");
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.WithWebHostBuilder(b => b.UseWebRoot(webRoot)).CreateClient();

        using var api = await client.GetAsync(new Uri("/api/workouts/history", UriKind.Relative));
        using var page = await client.GetAsync(new Uri("/workouts/history", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, api.StatusCode);
        Assert.Equal("application/problem+json", api.Content.Headers.ContentType?.MediaType);
        Assert.Equal(HttpStatusCode.OK, page.StatusCode);
        Assert.Equal("text/html", page.Content.Headers.ContentType?.MediaType);
        var html = await page.Content.ReadAsStringAsync();
        var nonce = System.Text.RegularExpressions.Regex.Match(html, "<wz-root ngCspNonce=\"([^\"]+)\"").Groups[1].Value;
        Assert.NotEmpty(nonce);
        Assert.Contains($"style-src 'self' 'nonce-{nonce}'", page.Headers.GetValues("Content-Security-Policy").Single(), StringComparison.Ordinal);
        Directory.Delete(webRoot, recursive: true);
    }

    [Fact]
    public async Task Cors_allows_only_configured_origins()
    {
        using var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Cors:Origins:0"] = "http://localhost:4200" }) { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        foreach (var (origin, allowed) in new[] { ("http://localhost:4200", true), ("https://evil.example", false) })
        {
            using var request = new HttpRequestMessage(HttpMethod.Options, new Uri("/api/status", UriKind.Relative));
            request.Headers.Add("Origin", origin);
            request.Headers.Add("Access-Control-Request-Method", "GET");
            using var response = await client.SendAsync(request);
            Assert.Equal(allowed, response.Headers.Contains("Access-Control-Allow-Origin"));
        }
    }

    private static async Task<string> IssueAsync(HttpClient keyed)
    {
        using var response = await keyed.PostAsync(new Uri("/api/events/token", UriKind.Relative), null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await Bike.JsonAsync(response)).GetProperty("token").GetString()!;
    }

    private sealed class ExplodingControl : IResistanceControl
    {
        public Task<SendResult> SetManualAsync(int level, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("secret detail");
    }
}
