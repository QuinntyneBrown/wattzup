using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Infrastructure.Accounts;

/// <summary>
/// Sends email over SMTP with MailKit (ADR 0031), to whichever provider the <c>Email:*</c> settings name
/// (docs/deployment.md). A message that cannot be sent throws, and the rider is told the code could not be sent.
/// </summary>
internal sealed class SmtpEmailSender(IConfiguration configuration) : IEmailSender
{
    public async Task SendSignInCodeAsync(string email, string code, CancellationToken cancellationToken)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(Setting("Email:From")));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = $"{code} is your Telo Ride code";
        message.Body = new TextPart("plain")
        {
            Text = $"Your Telo Ride sign-in code is {code}.\n\nIt works for 10 minutes. If you didn't ask for it, you can ignore this email.\n",
        };

        using var smtp = new SmtpClient();
        var port = int.TryParse(configuration["Email:Smtp:Port"], out var configured) ? configured : 587;
        await smtp.ConnectAsync(Setting("Email:Smtp:Host"), port, SecureSocketOptions.Auto, cancellationToken);
        if (configuration["Email:Smtp:Username"] is { Length: > 0 } username)
        {
            await smtp.AuthenticateAsync(username, configuration["Email:Smtp:Password"] ?? string.Empty, cancellationToken);
        }

        await smtp.SendAsync(message, cancellationToken);
        await smtp.DisconnectAsync(true, cancellationToken);
    }

    private string Setting(string name) =>
        configuration[name] is { Length: > 0 } value ? value : throw new InvalidOperationException($"{name} is not set.");
}
