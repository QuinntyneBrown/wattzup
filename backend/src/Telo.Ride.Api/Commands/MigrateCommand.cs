using Telo.Ride.Application;

namespace Telo.Ride.Api.Commands;

/// <summary>
/// <c>dotnet Telo.Ride.Api.dll migrate</c>: applies every pending migration and exits, 0 on success
/// and 1 on failure (L2-147 AC5, docs/deployment.md). Normal start-up never migrates.
/// </summary>
internal static partial class MigrateCommand
{
    public const string Name = "migrate";

    public static async Task<int> RunAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        try
        {
            await scope.ServiceProvider.GetRequiredService<IDatabaseMigrator>().MigrateAsync(cancellationToken);
            LogMigrated(logger);
            return 0;
        }
#pragma warning disable CA1031 // A command reports any failure as its exit code.
        catch (Exception exception)
#pragma warning restore CA1031
        {
            LogFailed(logger, exception);
            return 1;
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "The database is migrated.")]
    private static partial void LogMigrated(ILogger logger);

    [LoggerMessage(Level = LogLevel.Error, Message = "The database migration failed.")]
    private static partial void LogFailed(ILogger logger, Exception exception);
}
