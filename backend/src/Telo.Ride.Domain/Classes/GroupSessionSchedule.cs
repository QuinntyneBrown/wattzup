using System.Globalization;

namespace Telo.Ride.Domain.Classes;

/// <summary>
/// When each open class's group sessions start (L2-083 AC1, L2-122 AC1): one every 15 minutes on the quarter hours,
/// UTC, each seating up to 10 riders. A session can be joined until it starts, so the next one starts after now.
/// </summary>
public static class GroupSessionSchedule
{
    public const int Capacity = 10;

    public static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    /// <summary>The starts of the next <paramref name="count"/> sessions after <paramref name="now"/>.</summary>
    public static IReadOnlyList<DateTimeOffset> Next(DateTimeOffset now, int count)
    {
        var utc = now.ToUniversalTime();
        var quarter = new DateTimeOffset(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute / 15 * 15, 0, TimeSpan.Zero);
        var first = quarter + Interval;
        return [.. Enumerable.Range(0, count).Select(i => first + (Interval * i))];
    }

    /// <summary>
    /// Reads a session's class and start from its id; false for an id that names no slot of the schedule, such as one
    /// whose start is not on a quarter hour.
    /// </summary>
    public static bool TryParse(string sessionId, out string classId, out DateTimeOffset start)
    {
        classId = string.Empty;
        start = default;
        var at = sessionId.LastIndexOf('@');
        if (at <= 0)
            return false;
        if (!DateTimeOffset.TryParseExact(
                sessionId[(at + 1)..], "yyyyMMdd'T'HHmm'Z'", CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed)
            || parsed.Minute % 15 != 0)
            return false;
        (classId, start) = (sessionId[..at], parsed);
        return true;
    }

    /// <summary>A session's id, from its class and its start: two riders asking for the same slot reach the same session.</summary>
    public static string SessionId(string classId, DateTimeOffset start) =>
        $"{classId}@{start.ToUniversalTime().ToString("yyyyMMdd'T'HHmm'Z'", CultureInfo.InvariantCulture)}";
}
