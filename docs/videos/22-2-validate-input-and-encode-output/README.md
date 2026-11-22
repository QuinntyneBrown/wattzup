# Slice 22.2 · Validate input and encode output

Every request with input now has a validator (L2-129 AC1). Class and map ids keep the catalogue's shape, session ids
their class or map and start, power stays from 0 to 2,000 W, and output and distance never fall below zero. A field
that breaks its rule, or a body of the wrong type, is refused with 400, code `validation_failed` and `errors` naming
the field as the app sends it, with a trace id and no .NET type name (AC4). The ride hub refuses the same way, with a
`HubException` ending `validation_failed: powerWatts`. A bike whose Bluetooth name holds markup pairs and shows its
name character for character, on Connect Bike and in the header; nothing in it runs (AC2). ESLint refuses an
`[innerHTML]` or `[outerHTML]` binding and any `bypassSecurityTrust*` call.

- **Film:** [`22-2-validate-input-and-encode-output.mp4`](22-2-validate-input-and-encode-output.mp4), 1920×1080, 30 fps,
  1 min 53 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-129 AC1, AC2, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike after pairing a bike named with markup, at 1440 px in a browser over the aurora | Data in, **text out.** |
| 0:10 | 5 | `rules` | The shapes the validators share | A rule for **every field.** |
| 0:23 | 5 | `refused` | The built API refusing an id that is not one and an email sent as a number | 400, **naming the field.** |
| 0:36 | 5 | `hub` | A real SignalR client refused on power and on a map id | The hub, **the same rule.** |
| 0:49 | 5 | `text` | The bike's name on Connect Bike and in the header, close up | Markup, **shown as text.** |
| 1:01 | 4 | `lint` | ESLint refusing an `[innerHTML]` binding and a sanitiser bypass | No way **round it.** |
| 1:12 | 4 | `widths` | Connect Bike growing from 390 through 768 and 1024 to 1440 px | Connect Bike, **at every width.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `refused`, a wipe and a push into `text`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flow of `e2e/untrusted-text.spec.ts`; the fake Bluetooth stack offers
  the bike. The terminal in `refused` holds the real answers of the built API, run in Development on
  `localhost:5310`; the one in `hub` restates `InputValidationTests`' hub cases, and the one in `lint` holds ESLint's
  real output with the binding and the bypass put in by hand, then taken out.
- **What this slice adds:** `InputRules` and eleven validators in `Telo.Ride.Application`; `InvalidBodyResponse` and
  `ValidationHubFilter` in `Telo.Ride.Api`; `InputValidationTests` and `e2e/untrusted-text.spec.ts`; and the two ESLint
  rules. A join with a malformed session id is now `validation_failed`, not `session_not_found`. Every check passes.
- Not shown: queries built with parameters (L2-129 AC3), which EF Core's LINQ already does everywhere; the email, code,
  display name and custom workout, which keep their own codes; feedback's validator (slice 26.2).
