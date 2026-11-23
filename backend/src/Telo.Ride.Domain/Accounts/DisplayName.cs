using System.Text.RegularExpressions;

namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// The name other riders see (L2-005 AC2): 2 to 24 characters after trimming, made of letters, digits, spaces,
/// <c>.</c>, <c>_</c> and <c>-</c>. It is the one rule; nothing that breaks it reaches a rider.
/// </summary>
public sealed partial record DisplayName
{
    public const int MinLength = 2;
    public const int MaxLength = 24;

    private DisplayName(string value) => Value = value;

    public string Value { get; }

    [GeneratedRegex(@"^[\p{L}\p{N} ._-]+$")]
    private static partial Regex Allowed();

    /// <summary>The trimmed name, or <c>display_name_invalid</c> when it breaks the rule.</summary>
    public static DisplayName Parse(string? raw)
    {
        var trimmed = raw?.Trim() ?? string.Empty;
        if (trimmed.Length is < MinLength or > MaxLength || !Allowed().IsMatch(trimmed))
        {
            throw new DomainRuleException(
                "display_name_invalid", RuleKind.Invalid, "Use 2 to 24 characters: letters, digits, spaces, . _ and -.");
        }

        return new DisplayName(trimmed);
    }

    public override string ToString() => Value;
}
