using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Api.Tests;

/// <summary>A code the API handed to the email sender: the address it went to and the six digits.</summary>
public sealed record SentCode(string Email, string Code);

/// <summary>Stands in for the email delivery service: it keeps every code the API sends, and never sends one.</summary>
public sealed class FakeMailbox : IEmailSender
{
    private readonly List<SentCode> sent = [];

    /// <summary>While true, every send fails as an unreachable SMTP relay would.</summary>
    public bool Unreachable { get; set; }

    public IReadOnlyList<SentCode> Sent
    {
        get
        {
            lock (sent)
            {
                return [.. sent];
            }
        }
    }

    public Task SendSignInCodeAsync(string email, string code, CancellationToken cancellationToken)
    {
        if (Unreachable)
        {
            throw new InvalidOperationException("The SMTP relay cannot be reached.");
        }

        lock (sent)
        {
            sent.Add(new SentCode(email, code));
        }

        return Task.CompletedTask;
    }
}

/// <summary>The API with a <see cref="FakeMailbox"/> for its email sender and a code hash key of its own.</summary>
public class SignInApi : TeloRideApiFactory
{
    public FakeMailbox Mailbox { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Auth:CodeHashKey", "acceptance-tests-code-hash-key-0123456789");
        base.ConfigureWebHost(builder);
    }

    protected override void ConfigureServices(IServiceCollection services) =>
        services.Replace(ServiceDescriptor.Singleton<IEmailSender>(Mailbox));
}

/// <summary>A second host for the per-address limit, so its requests count against no other test's.</summary>
public sealed class SignInPerAddressApi : SignInApi;
