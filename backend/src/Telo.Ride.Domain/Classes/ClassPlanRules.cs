namespace Telo.Ride.Domain.Classes;

/// <summary>
/// What makes a class servable (L2-080 AC2, AC4, L2-043 AC1; ADR 0028): a YouTube video id, a tier, a sync offset of 0 or more, at least one
/// segment, each of a known kind, lasting over 0 seconds at a level of 1 to 32, and a plan that totals the class length.
/// </summary>
public static class ClassPlanRules
{
    public const int LowestLevel = 1;
    public const int HighestLevel = 32;

    private static readonly HashSet<string> Kinds = ["warm-up", "work", "recover", "steady", "cool-down"];

    /// <summary>The first rule the class breaks, in words for the log, or <c>null</c> when it may be served.</summary>
    public static string? BrokenRule(ClassDefinition definition)
    {
        if (!IsYouTubeId(definition.VideoId)) return "the video id is not a YouTube id";
        if (!ClassTierRules.IsTier(definition.OpensAtLevel)) return "the tier is not 1, 5, 10 or 20";
        if (definition.SyncOffsetSeconds < 0) return "the sync offset is below 0";
        if (definition.Segments.Count == 0) return "the plan has no segment";
        if (definition.Segments.Any(s => !Kinds.Contains(s.Kind)))
            return "a segment's kind is not one of warm-up, work, recover, steady or cool-down";
        if (definition.Segments.Any(s => s.Duration <= 0)) return "a segment lasts 0 seconds or less";
        if (definition.Segments.Any(s => s.Level is < LowestLevel or > HighestLevel))
            return $"a segment level is outside {LowestLevel} to {HighestLevel}";
        var total = definition.Segments.Sum(s => s.Duration);
        return total == definition.LengthSeconds ? null : $"the plan totals {total} s, not {definition.LengthSeconds} s";
    }

    /// <summary>Eleven characters from A–Z, a–z, 0–9, '_' and '-': the cover URL is built from it (ADR 0014).</summary>
    private static bool IsYouTubeId(string videoId) =>
        videoId.Length == 11 && videoId.All(c => char.IsAsciiLetterOrDigit(c) || c is '_' or '-');
}
