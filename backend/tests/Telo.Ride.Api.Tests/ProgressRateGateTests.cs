// Unit test
// Traces to: L2-130 AC2
// Description: the gate's answers, one case per pattern of messages: each row is the messages sent in each second, in
// turn, and the answer to the last of them.
using Microsoft.Extensions.Time.Testing;
using Telo.Ride.Api.Hubs;

namespace Telo.Ride.Api.Tests;

public sealed class ProgressRateGateTests
{
    [Theory]
    [InlineData(new[] { 1 }, "Admit")]
    [InlineData(new[] { 2 }, "Admit")]
    [InlineData(new[] { 3 }, "Drop")]
    [InlineData(new[] { 3, 1 }, "Admit")]
    [InlineData(new[] { 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 }, "Drop")]
    [InlineData(new[] { 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 }, "Disconnect")]
    [InlineData(new[] { 3, 3, 3, 3, 3, 3, 3, 3, 2, 3, 3, 3 }, "Drop")]
    [InlineData(new[] { 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3 }, "Drop")]
    [InlineData(new[] { 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 }, "Admit")]
    public void Answers_the_last_message(int[] perSecond, string expected)
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 11, 22, 7, 0, 0, TimeSpan.Zero));
        var gate = new ProgressRateGate(clock);
        var last = GateDecision.Admit;

        foreach (var messages in perSecond)
        {
            for (var message = 0; message < messages; message++) last = gate.Admit();
            clock.Advance(TimeSpan.FromSeconds(1));
        }

        Assert.Equal(expected, last.ToString());
    }

    [Fact]
    public void A_client_over_the_limit_after_a_quiet_spell_starts_its_ten_seconds_again()
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 11, 22, 7, 0, 0, TimeSpan.Zero));
        var gate = new ProgressRateGate(clock);
        for (var second = 0; second < 9; second++)
        {
            for (var message = 0; message < 3; message++) gate.Admit();
            clock.Advance(TimeSpan.FromSeconds(1));
        }

        clock.Advance(TimeSpan.FromSeconds(5));
        for (var message = 0; message < 3; message++) gate.Admit();
        clock.Advance(TimeSpan.FromSeconds(1));

        Assert.Equal(GateDecision.Admit, gate.Admit());
        Assert.Equal(GateDecision.Admit, gate.Admit());
        Assert.Equal(GateDecision.Drop, gate.Admit());
    }
}
