// Acceptance test
// Traces to: L2-125 AC3
// Description: when two first submissions of one ride id arrive at once, both find no ride, and the other one's insert
// lands first. The key refuses this one's insert, and it answers with the ride the other recorded, not a failure.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Telo.Ride.Application;
using Telo.Ride.Domain.Accounts;
using Telo.Ride.Domain.Maps;
using Telo.Ride.Domain.Results;
using Telo.Ride.Domain.Rides;
using Telo.Ride.Domain.Workouts;
using Telo.Ride.Infrastructure;

namespace Telo.Ride.Api.Tests;

/// <summary>
/// The API whose database, injected through <see cref="IAppDbContext"/>, records each new ride a minute earlier through
/// another context just before this one saves it: the other submission of the same ride id, landing first. This save
/// then fails as SQL Server's primary key fails it, with <see cref="DbUpdateException"/>; EF Core InMemory's store
/// would throw an exception of its own.
/// </summary>
public sealed class ConcurrentRideApi : SignInApi
{
    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.Replace(ServiceDescriptor.Scoped<IAppDbContext, OtherSubmissionLandsFirst>());
    }

    private sealed class OtherSubmissionLandsFirst(AppDbContext db, DbContextOptions<AppDbContext> options) : IAppDbContext
    {
        public DbSet<SignInCode> SignInCodes => db.SignInCodes;

        public DbSet<Rider> Riders => db.Riders;

        public DbSet<RiderSession> RiderSessions => db.RiderSessions;

        public DbSet<RecordedRide> Rides => db.Rides;

        public DbSet<MapProgress> MapProgress => db.MapProgress;
        public DbSet<CustomWorkout> CustomWorkouts => db.CustomWorkouts;

        public DbSet<SessionResult> SessionResults => db.SessionResults;

        public Task<bool> CanConnectAsync(CancellationToken cancellationToken) => db.CanConnectAsync(cancellationToken);

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken)
        {
            var added = db.ChangeTracker.Entries<RecordedRide>().Where(entry => entry.State == EntityState.Added).ToList();
            foreach (var entry in added)
            {
                await using var other = new AppDbContext(options);
                var ride = entry.Entity;
                other.Rides.Add(new RecordedRide
                {
                    RiderId = ride.RiderId,
                    Id = ride.Id,
                    Kind = ride.Kind,
                    MapId = ride.MapId,
                    Mode = ride.Mode,
                    Pack = ride.Pack,
                    Place = ride.Place,
                    FieldSize = ride.FieldSize,
                    ElapsedSeconds = ride.ElapsedSeconds,
                    DistanceMeters = ride.DistanceMeters,
                    OutputKj = ride.OutputKj,
                    MaxPowerWatts = ride.MaxPowerWatts,
                    MaxSpeedKmh = ride.MaxSpeedKmh,
                    OnTargetShare = ride.OnTargetShare,
                    XpLines = ride.XpLines,
                    TotalXp = ride.TotalXp,
                    FinishedAt = ride.FinishedAt,
                    TimeZoneId = ride.TimeZoneId,
                    RecordedAt = ride.RecordedAt.AddMinutes(-1),
                });
                await other.SaveChangesAsync(cancellationToken);
            }

            return added.Count == 0
                ? await db.SaveChangesAsync(cancellationToken)
                : throw new DbUpdateException("Violation of PRIMARY KEY constraint 'PK_Rides'.");
        }
    }
}

public sealed class ConcurrentRideTests(ConcurrentRideApi api) : IClassFixture<ConcurrentRideApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_submission_whose_insert_loses_to_another_answers_with_the_ride_the_other_recorded()
    {
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
        });
        const string email = "tess.twice@example.com";
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        var rideId = Guid.NewGuid();
        var otherRecordedAt = api.Clock.GetUtcNow().AddMinutes(-1);

        using var answered = await browser.PostAsJsonAsync("/api/rides", new
        {
            rideId,
            kind = "class",
            classId = "power-intervals-20",
            elapsedSeconds = 1200,
            distanceMeters = 0.0,
            outputKj = 240.0,
            maxPowerWatts = 380,
            maxSpeedKmh = 0.0,
            speedSamplesKmh = Array.Empty<double>(),
            finishedAt = "2026-11-21T07:20:00+00:00",
            timeZoneId = "Europe/Paris",
        }, Cancel);

        Assert.Equal(HttpStatusCode.OK, answered.StatusCode);
        var answer = JsonDocument.Parse(await answered.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.Equal(rideId, answer.GetProperty("rideId").GetGuid());
        Assert.Equal(otherRecordedAt, answer.GetProperty("recordedAt").GetDateTimeOffset());
    }
}
