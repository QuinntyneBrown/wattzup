using System.Numerics;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application.Maps;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Maps;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Rides;

/// <summary>
/// A finished ride as the app submits it: facts only, never XP, stars or unlocks (L2-044 AC4). A race names its map,
/// mode, pack, place and field; a class names its class. The speed of each second ridden is in km/h; a class ride covers
/// no distance and sends none.
/// </summary>
public sealed record SubmitRideRequest(
    Guid RideId,
    string? Kind,
    string? MapId,
    string? Mode,
    string? Pack,
    int? Place,
    int? FieldSize,
    string? ClassId,
    int ElapsedSeconds,
    double DistanceMeters,
    double OutputKj,
    int MaxPowerWatts,
    double MaxSpeedKmh,
    double OnTargetShare,
    IReadOnlyList<double>? SpeedSamplesKmh,
    DateTimeOffset? FinishedAt,
    string? TimeZoneId,
    string? SessionId = null)
{
    /// <summary>What the plausibility rule checks.</summary>
    public RideFacts Facts => new(ElapsedSeconds, DistanceMeters, MaxPowerWatts, MaxSpeedKmh, SpeedSamplesKmh ?? []);
}

/// <summary>
/// What the backend answers for a recorded ride, the same for every repeat of its ride id (L2-125 AC3): its XP line by
/// line and in all, the rider's total XP once it was added (L2-037), the level that total reaches, whether the ride
/// took it there, and the next level's threshold and the XP to it, both null at level 30 (L2-038); for a race its stars
/// and best (L2-075, L2-077); and the map the ride opened, if any (L2-040 AC5).
/// </summary>
public sealed record RideRecordedDto(
    Guid RideId,
    DateTimeOffset RecordedAt,
    IReadOnlyList<XpLineDto> XpLines,
    int XpTotal,
    int TotalXp,
    int Level,
    bool LevelUp,
    int? NextLevelXp,
    int? XpToNextLevel,
    MapStarsDto? Stars,
    PersonalBestDto? Best,
    string? OpenedMapId)
{
    public static RideRecordedDto From(RecordedRide ride)
    {
        var xpTotal = ride.XpLines.Sum(line => line.Xp);
        var progress = LevelTable.Progress(ride.TotalXp);
        return new(
            ride.Id,
            ride.RecordedAt,
            [.. ride.XpLines.Select(line => new XpLineDto(JsonNamingPolicy.CamelCase.ConvertName(line.Kind.ToString()), line.Label, line.Xp))],
            xpTotal,
            ride.TotalXp,
            progress.Level,
            progress.Level > LevelTable.LevelFor(ride.TotalXp - xpTotal),
            progress.NextThresholdXp,
            progress.XpToNext,
            ride.StarsHeld is { } held ? new MapStarsDto(Count(held), Count(ride.StarsEarned ?? MapStar.None)) : null,
            ride.BestSeconds is { } best ? new PersonalBestDto(best, ride.PreviousBestSeconds, ride.IsNewBest) : null,
            ride.OpenedMapId);
    }

    private static int Count(MapStar stars) => BitOperations.PopCount((uint)stars);
}

/// <summary>A race's stars on its map: how many of the three the rider holds, and how many this ride earned (L2-075).</summary>
public sealed record MapStarsDto(int Held, int Earned);

/// <summary>A race's best time on its map, the best before it (none on a first finish), and whether it is new (L2-077).</summary>
public sealed record PersonalBestDto(int BestSeconds, int? PreviousBestSeconds, bool IsNewBest);

/// <summary>One XP line: its kind (<c>finished</c>, <c>place</c>, <c>podium</c>, <c>onTarget</c>, <c>streak</c>), label and XP.</summary>
public sealed record XpLineDto(string Kind, string Label, int Xp);

/// <summary>The answer, and whether this submission recorded the ride or repeated one already recorded.</summary>
public sealed record RideSubmission(RideRecordedDto Answer, bool Recorded);

/// <summary>Records the signed-in rider's finished ride once for its ride id (Record a ride, L2-044 AC2).</summary>
public sealed record SubmitRideCommand(Guid RiderId, SubmitRideRequest Ride) : IRequest<RideSubmission>;

