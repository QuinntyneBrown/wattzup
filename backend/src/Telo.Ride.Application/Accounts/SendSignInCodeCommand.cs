using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Application.Accounts;

/// <summary>Asks for a sign-in code for <paramref name="Email"/>, from the client's network address (null when unknown).</summary>
public sealed record SendSignInCodeCommand(string? Email, string? NetworkAddress) : IRequest;

/// <summary>
/// Sends a six-digit sign-in code (L2-001, L2-003). The address is normalised; the per-address limit (5 an hour), the
/// per-network limit (20 an hour) and the 30-second gap between codes refuse with 429 and when to try again; otherwise
/// the active code is superseded and the plain code handed to <see cref="IEmailSender"/>, then the new one is saved as
/// a hash. Sending first means a send that fails saves nothing, so the rider can ask again at once (L2-001 AC5).
/// The work is the same whether or not the address has an account, so the answer does not tell (L2-001 AC4).
/// </summary>
public sealed class SendSignInCodeCommandHandler(
    IAppDbContext db, ISignInCodeHasher hasher, IEmailSender email, TimeProvider time)
    : IRequestHandler<SendSignInCodeCommand>
{
    public const int CodesPerAddressPerHour = 5;
    public const int CodesPerNetworkPerHour = 20;
    private static readonly TimeSpan Window = TimeSpan.FromHours(1);

    public async Task Handle(SendSignInCodeCommand request, CancellationToken cancellationToken)
    {
        var address = EmailAddress.Parse(request.Email ?? string.Empty);
        var network = hasher.HashNetwork(request.NetworkAddress ?? "unknown");
        var now = time.GetUtcNow();
        var windowStart = now - Window;

        var forAddress = await db.SignInCodes
            .Where(code => code.Email == address.Value && code.IssuedAt > windowStart)
            .OrderBy(code => code.IssuedAt)
            .ToListAsync(cancellationToken);
        RefuseOverLimit(forAddress.Select(code => code.IssuedAt).ToList(), CodesPerAddressPerHour, now);

        var forNetwork = await db.SignInCodes
            .Where(code => code.NetworkHash == network && code.IssuedAt > windowStart)
            .OrderBy(code => code.IssuedAt)
            .Select(code => code.IssuedAt)
            .ToListAsync(cancellationToken);
        RefuseOverLimit(forNetwork, CodesPerNetworkPerHour, now);

        var active = forAddress.LastOrDefault(code => code.SupersededAt is null);
        if (active?.ResendWait(now) is { } wait && wait > TimeSpan.Zero)
        {
            throw new DomainRuleException("resend_too_soon", RuleKind.TooManyRequests, "A code was sent moments ago.", wait);
        }

        active?.Supersede(now);
        var plain = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", System.Globalization.CultureInfo.InvariantCulture);
        db.SignInCodes.Add(SignInCode.Issue(address, hasher.HashCode(plain), network, now));
        await email.SendSignInCodeAsync(address.Value, plain, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static void RefuseOverLimit(List<DateTimeOffset> issued, int limit, DateTimeOffset now)
    {
        if (issued.Count >= limit)
        {
            throw new DomainRuleException(
                "rate_limited", RuleKind.TooManyRequests, "Too many sign-in codes asked for.", issued[^limit] + Window - now);
        }
    }
}
