using Microsoft.Extensions.Diagnostics.HealthChecks;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Health;

/// <summary>Readiness: healthy only while the database answers (L2-127 AC4).</summary>
internal sealed class DatabaseHealthCheck(IAppDbContext database) : IHealthCheck
{
    public const string Tag = "ready";

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default) =>
        await database.CanConnectAsync(cancellationToken) ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy();
}
