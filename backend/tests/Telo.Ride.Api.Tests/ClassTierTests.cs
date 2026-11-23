// Acceptance test
// Traces to: L2-043 AC1
// Description: a class opens at level 1, 5, 10 or 20; a class whose tier is any other level is left out of the
// catalogue, and asking for it by id is 404 class_not_found.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Telo.Ride.Api.Tests;

public sealed class ClassTierTests(StubCatalogueApi api) : IClassFixture<StubCatalogueApi>
{
    [Fact]
    public async Task A_class_whose_tier_is_not_1_5_10_or_20_is_not_listed_and_is_404_by_its_id()
    {
        using var client = api.CreateClient();

        var catalogue = await client.GetFromJsonAsync<JsonElement>("/api/classes", TestContext.Current.CancellationToken);
        using var response = await client.GetAsync("/api/classes/tier-7", TestContext.Current.CancellationToken);

        Assert.DoesNotContain("tier-7", catalogue.GetProperty("classes").EnumerateArray().Select(c => c.GetProperty("id").GetString()));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal("class_not_found", problem.GetProperty("code").GetString());
    }
}
