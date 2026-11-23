namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// A rider signed in on one device (L2-004). The browser holds a random key in a cookie; only the key's hash is kept.
/// The session lasts 365 days from its last use, and each use moves the expiry forward (AC1).
/// </summary>
public sealed class RiderSession
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(365);

    private RiderSession()
    {
    }

    public Guid Id { get; private set; }

    public Guid RiderId { get; private set; }

    public string KeyHash { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset LastUsedAt { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? EndedAt { get; private set; }

    public static RiderSession Start(Guid riderId, string keyHash, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        RiderId = riderId,
        KeyHash = keyHash,
        CreatedAt = now,
        LastUsedAt = now,
        ExpiresAt = now + Lifetime,
    };

    public bool IsActive(DateTimeOffset now) => EndedAt is null && now < ExpiresAt;

    public void Touch(DateTimeOffset now)
    {
        LastUsedAt = now;
        ExpiresAt = now + Lifetime;
    }

    public void End(DateTimeOffset now) => EndedAt ??= now;
}
