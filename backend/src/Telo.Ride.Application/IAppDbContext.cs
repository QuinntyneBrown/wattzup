using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain.Accounts;
using Telo.Ride.Domain.Maps;
using Telo.Ride.Domain.Results;
using Telo.Ride.Domain.Rides;
using Telo.Ride.Domain.Workouts;

namespace Telo.Ride.Application;

/// <summary>
/// The database as handlers see it. Infrastructure implements it with EF Core; tests inject faults
/// through it (AGENTS.md). Entity sets join it as slices add entities.
/// </summary>
public interface IAppDbContext
{
    /// <summary>The sign-in codes sent, as hashes (sign-in with an email code).</summary>
    DbSet<SignInCode> SignInCodes { get; }

    /// <summary>The riders' accounts.</summary>
    DbSet<Rider> Riders { get; }

    /// <summary>The sessions riders hold on their devices (Stay signed in).</summary>
    DbSet<RiderSession> RiderSessions { get; }

    /// <summary>The finished rides recorded for riders (Record a ride).</summary>
    DbSet<RecordedRide> Rides { get; }

    /// <summary>Each rider's stars and best time on each map they have raced (L2-039, L2-077).</summary>
    DbSet<MapProgress> MapProgress { get; }

    /// <summary>The results of finished riders-online races, as the service computed them (L2-125 AC1).</summary>
    DbSet<SessionResult> SessionResults { get; }

    /// <summary>Each rider's last saved custom workout (L2-099 AC4).</summary>
    DbSet<CustomWorkout> CustomWorkouts { get; }

    /// <summary>Whether the database answers; readiness reports it (L2-127 AC4).</summary>
    Task<bool> CanConnectAsync(CancellationToken cancellationToken);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
