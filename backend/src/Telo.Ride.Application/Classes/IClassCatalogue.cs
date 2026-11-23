using Telo.Ride.Domain.Classes;

namespace Telo.Ride.Application.Classes;

/// <summary>
/// The class catalogue as the backend ships it (ADR 0028): the shelves in display order and every class in catalogue
/// order, valid or not. Infrastructure reads it from the embedded <c>classes.json</c>; tests serve their own.
/// </summary>
public interface IClassCatalogue
{
    IReadOnlyList<Shelf> Shelves { get; }

    IReadOnlyList<ClassDefinition> Classes { get; }
}
