namespace Telo.Ride.Domain.Maps;

/// <summary>
/// How a map opens (L2-040): from the start, by a top-3 finish in a bots race on another map, by stars on another map,
/// or at a rider level. Each locked map shows its one goal (AC6), written here so every screen reads the same words.
/// </summary>
public sealed record MapUnlock(string Kind, string? MapId, int? Stars, int? Level)
{
    public const string Start = "start";
    public const string TopThree = "top-three-vs-bots";
    public const string StarsKind = "stars";
    public const string LevelKind = "level";

    public static MapUnlock FromTheStart { get; } = new(Start, null, null, null);

    public static MapUnlock TopThreeVsBots(string mapId) => new(TopThree, mapId, null, null);

    public static MapUnlock StarsOn(string mapId, int stars) => new(StarsKind, mapId, stars, null);

    public static MapUnlock RiderLevel(int level) => new(LevelKind, null, null, level);

    /// <summary>The goal a locked map shows, naming the map the rule names by <paramref name="names"/>; none for a map open from the start.</summary>
    public string? Goal(IReadOnlyDictionary<string, string> names) => Kind switch
    {
        TopThree => $"Finish top 3 vs Bots on {names[MapId!]}",
        StarsKind => $"Earn {Stars}★ on {names[MapId!]}",
        LevelKind => $"Reach rider level {Level}",
        _ => null,
    };
}
