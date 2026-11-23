using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Time.Testing;
using Telo.Ride.Infrastructure;
using Telo.Ride.Infrastructure.Accounts;

namespace Telo.Ride.Api.Tests;

/// <summary>
/// The Telo Ride API hosted in memory for one test class: one fixture, one EF Core InMemory store,
/// never a real database or file, and a <see cref="Clock"/> the test advances instead of sleeping
/// (AGENTS.md, L2-148). Subclasses override <see cref="ConfigureServices"/> to inject faults.
/// </summary>
public class TeloRideApiFactory : WebApplicationFactory<Program>
{
    private readonly string store = $"telo-ride-{Guid.NewGuid():N}";

    /// <summary>The API's <see cref="TimeProvider"/>: time moves only when a test advances it.</summary>
    public FakeTimeProvider Clock { get; } = new(new DateTimeOffset(2026, 11, 21, 7, 0, 0, TimeSpan.Zero));

    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(store));
            services.Replace(ServiceDescriptor.Singleton<TimeProvider>(Clock));
            if (!RunsAccountErasure)
            {
                foreach (var erasure in services.Where(descriptor => descriptor.ImplementationType == typeof(AccountErasureService)).ToList())
                {
                    services.Remove(erasure);
                }
            }

            ConfigureServices(services);
        });

    /// <summary>
    /// Whether the daily <see cref="AccountErasureService"/> runs. It ticks on <see cref="Clock"/>, which every test
    /// advances, so only the host that tests it runs it; elsewhere it would erase in the background mid-test.
    /// </summary>
    protected virtual bool RunsAccountErasure => false;

    /// <summary>Changes the host's services after the in-memory store is in place.</summary>
    protected virtual void ConfigureServices(IServiceCollection services)
    {
    }
}
