// Direct test of a rule with a table of cases
// Traces to: L2-037 AC1 to AC7
// Description: a ride's XP lines, in order: "Finished" +100; "{place} of {field}" +(field − place) × 20 and, for places
// 1 to 3, "Podium" +75 when the ride has places and the field more than 2 riders; "{p}% on target" +round(p × 0.8);
// "{n}-day streak" +n × 10 when n > 0. A solo race or a class has no place lines; a DNF or a discarded ride earns none.
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Api.Tests;

public sealed class XpCalculatorTests
{
    private static RideResult Bots(int place, int field, double onTarget = 0.84) =>
        new(RideKind.Race, "bots", RideOutcome.Finished, place, field, onTarget);

    private static string[] Lines(RideResult result, int streakDays = 0) =>
        [.. XpCalculator.Compute(result, streakDays).Select(line => $"{line.Label} +{line.Xp}")];

    [Fact]
    public void The_worked_example_earns_442() // AC5
    {
        var lines = XpCalculator.Compute(Bots(2, 10), streakDays: 4);

        Assert.Equal(["Finished +100", "2 of 10 +160", "Podium +75", "84% on target +67", "4-day streak +40"],
            lines.Select(line => $"{line.Label} +{line.Xp}"));
        Assert.Equal(442, lines.Sum(line => line.Xp));
        Assert.Equal([XpLineKind.Finished, XpLineKind.Place, XpLineKind.Podium, XpLineKind.OnTarget, XpLineKind.Streak],
            lines.Select(line => line.Kind));
    }

    [Theory] // AC1, AC3
    [InlineData(0.0, "0% on target +0")]
    [InlineData(0.5, "50% on target +40")]
    [InlineData(0.814, "81% on target +65")]
    [InlineData(1.0, "100% on target +80")]
    public void A_finished_ride_earns_100_and_its_time_on_target(double share, string onTarget) =>
        Assert.Equal(["Finished +100", onTarget], Lines(new RideResult(RideKind.Class, null, RideOutcome.Finished, null, null, share)));

    [Theory] // AC2
    [InlineData(1, 10, new[] { "1 of 10 +180", "Podium +75" })]
    [InlineData(3, 10, new[] { "3 of 10 +140", "Podium +75" })]
    [InlineData(4, 10, new[] { "4 of 10 +120" })]
    [InlineData(10, 10, new[] { "10 of 10 +0" })]
    [InlineData(3, 3, new[] { "3 of 3 +0", "Podium +75" })]
    public void A_bots_race_of_more_than_two_earns_its_place_and_a_podium(int place, int field, string[] placeLines) =>
        Assert.Equal(["Finished +100", .. placeLines, "84% on target +67"], Lines(Bots(place, field)));

    [Fact] // AC2: a field of 2 has no place lines
    public void A_field_of_two_has_no_place_lines() =>
        Assert.Equal(["Finished +100", "84% on target +67"], Lines(Bots(1, 2)));

    [Theory] // AC4
    [InlineData(0, null)]
    [InlineData(1, "1-day streak +10")]
    [InlineData(12, "12-day streak +120")]
    public void A_streak_of_n_days_earns_n_times_10(int days, string? streak) =>
        Assert.Equal(streak is null ? ["Finished +100", "50% on target +40"] : ["Finished +100", "50% on target +40", streak],
            Lines(new RideResult(RideKind.Class, null, RideOutcome.Finished, null, null, 0.5), days));

    [Fact] // AC6
    public void A_solo_race_has_no_place_or_podium_line() =>
        Assert.Equal(["Finished +100", "84% on target +67"],
            Lines(new RideResult(RideKind.Race, "solo", RideOutcome.Finished, 1, 2, 0.84)));

    [Fact] // AC6
    public void A_class_has_no_place_or_podium_line() =>
        Assert.Equal(["Finished +100", "84% on target +67"],
            Lines(new RideResult(RideKind.Class, null, RideOutcome.Finished, 1, 10, 0.84)));

    [Theory] // AC7
    [InlineData(RideOutcome.Dnf)]
    [InlineData(RideOutcome.Discarded)]
    public void A_ride_that_did_not_finish_earns_nothing(RideOutcome outcome) =>
        Assert.Empty(XpCalculator.Compute(new RideResult(RideKind.Race, "bots", outcome, 2, 10, 0.84), streakDays: 4));
}
