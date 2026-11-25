# Furka Pass from the saddle

Select Furka Pass to climb from Gletsch to the 2,429 m summit. GCN’s 45 Minute VO2 Max Intervals keeps its 15 stages. The 45:00 course covers 20.025 km with 672 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Gletsch valley, 0.08 km | [Before](before-gletsch.jpg) | [After](after-gletsch.jpg) | Chapel, shuttered hotel and valley road. Real 09–11 and 13, games 01 and 04. |
| Pasture, 2.46 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Swiss delineators and grazing cows on flowered turf. Real 08–09 and 13, game 04. |
| Switchbacks, 6.72 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | Stone kerbs lead into the turn beneath the snowfields. Real 03, 05, 08–10 and 12, games 02–03. |
| Hôtel Belvédère, 12.28 km | [Before](before-belvedere.jpg) | [After](after-belvedere.jpg) | The postbus approaches the bend beside the shuttered hotel. Real 01–02 and 06, games 04–05. |
| Rhône Glacier, 14.46 km | [Before](before-glacier.jpg) | [After](after-glacier.jpg) | A meltwater lake, the glacier toe and its protective blankets. Real 04, 06, 11 and 15, games 01–03. |
| Furka summit, 19.72 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | Pass sign, snowbanks, granite and alpine skyline. Real 05, 07, 12 and 14, games 02 and 05. |

The lower pasture, Gletsch chapel and inn, switchback arms and Hotel Belvédère occupy fixed locations. Green shutters sit above the hotel’s red gallery, with a yellow postbus on the approach. The road climbs above the ice tongue and meltwater, then passes between snowbanks. Cows, bus and valley cloud respond to ride time. The Rhône basin, the pass road and the Bernese skyline have distinct depths. [Credited references](../../worlds/furka/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Gletsch valley floor | 55 m | 0.12 km to 0.95 km | 120.34 | 119.98 | 9.7 ms | 22.2 ms | 39 |
| Belvédère hairpin and postbus | 11940 m | 0.12 km to 0.95 km | 120.41 | 120.00 | 9.6 ms | 13.4 ms | 66 |

Reproduce from the frontend workspace with `npm run perf -- furka-tablet --headed`.
