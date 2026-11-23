using System.Numerics;

namespace Telo.Ride.Domain.Maps;

/// <summary>
/// Which maps a recorded ride opens (L2-040): a locked map not yet opened whose goal the ride meets. A top-3 finish
/// against bots on the goal's map, at any pack (AC2); the stars now held on the goal's map (AC3); or the rider's level
/// after the ride, so a class can open a map too (AC4). A map open from the start never opens.
/// </summary>
public static class UnlockRules
{
    /// <summary>
    /// The maps the ride opens, in unlock order (<paramref name="order"/>): the race's map and finish, none for a class,
    /// the stars the rider holds on each map after the ride, the level after it and the maps already opened.
    /// </summary>
    public static IReadOnlyList<string> Evaluate(
        IReadOnlyList<(string MapId, MapUnlock Unlock)> order,
        string? raceMapId,
        RaceFinish? finish,
        IReadOnlyDictionary<string, MapStar> stars,
        int level,
        IReadOnlySet<string> opened) =>
        order
            .Where(map => !opened.Contains(map.MapId) && Meets(map.Unlock, raceMapId, finish, stars, level))
            .Select(map => map.MapId)
            .ToList();

    /// <summary>
    /// The next unlock (L2-041 AC1): the first locked map in unlock order whose goal the rider can work on now, its
    /// prerequisite map open or its goal a level; none once every map is open.
    /// </summary>
    /// <summary>
    /// The map Home's Next ride card offers (L2-033 AC2 to AC5): for a top-3 or a stars goal, the map the next unlock's goal
    /// is earned on; for a level goal, the most recently opened map; with every map open, the open map with the fewest
    /// stars, the first in unlock order on a tie.
    /// </summary>
    public static string NextRide(
        IReadOnlyList<(string MapId, MapUnlock Unlock)> order,
        IReadOnlyDictionary<string, DateTimeOffset> openedAt,
        IReadOnlyDictionary<string, int> stars)
    {
        var next = NextUnlock(order, openedAt.Keys.ToHashSet());
        if (next is null)
        {
            return order.MinBy(map => stars.GetValueOrDefault(map.MapId)).MapId;
        }

        var goal = order.First(map => map.MapId == next).Unlock;
        if (goal.Kind != MapUnlock.LevelKind)
        {
            return goal.MapId!;
        }

        return openedAt.Count > 0
            ? openedAt.MaxBy(opened => opened.Value).Key
            : order.Last(map => map.Unlock.Kind == MapUnlock.Start).MapId;
    }

    public static string? NextUnlock(IReadOnlyList<(string MapId, MapUnlock Unlock)> order, IReadOnlySet<string> opened)
    {
        bool IsOpen(string mapId) =>
            opened.Contains(mapId) || order.Any(map => map.MapId == mapId && map.Unlock.Kind == MapUnlock.Start);

        return order
            .Where(map => !IsOpen(map.MapId))
            .Where(map => map.Unlock.Kind == MapUnlock.LevelKind || IsOpen(map.Unlock.MapId!))
            .Select(map => map.MapId)
            .FirstOrDefault();
    }

    private static bool Meets(
        MapUnlock unlock, string? raceMapId, RaceFinish? finish, IReadOnlyDictionary<string, MapStar> stars, int level) =>
        unlock.Kind switch
        {
            MapUnlock.TopThree => raceMapId == unlock.MapId && finish is { Mode: "bots", Place: <= 3 },
            MapUnlock.StarsKind => stars.TryGetValue(unlock.MapId!, out var held)
                && BitOperations.PopCount((uint)held) >= unlock.Stars,
            MapUnlock.LevelKind => level >= unlock.Level,
            _ => false,
        };
}
