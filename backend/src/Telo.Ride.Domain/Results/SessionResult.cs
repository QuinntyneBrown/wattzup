using Telo.Ride.Domain.Races;

namespace Telo.Ride.Domain.Results;

/// <summary>
/// The record of one finished riders-online race (docs/detailed-designs/multiplayer/record-results-nobody-can-change):
/// each seat's place, time and output as the service computed them from the progress it received, never from anything
/// a client submitted (L2-125 AC1). Kept by the session id.
/// </summary>
public sealed class SessionResult
{
    public required string SessionId { get; init; }

    public required string MapId { get; init; }

    public required DateTimeOffset EndedAt { get; init; }

    public List<SessionResultEntry> Entries { get; init; } = [];
}

/// <summary>
/// One seat of a <see cref="SessionResult"/>: its place, the person in it (none for a bot), the name shown, the race
/// second it reached the line (none for a rider placed by distance), its output in kJ and how it ended.
/// </summary>
public sealed class SessionResultEntry
{
    public required int Seat { get; init; }

    public required int Place { get; init; }

    public Guid? RiderId { get; init; }

    public required string Name { get; init; }

    public int? TimeSeconds { get; init; }

    public required double OutputKj { get; init; }

    public required RaceStatus Status { get; init; }
}
