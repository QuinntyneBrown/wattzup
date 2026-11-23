// Unit test (the rule's table of cases, beside InvalidClassTests through the API)
// Traces to: L2-080 AC2, AC4
// Description: ClassPlanRules accepts a class whose video id is a YouTube id, whose sync offset is 0 or
// more, whose segments last over 0 seconds at levels 1 to 32, and whose plan totals its length; it names
// the first rule any other class breaks.
using Telo.Ride.Domain.Classes;
using static Telo.Ride.Api.Tests.StubCatalogueApi;

namespace Telo.Ride.Api.Tests;

public sealed class ClassPlanRulesTests
{
    public static TheoryData<string, ClassDefinition, string?> Cases => new()
    {
        { "valid", Valid, null },
        { "level 1 and level 32", Class("edges", 600, [Segment(300, 1), Segment(300, 32)]), null },
        { "level 0", Class("low", 600, [Segment(300, 0), Segment(300, 12)]), "a segment level is outside 1 to 32" },
        { "level 33", Class("high", 600, [Segment(300, 8), Segment(300, 33)]), "a segment level is outside 1 to 32" },
        { "a segment of 0 s", Class("empty", 600, [Segment(600, 8), Segment(0, 12)]), "a segment lasts 0 seconds or less" },
        { "no segment", Class("none", 600, []), "the plan has no segment" },
        { "plan 60 s short", Class("short", 600, [Segment(300, 8), Segment(240, 12)]), "the plan totals 540 s, not 600 s" },
        { "plan 60 s long", Class("long", 600, [Segment(300, 8), Segment(360, 12)]), "the plan totals 660 s, not 600 s" },
        { "video id of 10 characters", Valid with { VideoId = "QUoToFsMNi" }, "the video id is not a YouTube id" },
        { "video id with a slash", Valid with { VideoId = "QUoToFs/Nig" }, "the video id is not a YouTube id" },
        { "negative sync offset", Valid with { SyncOffsetSeconds = -0.5 }, "the sync offset is below 0" },
        { "unknown kind", Valid with { Segments = [new ClassSegment("sprint", 600, 8, 90)] }, "a segment's kind is not one of warm-up, work, recover, steady or cool-down" },
    };

    [Theory]
    [MemberData(nameof(Cases))]
    public void Names_the_rule_a_class_breaks(string name, ClassDefinition definition, string? broken)
    {
        _ = name; // names the row in the test's display name
        Assert.Equal(broken, ClassPlanRules.BrokenRule(definition));
    }
}
