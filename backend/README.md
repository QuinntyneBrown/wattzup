# Telo Ride backend

The thin .NET service of [ADR 0025](../docs/adr/0025-thin-dotnet-backend.md): only what one browser
cannot do alone. It never talks to the bike. The shape is in [Structure the
backend](../docs/detailed-designs/platform/structure-the-backend/README.md); the settings a deployed
copy reads are in [`docs/deployment.md`](../docs/deployment.md).

| Project | Holds | References |
|---------|-------|------------|
| `src/Telo.Ride.Domain` | Entities, value objects, `DomainRuleException` | nothing |
| `src/Telo.Ride.Application` | MediatR handlers, validators, `ValidationBehavior`, `IAppDbContext` | Domain |
| `src/Telo.Ride.Infrastructure` | `AppDbContext` (EF Core, Azure SQL), migrations, `TeloRideMetrics`, and the class catalogue `Catalogue/classes.json`, embedded and read through `IClassCatalogue` (ADR 0028) | Application |
| `src/Telo.Ride.Api` | `Program.cs`, controllers, `RideHub`, authentication, ProblemDetails, health, telemetry, `migrate`, `feedback`, and the app's build from `wwwroot` with the L2-131 headers (ADR 0026) | Infrastructure |
| `tests/Telo.Ride.Api.Tests` | Acceptance tests through the API, in memory, on EF Core InMemory | Api |

Commands, from `backend/` (`node tools/verify/verify.mjs` runs the first two):

```shell
dotnet format Telo.Ride.slnx --verify-no-changes   # the backend's lint
dotnet test --solution Telo.Ride.slnx              # build and every test
dotnet run --project src/Telo.Ride.Api             # serve the API (needs ConnectionStrings:TeloRide for readiness)
dotnet run --project src/Telo.Ride.Api -- migrate  # apply pending migrations and exit
dotnet run --project src/Telo.Ride.Api -- feedback # write every feedback report as JSON Lines and exit
dotnet ef migrations add <Name> --project src/Telo.Ride.Infrastructure --startup-project src/Telo.Ride.Api --output-dir Migrations
```

In Development, sign-in codes are emailed to an SMTP catcher on `localhost:1025` (ADR 0031): run
[Mailpit](https://mailpit.axllent.org/) (`mailpit`, then open `http://localhost:8025`) to read them.

To serve a local build as production does, from `backend/`:

```shell
dotnet run --no-launch-profile --project src/Telo.Ride.Api -- --webroot ../frontend/dist/ride/browser
```

Tests never use a real database, file or sleep. Each fixture is the API hosted in memory
(`TeloRideApiFactory`) over its own InMemory store, with a `FakeTimeProvider` as its `Clock`; a
fault is injected by subclassing it and replacing a service in `ConfigureServices`, as
`UnreachableDatabaseApi` replaces `IAppDbContext`. Hub tests connect a real SignalR client to
`/hubs/ride` through `Server.CreateHandler()`, and `EventProbe<T>` awaits an event with a timeout
that names what did arrive. Until a feature adds its own endpoints and sign-in, the test-only
`ProbeController` stands in for one (no `[AllowAnonymous]`, one MediatR request per action) and
`SignedInProbeApi` signs every request in.
