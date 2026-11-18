using Wattzup.Core.Workouts;

namespace Wattzup.Core.Classes;

/// <summary>A shelf of the class catalogue: a group of classes the owner names, shown in file order (L2-077).</summary>
public sealed record Shelf(string Id, string Title, string Tagline);

/// <summary>A class: a bike plan with the YouTube video it follows, filed on one shelf (L2-077, ADR 0014).</summary>
public sealed record ClassEntry(string Id, string Title, string Channel, string Focus, string Description, string ShelfId, WorkoutPlan Plan);

/// <summary>The validated, immutable catalogue of shelves and classes, both in file order.</summary>
public sealed class ClassCatalogue(IReadOnlyList<Shelf> shelves, IReadOnlyList<ClassEntry> classes)
{
    /// <summary>The catalogue of a missing or unreadable file.</summary>
    public static ClassCatalogue Empty { get; } = new([], []);

    public IReadOnlyList<Shelf> Shelves { get; } = shelves;

    public IReadOnlyList<ClassEntry> Classes { get; } = classes;

    public ClassEntry? Find(string id) => Classes.FirstOrDefault(c => string.Equals(c.Id, id, StringComparison.Ordinal));

    public IEnumerable<ClassEntry> ClassesOn(string shelfId) => Classes.Where(c => string.Equals(c.ShelfId, shelfId, StringComparison.Ordinal));
}

/// <summary>One shelf or class the reader left out: the entry (its id, or <c>classes[i]</c>), the field and why.</summary>
public sealed record CatalogueEntryProblem(string Entry, string Field, string Message);

/// <summary>
/// What reading a catalogue file gave: the catalogue and the entries left out of it, or, when the file as a whole
/// cannot be used, no catalogue and the reason (L2-077 criterion 5).
/// </summary>
public sealed record CatalogueLoadResult(ClassCatalogue? Catalogue, IReadOnlyList<CatalogueEntryProblem> Problems, string? FileError);

/// <summary>The single holder of the current catalogue; published by reference swap and read without a lock.</summary>
public sealed class ClassCatalogueStore
{
    private ClassCatalogue _current = ClassCatalogue.Empty;

    public ClassCatalogue Current => Volatile.Read(ref _current);

    public void Replace(ClassCatalogue catalogue)
    {
        ArgumentNullException.ThrowIfNull(catalogue);
        Volatile.Write(ref _current, catalogue);
    }
}
