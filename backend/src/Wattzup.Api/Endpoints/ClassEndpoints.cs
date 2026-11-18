using Wattzup.Core.Classes;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.Endpoints;

/// <summary>The shelf a class is filed on.</summary>
public sealed record ShelfRef(string Id, string Title, string Tagline);

/// <summary>A class as served: its text, its shelf and the accepted plan as <c>workout.plan</c> carries it (L2-078).</summary>
public sealed record ClassResponse(string Id, string Title, string Channel, string Focus, string Description, ShelfRef Shelf, WorkoutPlan Plan);

/// <summary>A shelf with its classes, in file order.</summary>
public sealed record ClassShelfResponse(string Id, string Title, string Tagline, IReadOnlyList<ClassResponse> Classes);

/// <summary>The answer of <c>GET /api/classes</c>: every shelf that has a class.</summary>
public sealed record ClassCatalogueResponse(IReadOnlyList<ClassShelfResponse> Shelves);

/// <summary><c>GET /api/classes</c> and <c>GET /api/classes/{id}</c>: the catalogue, read-only (L2-078, ADR 0014).</summary>
public static class ClassEndpoints
{
    public static RouteGroupBuilder MapClassEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/classes", (ClassCatalogueStore store) => TypedResults.Ok(ToResponse(store.Current)))
            .WithName("ListClasses")
            .WithSummary("The class catalogue: every shelf that has a class, with its classes, in file order.")
            .Produces<ClassCatalogueResponse>();
        api.MapGet("/classes/{id}", Get)
            .WithName("GetClass")
            .WithSummary("One class by id; an unknown id answers 404 class_not_found.")
            .Produces<ClassResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        return api;
    }

    private static IResult Get(string id, ClassCatalogueStore store)
    {
        var catalogue = store.Current;
        if (ClassCatalogueReader.IsId(id)
            && catalogue.Find(id) is { } entry
            && catalogue.Shelves.FirstOrDefault(s => s.Id == entry.ShelfId) is { } shelf)
        {
            return TypedResults.Ok(ToResponse(entry, shelf));
        }

        return Problems.WithCode(StatusCodes.Status404NotFound, "class_not_found", "No class has that id.");
    }

    private static ClassCatalogueResponse ToResponse(ClassCatalogue catalogue) =>
        new([.. catalogue.Shelves
            .Select(shelf => new ClassShelfResponse(shelf.Id, shelf.Title, shelf.Tagline, [.. catalogue.ClassesOn(shelf.Id).Select(c => ToResponse(c, shelf))]))
            .Where(shelf => shelf.Classes.Count > 0)]);

    private static ClassResponse ToResponse(ClassEntry entry, Shelf shelf) =>
        new(entry.Id, entry.Title, entry.Channel, entry.Focus, entry.Description, new ShelfRef(shelf.Id, shelf.Title, shelf.Tagline), entry.Plan);
}
