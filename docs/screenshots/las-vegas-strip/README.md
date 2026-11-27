# Las Vegas Strip from the saddle

The historical Quick HIIT Sprint Workout carries 22 stages over 20 minutes and 9 km of Las Vegas Boulevard. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| The Welcome sign, 0.14 km | [Before](before-welcome.jpg) | [After](after-welcome.jpg) | The white diamond and starburst stand on a planted median. Palm crowns frame the first stretch of broad boulevard beneath the Luxor beam. Real 01, 06, 08–09 and games 02–03. |
| New York-New York, 1.86 km | [Before](before-newyork.jpg) | [After](after-newyork.jpg) | Art Deco towers rise beyond red and yellow marquees. Taxis and a stretch limousine cruise in the neighbouring lanes. Real 01–04, 06–08 and games 01–03. |
| Bellagio fountain lake, 3.84 km | [Before](before-bellagio.jpg) | [After](after-bellagio.jpg) | Rows of white jets rise at different heights in front of the illuminated hotel and reflect in the lake. Real 02, 10–11, 14–15 and games 03–05. |
| Paris and Caesars, 4.78 km | [Before](before-paris.jpg) | [After](after-paris.jpg) | The Eiffel lattice and blue globe rise across the road from classical colonnades. Light from LED boards shifts across the asphalt. Real 02, 04–06, 12 and games 01, 03–04. |
| The Venetian footbridge, 6.33 km | [Before](before-venetian.jpg) | [After](after-venetian.jpg) | The campanile and gilded arcades stand behind a pedestrian bridge, lit palms, crowds and a party bus. Real 03, 05–08, 12 and games 03–05. |
| The northern skyline, 8.81 km | [Before](before-roller.jpg) | [After](after-roller.jpg) | The High Roller turns above the hotel terraces while the narrow Strat shaft and its observation pod mark the next light. Real 01, 04, 12–14 and games 01–03. |

The Race shares the class Welcome sign artwork. The fountain jets, Strip traffic and High Roller move on the ride clock. Merged casino geometry, repeated palm crowns and the layered skyline follow the Caribana approach. [Credited references](../../worlds/vegas/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Welcome median | 0 m | 0.11 km to 0.95 km | 120.26 | 119.82 | 10.3 ms | 58.7 ms | 59 |
| Bellagio lake | 3660 m | 0.12 km to 0.95 km | 119.28 | 119.08 | 10.7 ms | 95.8 ms | 64 |

Reproduce from the frontend workspace with `npm run perf -- vegas-tablet --headed`.
