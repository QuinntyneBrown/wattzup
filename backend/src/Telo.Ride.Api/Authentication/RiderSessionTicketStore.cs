using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Api.Authentication;

/// <summary>
/// Keeps each session in the database as a <see cref="RiderSession"/> (Stay signed in). The cookie carries a random
/// 256-bit key and the database only its SHA-256 hash, so a copy of the database cannot replay a session. Every
/// authenticated request loads the session afresh: an ended or expired one is refused, an active one is touched, so it
/// lasts 365 days from its last use (L2-004 AC1). The ticket is rebuilt from the session's rider; none is stored.
/// </summary>
internal sealed class RiderSessionTicketStore(IServiceScopeFactory scopes, TimeProvider time) : ITicketStore
{
    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var riderId = RiderId(ticket.Principal) ?? throw new InvalidOperationException("A session needs a rider.");
        var key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        db.RiderSessions.Add(RiderSession.Start(riderId, Hash(key), time.GetUtcNow()));
        await db.SaveChangesAsync(CancellationToken.None);
        return key;
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var hash = Hash(key);
        var session = await db.RiderSessions.FirstOrDefaultAsync(known => known.KeyHash == hash);
        var now = time.GetUtcNow();
        if (session is null || !session.IsActive(now))
        {
            return null;
        }

        session.Touch(now);
        await db.SaveChangesAsync(CancellationToken.None);
        return Ticket(session.RiderId, now, session.ExpiresAt);
    }

    // The session already moved forward when it was retrieved; the cookie is reissued with its new expiry.
    public Task RenewAsync(string key, AuthenticationTicket ticket) => Task.CompletedTask;

    public async Task RemoveAsync(string key)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var hash = Hash(key);
        var session = await db.RiderSessions.FirstOrDefaultAsync(known => known.KeyHash == hash);
        if (session is not null)
        {
            session.End(time.GetUtcNow());
            await db.SaveChangesAsync(CancellationToken.None);
        }
    }

    /// <summary>The ticket that signs <paramref name="riderId"/> in, persistent so the cookie outlives the browser.</summary>
    public static AuthenticationTicket Ticket(Guid riderId, DateTimeOffset issued, DateTimeOffset expires) =>
        new(Principal(riderId), new AuthenticationProperties { IsPersistent = true, IssuedUtc = issued, ExpiresUtc = expires },
            CookieAuthenticationDefaults.AuthenticationScheme);

    public static ClaimsPrincipal Principal(Guid riderId) => new(new ClaimsIdentity(
        [new Claim(ClaimTypes.NameIdentifier, riderId.ToString())], CookieAuthenticationDefaults.AuthenticationScheme));

    public static Guid? RiderId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private static string Hash(string key) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(key)));
}
