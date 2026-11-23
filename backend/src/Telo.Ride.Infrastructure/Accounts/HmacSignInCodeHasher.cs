using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Infrastructure.Accounts;

/// <summary>
/// HMAC-SHA256 keyed by the secret setting <c>Auth:CodeHashKey</c> (docs/deployment.md), so a copy of the database alone
/// cannot recover a code or a network address (L2-132). The code and the network are hashed under different labels.
/// </summary>
internal sealed class HmacSignInCodeHasher(IConfiguration configuration) : ISignInCodeHasher
{
    private byte[] Key => Encoding.UTF8.GetBytes(configuration["Auth:CodeHashKey"] is { Length: >= 32 } key
        ? key
        : throw new InvalidOperationException("Auth:CodeHashKey is not set, or is shorter than 32 characters."));

    public string HashCode(string code) => Hash("code:" + code);

    public bool CodeMatches(string code, string hash) =>
        CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(HashCode(code)), Encoding.ASCII.GetBytes(hash));

    public string HashNetwork(string networkAddress) => Hash("network:" + networkAddress);

    private string Hash(string value) => Convert.ToHexStringLower(HMACSHA256.HashData(Key, Encoding.UTF8.GetBytes(value)));
}
