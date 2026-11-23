namespace Telo.Ride.Domain.Accounts;

/// <summary>What checking a code found (L2-002, L2-003 AC3).</summary>
public enum CodeCheck
{
    Matched,
    Mismatch,
    Expired,
    Locked,
    Used,
}

/// <summary>
/// One six-digit code sent to an email address, kept only as a keyed hash (L2-132). It works for 10 minutes and once;
/// a newer code for the same address supersedes it (L2-003 AC2). The network it was asked from is kept as a keyed hash
/// too, so the per-network limit can be counted without storing the address (L2-003 AC5).
/// </summary>
public sealed class SignInCode
{
    /// <summary>The least time between two codes for one address (L2-003 AC1).</summary>
    public static readonly TimeSpan ResendGap = TimeSpan.FromSeconds(30);

    /// <summary>How long a code works (L2-002 AC4).</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    /// <summary>Wrong codes after which even the right one is refused (L2-003 AC3).</summary>
    public const int MaxFailedAttempts = 5;

    private SignInCode()
    {
    }

    public Guid Id { get; private set; }

    public string Email { get; private set; } = string.Empty;

    public string CodeHash { get; private set; } = string.Empty;

    public string NetworkHash { get; private set; } = string.Empty;

    public DateTimeOffset IssuedAt { get; private set; }

    public DateTimeOffset? SupersededAt { get; private set; }

    public int FailedAttempts { get; private set; }

    public DateTimeOffset? UsedAt { get; private set; }

    public static SignInCode Issue(EmailAddress email, string codeHash, string networkHash, DateTimeOffset now) =>
        new() { Id = Guid.NewGuid(), Email = email.Value, CodeHash = codeHash, NetworkHash = networkHash, IssuedAt = now };

    /// <summary>How long until another code may be sent after this one, or zero.</summary>
    public TimeSpan ResendWait(DateTimeOffset now) =>
        IssuedAt + ResendGap > now ? IssuedAt + ResendGap - now : TimeSpan.Zero;

    public void Supersede(DateTimeOffset now) => SupersededAt ??= now;

    /// <summary>
    /// Checks a code whose hash <paramref name="matches"/> this one's or not: a used code stays used, one older than 10
    /// minutes has expired, after five wrong codes even the right one is refused, a wrong one counts against it, and
    /// the right one is used up.
    /// </summary>
    public CodeCheck Verify(bool matches, DateTimeOffset now)
    {
        if (UsedAt is not null)
        {
            return CodeCheck.Used;
        }

        if (now - IssuedAt > Lifetime)
        {
            return CodeCheck.Expired;
        }

        if (FailedAttempts >= MaxFailedAttempts)
        {
            return CodeCheck.Locked;
        }

        if (!matches)
        {
            FailedAttempts++;
            return CodeCheck.Mismatch;
        }

        UsedAt = now;
        return CodeCheck.Matched;
    }
}
