// Direct test of a rule with a table of cases
// Traces to: L2-001 AC3, AC6
// Description: an address is kept trimmed with its domain lower-cased and its local part as typed; one that is not an
// address is refused with invalid_email. One case per row.
using Telo.Ride.Domain;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Api.Tests;

public sealed class EmailAddressTests
{
    [Theory]
    [InlineData("rider@example.com", "rider@example.com")]
    [InlineData("  rider@example.com\t", "rider@example.com")]
    [InlineData("Rider@Example.COM", "Rider@example.com")]
    [InlineData("first.last+ride@Sub.Example.Org", "first.last+ride@sub.example.org")]
    public void An_address_is_kept_trimmed_with_its_domain_lower_cased(string typed, string kept) =>
        Assert.Equal(kept, EmailAddress.Parse(typed).Value);

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("rider")]
    [InlineData("rider@example")]
    [InlineData("rider.example.com")]
    [InlineData("rider @example.com")]
    [InlineData("rider@exa mple.com")]
    [InlineData("@example.com")]
    public void Anything_else_is_refused_with_invalid_email(string typed)
    {
        var refused = Assert.Throws<DomainRuleException>(() => EmailAddress.Parse(typed));
        Assert.Equal("invalid_email", refused.Code);
    }
}
