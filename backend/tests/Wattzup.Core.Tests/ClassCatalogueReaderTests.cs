// Unit Test
// Traces to: L2-077
// Description: Every row of the class catalogue table at and beyond its limits, the shelf rules, the count limits and
// the file rules: one case per row.

using System.Text;
using System.Text.Json.Nodes;
using Wattzup.Core.Classes;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class ClassCatalogueReaderTests
{
    private const string FlatPlan = """{"kind":"flat","level":12,"minutes":30,"cadence":85}""";

    private static JsonObject Shelf(string id = "short") =>
        new() { ["id"] = id, ["title"] = "20 min", ["tagline"] = "Short and sharp." };

    private static JsonObject Class(string id = "steady") => new()
    {
        ["id"] = id,
        ["title"] = "Steady",
        ["channel"] = "Wattzup Studio",
        ["focus"] = "Zone 2",
        ["description"] = "One level.",
        ["shelf"] = "short",
        ["plan"] = JsonNode.Parse(FlatPlan),
    };

    private static CatalogueLoadResult Read(JsonArray shelves, JsonArray classes) =>
        Read(new JsonObject { ["shelves"] = shelves, ["classes"] = classes }.ToJsonString());

    private static CatalogueLoadResult Read(string json)
    {
        var bytes = Encoding.UTF8.GetBytes(json);
        using var stream = new MemoryStream(bytes);
        return ClassCatalogueReader.Read(stream, bytes.Length);
    }

    private static CatalogueLoadResult ReadOneClass(string field, JsonNode? value)
    {
        var entry = Class();
        if (value is null)
        {
            entry.Remove(field);
        }
        else
        {
            entry[field] = value;
        }

        return Read([Shelf()], [entry]);
    }

    [Fact]
    public void A_valid_catalogue_keeps_every_shelf_and_class_in_file_order()
    {
        var x = Class("x");
        x["shelf"] = "b";
        var y = Class("y");
        y["shelf"] = "a";

        var result = Read([Shelf("a"), Shelf("b")], [x, y]);

        Assert.Null(result.FileError);
        Assert.Empty(result.Problems);
        Assert.Equal(["a", "b"], result.Catalogue!.Shelves.Select(s => s.Id));
        Assert.Equal(["x", "y"], result.Catalogue.Classes.Select(c => c.Id));
        Assert.IsType<FlatPlan>(result.Catalogue.Classes[0].Plan);
    }

    [Theory]
    [InlineData("id", "a", true)]
    [InlineData("id", "abc-123", true)]
    [InlineData("id", "", false)]
    [InlineData("id", "Upper", false)]
    [InlineData("id", "has space", false)]
    [InlineData("id", "../x", false)]
    [InlineData("title", "", false)]
    [InlineData("channel", "", false)]
    [InlineData("focus", "", false)]
    [InlineData("description", "", true)]
    [InlineData("shelf", "nowhere", false)]
    public void A_class_field_is_checked_against_its_rule(string field, string value, bool kept)
    {
        var result = ReadOneClass(field, value);

        Assert.Equal(kept ? 1 : 0, result.Catalogue!.Classes.Count);
        if (!kept)
        {
            var problem = Assert.Single(result.Problems);
            Assert.Equal(field, problem.Field);
            Assert.Equal(field == "id" ? "classes[0]" : "steady", problem.Entry);
        }
    }

    [Theory]
    [InlineData("id", 64, true)]
    [InlineData("id", 65, false)]
    [InlineData("title", 80, true)]
    [InlineData("title", 81, false)]
    [InlineData("channel", 40, true)]
    [InlineData("channel", 41, false)]
    [InlineData("focus", 40, true)]
    [InlineData("focus", 41, false)]
    [InlineData("description", 280, true)]
    [InlineData("description", 281, false)]
    public void A_class_field_is_kept_at_its_length_limit_and_left_out_beyond_it(string field, int length, bool kept)
    {
        var result = ReadOneClass(field, new string('a', length));

        Assert.Equal(kept ? 1 : 0, result.Catalogue!.Classes.Count);
    }

    [Fact]
    public void Characters_are_counted_as_characters_not_bytes()
    {
        var result = ReadOneClass("focus", new string('₂', 40));

        Assert.Single(result.Catalogue!.Classes);
    }

    [Theory]
    [InlineData("title")]
    [InlineData("channel")]
    [InlineData("focus")]
    [InlineData("description")]
    [InlineData("shelf")]
    [InlineData("plan")]
    public void A_class_missing_a_field_is_left_out(string field)
    {
        var result = ReadOneClass(field, null);

        Assert.Empty(result.Catalogue!.Classes);
        Assert.Equal(field, Assert.Single(result.Problems).Field);
    }

    [Fact]
    public void A_class_whose_text_field_is_not_a_string_is_left_out()
    {
        var result = ReadOneClass("title", 7);

        Assert.Empty(result.Catalogue!.Classes);
    }

    [Fact]
    public void A_class_with_an_invalid_plan_is_left_out_naming_the_plan_field()
    {
        var result = ReadOneClass("plan", JsonNode.Parse("""{"kind":"flat","level":40,"minutes":30,"cadence":85}"""));

        Assert.Empty(result.Catalogue!.Classes);
        var problem = Assert.Single(result.Problems);
        Assert.Equal("plan.level", problem.Field);
        Assert.Equal(WorkoutPlanValidator.LevelRange, problem.Message);
    }

    [Fact]
    public void A_class_with_a_treadmill_plan_is_left_out()
    {
        var result = ReadOneClass("plan", JsonNode.Parse("""{"kind":"flat","speed":9.0,"incline":2,"minutes":30}"""));

        Assert.Empty(result.Catalogue!.Classes);
        Assert.StartsWith("plan", Assert.Single(result.Problems).Field, StringComparison.Ordinal);
    }

    [Fact]
    public void A_plan_video_keeps_only_its_id_and_start_point()
    {
        var plan = JsonNode.Parse(FlatPlan)!.AsObject();
        plan["video"] = JsonNode.Parse("""{"url":"https://youtu.be/QUoToFsMNig","start_seconds":12.5}""");

        var result = ReadOneClass("plan", plan);

        Assert.Equal(new RideVideo("QUoToFsMNig", 12.5), Assert.Single(result.Catalogue!.Classes).Plan.Video);
    }

    [Fact]
    public void A_repeated_class_id_leaves_out_the_later_class()
    {
        var second = Class();
        second["title"] = "Second";

        var result = Read([Shelf()], [Class(), second]);

        Assert.Equal("Steady", Assert.Single(result.Catalogue!.Classes).Title);
        var problem = Assert.Single(result.Problems);
        Assert.Equal(("steady", "id"), (problem.Entry, problem.Field));
    }

    [Theory]
    [InlineData("id", "Bad Id")]
    [InlineData("id", "")]
    [InlineData("title", "")]
    public void A_shelf_breaking_a_rule_is_left_out_with_its_classes(string field, string value)
    {
        var shelf = Shelf();
        shelf[field] = value;

        var result = Read([shelf], [Class()]);

        Assert.Empty(result.Catalogue!.Shelves);
        Assert.Empty(result.Catalogue.Classes);
        Assert.Contains(result.Problems, p => p.Field == field);
    }

    [Fact]
    public void A_shelf_tagline_over_280_characters_leaves_the_shelf_out()
    {
        var shelf = Shelf();
        shelf["tagline"] = new string('a', 281);

        var result = Read([shelf], []);

        Assert.Empty(result.Catalogue!.Shelves);
    }

    [Fact]
    public void A_repeated_shelf_id_leaves_out_the_later_shelf()
    {
        var second = Shelf();
        second["title"] = "Second";

        var result = Read([Shelf(), second], [Class()]);

        Assert.Equal("20 min", Assert.Single(result.Catalogue!.Shelves).Title);
        Assert.Single(result.Catalogue.Classes);
        Assert.Equal(("short", "id"), (Assert.Single(result.Problems).Entry, result.Problems[0].Field));
    }

    [Fact]
    public void Beyond_20_shelves_the_first_20_are_kept_and_one_problem_names_how_many_were_dropped()
    {
        var shelves = new JsonArray([.. Enumerable.Range(0, 21).Select(i => (JsonNode)Shelf($"s{i}"))]);

        var result = Read(shelves, []);

        Assert.Equal(20, result.Catalogue!.Shelves.Count);
        Assert.Contains("1", Assert.Single(result.Problems).Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Beyond_200_valid_classes_the_first_200_are_kept_and_one_problem_names_how_many_were_dropped()
    {
        var classes = new JsonArray([.. Enumerable.Range(0, 202).Select(i => (JsonNode)Class($"c{i}"))]);
        classes[0]!["title"] = string.Empty;

        var result = Read([Shelf()], classes);

        Assert.Equal(200, result.Catalogue!.Classes.Count);
        Assert.Equal("c1", result.Catalogue.Classes[0].Id);
        Assert.Equal(2, result.Problems.Count);
        Assert.Contains("1", result.Problems[1].Message, StringComparison.Ordinal);
    }

    [Fact]
    public void A_file_over_1_MB_is_not_read()
    {
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("""{"shelves":[],"classes":[]}"""));

        var result = ClassCatalogueReader.Read(stream, ClassCatalogueReader.MaxBytes + 1);

        Assert.Null(result.Catalogue);
        Assert.Equal("larger than 1 MB", result.FileError);
    }

    [Theory]
    [InlineData("{not json")]
    [InlineData("")]
    [InlineData("[]")]
    [InlineData("""{"shelves":{},"classes":[]}""")]
    public void A_file_that_is_not_a_catalogue_gives_no_catalogue(string json)
    {
        var result = Read(json);

        Assert.Null(result.Catalogue);
        Assert.NotNull(result.FileError);
    }

    [Fact]
    public void A_catalogue_with_no_shelves_or_classes_is_empty_but_valid()
    {
        var result = Read("""{"shelves":[],"classes":[]}""");

        Assert.Null(result.FileError);
        Assert.Empty(result.Catalogue!.Shelves);
    }
}
