# Slice 26.1 · Send feedback

"Feedback" in the custom ride's header pauses the ride and opens "Send feedback": a bottom sheet on a phone, a 400 px
popover under the button from sm (L2-116 AC1, AC4). Bug, Improvement and Kudos each change the question, its example
and the send button; a message over 2,000 characters is refused with its count (AC2, AC3). A bug offers "Attach
diagnostics", checked; every note carries the ride's context, listed under "Attached from Ride"; a bug report with
diagnostics carries the last 1 MB of the packet log and the app version, never a token (L2-117). Sending locks the form
with "Sending…"; the thanks fits the kind; a failure keeps the message and says so; Done leaves the ride paused
(L2-118).

- **Film:** [`26-1-send-feedback.mp4`](26-1-send-feedback.mp4), 1920×1080, 30 fps, 1 min 43 s, H.264 at CRF 25 and
  AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-116 AC1 to AC4, L2-117 AC1 to AC4, L2-118 AC1 to AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride at 1440 px with Send feedback open under Feedback, in a browser window, over the aurora | Say what happened, **mid-ride.** |
| 0:10 | 5 | `kinds` | Close-ups of the form as a bug, with Attach diagnostics, and as kudos | Bug, idea **or kudos.** |
| 0:23 | 5 | `context` | A close-up of the form with "Attached from Ride" open on the ride's facts | The ride, **as it stood.** |
| 0:36 | 5 | `sending` | Close-ups of the form sending, and of the bug report's thanks with Send another and Done | Sent, **and still paused.** |
| 0:49 | 5 | `proof` | The spec's 7 failures before the change, its 21 passes after, and the unit tests' 1934 passes | Failing first, **passing now.** |
| 1:02 | 4 | `widths` | Send feedback on the ride growing from 390 (a bottom sheet) through 768 and 1024 to 1440 px | Send feedback, **at every width.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `context`, a wipe and a push into `sending`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the page objects of
  `e2e/feedback.spec.ts`. The fake Bluetooth stack and the API fixture stand in for the bike and the backend, which
  answers `POST /api/feedback` with 201. The terminal holds the spec's real run before the change and after, and the
  unit tests' run.
- **What this slice adds:** the `FeedbackApi` contract and `HttpFeedbackApi` and `PacketLog.tail()` in `api` and
  `domain`; `FeedbackForm` and `FeedbackContextDetails` in `components`; `FeedbackStore`, `FeedbackDialog`,
  `openFeedback()`, `FEEDBACK_KIND_COPY` and `rideFeedbackContext()` in `ride`; the Feedback button in the ride header.
  Every check passes.
- Not shown: the backend that receives the note, which is slice 26.2; until it lands, a real send fails and keeps the
  message.
