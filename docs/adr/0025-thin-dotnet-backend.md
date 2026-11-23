# 0025. A thin .NET backend for what one browser cannot do alone

- **Status:** Accepted
- **Date:** 2026-11-21
- **Supersedes:** [0019](0019-no-backend.md)

## Context

ADR 0019 removed the Wattzup backend: every rule lived twice, and a computer beside the bike ran
the Bluetooth link. Telo Ride keeps the half of that decision that mattered. The bike, the
protocol, the workout engine and the ride itself stay in the browser, and a ride finishes on the
device without a network.

Telo Ride also needs things one browser cannot do alone (L1-024, L2-147): email sign-in, rider
progress that follows the rider between devices (XP, rider levels, stars, unlocks and rides),
live races and group classes between riders, and feedback the team can read. `AGENTS.md` names a
thin .NET service in clean architecture for exactly these, and asks that ADR 0019 be superseded
before `backend/` lands. The design of [Structure the
backend](../detailed-designs/platform/structure-the-backend/README.md) left the database engine
open.

## Decision

**`backend/` is one ASP.NET Core service on .NET 10, in four projects, over one Azure SQL
database. It never talks to the bike.**

- **Projects.** `Telo.Ride.Domain` (entities, no dependencies) ← `Telo.Ride.Application`
  (MediatR handlers, FluentValidation validators, DTOs, `IAppDbContext`) ←
  `Telo.Ride.Infrastructure` (EF Core, migrations, authentication) ← `Telo.Ride.Api`
  (controllers, SignalR hubs, `Program.cs`), in `backend/src/`, with the solution
  `backend/Telo.Ride.slnx`. Project references enforce the direction at compile time; there is
  no architecture test.
- **One path per request.** A controller action or hub method binds its input and sends one
  MediatR request; `ValidationBehavior` runs the request's validators before its handler.
  MediatR stays on 12.5, the last version under the Apache 2.0 licence; later versions need a
  commercial licence key.
- **Errors.** ProblemDetails (RFC 9457) with a `code` extension: `validation_failed` (400, with
  `errors` by field), a domain refusal's own code and status, `unauthenticated` (401) and
  `unexpected` (500, with a `traceId` and no detail).
- **Authentication by default.** Cookie authentication with a fallback authorization policy that
  requires an authenticated rider. `/health/live` and `/health/ready` are the only anonymous
  endpoints until sign-in (slices 9.1 and 9.2) adds its own, each marked `[AllowAnonymous]`.
- **Database.** Azure SQL Database (serverless), through EF Core's SQL Server provider. It sits
  in the same Azure subscription as the static web app (ADR 0022), its serverless tier pauses
  when nobody rides, and EF Core's SQL Server provider is the most complete. A paused database
  refuses connections for about a minute while it resumes, so the provider's retrying execution
  strategy is on (`EnableRetryOnFailure`, up to about 70 seconds): the request that wakes the
  database waits and succeeds instead of answering 500. Tests never use it: every backend test
  runs on EF Core InMemory, one store per fixture.
- **Schema changes.** EF Core migrations in `Telo.Ride.Infrastructure`, applied only by
  `dotnet Telo.Ride.Api.dll migrate`, which migrates and exits. Normal start-up never migrates.
- **Telemetry.** OpenTelemetry tracing and metrics for ASP.NET Core and EF Core, with Telo Ride's
  own instruments on the meter `Telo.Ride`, exported over OTLP when the standard
  `OTEL_EXPORTER_OTLP_ENDPOINT` setting is present. No span, metric or log carries a contact
  detail, token, message text, query string or body; a route is recorded as its template.
- **Settings.** Every setting the deployed service needs is listed in `docs/deployment.md`, in
  the same change that adds it.

How the static web app routes `/api`, `/hubs` and `/health` to this service is slice 1.4's
decision, in its own ADR.

## Consequences

- The rules that need more than one browser (progress, results, sessions) live once, in C#, and
  the bike's rules live once, in TypeScript. Nothing is written twice.
- A ride still never waits for the backend; the app works without it and sends finished rides
  when it is back (slice 17.1).
- There is now a service and a database to run, pay for and secure; ADRs and slices 1.4, 9 and
  22 carry that.
- The `migrate` command is a deployment step: a new version that changes the schema is migrated
  before it starts.
