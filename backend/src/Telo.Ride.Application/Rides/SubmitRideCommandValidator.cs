using System.Linq.Expressions;
using FluentValidation;
using Telo.Ride.Application.Classes;
using Telo.Ride.Application.Maps;

namespace Telo.Ride.Application.Rides;

/// <summary>
/// Whether a submission is a ride at all (Record a ride): a ride id; a kind; for a race a map in the catalogue, a mode
/// of <c>solo</c>, <c>bots</c> or <c>online</c>, a pack for a bots race, a session for a riders-online race and a place
/// within the field; for a class a class in the
/// catalogue; 1 to <see cref="MaxSeconds"/> elapsed seconds; no negative distance, output, power or speed; an on-target
/// share from 0 to 1; no more speed
/// samples than seconds; a finish instant; and a known IANA time zone. Each error names the fact as the app sends it.
/// </summary>
public sealed class SubmitRideCommandValidator : AbstractValidator<SubmitRideCommand>
{
    /// <summary>Four hours, the longest ride the app records, and so the most speed samples a ride carries.</summary>
    public const int MaxSeconds = 14_400;

    private static readonly string[] Kinds = ["race", "class"];
    private static readonly string[] Modes = ["solo", "bots", "online"];
    private static readonly string[] Packs = ["easy", "medium", "hard"];

    public SubmitRideCommandValidator(IMapCatalogue maps, IClassCatalogue classes)
    {
        Fact(ride => ride.RideId).NotEmpty();
        Fact(ride => ride.Kind).Must(kind => kind is not null && Kinds.Contains(kind)).WithMessage("Kind is race or class.");
        When(command => command.Ride.Kind == "race", () =>
        {
            Fact(ride => ride.MapId).Must(id => maps.Maps.Any(map => map.Id == id)).WithMessage("No such map.");
            Fact(ride => ride.Mode).Must(mode => mode is not null && Modes.Contains(mode)).WithMessage("Mode is solo, bots or online.");
            Fact(ride => ride.Pack).Must(pack => pack is not null && Packs.Contains(pack)).When(command => command.Ride.Mode == "bots")
                .WithMessage("A bots race has a pack of easy, medium or hard.");
            Fact(ride => ride.SessionId).NotEmpty().MaximumLength(96).When(command => command.Ride.Mode == "online")
                .WithMessage("A riders-online race names its session.");
            Fact(ride => ride.FieldSize).NotNull().InclusiveBetween(1, 100);
            Fact(ride => ride.Place).NotNull().GreaterThanOrEqualTo(1)
                .Must((command, place) => place <= command.Ride.FieldSize).WithMessage("The place is within the field.");
        });
        When(command => command.Ride.Kind == "class", () =>
            Fact(ride => ride.ClassId).Must(id => classes.Classes.Any(known => known.Id == id)).WithMessage("No such class."));
        Fact(ride => ride.ElapsedSeconds).InclusiveBetween(1, MaxSeconds);
        Fact(ride => ride.DistanceMeters).GreaterThanOrEqualTo(0);
        Fact(ride => ride.OutputKj).GreaterThanOrEqualTo(0);
        Fact(ride => ride.MaxPowerWatts).GreaterThanOrEqualTo(0);
        Fact(ride => ride.MaxSpeedKmh).GreaterThanOrEqualTo(0);
        Fact(ride => ride.OnTargetShare).InclusiveBetween(0, 1);
        Fact(ride => ride.SpeedSamplesKmh)
            .Must((command, samples) => samples is null || samples.Count <= command.Ride.ElapsedSeconds)
            .WithMessage("No more speed samples than seconds.")
            .Must(samples => samples is null || samples.All(kmh => kmh >= 0)).WithMessage("No negative speed.");
        Fact(ride => ride.FinishedAt).NotNull();
        Fact(ride => ride.TimeZoneId).Must(KnownTimeZone).WithMessage("An IANA time zone, such as Europe/London.");
    }

    /// <summary>A rule on one fact of the ride, named as the app sends it: <c>ElapsedSeconds</c> → <c>elapsedSeconds</c>.</summary>
    private IRuleBuilderInitial<SubmitRideCommand, T> Fact<T>(Expression<Func<SubmitRideRequest, T>> fact)
    {
        var read = fact.Compile();
        var name = ((MemberExpression)fact.Body).Member.Name;
        return RuleFor(command => read(command.Ride)).Configure(rule => rule.PropertyName = name);
    }

    private static bool KnownTimeZone(string? id) =>
        id is not null && TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone) && zone.HasIanaId;
}
