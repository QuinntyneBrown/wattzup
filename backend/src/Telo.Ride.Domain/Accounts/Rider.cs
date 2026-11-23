using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// A rider's account: created the first time a code for an unknown address is confirmed (L2-001 AC4). It has no password
/// (L2-001 AC6); the display name comes later (L2-005). A deleted account keeps neither email nor name, and is erased
/// within 30 days (L2-006).
/// </summary>
public sealed class Rider
{
    private Rider()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>The address it signs in with; <c>null</c> once the account is deleted, so the address is free again.</summary>
    public string? Email { get; private set; }

    public string? DisplayName { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>Every XP the rider's recorded rides have earned (L2-037); the level follows from it (L2-038).</summary>
    public int TotalXp { get; private set; }

    /// <summary>When the rider deleted the account; it is erased within 30 days of it (L2-006 AC3).</summary>
    public DateTimeOffset? DeletionRequestedAt { get; private set; }

    public static Rider Create(EmailAddress email, DateTimeOffset now) =>
        new() { Id = Guid.NewGuid(), Email = email.Value, CreatedAt = now };

    /// <summary>The days of the rider's streak, as of <see cref="LastRideDay"/> (L2-042).</summary>
    public int StreakDays { get; private set; }

    /// <summary>The last calendar day with a finished ride, in the time zone it was submitted with.</summary>
    public DateOnly? LastRideDay { get; private set; }

    /// <summary>The IANA time zone of the rider's latest ride, which decides "today"; none before the first ride.</summary>
    public string? TimeZoneId { get; private set; }

    /// <summary>The rider's streak (L2-042).</summary>
    public Streak Streak => new(StreakDays, LastRideDay);

    /// <summary>Adds a recorded ride's XP to the total (L2-037).</summary>
    public void AddXp(int xp) => TotalXp += xp;

    /// <summary>
    /// Records a ride that finished at <paramref name="finishedAt"/> in <paramref name="timeZoneId"/>, which becomes the
    /// rider's time zone, and returns the streak after it (L2-042 AC1, AC3).
    /// </summary>
    public int RecordRide(DateTimeOffset finishedAt, string timeZoneId)
    {
        var streak = Streak.Record(RiderDay.LocalDay(finishedAt, timeZoneId));
        (StreakDays, LastRideDay, TimeZoneId) = (streak.Days, streak.LastRideDay, timeZoneId);
        return streak.Days;
    }

    /// <summary>The streak as it reads at <paramref name="now"/> in the rider's time zone, UTC before the first ride (AC2).</summary>
    public int StreakDaysAt(DateTimeOffset now) => Streak.DaysOn(RiderDay.LocalDay(now, TimeZoneId ?? "Etc/UTC"));

    /// <summary>Sets the name other riders see (L2-005).</summary>
    public void Rename(DisplayName name) => DisplayName = name.Value;

    /// <summary>
    /// Deletes the account (L2-006 AC3): the email and the display name go at once, so a later sign-in with the same
    /// address makes a new, empty account (AC4). The rest goes when the account is erased.
    /// </summary>
    public void RequestDeletion(DateTimeOffset now)
    {
        Email = null;
        DisplayName = null;
        DeletionRequestedAt ??= now;
    }
}
