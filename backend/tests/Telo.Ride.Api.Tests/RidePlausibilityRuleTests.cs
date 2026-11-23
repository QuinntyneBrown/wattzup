// Direct test of a rule with a table of cases
// Traces to: L2-125 AC2
// Description: a ride is plausible unless its power passes 2,000 W, its speed passes 100 km/h, its distance disagrees
// with the sum of its per-second speed samples by more than 5 %, or a race is finished faster than its distance
// allows at 100 km/h.
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Api.Tests;

public sealed class RidePlausibilityRuleTests
{
    /// <summary>A ride of these seconds at one speed, covering exactly the distance its samples add up to.</summary>
    private static RideFacts Steady(int seconds, double kmh, int maxPowerWatts = 300) =>
        new(seconds, seconds * kmh / 3.6, maxPowerWatts, kmh, [.. Enumerable.Repeat(kmh, seconds)]);

    [Theory]
    [InlineData(2000, true)]
    [InlineData(2001, false)]
    public void Power_up_to_2000_W_is_plausible(int maxPowerWatts, bool plausible) =>
        Assert.Equal(plausible, RidePlausibilityRule.IsPlausible(Steady(600, 30, maxPowerWatts), raceMeters: null));

    [Theory]
    [InlineData(100.0, true)]
    [InlineData(100.1, false)]
    public void A_top_speed_up_to_100_kmh_is_plausible(double maxSpeedKmh, bool plausible) =>
        Assert.Equal(plausible, RidePlausibilityRule.IsPlausible(Steady(600, 30) with { MaxSpeedKmh = maxSpeedKmh }, null));

    [Theory]
    [InlineData(100.0, true)]
    [InlineData(100.1, false)]
    public void Every_second_up_to_100_kmh_is_plausible(double fastestSecondKmh, bool plausible)
    {
        var ride = Steady(600, 30);
        var samples = ride.SpeedSamplesKmh.ToArray();
        samples[300] = fastestSecondKmh;
        var faster = ride with { SpeedSamplesKmh = samples, DistanceMeters = samples.Sum() / 3.6 };

        Assert.Equal(plausible, RidePlausibilityRule.IsPlausible(faster, null));
    }

    [Theory]
    [InlineData(1.00, true)]
    [InlineData(1.05, true)]
    [InlineData(0.95, true)]
    [InlineData(1.06, false)]
    [InlineData(0.94, false)]
    public void A_distance_within_5_percent_of_the_speed_samples_is_plausible(double ofTheSamples, bool plausible)
    {
        var ride = Steady(600, 30);

        Assert.Equal(plausible, RidePlausibilityRule.IsPlausible(ride with { DistanceMeters = ride.DistanceMeters * ofTheSamples }, null));
    }

    [Fact]
    public void A_ride_with_no_distance_and_no_samples_is_plausible() =>
        Assert.True(RidePlausibilityRule.IsPlausible(new RideFacts(1200, 0, 380, 0, []), null));

    [Fact]
    public void A_distance_with_no_samples_is_not_plausible() =>
        Assert.False(RidePlausibilityRule.IsPlausible(new RideFacts(1200, 500, 380, 0, []), null));

    [Theory]
    // 10 km at 100 km/h takes 360 s.
    [InlineData(360, true)]
    [InlineData(359, false)]
    public void A_race_is_not_finished_faster_than_its_distance_allows_at_100_kmh(int seconds, bool plausible) =>
        Assert.Equal(plausible, RidePlausibilityRule.IsPlausible(Steady(seconds, 100), raceMeters: 10_000));
}
