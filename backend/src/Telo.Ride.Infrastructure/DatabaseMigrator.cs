using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application;

namespace Telo.Ride.Infrastructure;

/// <summary>Applies the EF Core migrations in this assembly that the database has not had yet.</summary>
internal sealed class DatabaseMigrator(AppDbContext database) : IDatabaseMigrator
{
    public Task MigrateAsync(CancellationToken cancellationToken) => database.Database.MigrateAsync(cancellationToken);
}
