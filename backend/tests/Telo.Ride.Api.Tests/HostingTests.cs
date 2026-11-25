// Acceptance test
// Traces to: L2-149 AC1, AC2, L2-131 AC4, L2-135 AC3, L2-150 AC1
// Description: the API serves the app's build as one origin with its backend: a deep link answers the
// app with the headers of L2-131 and is never cached stale, a file answers itself, the service worker
// and its manifest are never cached stale either, so a deploy reaches the app cache on the next start,
// the web app manifest and its icons answer with their types, so Chrome and Edge can install the app,
// and an unknown address under /api, /hubs or /health stays the backend's, never the app.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Telo.Ride.Api.Tests;

public sealed class HostingTests(HostedAppApi api) : IClassFixture<HostedAppApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Theory]
    [Trait("Category", "Critical")]
    [InlineData("/")]
    [InlineData("/race")]
    [InlineData("/classes/hiit-30")]
    public async Task A_deep_link_without_a_session_answers_the_app_with_its_headers(string path)
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false });

        using var response = await client.GetAsync(path, Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(HostedAppApi.AppShell, await response.Content.ReadAsStringAsync(Cancel));
        Assert.True(response.Headers.CacheControl?.NoCache, "index.html must never be cached stale");
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task A_file_of_the_build_answers_itself_without_a_session()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/main-GJM55KKQ.js", Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/javascript", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("console.log('ride');", await response.Content.ReadAsStringAsync(Cancel));
        AssertSecurityHeaders(response);
    }

    [Theory]
    [InlineData("/ngsw-worker.js", "text/javascript")]
    [InlineData("/ngsw.json", "application/json")]
    public async Task The_service_worker_and_its_manifest_are_never_cached_stale(string path, string type)
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync(path, Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(type, response.Content.Headers.ContentType?.MediaType);
        Assert.True(response.Headers.CacheControl?.NoCache, $"{path} must never be cached stale");
        AssertSecurityHeaders(response);
    }

    [Theory]
    [InlineData("/manifest.webmanifest", "application/manifest+json", "{\"name\":\"Telo Ride\"}")]
    [InlineData("/icons/icon-192.png", "image/png", "png")]
    public async Task The_web_app_manifest_and_its_icons_answer_with_their_types_without_a_session(string path, string type, string body)
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync(path, Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(type, response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(body, await response.Content.ReadAsStringAsync(Cancel));
        AssertSecurityHeaders(response);
    }

    [Theory]
    [InlineData("kokoro.onnx", "application/octet-stream", "weights")]
    [InlineData("af_bella.bin", "application/octet-stream", "voice")]
    [InlineData("ort-wasm-simd-threaded.wasm", "application/wasm", "runtime")]
    public async Task The_announcer_pack_files_answer_from_the_app_origin_without_a_session(string name, string type, string body)
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync($"/models/voice-announcer/{name}", Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(type, response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(body, await response.Content.ReadAsStringAsync(Cancel));
        AssertSecurityHeaders(response);
    }

    [Theory]
    [InlineData("/api/progress")]
    [InlineData("/hubs/unknown")]
    [InlineData("/health/unknown")]
    public async Task An_unknown_backend_address_is_refused_never_answered_with_the_app(string path)
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false });

        using var response = await client.GetAsync(path, Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(Cancel);
        Assert.Equal("unauthenticated", problem?.Extensions["code"]?.ToString());
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task The_backend_answers_carry_the_same_headers()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/live", Cancel);

        AssertSecurityHeaders(response);
    }

    private static void AssertSecurityHeaders(HttpResponseMessage response)
    {
        var policy = Assert.Single(response.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("default-src 'self'", policy, StringComparison.Ordinal);
        Assert.Contains("frame-src https://www.youtube-nocookie.com", policy, StringComparison.Ordinal);
        Assert.Contains("frame-ancestors 'none'", policy, StringComparison.Ordinal);
        // The 3D Tiles mesh decoder's blob: worker and its WebAssembly, and a tile's embedded textures (L2-131 AC1).
        Assert.Contains("script-src 'self' https://www.youtube.com 'wasm-unsafe-eval'", policy, StringComparison.Ordinal);
        Assert.Contains("worker-src 'self' blob:", policy, StringComparison.Ordinal);
        Assert.Contains("connect-src 'self' https://tile.googleapis.com blob:", policy, StringComparison.Ordinal);
        Assert.Contains("img-src 'self' https://i.ytimg.com https://tile.googleapis.com blob:", policy, StringComparison.Ordinal);
        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("strict-origin-when-cross-origin", Assert.Single(response.Headers.GetValues("Referrer-Policy")));
    }
}
