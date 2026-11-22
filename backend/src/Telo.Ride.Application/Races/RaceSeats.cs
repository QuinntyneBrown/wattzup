using Telo.Ride.Domain.Races;

namespace Telo.Ride.Application.Races;

/// <summary>Turns a session's seats into what the app draws.</summary>
internal static class RaceSeats
{
    public static IReadOnlyList<RaceSeatDto> Of(RaceSession session) =>
        [.. session.Seats.Select((seat, index) => seat is null
            ? new RaceSeatDto(index + 1, "open", null, null, null, null, false)
            : new RaceSeatDto(index + 1, seat.Kind == RaceSeatKind.Bot ? "bot" : "rider", seat.Name, seat.Jersey, seat.Level, null, seat.Ready))];
}
