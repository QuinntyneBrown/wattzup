using System.Text.Json;
using MediatR;
using Telo.Ride.Application.Feedback;

namespace Telo.Ride.Api.Commands;

/// <summary>
/// <c>dotnet Telo.Ride.Api.dll feedback</c>: writes every stored feedback report to standard output as JSON Lines, oldest
/// first, and exits 0, or 1 on failure (docs/detailed-designs/feedback/receive-feedback). This is how the team reads
/// feedback: a report names its rider by id, never by a contact detail, and its message and context are JSON strings, so
/// nothing renders them as HTML (L2-119 AC4). It writes nothing to telemetry.
/// </summary>
internal static partial class FeedbackCommand
{
    public const string Name = "feedback";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static async Task<int> RunAsync(IServiceProvider services, TextWriter output, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        try
        {
            var reports = await scope.ServiceProvider.GetRequiredService<ISender>().Send(new ListFeedbackQuery(), cancellationToken);
            foreach (var report in reports)
            {
                await output.WriteLineAsync(JsonSerializer.Serialize(report, Json).AsMemory(), cancellationToken);
            }

            return 0;
        }
#pragma warning disable CA1031 // A command reports any failure as its exit code.
        catch (Exception exception)
#pragma warning restore CA1031
        {
            LogFailed(scope.ServiceProvider.GetRequiredService<ILogger<Program>>(), exception);
            return 1;
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Reading the feedback failed.")]
    private static partial void LogFailed(ILogger logger, Exception exception);
}
