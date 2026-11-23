using System.Text.RegularExpressions;

namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// An email address as Telo Ride keeps it: trimmed, with its domain lower-cased and its local part as typed
/// (L2-001 AC6). It is the only form the backend stores or sends to.
/// </summary>
public sealed partial record EmailAddress
{
    private EmailAddress(string value) => Value = value;

    public string Value { get; }

    /// <summary>One <c>@</c>, no space, and a dot in the domain, as the sign-in screen checks it.</summary>
    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex Shape();

    public static bool IsValid(string? raw) => raw is not null && Shape().IsMatch(raw.Trim());

    public static EmailAddress Parse(string raw)
    {
        if (!IsValid(raw))
        {
            throw new DomainRuleException("invalid_email", RuleKind.Invalid, "That is not an email address.");
        }

        var trimmed = raw.Trim();
        var at = trimmed.LastIndexOf('@');
        return new EmailAddress(string.Concat(trimmed.AsSpan(0, at + 1), trimmed[(at + 1)..].ToLowerInvariant()));
    }

    public override string ToString() => Value;
}
