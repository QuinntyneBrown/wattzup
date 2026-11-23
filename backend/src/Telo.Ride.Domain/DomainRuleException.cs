namespace Telo.Ride.Domain;

/// <summary>What kind of refusal a domain rule makes; the API maps each to an HTTP status.</summary>
public enum RuleKind
{
    /// <summary>The thing asked for does not exist, or is not the rider's to see (404).</summary>
    NotFound,

    /// <summary>The request clashes with the current state, such as a full session (409).</summary>
    Conflict,

    /// <summary>The rider may not do this (403).</summary>
    Forbidden,

    /// <summary>What the rider sent is not acceptable, such as a malformed email address (400).</summary>
    Invalid,

    /// <summary>What the rider sent is well formed but cannot be true, such as a ride no one could ride (422).</summary>
    Unprocessable,

    /// <summary>Too many requests of this kind for now; try again after <see cref="DomainRuleException.RetryAfter"/> (429).</summary>
    TooManyRequests,
}

/// <summary>
/// A domain rule refusing a request, with the <see cref="Code"/> a screen branches on (for example
/// <c>session_full</c>, <c>ride_not_plausible</c>). The message is for developers; riders see a
/// generic message chosen by the screen from the code. A <see cref="RuleKind.TooManyRequests"/> refusal says when to try
/// again with <see cref="RetryAfter"/>.
/// </summary>
public sealed class DomainRuleException(string code, RuleKind kind, string message, TimeSpan? retryAfter = null) : Exception(message)
{
    public string Code { get; } = code;

    public RuleKind Kind { get; } = kind;

    public TimeSpan? RetryAfter { get; } = retryAfter;
}
