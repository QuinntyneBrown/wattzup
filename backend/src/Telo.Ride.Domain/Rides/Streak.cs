namespace Telo.Ride.Domain.Rides;

/// <summary>
/// A rider's streak (L2-042): the consecutive calendar days, ending on <see cref="LastRideDay"/>, each with a finished
/// ride. It reads as it is while that day is today or yesterday, and 0 once a whole day has passed with no ride.
/// </summary>
public sealed record Streak(int Days, DateOnly? LastRideDay)
{
    /// <summary>
    /// The streak once a ride finished on <paramref name="day"/>: the same for a second ride that day or a ride on an
    /// earlier day (one submitted late), one more for the next day, and 1 after a gap (AC1, AC3).
    /// </summary>
    public Streak Record(DateOnly day) => LastRideDay switch
    {
        { } last when day <= last => this,
        { } last when day == last.AddDays(1) => new(Days + 1, day),
        _ => new(1, day),
    };

    /// <summary>The streak as it reads on <paramref name="today"/> (AC2).</summary>
    public int DaysOn(DateOnly today) =>
        LastRideDay is { } last && today <= last.AddDays(1) ? Days : 0;
}
