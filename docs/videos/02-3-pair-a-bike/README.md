# Slice 2.3 · Pair a bike

One press on Connect Bike opens the browser's list of bikes, asking for the Echelon service or FTMS
with Heart Rate optional, and connects to the bike the rider picks (L2-011 to L2-015). The card
names it from what it advertises (`ECH-EX5S-141844` is Echelon EX-5s, `EX5S-141844`). Pairing
subscribes before it writes, then writes the three initialisation commands one at a time, at least
300 ms apart, and the card is Paired on the bike's first notification. A closed list leaves no
error; a policy that blocks it is named in plain words with **Try again**. FTMS bikes subscribe to
their data and control point, read their range, and set resistance only once the bike grants
control. The bike is remembered, so Telo Ride opens on Home next time and reconnects without the
list. Keepalive and reconnects follow in slice 2.4.

- **Film:** [`02-3-pair-a-bike.mp4`](02-3-pair-a-bike.mp4), 1920×1080, 30 fps, 2 min 25 s, H.264
  at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a
  player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-011 AC3 to AC5 (the card, Pairing, Paired), L2-012 AC1 to AC5 (the
  chooser, a closed or blocked list, the hint), L2-013 AC1 to AC4 (initialisation), L2-014 AC1 to
  AC4 (FTMS), L2-015 AC1 (the remembered bike).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike pairing in a browser window, over the aurora | One press. **Paired.** |
| 0:10 | 4 | `press` | A close-up of the device card, the pair button and the hint | One press, **the browser’s list.** |
| 0:21 | 4 | `blocked` | The alert for a blocked chooser, on a phone | Blocked? **Said plainly.** |
| 0:31 | 4 | `identity` | The advertised name turned into the card's name and identifier, drawn | Its model, **its own number.** |
| 0:41 | 4 | `init` | The subscription and the three writes the fake bike recorded, in order | Subscribe, **then three writes.** |
| 0:52 | 4 | `pairing` | Close-ups of the card Pairing…, then Paired | Pairing…, **then Paired.** |
| 1:02 | 4 | `ftms` | An FTMS bike pairing, on a phone | Other bikes, **by FTMS.** |
| 1:12 | 4 | `remember` | Home opened again with the bike remembered, in a browser window | Remembered, **reconnected.** |
| 1:23 | 4 | `deferred` | What slice 2.4 and later bring | The next slice **keeps it connected.** |
| 1:33 | 4 | `shell` | Connect Bike pairing, growing from 390 through 768 and 1024 to 1440 px, a phone over it | Every width, **one press.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Eighty-seven, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `blocked`, `init` and `remember`, a signal wipe into `ftms`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the browser's chooser and for the bike: an Echelon
  advertising `ECH-EX5S-141844`, an FTMS bike advertising `KICKR BIKE 1A2B`, and a chooser blocked by
  a policy. No real bike or browser chooser was involved.
- The `init` terminal shows the order `frontend/e2e/pair-a-bike.spec.ts` asserts from the fake
  bike's log; the 300 ms gaps are proved by the unit tests of `GattWriteQueue` on a fake clock.
- The diagram and the cards are drawn.
- **What the tests prove:** twenty-five behaviour specs, eight of them for this slice
  (`frontend/e2e/pair-a-bike.spec.ts`: L2-011 AC3 to AC5, L2-012 AC1 to AC5, L2-013 AC1, AC2 and
  AC4, L2-014 AC1; `frontend/e2e/remembered-bike.spec.ts`: L2-015 AC1; and Home with no Bluetooth
  in `frontend/e2e/browser-support.spec.ts`: L2-010 AC5), and sixty-two unit tests, forty-five of
  them for this slice (the bike's identity, the write queue, the FTMS codec and link, the
  remembered bike).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/02-3-pair-a-bike
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/02-3-pair-a-bike
node tools/video-build/build.mjs docs/videos/02-3-pair-a-bike --crf 23
```
