using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Api.Commands;
using Telo.Ride.Api.Errors;
using Telo.Ride.Api.Health;
using Telo.Ride.Api.Hosting;
using Telo.Ride.Api.Hubs;
using Telo.Ride.Api.Telemetry;
using Telo.Ride.Application;
using Telo.Ride.Application.Live;
using Telo.Ride.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddTeloRideTelemetry(builder.Configuration);
// Every ProblemDetails the API writes, refusals by authentication included, is counted by code.
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
    context.HttpContext.RequestServices.GetRequiredService<TeloRideMetrics>().ProblemAnswered(
        context.ProblemDetails.Extensions.TryGetValue("code", out var code) ? code?.ToString() ?? "none" : "none",
        context.ProblemDetails.Status ?? context.HttpContext.Response.StatusCode));
builder.Services.AddExceptionHandler<ProblemDetailsExceptionHandler>();
builder.Services.AddControllers().AnswerInvalidBodies();
builder.Services.AddSignalR(options =>
{
    options.AddFilter<ProgressRateHubFilter>();
    options.AddFilter<ValidationHubFilter>();
});
builder.Services.AddSingleton<ISessionNotifier, RideHubNotifier>();
builder.Services.AddAppHosting();
builder.Services.AddTransportSecurity();
// Code reads time only through TimeProvider, so tests advance a FakeTimeProvider instead of sleeping.
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddTeloRideAuthentication();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database", tags: [DatabaseHealthCheck.Tag]);

var app = builder.Build();

if (args is [MigrateCommand.Name])
{
    return await MigrateCommand.RunAsync(app.Services, CancellationToken.None);
}

app.UseTransportSecurity();
app.UseSecurityHeaders();
app.UseExceptionHandler();
// The app's files need no session, so they are served before authentication (ADR 0026).
app.UseStaticFiles();
// A change or a hub connection the browser marks as coming from another origin is refused before authentication
// (L2-127 AC2, ADR 0033).
app.UseSameOriginRequests();
app.UseAuthentication();
app.UseAuthorization();

// The anonymous endpoints, with the app's shell below. The default writer writes the status word only, never check names,
// timings or exception text (L2-127 AC4). Liveness runs no checks; readiness answers 503 Unhealthy
// while the database cannot be reached (a check that throws counts as unhealthy).
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains(DatabaseHealthCheck.Tag) })
    .AllowAnonymous();
app.MapControllers();
app.MapHub<RideHub>(RideHub.Path);
app.MapApp();

await app.RunAsync();
return 0;

/// <summary>The API's entry point; public so the acceptance tests can host it in memory.</summary>
public partial class Program;
