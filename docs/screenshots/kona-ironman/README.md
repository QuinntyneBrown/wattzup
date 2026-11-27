# Kona Ironman from the saddle

The original seven stages of GCN’s High Intensity Race Day Effort follow 9.868 km of Queen Kaʻahumanu Highway to Aliʻi Drive. Resistance sets the 97 m of climbing. The class lasts 25:05 and starts three seconds into the video. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Queen K, 0.08 km | [Before](before-queen-k.jpg) | [After](after-queen-k.jpg) | Double yellow and white markings follow straight, rolling tarmac with a wide paved shoulder. Angular ʻaʻā and smooth pāhoehoe flank the road. Hualālai and the higher Mauna Kea silhouette stay fixed inland. Real 01–02, 05–08, 11 and 13–14; games 01 and 05. |
| Coral, 1.53 km | [Before](before-coral.jpg) | [After](after-coral.jpg) | Names on the verge are made from separate irregular pale stones. Dry fountain grass bends in the same crosswind across adjacent patches. Real 02, 05–08 and 13 for the dark verges; games 01 and 03. |
| Aero riders, 3.24 km | [Before](before-triathletes.jpg) | [After](after-triathletes.jpg) | Triathletes ride apart on the shoulder, with forearms on the extensions, aero helmets, numbers and dark disc wheels. Real 03, 04 and 10; games 02 and 05. |
| Aid station, 4.92 km | [Before](before-aid.jpg) | [After](after-aid.jpg) | Volunteers reach from behind cones and fold-out tables stacked with bottles. Tents and race bunting are visible before the rider reaches the station. Real 09 supplies crowd and banner scale at a Kona event. Real 03–06 and 09–10; games 02 and 04. |
| Coast, 7.30 km | [Before](before-coast.jpg) | [After](after-coast.jpg) | Pacific blue and wind-driven surf meet black shore shelves. The near road remains sharp and the low heat shimmer stays in the distance. Real 07, 08, 12, 13 and 15; games 03–05. |
| Aliʻi Drive, 9.51 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | The shoulder becomes a palm-lined seafront street with spectators, race banners and the finish arch. Real 09, 12 and 15; games 02–04. |

Fixed volcanic shields sit behind the coastal lava bench. A repeating original photographic texture covers the basalt, with larger ʻaʻā clasts and pāhoehoe folds modeled along the road. Individual coral stones spell messages on the verge. Numbered cyclists have aero helmets, bar extensions and rear disc wheels. Race time drives pedalling, wind in fountain grass and the distant heat shimmer. Original supporter cutouts occupy the aid station and palm-lined finish. Distant surf is baked into the coastal mesh. [Credited references](../../worlds/kona/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Queen K lava highway | 0 m | 0.12 km to 0.95 km | 120.26 | 120.00 | 9.7 ms | 14.7 ms | 65 |
| Aid station and time-trial riders | 4670 m | 0.12 km to 0.95 km | 120.08 | 120.00 | 9.8 ms | 22.4 ms | 70 |

Reproduce from the frontend workspace with `npm run perf -- kona-tablet --headed`.
