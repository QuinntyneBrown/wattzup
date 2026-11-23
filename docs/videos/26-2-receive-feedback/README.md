# Slice 26.2 · Receive feedback

`POST /api/feedback` stores a signed-in rider's report with its kind, message, context, a bug report's diagnostics, the
rider's account and the time, and answers 201 with its id (L2-119 AC1). Without a session it is refused with 401 (AC2).
The 11th report from one rider in an hour is refused with 429 `rate_limited` and a `Retry-After`, counted from stored
reports (AC3). The message and context are kept as data; the team reads reports with `dotnet Telo.Ride.Api.dll
feedback`, as JSON Lines that name a rider by id, never by email (AC4). Telemetry counts feedback by kind alone, and
account erasure removes it.

- **Film:** [`26-2-receive-feedback.mp4`](26-2-receive-feedback.mp4), 1920×1080, 30 fps, 1 min 43 s, H.264 at CRF 25
  and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-119 AC1 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride at 1440 px with the bug report's thanks after a 201, in a browser window, over the aurora | Every note, **received.** |
| 0:10 | 5 | `stored` | The acceptance tests' names, from `grep` in the backend's tests | Stored, **with 201.** |
| 0:23 | 5 | `limit` | Close-ups of a bug report being written, and of an idea refused with 429, its note kept and the error shown | Ten **an hour.** |
| 0:36 | 5 | `read` | What the `feedback` command wrote in a test run: a bug report, trimmed with "…", and kudos whose markup stays escaped | Read as data, **never as HTML.** |
| 0:49 | 5 | `proof` | The tests failing with NotFound before the endpoint, then 14 and all 534 backend tests passing | Failing first, **passing now.** |
| 1:02 | 4 | `widths` | The thanks on the ride growing from 390 through 768 and 1024 to 1440 px | The thanks, **at every width.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `limit`, a wipe and a push into `read`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the page objects of
  `e2e/feedback.spec.ts`, with the API fixture answering 201 and 429 as this slice's backend does; no real backend or
  database ran. The terminals hold real outputs: the tests' names, what the `feedback` command wrote in a run of
  `FeedbackTests` against the API hosted in memory (trimmed with "…"), and the test runs before and after.
- **What this slice adds:** `FeedbackController`, `SubmitFeedbackCommand` with its validator and handler,
  `ListFeedbackQuery`, the `FeedbackReport` entity and its migration, `IFeedbackMetrics` on `TeloRideMetrics`, the
  `feedback` command, feedback in account erasure, and nested field names camel-cased in `validation_failed`. Every
  check passes.
- Not shown: a real database, which no test or film uses; a separate message for a 429 in the dialog, which still
  shows its generic failure.
