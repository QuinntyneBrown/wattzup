using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;
using Telo.Ride.Application.Accounts;
using Telo.Ride.Application.Classes;
using Telo.Ride.Application.Maps;
using Telo.Ride.Infrastructure.Accounts;
using Telo.Ride.Infrastructure.Catalogue;
using Telo.Ride.Infrastructure.Live;

namespace Telo.Ride.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// The database (connection string <c>ConnectionStrings:TeloRide</c>, docs/deployment.md) and
    /// <see cref="IAppDbContext"/> over it, <see cref="TeloRideMetrics"/>, and the class catalogue embedded in
    /// this assembly (ADR 0028), sign-in's code hasher and email sender (ADR 0031), and the daily erasure of deleted
    /// accounts (L2-006 AC3).
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("TeloRide")));
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IDatabaseMigrator, DatabaseMigrator>();
        services.AddSingleton<TeloRideMetrics>();
        services.AddSingleton<IClassCatalogue, EmbeddedClassCatalogue>();
        services.AddSingleton<IMapCatalogue, EmbeddedMapCatalogue>();
        services.AddSingleton<IGroupSessionRegistry, InMemoryGroupSessionRegistry>();
        services.AddSingleton<ISignInCodeHasher, HmacSignInCodeHasher>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddHostedService<AccountErasureService>();
        services.AddHostedService<SessionTicker>();
        return services;
    }
}
