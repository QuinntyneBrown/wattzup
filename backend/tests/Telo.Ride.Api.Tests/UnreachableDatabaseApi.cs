using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Telo.Ride.Application;
using Telo.Ride.Domain.Accounts;
using Telo.Ride.Domain.Feedback;
using Telo.Ride.Domain.Maps;
using Telo.Ride.Domain.Results;
using Telo.Ride.Domain.Rides;
using Telo.Ride.Domain.Workouts;
using Telo.Ride.Infrastructure;

namespace Telo.Ride.Api.Tests;

/// <summary>The API with a database it cannot reach, injected through <see cref="IAppDbContext"/>.</summary>
public sealed class UnreachableDatabaseApi : TeloRideApiFactory
{
    protected override void ConfigureServices(IServiceCollection services) =>
        services.Replace(ServiceDescriptor.Scoped<IAppDbContext, UnreachableDatabase>());

    /// <summary>The real context over the test's store, except that it cannot connect.</summary>
    private sealed class UnreachableDatabase(AppDbContext db) : IAppDbContext
    {
        public DbSet<SignInCode> SignInCodes => db.SignInCodes;

        public DbSet<Rider> Riders => db.Riders;

        public DbSet<RiderSession> RiderSessions => db.RiderSessions;

        public DbSet<RecordedRide> Rides => db.Rides;

        public DbSet<MapProgress> MapProgress => db.MapProgress;
        public DbSet<CustomWorkout> CustomWorkouts => db.CustomWorkouts;

        public DbSet<FeedbackReport> FeedbackReports => db.FeedbackReports;

        public DbSet<SessionResult> SessionResults => db.SessionResults;

        public Task<bool> CanConnectAsync(CancellationToken cancellationToken) =>
            throw new InvalidOperationException("The database cannot be reached.");

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
    }
}
