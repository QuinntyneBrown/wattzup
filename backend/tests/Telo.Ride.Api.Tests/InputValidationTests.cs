// Acceptance test
// Traces to: L2-129 AC1, AC4
// Description: a request with a field that breaks its rule is refused with 400, code validation_failed and errors
// keyed by the field as the app sends it, before its handler runs: a number sent as text, a catalogue id that is not
// one, an id longer than any the catalogue holds. The refusal names no .NET type. A ride hub message with a value
// outside its range is refused with a HubException naming validation_failed and the field; a valid one is answered.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace Telo.Ride.Api.Tests;

public sealed class InputValidationTests(SignedInProbeApi api) : IClassFixture<SignedInProbeApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private static async Task<JsonElement> Refused(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync(Cancel);
        var problem = JsonDocument.Parse(body).RootElement.Clone();
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").GetProperty(field).GetArrayLength() > 0, body);
        Assert.DoesNotContain("System.", body);
        Assert.DoesNotContain("Telo.Ride", body);
        return problem;
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_number_sent_as_text_is_refused_naming_its_field()
    {
        using var client = api.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/rides", new { elapsedSeconds = "six minutes" }, Cancel);

        var problem = await Refused(response, "elapsedSeconds");
        Assert.Equal(["elapsedSeconds"], problem.GetProperty("errors").EnumerateObject().Select(field => field.Name));
    }

    [Fact]
    public async Task A_body_that_is_not_JSON_is_refused()
    {
        using var client = api.CreateClient();
        using var content = new StringContent("{ \"kind\": ", System.Text.Encoding.UTF8, "application/json");

        using var response = await client.PostAsync("/api/rides", content, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
    }

    [Theory]
    [InlineData("/api/classes/HIIT%20%3Cb%3E", "id")]
    [InlineData("/api/classes/a-class-id-far-longer-than-any-the-catalogue-holds-or-ever-will-hold-x", "id")]
    [InlineData("/api/classes/hiit%3Bdrop/sessions", "classId")]
    [InlineData("/api/maps/..%2F..%2Fetc/queue", "mapId")]
    public async Task A_catalogue_id_that_breaks_its_rule_is_refused_naming_its_field(string path, string field)
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync(path, Cancel);

        await Refused(response, field);
    }

    [Fact]
    public async Task Marking_an_unlock_seen_with_an_id_that_breaks_its_rule_is_refused()
    {
        using var client = api.CreateClient();

        using var response = await client.PostAsync("/api/progress/unlocks/Vice%20City!/seen", null, Cancel);

        await Refused(response, "mapId");
    }

    [Fact]
    public async Task A_catalogue_id_that_keeps_its_rule_but_names_nothing_is_still_not_found()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/api/classes/no-such-class", Cancel);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("ReportProgress", "powerWatts", new object[] { "hiit-cardio-30@20261121T0700Z", 1.0, -5.0 })]
    [InlineData("ReportProgress", "outputKj", new object[] { "hiit-cardio-30@20261121T0700Z", -1.0, 150.0 })]
    [InlineData("ReportRaceProgress", "powerWatts", new object[] { "vice-city@20261121T070000Z", 120.0, 9_999.0 })]
    [InlineData("ReportRaceProgress", "sessionId", new object[] { "vice-city", 120.0, 150.0 })]
    [InlineData("FindRace", "mapId", new object[] { "../../etc/passwd" })]
    [InlineData("SetReady", "sessionId", new object[] { "<script>", true })]
    [InlineData("JoinClassSession", "sessionId", new object[] { "hiit-cardio-30", "hiit-cardio-30" })]
    [InlineData("JoinClassSession", "classId", new object[] { "HIIT", "hiit-cardio-30@20261121T1945Z" })]
    public async Task A_hub_message_with_a_field_outside_its_rule_is_refused_naming_it(
        string method, string field, object[] arguments)
    {
        await using var connection = Connect();
        await connection.StartAsync(Cancel);

        var refused = await Assert.ThrowsAsync<HubException>(() => connection.InvokeCoreAsync(method, typeof(object), arguments, Cancel));

        // SignalR sends a HubException as "An unexpected error occurred invoking '…' on the server. HubException: …".
        Assert.EndsWith($"HubException: validation_failed: {field}", refused.Message);
        Assert.Equal(HubConnectionState.Connected, connection.State);
    }

    [Fact]
    public async Task A_valid_hub_message_is_answered()
    {
        await using var connection = Connect();
        await connection.StartAsync(Cancel);

        var result = await connection.InvokeAsync<JsonElement>("FindRace", "no-such-map", Cancel);

        Assert.Equal("map_not_found", result.GetProperty("code").GetString());
    }

    private HubConnection Connect() =>
        new HubConnectionBuilder()
            .WithUrl(new Uri(api.Server.BaseAddress, "hubs/ride"), options =>
            {
                options.HttpMessageHandlerFactory = _ => api.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
            })
            .Build();
}
