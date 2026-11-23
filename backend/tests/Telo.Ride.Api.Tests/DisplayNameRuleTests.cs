// Direct test of a rule with a table of cases
// Traces to: L2-005 AC2
// Description: a display name is 2 to 24 characters after trimming, made of letters, digits, spaces, . _ and -.
using Telo.Ride.Domain;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Api.Tests;

public sealed class DisplayNameRuleTests
{
    [Theory]
    [InlineData("Sam", "Sam")]
    [InlineData("  Sam  ", "Sam")]
    [InlineData("Al", "Al")]
    [InlineData("Sam R.", "Sam R.")]
    [InlineData("sam_rider-7", "sam_rider-7")]
    [InlineData("Zoë Ångström", "Zoë Ångström")]
    [InlineData("早川 さくら", "早川 さくら")]
    [InlineData("abcdefghijklmnopqrstuvwx", "abcdefghijklmnopqrstuvwx")]
    public void A_name_within_the_rule_is_kept_trimmed(string raw, string kept) =>
        Assert.Equal(kept, DisplayName.Parse(raw).Value);

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("S")]
    [InlineData(" S ")]
    [InlineData("abcdefghijklmnopqrstuvwxy")]
    [InlineData("<Sam>")]
    [InlineData("Sam!")]
    [InlineData("sam@example.com")]
    [InlineData("Sam\tR")]
    [InlineData("Sam 🚴")]
    public void A_name_outside_the_rule_is_refused(string? raw)
    {
        var refused = Assert.Throws<DomainRuleException>(() => DisplayName.Parse(raw));

        Assert.Equal("display_name_invalid", refused.Code);
        Assert.Equal(RuleKind.Invalid, refused.Kind);
    }
}
