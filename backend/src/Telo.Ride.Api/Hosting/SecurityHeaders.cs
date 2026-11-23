using System.Text.Json;

namespace Telo.Ride.Api.Hosting;

/// <summary>
/// The headers of L2-131 on every response, the app's files and the backend's answers alike (ADR 0026). They are read
/// from <c>security-headers.json</c> beside this file, the one place they are written: the API embeds it, and the server
/// the Playwright specs run the app on (<c>frontend/scripts/serve-dist.mjs</c>) sends the same headers, so every spec
/// runs the app under the policy. They are added as the response starts, so an error page the exception handler writes
/// carries them too.
/// </summary>
/// <remarks>
/// Scripts from the app and the YouTube player; frames only from youtube-nocookie; connections to the app's own origin
/// (its backend and hub) and Google's Map Tiles API; images from the app, YouTube's covers and the tiles. The 3D Tiles
/// mesh decoder runs WebAssembly in a <c>blob:</c> worker, and a tile's embedded textures load through <c>blob:</c>
/// URLs the page makes from bytes it holds, so neither admits a foreign origin. The policy is static: the service
/// worker keeps <c>index.html</c> by the hash of its bytes (ADR 0032), so no nonce can be minted per response, and
/// <c>style-src 'unsafe-inline'</c> admits Angular's component styles (ADR 0018).
/// </remarks>
internal static class SecurityHeaders
{
    public static readonly IReadOnlyDictionary<string, string> Headers = Read();

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                foreach (var (name, value) in Headers) context.Response.Headers[name] = value;
                return Task.CompletedTask;
            });
            await next(context);
        });

    private static Dictionary<string, string> Read()
    {
        using var stream = typeof(SecurityHeaders).Assembly.GetManifestResourceStream("security-headers.json")
            ?? throw new InvalidOperationException("security-headers.json is not embedded in the API.");
        using var json = JsonDocument.Parse(stream);
        return json.RootElement.EnumerateObject().ToDictionary(
            header => header.Name,
            header => header.Value.ValueKind == JsonValueKind.Object
                ? string.Join("; ", header.Value.EnumerateObject().Select(directive =>
                    string.Join(' ', directive.Value.EnumerateArray().Select(source => source.GetString()).Prepend(directive.Name))))
                : header.Value.GetString()!);
    }
}
