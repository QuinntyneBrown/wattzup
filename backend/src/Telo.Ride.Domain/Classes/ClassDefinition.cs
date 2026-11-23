namespace Telo.Ride.Domain.Classes;

/// <summary>
/// A class of the catalogue (L2-080): a YouTube video paired with a plan that follows it, on a shelf of its length
/// band, opening at a rider level and riding in a world.
/// </summary>
public sealed record ClassDefinition(
    string Id,
    string Title,
    string Channel,
    string Focus,
    int LengthSeconds,
    int OpensAtLevel,
    string ShelfId,
    string Summary,
    string World,
    string VideoId,
    double SyncOffsetSeconds,
    IReadOnlyList<ClassSegment> Segments);

/// <summary>One segment of a class plan: its kind, how long it lasts in seconds, its level and its cadence aim.</summary>
public sealed record ClassSegment(string Kind, int Duration, int Level, int CadenceAim);

/// <summary>A shelf of the Class Library: the classes of one length band, with its title and tagline (L2-081 AC3).</summary>
public sealed record Shelf(string Id, string Title, string Tagline);
