using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Infrastructure.Accounts;

/// <summary>
/// Erases deleted accounts once a day on the injected <see cref="TimeProvider"/>, so each is gone within a day of its
/// deletion, well inside the 30 days of L2-006 AC3. A failed run is logged with no rider's data, and the next day's run
/// tries again; it never stops the host.
/// </summary>
public sealed partial class AccountErasureService(IServiceScopeFactory scopes, TimeProvider time, ILogger<AccountErasureService> log)
    : BackgroundService
{
    /// <summary>How often deleted accounts are erased.</summary>
    public static readonly TimeSpan Interval = TimeSpan.FromDays(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval, time);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await EraseAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // The host is stopping.
        }
    }

    private async Task EraseAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var erased = await scope.ServiceProvider.GetRequiredService<ISender>().Send(new ErasePendingAccountsCommand(), stoppingToken);
            Erased(erased);
        }
        catch (Exception failure) when (failure is not OperationCanceledException)
        {
            Failed(failure.GetType().Name);
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Erased {Count} deleted accounts")]
    private partial void Erased(int count);

    [LoggerMessage(Level = LogLevel.Error, Message = "Erasing deleted accounts failed ({Failure}); the next run tries again")]
    private partial void Failed(string failure);
}
