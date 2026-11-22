using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Telo.Ride.Application;
using Telo.Ride.Domain.Accounts;
using Telo.Ride.Domain.Maps;
using Telo.Ride.Domain.Results;
using Telo.Ride.Domain.Rides;
using Telo.Ride.Domain.Workouts;

namespace Telo.Ride.Infrastructure;

/// <summary>The Telo Ride database through EF Core: Azure SQL when deployed (ADR 0025).</summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<SignInCode> SignInCodes => Set<SignInCode>();

    public DbSet<Rider> Riders => Set<Rider>();

    public DbSet<RiderSession> RiderSessions => Set<RiderSession>();

    public DbSet<RecordedRide> Rides => Set<RecordedRide>();

    public DbSet<MapProgress> MapProgress => Set<MapProgress>();

    public DbSet<CustomWorkout> CustomWorkouts => Set<CustomWorkout>();

    public DbSet<SessionResult> SessionResults => Set<SessionResult>();

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Task<bool> CanConnectAsync(CancellationToken cancellationToken) =>
        Database.CanConnectAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SignInCode>(code =>
        {
            code.HasKey(c => c.Id);
            code.Property(c => c.Email).HasMaxLength(320).IsRequired();
            code.Property(c => c.CodeHash).HasMaxLength(64).IsRequired();
            code.Property(c => c.NetworkHash).HasMaxLength(64).IsRequired();
            code.HasIndex(c => new { c.Email, c.IssuedAt });
            code.HasIndex(c => new { c.NetworkHash, c.IssuedAt });
        });
        modelBuilder.Entity<Rider>(rider =>
        {
            rider.HasKey(r => r.Id);
            // A deleted account has no email; the unique index leaves those out (L2-006 AC4).
            rider.Property(r => r.Email).HasMaxLength(320);
            rider.HasIndex(r => r.Email).IsUnique();
            rider.Property(r => r.DisplayName).HasMaxLength(40);
            rider.Property(r => r.TimeZoneId).HasMaxLength(64);
            rider.Ignore(r => r.Streak);
        });
        modelBuilder.Entity<RiderSession>(session =>
        {
            session.HasKey(s => s.Id);
            session.Property(s => s.KeyHash).HasMaxLength(64).IsRequired();
            session.HasIndex(s => s.KeyHash).IsUnique();
            session.HasIndex(s => s.RiderId);
            session.HasOne<Rider>().WithMany().HasForeignKey(s => s.RiderId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<RecordedRide>(ride =>
        {
            // One ride id is recorded once for each rider (L2-125 AC3); the key refuses a second insert.
            ride.HasKey(r => new { r.RiderId, r.Id });
            ride.Property(r => r.Kind).HasConversion<string>().HasMaxLength(8);
            ride.Property(r => r.MapId).HasMaxLength(64);
            ride.Property(r => r.Mode).HasMaxLength(8);
            ride.Property(r => r.Pack).HasMaxLength(8);
            ride.Property(r => r.SessionId).HasMaxLength(96);
            ride.Property(r => r.ClassId).HasMaxLength(64);
            ride.Property(r => r.OpenedMapId).HasMaxLength(64);
            ride.Property(r => r.TimeZoneId).HasMaxLength(64);
            // The XP lines are the ride's answer, read and written whole, so they are one JSON column.
            ride.Property(r => r.XpLines).HasConversion(
                lines => JsonSerializer.Serialize(lines, JsonOptions),
                json => JsonSerializer.Deserialize<List<XpLine>>(json, JsonOptions) ?? new List<XpLine>(),
                new ValueComparer<IReadOnlyList<XpLine>>(
                    (left, right) => left!.SequenceEqual(right!),
                    lines => lines.Aggregate(0, (hash, line) => HashCode.Combine(hash, line)),
                    lines => lines.ToList()));
            ride.Property(r => r.StarsHeld).HasConversion<int?>();
            ride.Property(r => r.StarsEarned).HasConversion<int?>();
            ride.HasOne<Rider>().WithMany().HasForeignKey(r => r.RiderId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<MapProgress>(progress =>
        {
            // One row for each rider and map: the stars held, as flags, the best time and when a ride opened it.
            progress.HasKey(p => new { p.RiderId, p.MapId });
            progress.Property(p => p.MapId).HasMaxLength(64);
            progress.Property(p => p.Stars).HasConversion<int>();
            progress.HasOne<Rider>().WithMany().HasForeignKey(p => p.RiderId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<CustomWorkout>(workout =>
        {
            // One row for each rider: the app's settings as JSON, kept as they came, and when they were saved.
            workout.HasKey(w => w.RiderId);
            workout.Property(w => w.Settings).HasMaxLength(CustomWorkout.MaxSettingsLength);
            workout.HasOne<Rider>().WithMany().HasForeignKey(w => w.RiderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SessionResult>(result =>
        {
            // One result for each finished race session, with an entry for each seat (L2-125 AC1).
            result.HasKey(r => r.SessionId);
            result.Property(r => r.SessionId).HasMaxLength(96);
            result.Property(r => r.MapId).HasMaxLength(64);
            result.OwnsMany(r => r.Entries, entry =>
            {
                entry.ToTable("SessionResultEntries");
                entry.WithOwner().HasForeignKey("SessionId");
                entry.HasKey("SessionId", nameof(SessionResultEntry.Seat));
                entry.Property(e => e.Name).HasMaxLength(40);
                entry.Property(e => e.Status).HasConversion<string>().HasMaxLength(16);
                entry.HasOne<Rider>().WithMany().HasForeignKey(e => e.RiderId).OnDelete(DeleteBehavior.SetNull);
            });
        });
    }
}