/// <summary>
/// A ride already recorded under its ride id answers as it did the first time. A new one is refused with 422
/// <c>ride_not_plausible</c> when no one could have ridden it (L2-125 AC2), and otherwise recorded with the XP it earns,
/// which is added to the rider's total in the same unit of work (L2-037). Every submitted ride finished, and records its
/// day on the rider's streak, whose days after the ride give the streak line (L2-042). Two first submissions at once both find nothing; the key refuses the second
/// insert, which then answers with the first's ride and adds nothing.
/// </summary>
public sealed class SubmitRideCommandHandler(IAppDbContext db, IMapCatalogue maps, TimeProvider time)
    : IRequestHandler<SubmitRideCommand, RideSubmission>
{
    /// <summary>The most rides one rider records in an hour (L2-130 AC3).</summary>
    public const int RidesPerHour = 60;

    private static readonly TimeSpan Hour = TimeSpan.FromHours(1);

    public async Task<RideSubmission> Handle(SubmitRideCommand request, CancellationToken cancellationToken)
    {
        var ride = request.Ride;
        if (await Recorded(request, cancellationToken) is { } recorded) return new(RideRecordedDto.From(recorded), false);
        await KeepWithinTheHoursLimit(request.RiderId, cancellationToken);

        var raceMeters = ride.Kind == "race" ? maps.Maps.Single(map => map.Id == ride.MapId).DistanceKm * 1000 : (double?)null;
        if (!RidePlausibilityRule.IsPlausible(ride.Facts, raceMeters))
        {
            throw new DomainRuleException("ride_not_plausible", RuleKind.Unprocessable, "No one could have ridden this ride.");
        }

        if (ride.Mode == "online")
        {
            request = request with { Ride = await FromResult(request, cancellationToken) };
            ride = request.Ride;
        }

        var rider = await db.Riders.FirstOrDefaultAsync(known => known.Id == request.RiderId, cancellationToken)
            ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "No such rider.");
        var kind = ride.Kind switch
        {
            "race" => RideKind.Race,
            "custom" => RideKind.Custom,
            _ => RideKind.Class,
        };
        var streakDays = rider.RecordRide(ride.FinishedAt!.Value, ride.TimeZoneId!);
        var xpLines = XpCalculator.Compute(
            new RideResult(kind, ride.Mode, RideOutcome.Finished, ride.Place, ride.FieldSize, ride.OnTargetShare), streakDays);
        rider.AddXp(xpLines.Sum(line => line.Xp));
        var (mapProgress, finish) = kind == RideKind.Race ? await RecordFinish(request, cancellationToken) : (null, null);
        var (openedMapId, touched) = await OpenMaps(request, mapProgress, LevelTable.LevelFor(rider.TotalXp), cancellationToken);
        var recording = new RecordedRide
        {
            RiderId = request.RiderId,
            Id = ride.RideId,
            Kind = kind,
            MapId = ride.MapId,
            Mode = ride.Mode,
            Pack = ride.Pack,
            Place = ride.Place,
            FieldSize = ride.FieldSize,
            ClassId = ride.ClassId,
            ElapsedSeconds = ride.ElapsedSeconds,
            DistanceMeters = ride.DistanceMeters,
            OutputKj = ride.OutputKj,
            MaxPowerWatts = ride.MaxPowerWatts,
            MaxSpeedKmh = ride.MaxSpeedKmh,
            OnTargetShare = ride.OnTargetShare,
            XpLines = xpLines,
            TotalXp = rider.TotalXp,
            StarsHeld = mapProgress?.Stars,
            StarsEarned = finish?.Earned,
            BestSeconds = finish?.BestSeconds,
            PreviousBestSeconds = finish?.PreviousBestSeconds,
            IsNewBest = finish?.IsNewBest ?? false,
            OpenedMapId = openedMapId,
            SessionId = ride.SessionId,
            FinishedAt = ride.FinishedAt!.Value,
            TimeZoneId = ride.TimeZoneId!,
            RecordedAt = time.GetUtcNow(),
        };
        db.Rides.Add(recording);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return new(RideRecordedDto.From(recording), true);
        }
        catch (DbUpdateException)
        {
            db.Rides.Entry(recording).State = EntityState.Detached;
            await db.Riders.Entry(rider).ReloadAsync(cancellationToken);
            foreach (var progress in touched)
            {
                var entry = db.MapProgress.Entry(progress);
                if (entry.State == EntityState.Added) entry.State = EntityState.Detached;
                else await entry.ReloadAsync(cancellationToken);
            }
            var first = await Recorded(request, cancellationToken) ?? throw new InvalidOperationException("The ride was neither recorded nor found.");
            return new(RideRecordedDto.From(first), false);
        }
    }

    /// <summary>
    /// A riders-online race as the service recorded it, never as the app sent it (L2-125 AC1): the rider's place, the
    /// field, the second they reached the line (the app's time when the race placed them by distance) and their output.
    /// Refused with 409 <c>result_pending</c> before the race's result exists, and 404 <c>session_not_found</c> when the
    /// rider has no seat in it.
    /// </summary>
    /// <summary>
    /// Refuses a new ride once the rider has recorded <see cref="RidesPerHour"/> in the past hour, with <c>rate_limited</c>
    /// and the wait until the oldest of them falls out of it (L2-130 AC1, AC3). It counts recorded rides, so a repeat of
    /// one, or a race result asked for again while it is pending, costs nothing; the count holds across instances.
    /// </summary>
    private async Task KeepWithinTheHoursLimit(Guid riderId, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var since = now - Hour;
        var recent = await db.Rides
            .Where(ride => ride.RiderId == riderId && ride.RecordedAt > since)
            .OrderBy(ride => ride.RecordedAt)
            .Select(ride => ride.RecordedAt)
            .ToListAsync(cancellationToken);
        if (recent.Count < RidesPerHour) return;

        var wait = recent[recent.Count - RidesPerHour] + Hour - now;
        throw new DomainRuleException("rate_limited", RuleKind.TooManyRequests, "Too many rides recorded this hour.", wait);
    }

    private async Task<SubmitRideRequest> FromResult(SubmitRideCommand request, CancellationToken cancellationToken)
    {
        var ride = request.Ride;
        var result = await db.SessionResults.FirstOrDefaultAsync(known => known.SessionId == ride.SessionId, cancellationToken)
            ?? throw new DomainRuleException("result_pending", RuleKind.Conflict, "The race's result is not recorded yet.");
        var entry = result.Entries.FirstOrDefault(each => each.RiderId == request.RiderId)
            ?? throw new DomainRuleException("session_not_found", RuleKind.NotFound, "No such race session.");
        return ride with
        {
            MapId = result.MapId,
            Place = entry.Place,
            FieldSize = result.Entries.Count,
            ElapsedSeconds = entry.TimeSeconds ?? ride.ElapsedSeconds,
            OutputKj = entry.OutputKj,
        };
    }

    /// <summary>Records a race's finish on the rider's progress on its map, started on the first race there (L2-039, L2-077).</summary>
    private async Task<(MapProgress, FinishRecord)> RecordFinish(SubmitRideCommand request, CancellationToken cancellationToken)
    {
        var ride = request.Ride;
        var progress = await db.MapProgress.FirstOrDefaultAsync(
            known => known.RiderId == request.RiderId && known.MapId == ride.MapId, cancellationToken);
        if (progress is null)
        {
            progress = MapProgress.Start(request.RiderId, ride.MapId!);
            db.MapProgress.Add(progress);
        }

        return (progress, progress.RecordFinish(Finish(ride)));
    }

    private static RaceFinish Finish(SubmitRideRequest ride) => new(ride.Mode!, ride.Pack, ride.Place!.Value, ride.ElapsedSeconds);

    /// <summary>
    /// Opens the maps whose goal the ride meets (L2-040), started on the rider's progress there if need be, and names the
    /// first; every map progress the ride changed, the race's included, so a lost race to record can undo them.
    /// </summary>
    private async Task<(string? Opened, IReadOnlyList<MapProgress> Touched)> OpenMaps(
        SubmitRideCommand request, MapProgress? raceProgress, int level, CancellationToken cancellationToken)
    {
        var progress = await db.MapProgress.Where(known => known.RiderId == request.RiderId).ToDictionaryAsync(known => known.MapId, cancellationToken);
        if (raceProgress is not null) progress[raceProgress.MapId] = raceProgress;
        var opens = UnlockRules.Evaluate(
            maps.Maps.Select(map => (map.Id, map.Unlock)).ToList(),
            raceProgress?.MapId,
            raceProgress is null ? null : Finish(request.Ride),
            progress.ToDictionary(known => known.Key, known => known.Value.Stars),
            level,
            progress.Values.Where(known => known.OpenedAt is not null).Select(known => known.MapId).ToHashSet());
        var touched = raceProgress is null ? new List<MapProgress>() : [raceProgress];
        foreach (var mapId in opens)
        {
            if (!progress.TryGetValue(mapId, out var opened))
            {
                opened = MapProgress.Start(request.RiderId, mapId);
                db.MapProgress.Add(opened);
            }
            opened.Open(time.GetUtcNow());
            if (!touched.Contains(opened)) touched.Add(opened);
        }

        return (opens.Count > 0 ? opens[0] : null, touched);
    }

    private Task<RecordedRide?> Recorded(SubmitRideCommand request, CancellationToken cancellationToken) =>
        db.Rides.AsNoTracking().FirstOrDefaultAsync(
            ride => ride.RiderId == request.RiderId && ride.Id == request.Ride.RideId, cancellationToken);
}
