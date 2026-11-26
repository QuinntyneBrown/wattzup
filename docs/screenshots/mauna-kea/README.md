# Mauna Kea from the saddle

GCN Training’s 60 Minutes of Brutal Power retains 15 stages over 60:00 and 25.825 km with a three-second video offset. The climb rises from 2,170 m past the 2,800 m visitor stop to the summit at 4,207 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Saddle Road lava fields, 0.08 km | [Before](before-saddle.jpg) | [After](after-saddle.jpg) | Black lava hummocks and pale grass border the yellow-lined tarmac. Mauna Loa forms a broad, low shoulder behind the saddle. Real 06–07 and 11. Games 01 and 04.. |
| Māmane woodland, 4.42 km | [Before](before-mamane.jpg) | [After](after-mamane.jpg) | Twisted māmane trunks and sparse grey-green crowns give way to an increasingly open hillside. Cloud drifts across the lower switchbacks. Real 04–07. Games 04–05.. |
| Onizuka visitor station, 8.98 km | [Before](before-onizuka.jpg) | [After](after-onizuka.jpg) | A stone visitor building, silversword rosettes, cones and a four-wheel-drive sign mark the transition to the unpaved climbing road at 2,800 m. Real 04–05. Games 01 and 03.. |
| Cinder switchbacks, 14.74 km | [Before](before-cinder.jpg) | [After](after-cinder.jpg) | The gravel road cuts into bare red and ochre cones. A service vehicle climbs the next bend, with the low cloud deck visible beyond it. Real 03, 09, 13–14. Games 02–03 and 05.. |
| Observatory ridge, 21.96 km | [Before](before-telescopes.jpg) | [After](after-telescopes.jpg) | Two Keck domes, Subaru’s cylindrical enclosure and Gemini’s silver segmented dome stand on the ridge. Dark access shutters and platforms interrupt the pale metal shells. Real 01–02, 08–11. Games 01–03.. |
| Summit at sunset, 25.24 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | The high paved road passes a summit altitude marker. Orange light crosses the domes and catches the cloud tops below the ridge. Real 09–15. Games 01 and 03.. |

Black lava, tufts of pale grass and māmane give way to red cinder above the visitor station. Gravel switchbacks lead to the paved observatory ridge. The service pickup follows the road, the cloud bank drifts and the Gemini enclosure turns with the race clock. Fixed Keck domes and the Subaru enclosure overlook the final climb into sunset. [Credited references](../../worlds/maunakea/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Saddle Road lava fields | 0 m | 0.12 km to 0.95 km | 120.18 | 119.62 | 10.2 ms | 53.7 ms | 39 |
| Observatory ridge above the clouds | 21740 m | 0.12 km to 0.95 km | 120.27 | 119.99 | 9.8 ms | 24.1 ms | 46 |

Reproduce from the frontend workspace with `npm run perf -- maunakea-tablet --headed`.
