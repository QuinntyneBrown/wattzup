namespace Telo.Ride.Domain.Bots;

/// <summary>A bot's own pace: its steady drift and its swing's size, period and phase (L2-067 AC1).</summary>
public sealed record BotPace(string Name, double Base, double Drift, double Swing, double Period, double Phase);

/// <summary>
/// The pace model (L2-067 AC1, L2-123 AC4), the service's copy of the Ride app's <c>BotPaceModel</c>: each bot rides
/// <c>base + drift + swing × sin(2πt ÷ period + phase)</c> watts, its drift within ±12 % of the pack's base, its swing
/// 4 to 10 % of it over 45 to 150 seconds. The draws come from a generator seeded with "seed:pack", nine bots in the
/// list's order. Both copies run one table of cases in their unit tests, so they stay equal.
/// </summary>
public static class BotPaceModel
{
    /// <summary>The bot list, in the order they are drawn.</summary>
    public static readonly IReadOnlyList<string> Names = ["Nova", "Rook", "Juno", "Atlas", "Kite", "Vale", "Moss", "Flint", "Echo"];

    /// <summary>The pack strength's base power in watts.</summary>
    public static double BaseWatts(string pack) => pack switch
    {
        "easy" => 130,
        "medium" => 190,
        "hard" => 250,
        _ => throw new ArgumentOutOfRangeException(nameof(pack), pack, "Not a pack strength"),
    };

    public static IReadOnlyList<BotPace> Paces(string seed, string pack)
    {
        var random = new SeededRandom(SeededRandom.Fnv1a($"{seed}:{pack}"));
        var @base = BaseWatts(pack);
        return
        [
            .. Names.Select(name => new BotPace(
                name,
                @base,
                Drift: @base * random.Between(-0.12, 0.12),
                Swing: @base * random.Between(0.04, 0.1),
                Period: random.Between(45, 150),
                Phase: random.Between(0, 2 * Math.PI))),
        ];
    }

    /// <summary>The bot's power in watts at second <paramref name="second"/> of its ride.</summary>
    public static double Watts(BotPace pace, double second) =>
        pace.Base + pace.Drift + (pace.Swing * Math.Sin((2 * Math.PI * second / pace.Period) + pace.Phase));
}
