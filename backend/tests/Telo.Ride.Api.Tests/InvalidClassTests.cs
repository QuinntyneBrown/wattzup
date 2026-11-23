// Acceptance test
// Traces to: L2-080 AC4
// Description: a class whose plan has a level outside 1 to 32, whose plan total differs from its length,
// or whose video id is not a YouTube id is left out of the catalogue, and asking for it by id is 404
// class_not_found; the valid classes are still listed and served.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Telo.Ride.Api.Tests;

public sealed class InvalidClassTests(StubCatalogueApi api) : IClassFixture<StubCatalogueApi>
{
    [Fact]
    public async Task Only_the_valid_classes_are_listed()
    {
        using var client = api.CreateClient();

        var catalogue = await client.GetFromJsonAsync<Catalogue>("/api/classes", TestContext.Current.CancellationToken);

        Assert.Equal(["valid"], catalogue!.Classes.Select(c => c.Id));
    }

    [Fact]
    public async Task A_class_that_breaks_the_rules_is_404_class_not_found_by_its_id()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/api/classes/level-too-high", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal("class_not_found", problem.GetProperty("code").GetString());
    }
}
