using System.Numerics;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application.Maps;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Maps;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Progress;

/// <summary>
/// The rider's standing (L2-032 AC2): their level, total XP and the next level's threshold, null at level 30 (L2-038),
/// their streak as it reads today in their time zone (L2-042), and their maps: those open, in unlock order (L2-040), the
/// next unlock (L2-041), and the stars held and best time in seconds on each map ridden (L2-039); and for Home, the map
/// the Next ride card offers (L2-033) and the map a ride opened that Home has not announced yet, if any (L2-036); and for
/// Profile, how many rides they have recorded and the kilometres those rides covered, to the nearest whole (L2-109).
/// </summary>
public sealed record ProgressDto(
    int Level,
    int TotalXp,
    int? NextLevelXp,
    int StreakDays,
    IReadOnlyList<string> OpenMapIds,
    string? NextUnlockId,
    IReadOnlyDictionary<string, int> Stars,
    IReadOnlyDictionary<string, int> BestTimeSeconds,
    string NextRideMapId,
    string? UnseenUnlockId,
    int RideCount,
    int DistanceKm);

/// <summary>Reads the signed-in rider's progress (L2-044 AC1).</summary>
public sealed record GetProgressQuery(Guid RiderId) : IRequest<ProgressDto>;

/// <summary>
/// Resolves the rider's level from their total XP with <see cref="LevelTable"/>, and their maps from their map progress
/// against the catalogue: a map is open from the start or once a ride opened it, and <see cref="UnlockRules"/> gives the
/// next unlock.
/// </summary>
public sealed class GetProgressQueryHandler(IAppDbContext db, IMapCatalogue maps, TimeProvider time)
    : IRequestHandler<GetProgressQuery, ProgressDto>
{
    public async Task<ProgressDto> Handle(GetProgressQuery request, CancellationToken cancellationToken)
    {
        var rider = await db.Riders.AsNoTracking().FirstOrDefaultAsync(known => known.Id == request.RiderId, cancellationToken)
            ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "No such rider.");
        var progress = LevelTable.Progress(rider.TotalXp);
        var onMaps = await db.MapProgress.AsNoTracking().Where(known => known.RiderId == request.RiderId)
            .ToDictionaryAsync(known => known.MapId, cancellationToken);
        var order = maps.Maps.Select(map => (map.Id, map.Unlock)).ToList();
        var opened = onMaps.Values.Where(known => known.OpenedAt is not null).Select(known => known.MapId).ToHashSet();
        var ridden = order.Where(map => onMaps.ContainsKey(map.Id)).Select(map => onMaps[map.Id]).ToList();
        var rides = db.Rides.AsNoTracking().Where(ride => ride.RiderId == request.RiderId);
        var rideCount = await rides.CountAsync(cancellationToken);
        var meters = await rides.SumAsync(ride => ride.DistanceMeters, cancellationToken);
        return new(
            progress.Level,
            progress.TotalXp,
            progress.NextThresholdXp,
            rider.StreakDaysAt(time.GetUtcNow()),
            order.Where(map => map.Unlock.Kind == MapUnlock.Start || opened.Contains(map.Id)).Select(map => map.Id).ToList(),
            UnlockRules.NextUnlock(order, opened),
            ridden.Where(known => known.Stars != MapStar.None)
                .ToDictionary(known => known.MapId, known => BitOperations.PopCount((uint)known.Stars)),
            ridden.Where(known => known.BestSeconds is not null)
                .ToDictionary(known => known.MapId, known => known.BestSeconds!.Value),
            UnlockRules.NextRide(
                order,
                onMaps.Values.Where(known => known.OpenedAt is not null).ToDictionary(known => known.MapId, known => known.OpenedAt!.Value),
                ridden.ToDictionary(known => known.MapId, known => BitOperations.PopCount((uint)known.Stars))),
            onMaps.Values.Where(known => known.OpenedAt is not null && known.UnlockSeenAt is null)
                .MaxBy(known => known.OpenedAt)?.MapId,
            rideCount,
            (int)Math.Round(meters / 1000, MidpointRounding.AwayFromZero));
    }
}
