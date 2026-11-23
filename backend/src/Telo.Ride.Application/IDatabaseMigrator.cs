namespace Telo.Ride.Application;

/// <summary>Applies pending schema migrations; only the <c>migrate</c> command calls it (L2-147 AC5).</summary>
public interface IDatabaseMigrator
{
    Task MigrateAsync(CancellationToken cancellationToken);
}
