namespace Telo.Ride.Application.Accounts;

/// <summary>
/// One-way keyed hashing for what sign-in keeps but must not store in the clear: the code, and the network address a
/// code was asked from (L2-132). Infrastructure computes HMAC-SHA256 keyed by <c>Auth:CodeHashKey</c>.
/// </summary>
public interface ISignInCodeHasher
{
    string HashCode(string code);

    /// <summary>Whether <paramref name="code"/> hashes to <paramref name="hash"/>, compared in constant time.</summary>
    bool CodeMatches(string code, string hash);

    string HashNetwork(string networkAddress);
}
