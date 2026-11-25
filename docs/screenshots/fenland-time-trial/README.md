# Fenland Time Trial from the saddle

Choose Fenland Time Trial in Map Select. The eight stages of GCN Training’s Tough Time Trial Efforts cover 15 km in 35:00. Ramps to the raised banks account for 9 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening drove, 0.08 km | [Before](before-drove.jpg) | [After](after-drove.jpg) | Straight single-track asphalt and peat fields below a wide cloud bank. Real 01 and 03–05, game 04. |
| Forty Foot Drain, 2.46 km | [Before](before-drain.jpg) | [After](after-drain.jpg) | Parallel water, access bridge and reed beds beside a brick farmstead. Real 02, 06, 09, 12 and 15, game 05. |
| Harvest straight, 5.45 km | [Before](before-harvest.jpg) | [After](after-harvest.jpg) | Crosswind dust moves across the lane. Field colours, furrows and crop textures draw on real 05, 09 and 13–14, games 01 and 05. |
| Drainage windpump, 7.89 km | [Before](before-pump.jpg) | [After](after-pump.jpg) | Timber sails and modern white turbines share the horizon. Real 10 and 14 inform the flat skyline and game 03 the landmark proportions. |
| Great Ouse crossing, 10.72 km | [Before](before-ouse.jpg) | [After](after-ouse.jpg) | Bridge rails and grassy banks frame the river above the surrounding fields. Real 08, 09 and 15, games 02 and 04. |
| Approach to Ely, 13.94 km | [Before](before-ely.jpg) | [After](after-ely.jpg) | The west tower and octagonal crossing lantern rise above the long nave. Real 07 and 10–12, games 02–03. |

The drove lane, reed-filled drains, cultivated peat and distant cathedral pass at different rates, like the foreground and skyline of Caribana. The bank-top road crosses the Great Ouse above the field level. The windpump has timber lattice sails, and the taller turbines turn against a moving East Anglian sky. Dust and broad cloud shadows follow the ride clock. Ely, the mill and the river are brought together along the length of the original workout. All fifteen real photographs and five game views were restored with their original credits. [Credited references](../../worlds/fens/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Opening drove road | 55 m | 0.12 km to 0.95 km | 120.62 | 120.00 | 9.6 ms | 14.9 ms | 59 |
| Great Ouse bank and crossing | 10350 m | 0.12 km to 0.95 km | 120.45 | 120.00 | 9.6 ms | 17.3 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- fens-tablet --headed`.
