// Acceptance test
// Traces to: L2-001 AC2, AC3, AC4, AC5, AC6; L2-003 AC1, AC2, AC4, AC5
// Description: a rider asks for a sign-in code by email. The API answers 202 whether or not the
// address has an account, mails six digits to the normalised address, refuses a malformed address,
// refuses a second code inside 30 seconds, and limits codes to 5 an hour per address and 20 an hour
// per network address, each refusal a 429 with Retry-After. A code that could not be sent is not kept.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Telo.Ride.Api.Tests;

public sealed class SignInCodeTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<HttpResponseMessage> RequestCode(string email)
    {
        using var client = api.CreateClient();
        return await client.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
    }

    private static async Task<string?> CodeOf(HttpResponseMessage response)
    {
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel));
        return problem.RootElement.TryGetProperty("code", out var code) ? code.GetString() : null;
    }

    /// <summary>Moves past every earlier test's hour, so each test starts with no codes counted against it.</summary>
    private void StartAfresh() => api.Clock.Advance(TimeSpan.FromHours(2));

    [Fact]
    public async Task A_code_is_six_digits_mailed_to_the_normalised_address_with_202_and_no_body()
    {
        StartAfresh();

        using var response = await RequestCode("  Ada.Rider@Example.COM ");

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(string.Empty, await response.Content.ReadAsStringAsync(Cancel));
        var sent = Assert.Single(api.Mailbox.Sent, code => code.Email.StartsWith("Ada.Rider", StringComparison.Ordinal));
        Assert.Equal("Ada.Rider@example.com", sent.Email);
        Assert.Matches("^[0-9]{6}$", sent.Code);
    }

    [Fact]
    public async Task An_address_with_no_account_gets_the_same_answer_as_any_other()
    {
        StartAfresh();

        using var first = await RequestCode("first-time@example.com");
        using var again = await RequestCode("someone-else@example.com");

        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.Equal(first.StatusCode, again.StatusCode);
        Assert.Equal(await first.Content.ReadAsStringAsync(Cancel), await again.Content.ReadAsStringAsync(Cancel));
    }

    [Theory]
    [InlineData("rider@example")]
    [InlineData("rider.example.com")]
    [InlineData("rider @example.com")]
    [InlineData("")]
    public async Task A_malformed_address_is_refused_with_invalid_email_and_nothing_is_mailed(string email)
    {
        StartAfresh();
        var before = api.Mailbox.Sent.Count;

        using var response = await RequestCode(email);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_email", await CodeOf(response));
        Assert.Equal(before, api.Mailbox.Sent.Count);
    }

    [Fact]
    public async Task A_second_code_inside_30_seconds_is_refused_and_one_after_it_is_sent()
    {
        StartAfresh();
        using var first = await RequestCode("again@example.com");

        api.Clock.Advance(TimeSpan.FromSeconds(20));
        using var tooSoon = await RequestCode("again@example.com");

        Assert.Equal(HttpStatusCode.TooManyRequests, tooSoon.StatusCode);
        Assert.Equal("resend_too_soon", await CodeOf(tooSoon));
        Assert.Equal(TimeSpan.FromSeconds(10), tooSoon.Headers.RetryAfter?.Delta);

        api.Clock.Advance(TimeSpan.FromSeconds(10));
        using var resent = await RequestCode("again@example.com");

        Assert.Equal(HttpStatusCode.Accepted, resent.StatusCode);
        Assert.Equal(2, api.Mailbox.Sent.Count(code => code.Email == "again@example.com"));
    }

    [Fact]
    public async Task A_code_that_could_not_be_sent_is_not_kept_so_the_rider_can_ask_again_at_once()
    {
        StartAfresh();
        api.Mailbox.Unreachable = true;
        using var failed = await RequestCode("unlucky@example.com");
        api.Mailbox.Unreachable = false;

        Assert.Equal(HttpStatusCode.InternalServerError, failed.StatusCode);
        Assert.Equal("unexpected", await CodeOf(failed));

        using var again = await RequestCode("unlucky@example.com");

        Assert.Equal(HttpStatusCode.Accepted, again.StatusCode);
        Assert.Single(api.Mailbox.Sent, code => code.Email == "unlucky@example.com");
    }
}

public sealed class SignInPerAddressLimitTests(SignInPerAddressApi api) : IClassFixture<SignInPerAddressApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<HttpResponseMessage> RequestCode(string email)
    {
        using var client = api.CreateClient();
        return await client.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
    }

    [Fact]
    public async Task A_sixth_code_for_one_address_within_an_hour_is_refused_until_the_first_is_an_hour_old()
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var before = api.Mailbox.Sent.Count;
        for (var sent = 0; sent < 5; sent++)
        {
            using var accepted = await RequestCode("busy@example.com");
            Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
            api.Clock.Advance(TimeSpan.FromMinutes(1));
        }

        using var sixth = await RequestCode(" busy@EXAMPLE.com ");

        Assert.Equal(HttpStatusCode.TooManyRequests, sixth.StatusCode);
        using var problem = JsonDocument.Parse(await sixth.Content.ReadAsStringAsync(Cancel));
        Assert.Equal("rate_limited", problem.RootElement.GetProperty("code").GetString());
        Assert.Equal(TimeSpan.FromMinutes(55), sixth.Headers.RetryAfter?.Delta);
        Assert.Equal(before + 5, api.Mailbox.Sent.Count);

        api.Clock.Advance(TimeSpan.FromMinutes(55));
        using var later = await RequestCode("busy@example.com");

        Assert.Equal(HttpStatusCode.Accepted, later.StatusCode);
    }

    [Fact]
    public async Task More_than_20_codes_from_one_network_address_within_an_hour_are_refused()
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        for (var rider = 0; rider < 20; rider++)
        {
            using var accepted = await RequestCode($"rider{rider}@example.com");
            Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        }

        using var another = await RequestCode("rider20@example.com");

        Assert.Equal(HttpStatusCode.TooManyRequests, another.StatusCode);
        using var problem = JsonDocument.Parse(await another.Content.ReadAsStringAsync(Cancel));
        Assert.Equal("rate_limited", problem.RootElement.GetProperty("code").GetString());
        Assert.Equal(TimeSpan.FromHours(1), another.Headers.RetryAfter?.Delta);
    }
}
