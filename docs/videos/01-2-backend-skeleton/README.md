# Slice 1.2 · Backend skeleton

Telo Ride gets its backend, kept thin (ADR 0025): four clean-architecture projects on .NET 10 that
reference only the layer before them, one MediatR request per controller action, health endpoints
that answer without a session, every other address refused without a signed-in rider, every
refusal as ProblemDetails with a `code`, OpenTelemetry on the `Telo.Ride` meter, and schema changes
applied only by the `migrate` command. Riders see nothing new: the app still rides on its own.

- **Film:** [`01-2-backend-skeleton.mp4`](01-2-backend-skeleton.mp4), 1920×1080, 30 fps, 2 min 14 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-147 (backend architecture), L2-127 (authentication and health),
  L2-148 AC2 (backend tests on EF Core InMemory).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home in a browser window, over the aurora | A backend, **kept thin.** |
| 0:10 | 4 | `layers` | The four projects and their references, drawn | Four layers, **one direction.** |
| 0:21 | 4 | `path` | Controller, ISender, validation, handler, IAppDbContext, drawn | One path, **every request.** |
| 0:31 | 4 | `health` | A terminal: liveness 200 Healthy, readiness 503 Unhealthy | Healthy, or **it says so.** |
| 0:41 | 4 | `auth` | A terminal: 401 ProblemDetails with code `unauthenticated` | No session, **no data.** |
| 0:52 | 4 | `refusals` | Three refusals: 400, 409 and 500 with their codes | Every refusal, **a code.** |
| 1:02 | 4 | `telemetry` | The `telo.ride.problems` count and a span with no query string | Measured, **never nosy.** |
| 1:12 | 4 | `migrate` | A terminal: the first migration, and the `migrate` command | Migrate first, **then start.** |
| 1:23 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, a phone over it | Rides on **its own.** |
| 1:33 | 4 | `proof` | The test run, and two cards: what the tests prove | Sixteen tests, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a signal wipe into `health`, pushes from `health` into `auth` and from `auth` into
`refusals`, and a zoom through the `migrate` terminal into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the shared fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. No backend and no bike ran for them.
- The `health` and `auth` terminals are real output of `curl -i` against the API built from this
  slice (`dotnet run --project backend/src/Telo.Ride.Api`) with no database running; the JSON is
  pretty-printed and the trace id shortened.
- The three refusals are the real bodies the acceptance tests receive from the test-only probe
  controller, trimmed to their fields. The `migrate` terminal is the real output of
  `dotnet ef migrations add InitialCreate` and of the `migrate` command on a machine with no
  database, which exits 1. The test summary is the real output of `dotnet test`.
- The diagrams, and the meter and span card, are drawn: the card shows what
  `TelemetryTests` asserts through OpenTelemetry's in-memory exporters, not a collector's screen.
- **What the tests prove:** sixteen acceptance tests through the API, on the API hosted in memory
  over EF Core InMemory, one store per fixture, with no real database, file or sleep
  (`backend/tests/Telo.Ride.Api.Tests`; L2-147, L2-127, L2-148 AC2).
- The layer direction is held by project references, not by a test (ADR 0025).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/01-2-backend-skeleton
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/01-2-backend-skeleton
node tools/video-build/build.mjs docs/videos/01-2-backend-skeleton --crf 23
```
