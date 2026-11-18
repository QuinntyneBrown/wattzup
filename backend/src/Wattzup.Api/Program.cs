using Wattzup.Api;
using Wattzup.Api.Bluetooth;
using Wattzup.Api.Endpoints;
using Wattzup.Api.Security;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.State;
using Wattzup.Core.Resistance;
using Wattzup.Core.Security;
using Wattzup.Core.Telemetry;
using Wattzup.Core.Workouts;

// --simulate selects the simulated bike (L2-043); it is not a key=value setting, so it is taken out of args.
var simulate = args.Contains("--simulate", StringComparer.OrdinalIgnoreCase);
// Inside Wattzup.app the bundle is the content root and runtime output goes to Application Support (ADR 0008).
var bundled = OperatingSystem.IsMacOS() && AppContext.BaseDirectory.Contains(".app/Contents/MacOS", StringComparison.Ordinal);
// --machine treadmill is short for --Wattzup:Machine treadmill (L2-062).
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args =
    [
        .. args.Where(a => !string.Equals(a, "--simulate", StringComparison.OrdinalIgnoreCase))
            .Select(a => string.Equals(a, "--machine", StringComparison.OrdinalIgnoreCase) ? "--Wattzup:Machine"
                : a.StartsWith("--machine=", StringComparison.OrdinalIgnoreCase) ? "--Wattzup:Machine=" + a["--machine=".Length..]
                : a),
    ],
    ContentRootPath = bundled ? AppContext.BaseDirectory : null,
});
if (bundled)
{
    var data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Library", "Application Support", "Wattzup");
    builder.Configuration[$"{RawPacketLogOptions.SectionName}:Path"] ??= Path.Combine(data, "raw_packets.log");
    builder.Configuration[$"{StatusSnapshotOptions.SectionName}:Path"] ??= Path.Combine(data, "status.json");
}

if (simulate)
{
    builder.Configuration["Wattzup:Ble:Transport"] = TransportSelector.Simulated;
}

var options = builder.Configuration.GetSection(WattzupOptions.SectionName).Get<WattzupOptions>() ?? new WattzupOptions();
builder.WebHost.UseUrls(options.Urls);
builder.Services.Configure<ConnectivityOptions>(builder.Configuration.GetSection(ConnectivityOptions.SectionName));
builder.Services.Configure<BikeOptions>(builder.Configuration.GetSection(BikeOptions.SectionName));

// The state contract keeps the prototype's snake_case names, and writes nulls (L2-014).
builder.Services.ConfigureHttpJsonOptions(json => WattzupJson.Configure(json.SerializerOptions));
builder.Services.AddOpenApi(openApi => openApi.AddSchemaTransformer<Wattzup.Api.OpenApi.ContractSchemaTransformer>());
builder.Services.AddProblemDetails();
var security = builder.Configuration.GetSection(SecurityOptions.SectionName).Get<SecurityOptions>() ?? new SecurityOptions();
builder.Services.AddWattzupRateLimits(security);
builder.Services.Configure<WattzupOptions>(builder.Configuration.GetSection(WattzupOptions.SectionName));
builder.Services.Configure<SecurityOptions>(builder.Configuration.GetSection(SecurityOptions.SectionName));
builder.Services.AddHostedService<BindAddressGuard>();
var treadmill = builder.Configuration.GetSection(TreadmillOptions.SectionName).Get<TreadmillOptions>() ?? new TreadmillOptions();
builder.Services.Configure<TreadmillOptions>(builder.Configuration.GetSection(TreadmillOptions.SectionName));
builder.Services.Configure<ClassesOptions>(builder.Configuration.GetSection(ClassesOptions.SectionName));
builder.Services.AddHostedService<TreadmillGuard>();
builder.Services.AddSingleton<EventTokenService>();
var keyed = !string.IsNullOrEmpty(security.ApiKey);
if (keyed)
{
    builder.Services.AddAuthentication(ApiKeyAuthenticationHandler.SchemeName)
        .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(ApiKeyAuthenticationHandler.SchemeName, null);
    builder.Services.AddAuthorization();
}

var origins = builder.Configuration.GetSection(Wattzup.Api.Security.CorsOptions.SectionName).Get<Wattzup.Api.Security.CorsOptions>()?.Origins ?? [];
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy =>
    policy.WithOrigins([.. origins]).WithHeaders("Content-Type", ApiKeyAuthenticationHandler.Header).WithMethods("GET", "POST")));

