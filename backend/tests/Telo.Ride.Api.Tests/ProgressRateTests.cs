// Acceptance test
// Traces to: L2-130 AC2
// Description: a hub client may send 2 progress messages a second, class or race; the extra ones are dropped without an
// answer. A client that has been over the limit for 10 seconds is disconnected, and one that keeps to the limit stays
// connected however long it rides. A real SignalR client carries a real session cookie to the API hosted in memory;
// the fake clock is the server's time.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class ProgressRateTests(ProgressRateApi api) : IClassFixture<ProgressRateApi>, IAsyncDisposable
{
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(10);
    private const string ClassSession = "hiit-cardio-30@20261122T0700Z";
    private const string RaceSession = "vice-city@20261122T070000Z";

    private readonly List<HubConnection> connections = [];
    private readonly List<HttpClient> browsers = [];

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_client_over_the_limit_for_ten_seconds_is_disconnected()
    {
        var (hub, closed) = await Rider("flood@example.com");

        for (var second = 0; second < 10; second++)
        {
            await Messages(hub, 3);
            api.Clock.Advance(TimeSpan.FromSeconds(1));
        }
        Assert.Equal(HubConnectionState.Connected, hub.State);

        await Messages(hub, 3, tolerateClose: true);

        try
        {
            await closed.WaitAsync(Wait, Cancel);
        }
        catch (TimeoutException)
        {
            Assert.Fail($"still {hub.State} after 10 seconds over the limit");
        }
    }

    [Fact]
    public async Task A_client_that_falls_back_under_the_limit_is_not_disconnected()
    {
        var (hub, _) = await Rider("burst@example.com");

        for (var second = 0; second < 30; second++)
        {
            await Messages(hub, second % 9 == 8 ? 2 : 3);
            api.Clock.Advance(TimeSpan.FromSeconds(1));
        }

        Assert.Equal(HubConnectionState.Connected, hub.State);
        await hub.InvokeAsync<long>("ServerTime", Cancel);
    }

    [Fact]
    public async Task A_client_that_keeps_to_two_a_second_stays_connected()
    {
        var (hub, _) = await Rider("steady@example.com");

        for (var second = 0; second < 30; second++)
        {
            await Messages(hub, 2);
            api.Clock.Advance(TimeSpan.FromSeconds(1));
        }

        Assert.Equal(HubConnectionState.Connected, hub.State);
    }

    /// <summary>Sends that many progress messages within the same second, class and race in turn.</summary>
    private static async Task Messages(HubConnection hub, int count, bool tolerateClose = false)
    {
        for (var message = 0; message < count; message++)
        {
            try
            {
                if (message % 2 == 0) await hub.InvokeAsync("ReportProgress", ClassSession, 1.0, 150.0, Cancel);
                else await hub.InvokeAsync("ReportRaceProgress", RaceSession, 100.0, 150.0, Cancel);
            }
            catch (Exception) when (tolerateClose)
            {
                return;
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var connection in connections) await connection.DisposeAsync();
        foreach (var browser in browsers) browser.Dispose();
    }

    /// <summary>Signs a rider in and connects their hub with the session cookie; the task ends when the hub closes.</summary>
    private async Task<(HubConnection Hub, Task Closed)> Rider(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        browsers.Add(browser);
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync("/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var cookie = confirmed.Headers.GetValues("Set-Cookie").Single(v => v.StartsWith("__Host-telo-session=", StringComparison.Ordinal)).Split(';')[0];
        var hub = new HubConnectionBuilder()
            .WithUrl(new Uri("https://localhost/hubs/ride"), options =>
            {
                options.HttpMessageHandlerFactory = _ => api.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                options.Headers.Add("Cookie", cookie);
            })
            .Build();
        var closed = new TaskCompletionSource();
        hub.Closed += _ =>
        {
            closed.TrySetResult();
            return Task.CompletedTask;
        };
        connections.Add(hub);
        await hub.StartAsync(Cancel);
        return (hub, closed.Task);
    }
}

/// <summary>A sign-in host of its own for the progress-rate tests.</summary>
public sealed class ProgressRateApi : SignInApi;
