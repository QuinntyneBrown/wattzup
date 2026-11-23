namespace Telo.Ride.Domain.Rides;

/// <summary>The rider's calendar day: an instant as a date in an IANA time zone, midnight to midnight (L2-042 AC1).</summary>
public static class RiderDay
{
    public static DateOnly LocalDay(DateTimeOffset instant, string timeZoneId) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(instant, TimeZoneInfo.FindSystemTimeZoneById(timeZoneId)).DateTime);
}
