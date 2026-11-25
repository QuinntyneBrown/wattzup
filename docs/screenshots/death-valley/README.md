# Death Valley from the saddle

Badwater Road condenses the salt basin, Mesquite dunes and Furnace Creek into the original 15-stage GCN Sufferfest 20 Minute Session. The workout lasts 23:00 over 9.781 km and gains 40 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Badwater Road, 0.08 km | [Before](before-road.jpg) | [After](after-road.jpg) | Paired yellow lines and cracked asphalt cross gravel beside the escarpment. Real 01–02 and 09–10, game 01. |
| Badwater Basin, 0.89 km | [Before](before-badwater.jpg) | [After](after-badwater.jpg) | A timber boardwalk and brown elevation sign stand at the brine margin. Real 03–06 and games 01–02. |
| Salt flats, 2.28 km | [Before](before-salt.jpg) | [After](after-salt.jpg) | Salt crust stretches towards the Panamints and Telescope Peak. Real 04–08 and 15, games 02–03. |
| Alluvial fans, 4.63 km | [Before](before-fan.jpg) | [After](after-fan.jpg) | Dark strata cross the Black Mountains above creosote, saltbush and desert holly. Real 09–10 and 14–15, games 01 and 04. |
| Mesquite dunes, 7.74 km | [Before](before-dunes.jpg) | [After](after-dunes.jpg) | Gold windward faces and shaded slip faces appear beyond the cracked salt. Real 11–13 and games 03–05. |
| Furnace Creek, 9.07 km | [Before](before-furnace.jpg) | [After](after-furnace.jpg) | The tall thermometer and aid tents punctuate the cool-down and ravens circle overhead. Real 03, 09 and 13, games 02 and 05. |

The below-sea-level sign and brine pool occupy a single timber landing. The near Black Mountains use relief with folded rock and gravel gullies. Telescope Peak stays on the far horizon across the salt beneath a high sun. Like Caribana’s layered skyline, the distant silhouette, geological faces, verge and scrub move past the rider at different rates. The course reuses the authored salt crust, ravens, aid tents, crowd, park sign and thermometer. The mirage and ravens follow ride time. The long gaps between the real sites are compressed to the original workout. [Credited references](../../worlds/deathvalley/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Badwater boardwalk and salt fans | 540 m | 0.12 km to 0.95 km | 118.85 | 118.82 | 10.6 ms | 57.0 ms | 108 |
| Furnace Creek aid station and ravens | 8560 m | 0.12 km to 0.95 km | 120.10 | 120.01 | 9.8 ms | 16.8 ms | 102 |

Reproduce from the frontend workspace with `npm run perf -- deathvalley-tablet --headed`.
