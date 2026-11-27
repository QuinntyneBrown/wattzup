# Tremola, Gotthard Pass from the saddle

The historical GCN Low Cadence Workout supplies seven stages over thirty minutes with a three-second offset. The cobbled road rises from Airolo to the Gotthard hospice. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| The historic road, 0.14 km | [Before](before-setts.jpg) | [After](after-setts.jpg) | Hand-set granite fans lead uphill between low granite bollards, a yellow pass sign and the historic Tremola plaque. Real 01–03, 08, 12 and games 01–02. |
| Val Tremola turns, 2.34 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | The returning road climbs above massive dry-stone retaining walls. Several carriageways can be seen at different heights across the valley. Real 02–06, 10–13 and games 02–04. |
| The Ticino crossing, 4.61 km | [Before](before-torrent.jpg) | [After](after-torrent.jpg) | A stone arch spans the stream. Bright water crosses grey blocks below lingering snow patches on the rock face. Real 06, 09, 11–13 and games 03–04. |
| Airolo overlook, 6.55 km | [Before](before-airolo.jpg) | [After](after-airolo.jpg) | Houses and a motorway viaduct lie far below the stone parapet, with switchbacks winding into the Leventina valley. Real 04–05, 08, 10–13 and games 03–05. |
| The PostAuto bend, 8.46 km | [Before](before-postauto.jpg) | [After](after-postauto.jpg) | A yellow postbus passes a burgundy vintage car. A road cyclist climbs at low cadence alongside the granite edge stones. Real 01–03, 06–07, 12 and games 02–03. |
| The summit hospice, 10.69 km | [Before](before-hospice.jpg) | [After](after-hospice.jpg) | The pink hospice and stone museum overlook a small summit lake at 2,106 m. A yellow sign gives the pass name. Real 08, 13–15 and games 03–05. |

Fan-shaped sett courses bend with the road. Layered retaining walls, the Ticino arch and valley viaduct provide foreground and middle distance beneath the Alpine skyline. The PostAuto, vintage car and Ride One cyclists move with the ride clock. [Credited references](../../worlds/tremola/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| granite setts | 0 m | 0.12 km to 0.95 km | 120.33 | 119.94 | 10.0 ms | 31.2 ms | 72 |
| PostAuto bend | 8250 m | 0.12 km to 0.95 km | 119.97 | 119.82 | 10.1 ms | 36.4 ms | 84 |

Reproduce from the frontend workspace with `npm run perf -- tremola-tablet --headed`.
