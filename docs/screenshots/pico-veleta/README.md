# Pico Veleta from the saddle

GCN’s 55 Minute FTP Threshold Intervals supplies the historical 20-stage, 56-minute plan. The 25.25 km climb gains 1,258 m and keeps the three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Pradollano approach, 0.14 km | [Before](before-pradollano.jpg) | [After](after-pradollano.jpg) | A maintained A-395 lane passes the ski village, lift terminal and lower pines. The bare summit rises beyond the roofs. Real 02, 05, 12–14 and games 02–03. |
| The long switchbacks, 5.47 km | [Before](before-switchbacks.jpg) | [After](after-switchbacks.jpg) | A return bend cuts through slate and broom. The carriageway above the rider shows the next switchback. Real 01, 03–05, 08 and games 01–02. |
| The Granada overlook, 10.62 km | [Before](before-granada.jpg) | [After](after-granada.jpg) | The Vega and Granada lie far below the edge of the road. Brown foothills recede into blue haze. Real 03, 06, 11–12, 14 and games 02, 04. |
| The observatory ridge, 15.26 km | [Before](before-iram.jpg) | [After](after-iram.jpg) | The IRAM dish tilts above its pedestal beside the observatory domes. Snow gullies run below the crest. Real 05, 07, 10, 13 and games 02–03. |
| The upper barrier, 20.61 km | [Before](before-barrera.jpg) | [After](after-barrera.jpg) | The surface narrows and breaks up. A red-white barrier stands open beside scree and the last roadside snow. Real 01, 04, 07–09, 13 and games 01, 05. |
| The summit ridge, 24.98 km | [Before](before-mulhacen.jpg) | [After](after-mulhacen.jpg) | From Veleta, Mulhacén and a glacial lake fill the open ridge beyond the summit post. No trees reach this elevation. Real 04, 07–09, 11, 15 and games 03–05. |

The ski village, lower flora, slate and Sierra Nevada panoramas use original artwork. The grade follows the class uphill to the summit. The Pradollano gondolas, ribbed IRAM dish and Ride One cyclists follow the ride clock; near geometry and a fixed backdrop provide parallax. [Credited references](../../worlds/veleta/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Pradollano road | 0 m | 0.12 km to 0.95 km | 120.15 | 120.00 | 9.7 ms | 18.7 ms | 68 |
| observatory ridge | 15100 m | 0.12 km to 0.95 km | 120.55 | 120.00 | 9.6 ms | 13.7 ms | 60 |

Reproduce from the frontend workspace with `npm run perf -- veleta-tablet --headed`.
