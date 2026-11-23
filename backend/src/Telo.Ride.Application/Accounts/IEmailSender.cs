namespace Telo.Ride.Application.Accounts;

/// <summary>
/// Delivers email for Telo Ride (sign-in with an email code). Infrastructure sends it over SMTP (ADR 0031); tests keep
/// what would have been sent instead.
/// </summary>
public interface IEmailSender
{
    /// <summary>Sends the six-digit sign-in <paramref name="code"/> to <paramref name="email"/>.</summary>
    Task SendSignInCodeAsync(string email, string code, CancellationToken cancellationToken);
}
