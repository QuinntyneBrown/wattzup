namespace Telo.Ride.Domain.Bots;

/// <summary>
/// A deterministic generator (Mulberry32), seeded with the FNV-1a hash of a text: the same seed draws the same numbers
/// in the same order, so the same session replays the same way (L2-067 AC1). It matches the Ride app's
/// <c>SeededRandom</c> and <c>fnv1a</c> bit for bit, so a bot rides the same in the browser and on the service.
/// </summary>
public sealed class SeededRandom(uint seed)
{
    private uint state = seed;

    /// <summary>The FNV-1a hash of the text's UTF-16 code units, as the Ride app hashes it.</summary>
    public static uint Fnv1a(string text)
    {
        var hash = 0x811c9dc5u;
        foreach (var unit in text)
        {
            hash ^= unit;
            hash = unchecked(hash * 0x01000193u);
        }

        return hash;
    }

    /// <summary>A number in [0, 1).</summary>
    public double Next()
    {
        state = unchecked(state + 0x6d2b79f5u);
        var t = state;
        t = unchecked((t ^ (t >> 15)) * (t | 1u));
        t ^= unchecked(t + ((t ^ (t >> 7)) * (t | 61u)));
        return (t ^ (t >> 14)) / 4294967296.0;
    }

    /// <summary>A number in [min, max).</summary>
    public double Between(double min, double max) => min + ((max - min) * Next());
}
