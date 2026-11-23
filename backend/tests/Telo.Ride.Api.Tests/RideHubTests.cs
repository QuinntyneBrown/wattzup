// Acceptance test
// Traces to: L2-127 AC1, L2-148 AC3, L2-120 AC2, L2-121 AC3
// Description: the ride hub needs a signed-in rider; a real SignalR client connects to the API
// hosted in memory, and a connection without a session is refused at negotiation. Connected, the
// rider asks the hub for its time, from which the app measures its clock offset.
using System.Net;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class RideHubTests(SignedInProbeApi signedIn, TeloRideApiFactory anonymous)
    : IClassFixture<SignedInProbeApi>, IClassFixture<TeloRideApiFactory>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_signed_in_rider_connects_with_a_real_SignalR_client()
    {
        await using var connection = Connect(signedIn);

        await connection.StartAsync(Cancel);

        Assert.Equal(HubConnectionState.Connected, connection.State);
    }

    [Fact]
    public async Task A_connection_without_a_session_is_refused_at_negotiation()
    {
        await using var connection = Connect(anonymous);

        var refused = await Assert.ThrowsAsync<HttpRequestException>(() => connection.StartAsync(Cancel));

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
    }

    [Fact]
    public async Task The_hub_answers_with_its_time_for_the_clock_offset()
    {
        await using var connection = Connect(signedIn);
        await connection.StartAsync(Cancel);

        var first = await connection.InvokeAsync<long>("ServerTime", Cancel);
        signedIn.Clock.Advance(TimeSpan.FromSeconds(90));
        var later = await connection.InvokeAsync<long>("ServerTime", Cancel);

        Assert.Equal(new DateTimeOffset(2026, 11, 21, 7, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds(), first);
        Assert.Equal(first + 90_000, later);
    }

    private static HubConnection Connect(TeloRideApiFactory api) =>
        new HubConnectionBuilder()
            .WithUrl(new Uri(api.Server.BaseAddress, "hubs/ride"), options =>
            {
                options.HttpMessageHandlerFactory = _ => api.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
            })
            .Build();
}
