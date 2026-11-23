// Direct test of a rule with a table of cases
// Traces to: L2-002 AC4, AC6; L2-003 AC3
// Description: checking a code, one case per row: right, wrong, past 10 minutes, after five wrong codes, used.
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Api.Tests;

public sealed class SignInCodeRulesTests
{
    private static readonly DateTimeOffset Issued = new(2026, 11, 21, 7, 0, 0, TimeSpan.Zero);

    private static SignInCode Code() =>
        SignInCode.Issue(EmailAddress.Parse("rider@example.com"), "code-hash", "network-hash", Issued);

    [Theory]
    [InlineData(true, 0, CodeCheck.Matched)]
    [InlineData(false, 0, CodeCheck.Mismatch)]
    [InlineData(true, 600, CodeCheck.Matched)]
    [InlineData(true, 601, CodeCheck.Expired)]
    [InlineData(false, 601, CodeCheck.Expired)]
    public void A_code_works_for_10_minutes(bool matches, int secondsLater, CodeCheck found) =>
        Assert.Equal(found, Code().Verify(matches, Issued.AddSeconds(secondsLater)));

    [Theory]
    [InlineData(4, true, CodeCheck.Matched)]
    [InlineData(4, false, CodeCheck.Mismatch)]
    [InlineData(5, true, CodeCheck.Locked)]
    [InlineData(5, false, CodeCheck.Locked)]
    public void After_five_wrong_codes_even_the_right_one_is_refused(int wrong, bool matches, CodeCheck found)
    {
        var code = Code();
        for (var attempt = 0; attempt < wrong; attempt++)
        {
            Assert.Equal(CodeCheck.Mismatch, code.Verify(false, Issued));
        }

        Assert.Equal(found, code.Verify(matches, Issued));
    }

    [Fact]
    public void A_used_code_stays_used()
    {
        var code = Code();
        Assert.Equal(CodeCheck.Matched, code.Verify(true, Issued));

        Assert.Equal(CodeCheck.Used, code.Verify(true, Issued.AddSeconds(1)));
    }
}
