using System.Text.Json;
using System.Text.RegularExpressions;
using Wattzup.Core.State;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Classes;

/// <summary>
/// Reads a class catalogue file and applies the rules of L2-077: a file over 1 MB or not a JSON catalogue gives no
/// catalogue; a shelf or class that breaks a rule is left out with a problem naming it and the field; beyond 20
/// shelves and 200 valid classes the rest are dropped.
/// </summary>
public static partial class ClassCatalogueReader
{
    public const long MaxBytes = 1024 * 1024;
    public const int MaxShelves = 20;
    public const int MaxClasses = 200;

    public static CatalogueLoadResult Read(Stream file, long length)
    {
        ArgumentNullException.ThrowIfNull(file);
        if (length > MaxBytes)
        {
            return new CatalogueLoadResult(null, [], "larger than 1 MB");
        }

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(file);
        }
        catch (JsonException)
        {
            return new CatalogueLoadResult(null, [], "not valid JSON");
        }

        using (document)
        {
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object || !IsArrayOrMissing(root, "shelves") || !IsArrayOrMissing(root, "classes"))
            {
                return new CatalogueLoadResult(null, [], "not a catalogue: shelves and classes must be arrays");
            }

            var problems = new List<CatalogueEntryProblem>();
            var shelves = ReadShelves(Array(root, "shelves"), problems);
            var classes = ReadClasses(Array(root, "classes"), shelves, problems);
            return new CatalogueLoadResult(new ClassCatalogue(shelves, classes), problems, null);
        }
    }

    private static List<Shelf> ReadShelves(List<JsonElement> entries, List<CatalogueEntryProblem> problems)
    {
        var shelves = new List<Shelf>();
        for (var i = 0; i < entries.Count; i++)
        {
            var entry = entries[i];
            var name = Text(entry, "id") is { } id && IsId(id) ? id : $"shelves[{i}]";
            string? field =
                Text(entry, "id") is not { } shelfId || !IsId(shelfId) ? "id"
                : shelves.Any(s => s.Id == shelfId) ? "id"
                : !Fits(Text(entry, "title"), 1, 80) ? "title"
                : !Fits(Text(entry, "tagline"), 0, 280) ? "tagline"
                : null;
            if (field is not null)
            {
                problems.Add(new CatalogueEntryProblem(name, field, field == "id" && IsId(name) ? "The shelf id repeats an earlier shelf's." : Rule(field)));
                continue;
            }

            if (shelves.Count == MaxShelves)
            {
                problems.Add(new CatalogueEntryProblem("shelves", "shelves", $"At most {MaxShelves} shelves: {entries.Count - i} dropped."));
                break;
            }

            shelves.Add(new Shelf(name, Text(entry, "title")!, Text(entry, "tagline")!));
        }

        return shelves;
    }

    private static List<ClassEntry> ReadClasses(List<JsonElement> entries, List<Shelf> shelves, List<CatalogueEntryProblem> problems)
    {
        var classes = new List<ClassEntry>();
        var dropped = 0;
        for (var i = 0; i < entries.Count; i++)
        {
            var entry = entries[i];
            var name = Text(entry, "id") is { } id && IsId(id) ? id : $"classes[{i}]";
            var problem = Check(entry, name, classes, shelves, out var plan);
            if (problem is not null)
            {
                problems.Add(problem);
                continue;
            }

            if (classes.Count == MaxClasses)
            {
                dropped++;
                continue;
            }

            classes.Add(new ClassEntry(name, Text(entry, "title")!, Text(entry, "channel")!, Text(entry, "focus")!, Text(entry, "description")!, Text(entry, "shelf")!, plan!));
        }

        if (dropped > 0)
        {
            problems.Add(new CatalogueEntryProblem("classes", "classes", $"At most {MaxClasses} classes: {dropped} dropped."));
        }

        return classes;
    }

    private static CatalogueEntryProblem? Check(JsonElement entry, string name, List<ClassEntry> kept, List<Shelf> shelves, out WorkoutPlan? plan)
    {
        plan = null;
        if (Text(entry, "id") is not { } id || !IsId(id))
        {
            return new CatalogueEntryProblem(name, "id", Rule("id"));
        }

        if (kept.Any(c => c.Id == id))
        {
            return new CatalogueEntryProblem(name, "id", "The class id repeats an earlier class's.");
        }

        foreach (var (field, min, max) in TextRules)
        {
            if (!Fits(Text(entry, field), min, max))
            {
                return new CatalogueEntryProblem(name, field, Rule(field));
            }
        }

        if (!shelves.Any(s => s.Id == Text(entry, "shelf")))
        {
            return new CatalogueEntryProblem(name, "shelf", "The shelf names no shelf in the file.");
        }

        if (!entry.TryGetProperty("plan", out var body))
        {
            return new CatalogueEntryProblem(name, "plan", "A class needs a plan.");
        }

        var result = WorkoutPlanValidator.Validate(body, Machine.Bike);
        if (result.Plan is null)
        {
            var (key, messages) = result.Errors.First();
            return new CatalogueEntryProblem(name, $"plan.{key}", messages.FirstOrDefault() ?? "The plan is not valid.");
        }

        plan = result.Plan;
        return null;
    }

    private static readonly (string Field, int Min, int Max)[] TextRules =
    [
        ("title", 1, 80),
        ("channel", 1, 40),
        ("focus", 1, 40),
        ("description", 0, 280),
    ];

    private static string Rule(string field) => field switch
    {
        "id" => "An id is 1 to 64 characters of a-z, 0-9 and -.",
        "title" => "A title is 1 to 80 characters.",
        "channel" => "A channel is 1 to 40 characters.",
        "focus" => "A focus is 1 to 40 characters.",
        "tagline" => "A tagline is at most 280 characters.",
        "description" => "A description is at most 280 characters.",
        _ => "The field is not valid.",
    };

    /// <summary>The id rule of L2-077: 1 to 64 characters of a-z, 0-9 and -.</summary>
    public static bool IsId(string? id) => id is not null && IdPattern().IsMatch(id);

    private static bool Fits(string? text, int min, int max)
    {
        if (text is null)
        {
            return false;
        }

        var characters = text.EnumerateRunes().Count();
        return characters >= min && characters <= max;
    }

    private static bool IsArrayOrMissing(JsonElement root, string name) =>
        !root.TryGetProperty(name, out var value) || value.ValueKind == JsonValueKind.Array;

    private static List<JsonElement> Array(JsonElement root, string name) =>
        root.TryGetProperty(name, out var array) ? [.. array.EnumerateArray()] : [];

    private static string? Text(JsonElement entry, string name) =>
        entry.ValueKind == JsonValueKind.Object && entry.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    [GeneratedRegex("^[a-z0-9-]{1,64}$", RegexOptions.CultureInvariant)]
    private static partial Regex IdPattern();
}
