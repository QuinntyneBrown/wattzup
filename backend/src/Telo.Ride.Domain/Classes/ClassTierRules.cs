namespace Telo.Ride.Domain.Classes;

/// <summary>The rider levels a class may open at, its tiers (L2-043 AC1).</summary>
public static class ClassTierRules
{
    public static readonly IReadOnlyList<int> Tiers = [1, 5, 10, 20];

    public static bool IsTier(int level) => Tiers.Contains(level);
}
