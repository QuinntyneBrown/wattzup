# Slice 25.2 · Record the packet log

Diagnostics now keeps a packet log on the device. With "Log every packet" off it keeps the commands sent to the bike,
counted as "N commands · N KB" (L2-114 AC1); with it on, every message both ways, counted as packets with a
"Recording" tag (AC2). "Download packet log" saves `telo-ride-packets-{YYYY-MM-DD}.jsonl`, one JSON object per message
with its time, direction, frame type and hex bytes (AC3). The log holds 10 MB at most, the oldest dropped first (AC4).
Errors go to the browser console only, naming their area, with no email address or token; packet lines go there only
while recording (L2-115).

- **Film:** [`25-2-record-the-packet-log.mp4`](25-2-record-the-packet-log.mp4), 1920×1080, 30 fps, 1 min 43 s, H.264 at
  CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-114 AC1 to AC4, L2-115 AC2 and AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride at 1440 px with Diagnostics open on its packet log, in a browser window, over the aurora | The bytes, **kept here.** |
| 0:10 | 5 | `commands` | A close-up of the packet log with "Log every packet" off: its commands counted | Commands, **by default.** |
| 0:23 | 5 | `recording` | A close-up of the log recording, packets and the Recording tag, and Profile on a phone with the log | Every packet, **both ways.** |
| 0:36 | 5 | `file` | The first lines of the saved file, and its first two messages from the bike | One line **per message.** |
| 0:49 | 5 | `proof` | The spec's 2 failures before the change, its passes after, and the unit tests' 1916 passes | Failing first, **passing now.** |
| 1:01 | 4 | `widths` | Diagnostics' packet log over Profile growing from 390 through 768 and 1024 to 1440 px | The packet log, **at every width.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `recording`, a wipe and a push into `file`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the page objects of
  `e2e/packet-log.spec.ts`. The fake Bluetooth stack and the API fixture stand in for the bike and the backend. The
  file's lines are the real file `shots.ts` saved from that run; the other terminals hold the spec's real run before
  the change and after, and the unit tests' run.
- **What this slice adds:** the `PacketLog` and `AppLogger` contracts in `api`; `MemoryPacketLog`,
  `ConsoleAppLogger`, `packetLogSummary()` and `packetFrame()` in `domain`; the Bluetooth links' packet tap; the packet
  log under the facts in `DiagnosticsPanel`. Every check passes.
- Not shown: the 10 MB bound, proved by unit tests; attaching the log to a feedback report, which is slice 26's.
