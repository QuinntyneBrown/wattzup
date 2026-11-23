namespace Telo.Ride.Domain.Maps;

/// <summary>The three stars of a map (L2-039), as flags: the stars a rider holds, or those one finish earned.</summary>
[Flags]
public enum MapStar
{
    None = 0,

    /// <summary>"Finish the race".</summary>
    Finish = 1,

    /// <summary>"Top 3 against the medium pack".</summary>
    TopThree = 2,

    /// <summary>"Beat your best time".</summary>
    BeatBest = 4,

    All = Finish | TopThree | BeatBest,
}