var transportName = TransportSelector.Resolve(builder.Configuration[$"{ConnectivityOptions.SectionName}:Transport"]);
var displayNames = new DisplayNames(
    builder.Configuration[$"{BikeOptions.SectionName}:DisplayName"],
    builder.Configuration[$"{TreadmillOptions.SectionName}:DisplayName"] ?? TreadmillOptions.DefaultDisplayName);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.Configure<HostOptions>(host => host.ShutdownTimeout = TimeSpan.FromSeconds(5));
builder.Services.AddBikeTransport(transportName);
builder.Services.AddSingleton(sp =>
{
    var facts = HostFacts.For(sp.GetRequiredService<Wattzup.Ble.Abstractions.IBikeTransport>().Name, options.Urls);
    return new BikeStateStore(
        new BikeState
        {
            Transport = facts.Transport,
            Simulated = facts.Simulated,
            BindAddress = facts.BindAddress,
            Exposed = facts.Exposed,
            Machine = options.ParsedMachine,
            TreadmillEnabled = treadmill.Enabled,
        },
        sp.GetRequiredService<TimeProvider>(),
        displayNames);
});
builder.Services.AddSingleton<StateBroadcaster>();
builder.Services.AddSingleton<Wattzup.Core.Machines.MachineSelector>();
builder.Services.AddSingleton(displayNames);
builder.Services.AddSingleton<Wattzup.Core.Machines.NearbyMachines>();
builder.Services.AddSingleton<ActiveConnectionRegistry>();
builder.Services.Configure<RawPacketLogOptions>(builder.Configuration.GetSection(RawPacketLogOptions.SectionName));
builder.Services.Configure<StatusSnapshotOptions>(builder.Configuration.GetSection(StatusSnapshotOptions.SectionName));
builder.Services.AddSingleton<RecentPacketBuffer>();
builder.Services.AddSingleton<RawPacketLogger>();
builder.Services.AddSingleton<IRawPacketSink>(sp => sp.GetRequiredService<RecentPacketBuffer>());
builder.Services.AddSingleton<IRawPacketSink>(sp => sp.GetRequiredService<RawPacketLogger>());
builder.Services.AddHostedService<RawPacketLogWriter>();
builder.Services.AddHostedService<StatusSnapshotWriter>();
builder.Services.AddHostedService<StateChangeLogger>();
builder.Services.AddSingleton<TelemetryIngestor>();
builder.Services.AddSingleton<IResistanceCommander, ResistanceCommander>();
builder.Services.AddSingleton<PowerTraceHistory>();
builder.Services.AddSingleton<WorkoutEngine>();
builder.Services.AddSingleton<IResistanceControl>(sp => sp.GetRequiredService<WorkoutEngine>());
builder.Services.AddSingleton<Wattzup.Core.Treadmill.ITreadmillCommander, Wattzup.Core.Treadmill.TreadmillCommander>();
builder.Services.AddSingleton<ITreadmillControl>(sp => sp.GetRequiredService<WorkoutEngine>());
builder.Services.AddSingleton<IMachineControl>(sp => sp.GetRequiredService<WorkoutEngine>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<WorkoutEngine>());
builder.Services.AddSingleton<Wattzup.Core.Classes.ClassCatalogueStore>();
builder.Services.AddSingleton<Wattzup.Api.Classes.ClassCatalogueService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Wattzup.Api.Classes.ClassCatalogueService>());
builder.Services.AddSingleton<BikeConnectionService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<BikeConnectionService>());

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<BodySizeLimitMiddleware>();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
if (keyed)
{
    app.UseAuthentication();
    app.UseAuthorization();
}

app.UseRateLimiter();
app.UseAppShell();
app.MapOpenApi();
app.MapHealthEndpoint();
var api = app.MapGroup("/api");
if (keyed)
{
    api.RequireAuthorization();
}

api.MapStatusEndpoints();
api.MapEventTokenEndpoints();
api.MapEventsEndpoints();
api.MapBikeEndpoints();
api.MapResistanceEndpoints();
api.MapTreadmillEndpoints();
api.MapMachineEndpoints();
api.MapWorkoutEndpoints();
api.MapDiagnosticsEndpoints();
api.MapClassEndpoints();

app.Run();

/// <summary>The host's entry point, visible to the acceptance tests.</summary>
public partial class Program;
