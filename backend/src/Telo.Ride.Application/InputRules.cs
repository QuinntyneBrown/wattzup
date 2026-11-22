using FluentValidation;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application;

/// <summary>
/// The shapes the request validators share (L2-129 AC1): a catalogue id, a session id, power and a quantity that is
/// never negative. A value that breaks one is refused before its handler runs, naming its field.
/// </summary>
public static class InputRules
{
    /// <summary>The longest session id: a catalogue id, <c>@</c> and its start.</summary>
    public const int SessionIdLength = 96;

    /// <summary>A class or map id as the catalogue writes them, such as <c>hiit-cardio-30</c>: 1 to 64 of a-z, 0-9 and -.</summary>
    public static IRuleBuilderOptions<T, string?> CatalogueId<T>(this IRuleBuilder<T, string?> rule) =>
        rule.NotEmpty().MaximumLength(64).Matches("^[a-z0-9-]+$")
            .WithMessage("An id of lowercase letters, digits and hyphens.");

    /// <summary>
    /// A session id: its class or map, <c>@</c> and its start in UTC, such as <c>hiit-cardio-30@20261122T0700Z</c> for a
    /// class session or <c>vice-city@20261122T070000Z</c> for a race session.
    /// </summary>
    public static IRuleBuilderOptions<T, string?> SessionId<T>(this IRuleBuilder<T, string?> rule) =>
        rule.NotEmpty().MaximumLength(SessionIdLength).Matches("^[a-z0-9-]{1,64}@[0-9]{8}T[0-9]{4}([0-9]{2})?Z$")
            .WithMessage("A session id, such as hiit-cardio-30@20261122T0700Z.");

    /// <summary>Power in watts: from 0 to the most a rider can make (<see cref="RidePlausibilityRule.MaxPowerWatts"/>).</summary>
    public static IRuleBuilderOptions<T, double> Power<T>(this IRuleBuilder<T, double> rule) =>
        rule.Must(watts => double.IsFinite(watts) && watts is >= 0 and <= RidePlausibilityRule.MaxPowerWatts)
            .WithMessage($"Power from 0 to {RidePlausibilityRule.MaxPowerWatts} W.");

    /// <summary>An amount that only grows from nothing, such as output or distance: finite and 0 or more.</summary>
    public static IRuleBuilderOptions<T, double> NotNegative<T>(this IRuleBuilder<T, double> rule) =>
        rule.Must(value => double.IsFinite(value) && value >= 0).WithMessage("A number of 0 or more.");
}
