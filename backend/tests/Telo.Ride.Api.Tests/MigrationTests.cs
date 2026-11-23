// Acceptance test
// Traces to: L2-147 AC5
// Description: the schema changes only through the migrate command; starting the API and serving
// requests never migrates. The command itself is also tested directly, one case per outcome.
using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;
using Telo.Ride.Api.Commands;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Tests;

/// <summary>Counts migrations instead of applying them, or fails each one.</summary>
public sealed class MigratorSpy(bool fails = false) : IDatabaseMigrator
{
    public int Migrations { get; private set; }

    public Task MigrateAsync(CancellationToken cancellationToken)
    {
        Migrations++;
        return fails ? throw new InvalidOperationException("The migration failed.") : Task.CompletedTask;
    }
}

/// <summary>The API with <see cref="IDatabaseMigrator"/> replaced by a spy.</summary>
public sealed class MigratorSpyApi : TeloRideApiFactory
{
    public MigratorSpy Migrator { get; } = new();

    protected override void ConfigureServices(IServiceCollection services) =>
        services.Replace(ServiceDescriptor.Singleton<IDatabaseMigrator>(Migrator));
}

public sealed class MigrationTests(MigratorSpyApi api) : IClassFixture<MigratorSpyApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Starting_the_API_and_serving_requests_never_migrates_the_database()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/ready", Cancel);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, api.Migrator.Migrations);
    }

    [Fact]
    public async Task The_migrate_command_applies_pending_migrations_and_exits_0()
    {
        var migrator = new MigratorSpy();

        var exitCode = await MigrateCommand.RunAsync(Services(migrator), Cancel);

        Assert.Equal(0, exitCode);
        Assert.Equal(1, migrator.Migrations);
    }

    [Fact]
    public async Task The_migrate_command_exits_non_zero_when_a_migration_fails()
    {
        var exitCode = await MigrateCommand.RunAsync(Services(new MigratorSpy(fails: true)), Cancel);

        Assert.NotEqual(0, exitCode);
    }

    private static ServiceProvider Services(IDatabaseMigrator migrator) =>
        new ServiceCollection()
            .AddSingleton(migrator)
            .AddSingleton(typeof(Microsoft.Extensions.Logging.ILogger<>), typeof(NullLogger<>))
            .BuildServiceProvider();
}
