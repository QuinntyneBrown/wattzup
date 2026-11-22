using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Telo.Ride.Application.Live;

namespace Telo.Ride.Infrastructure.Live;

/// <summary>
/// Ticks the live sessions once a second on the injected <see cref="TimeProvider"/> (L2-123 AC3). A failed tick is
/// logged by its kind alone and the next second's tick runs as usual; it never stops the host.
/// </summary>
public sealed partial class SessionTicker(IServiceScopeFactory scopes, TimeProvider time, ILogger<SessionTicker> log) : BackgroundService
{
    /// <summary>How often the standings go out.</summary>
    public static readonly TimeSpan Interval = TimeSpan.FromSeconds(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval, time);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await TickAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // The host is stopping.
        }
    }

    private async Task TickAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = scopes.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ISender>().Send(new TickLiveSessionsCommand(), stoppingToken);
        }
        catch (Exception failure) when (failure is not OperationCanceledException)
        {
            Failed(failure.GetType().Name);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Ticking the live sessions failed ({Failure}); the next second's tick runs as usual")]
    private partial void Failed(string failure);
}
