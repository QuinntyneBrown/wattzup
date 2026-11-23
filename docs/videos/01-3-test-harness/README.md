# Slice 1.3 · Test harness

Telo Ride gets the doubles every later slice is proven against (L2-148): one shared Playwright fixture
with a fake `navigator.bluetooth` that records every write and pushes notifications on demand, answers
for the API, and a ride hub that speaks SignalR's JSON protocol, each failing the spec on anything it
did not expect; and, on the backend, `RideHub` with a real SignalR client connecting to the API hosted in
memory, a `FakeTimeProvider` in every fixture and an `EventProbe` that waits without sleeping. Riders see
nothing new.

- **Film:** [`01-3-test-harness.mp4`](01-3-test-harness.mp4), 1920×1080, 30 fps, 2 min 14 s, H.264 at
  CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-148 AC1 (Playwright fixtures), AC3 (hub tests), AC4 (fake time), and
  L2-127 AC1 (the hub needs a session).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home in a browser window, over the aurora | Nothing real, **all proven.** |
| 0:10 | 4 | `doubles` | The app and the three doubles around it, drawn | Three doubles, **one fixture.** |
| 0:21 | 4 | `bike` | The fake-bike spec: offer, pair, write, notify, and what it asserts | A bike that **keeps receipts.** |
| 0:31 | 4 | `strict` | The guard failing a spec on `requestDevice` | Unexpected? **Failed.** |
| 0:41 | 4 | `api` | An answered request, and the guard naming an unanswered one | Asked, and **answered.** |
| 0:52 | 4 | `hub` | The SignalR frames on `/hubs/ride` | SignalR, **played back.** |
| 1:02 | 4 | `server` | The real client in `RideHubTests`, and its two results | A real client, **in memory.** |
| 1:12 | 4 | `clock` | `FakeTimeProvider` in the factory, and `EventProbe`'s timeout | Time moves **when told.** |
| 1:23 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, a phone over it | Inside **the doubles.** |
| 1:33 | 4 | `proof` | The two test runs, and two cards: what the tests prove | Thirty checks, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a signal wipe into `bike`, pushes from `bike` into `strict` and from `strict` into `api`,
and a zoom through the `clock` terminal into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running Angular app, taken by [`shots.ts`](shots.ts) with the
  shared fixture (now with its three doubles installed) and page objects of `frontend/e2e/`, at 390,
  768, 1024 and 1440 px at double density. No backend and no bike ran for them.
- The code in `bike`, `api`, `server` and `clock` is the slice's own, trimmed (the clock's start time is
  shortened). The guard's failures are the real output of `e2e/harness.spec.ts` with its `test.fail`
  removed for one run. The hub frames are the ones `HubFixture` and `AppCalls` exchange in the hub
  spec; `␞` is the record separator SignalR ends each frame with. The test summaries are real output of
  `npx playwright test` and `dotnet test`.
- The diagram is drawn. Until slices 2.3, 9.1 and 14.1 bring the app's own Bluetooth, HTTP and hub
  clients, the harness spec makes those calls in the page through `AppCalls`.
- No time-driven rule exists yet; the fake clock is in place for the first (keepalive, slice 2.4).
- **What the tests prove:** six harness specs (three of them proving the guard fails a spec) among
  twelve behaviour specs, and eighteen backend tests, two of them a real SignalR client against the API
  hosted in memory (`frontend/e2e/harness.spec.ts`, `backend/tests/Telo.Ride.Api.Tests/RideHubTests.cs`;
  L2-148 AC1, AC3; L2-127 AC1).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/01-3-test-harness
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/01-3-test-harness
node tools/video-build/build.mjs docs/videos/01-3-test-harness --crf 23
```
