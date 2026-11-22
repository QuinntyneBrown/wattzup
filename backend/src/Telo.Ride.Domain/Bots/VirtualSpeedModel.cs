namespace Telo.Ride.Domain.Bots;

/// <summary>
/// A race's virtual speed from power, the Ride app's (virtual-speed-model.ts): 10 × ∛(max(W, 1) ÷ 20) km/h, so 371 W
/// rides at 26.5 km/h (L2-059 AC3). The service rides a riders-online race's bots on it (L2-123 AC4).
/// </summary>
public static class VirtualSpeedModel
{
    public static double SpeedKmh(double watts) => 10 * Math.Cbrt(Math.Max(watts, 1) / 20);

    /// <summary>The same speed in metres a second, which a bot's distance steps by.</summary>
    public static double SpeedMs(double watts) => SpeedKmh(watts) / 3.6;
}
