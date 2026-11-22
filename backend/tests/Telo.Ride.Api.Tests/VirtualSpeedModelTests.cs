// Unit test
// Traces to: L2-059 AC3; L2-123 AC4
// Description: the service rides a race's bots at the Ride app's virtual speed, 10 × ∛(W ÷ 20) km/h with power taken as
// at least 1 W. The table of cases and its tolerance (under 0.005 km/h) are the ones virtual-speed-model.spec.ts runs,
// so the two copies stay equal.
using Telo.Ride.Domain.Bots;

namespace Telo.Ride.Api.Tests;

public sealed class VirtualSpeedModelTests
{
    [Theory]
    [InlineData(371, 26.47)]
    [InlineData(418, 27.545)]
    [InlineData(160, 20)]
    [InlineData(20, 10)]
    [InlineData(0, 3.684)]
    [InlineData(-5, 3.684)]
    public void Power_rides_at_the_Ride_app_virtual_speed(double watts, double kmh) =>
        Assert.Equal(kmh, VirtualSpeedModel.SpeedKmh(watts), 0.005);

    [Fact]
    public void It_gives_the_same_speed_in_metres_a_second() =>
        Assert.Equal(20 / 3.6, VirtualSpeedModel.SpeedMs(160), 6);
}
