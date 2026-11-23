# Slice 1.4 · CI and hosting

Telo Ride gets its home on the web and its pipeline (L2-149, ADR 0026). One Azure App Service runs
`Telo.Ride.Api`, which serves the ride app's build from `wwwroot` as well as the backend: every route
answers the app, never cached stale, with the headers of L2-131, while `/api`, `/hubs` and `/health`
stay the backend's. On every push GitHub Actions runs lint, the production builds and one critical
acceptance path per feature in three parallel jobs, green in 1:24 on its first run; on `main` the
deploy publishes the API with the app inside, migrates, then ships. Riders see the same app.

- **Film:** [`01-4-ci-and-hosting.mp4`](01-4-ci-and-hosting.mp4), 1920×1080, 30 fps, 2 min 14 s, H.264
  at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a
  player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-149 AC1 to AC3 (hosting and delivery), L2-131 AC4 (headers), L2-127
  (backend paths need a session).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home in a browser window, over the aurora | One origin, **every push.** |
| 0:10 | 4 | `origin` | The App Service and the paths it answers, drawn | One site, **one origin.** |
| 0:21 | 4 | `deeplink` | `curl -i /race` against the API serving the real build | Every route, **served.** |
| 0:31 | 4 | `guarded` | `curl -i /api/progress`: 401 ProblemDetails, with the headers | The backend's, **not the app's.** |
| 0:41 | 4 | `pipeline` | Push, the three parallel jobs and the deploy, drawn | Three jobs, **side by side.** |
| 0:52 | 4 | `run` | The first run's three job times | Green in **1:24.** |
| 1:02 | 4 | `critical` | The critical paths' output in GitHub Actions | Critical, **not everything.** |
| 1:12 | 4 | `deploy` | The deploy job's steps | Migrate, **then ship.** |
| 1:23 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, a phone over it | Served **as one.** |
| 1:33 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Thirty-eight, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a signal wipe into `deeplink`, pushes from `deeplink` into `guarded` and from `guarded`
into `pipeline`, and a zoom through the `deploy` terminal into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running Angular app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density.
  No backend and no bike ran for them.
- The `deeplink` and `guarded` terminals are real output of `curl -i` against the API built from this
  slice serving the real production build (`dotnet run --no-launch-profile … -- --webroot
  ../frontend/dist/ride/browser`, `ASPNETCORE_ENVIRONMENT=Production`) with no database running,
  trimmed: the policy is cut to three of its directives, and the date, server and ETag lines are left out.
  The same app, loaded from that API in Chromium, rendered with no console error or policy violation.
- The job times and the `critical` output are from the workflow's first run on GitHub (run
  44903799853), on the slice's branch with cold caches; the deploy job was skipped because no host is
  provisioned yet. The `deploy` terminal is the job's own steps, trimmed; it has not run.
- The diagrams are drawn.
- **What the tests prove:** twenty-six backend tests, eight of them on hosting
  (`backend/tests/Telo.Ride.Api.Tests/HostingTests.cs` over an in-memory web root; L2-149 AC1 and AC2,
  L2-131 AC4), and twelve behaviour specs, two tagged `@critical`. The pipeline's own proof is its run.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/01-4-ci-and-hosting
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/01-4-ci-and-hosting
node tools/video-build/build.mjs docs/videos/01-4-ci-and-hosting --crf 23
```
