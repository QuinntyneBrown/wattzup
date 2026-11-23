// Unit test
// Traces to: L2-067 AC1; L2-123 AC4
// Description: the service's pace model rides each bot around the pack strength with its own drift and swing, drawn
// from the same seeded generator as the Ride app's. The table of cases is the one bot-pace-model.spec.ts runs, so the
// two copies stay equal.
using Telo.Ride.Domain.Bots;

namespace Telo.Ride.Api.Tests;

public sealed class BotPaceModelTests
{
    [Theory]
    [InlineData("dolomites", "hard", 0, 0, 229.829039)]
    [InlineData("dolomites", "hard", 3, 17, 264.577138)]
    [InlineData("dolomites", "hard", 8, 599, 261.017859)]
    [InlineData("hiit-cardio-30@20261121T0730Z", "easy", 0, 0, 126.067407)]
    [InlineData("hiit-cardio-30@20261121T0730Z", "easy", 3, 17, 112.148245)]
    [InlineData("hiit-cardio-30@20261121T0730Z", "easy", 8, 599, 127.386707)]
    public void Each_bot_rides_the_power_the_Ride_app_draws_for_the_same_seed(string seed, string pack, int bot, int second, double watts) =>
        Assert.Equal(watts, BotPaceModel.Watts(BotPaceModel.Paces(seed, pack)[bot], second), 6);

    [Theory]
    [InlineData("easy", 130)]
    [InlineData("medium", 190)]
    [InlineData("hard", 250)]
    public void Every_bot_rides_within_its_drift_and_swing_of_the_pack(string pack, double @base)
    {
        var paces = BotPaceModel.Paces("hiit-cardio-30@20261121T0730Z", pack);

        Assert.Equal(BotPaceModel.Names, paces.Select(pace => pace.Name));
        Assert.All(paces, pace =>
        {
            Assert.InRange(pace.Drift, -0.12 * @base, 0.12 * @base);
            Assert.InRange(pace.Swing, 0.04 * @base, 0.1 * @base);
            Assert.InRange(pace.Period, 45, 150);
        });
    }
}
