namespace Telo.Ride.Domain.Maps;

/// <summary>A finished race on a map: whom it was against, the bots' pack strength, the place and the finish time.</summary>
public sealed record RaceFinish(string Mode, string? Pack, int Place, int Seconds);

/// <summary>What one finish did on its map: the stars it earned, the best time after it and before it, and whether it set a new best.</summary>
public sealed record FinishRecord(MapStar Earned, int BestSeconds, int? PreviousBestSeconds, bool IsNewBest);
