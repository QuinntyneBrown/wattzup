using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Application.Maps;

/// <summary>
/// The map catalogue as the backend ships it (ADR 0029), in unlock order. Infrastructure reads it from the embedded
/// <c>maps.json</c>; tests serve their own.
/// </summary>
public interface IMapCatalogue
{
    IReadOnlyList<MapDefinition> Maps { get; }
}
