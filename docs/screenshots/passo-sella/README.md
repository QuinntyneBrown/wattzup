# Passo Sella from the saddle

The 11.64 km climb gains 619 m. GCN Training’s Fat Burning Climb: Passo Sella retains all ten stages, its 26:00 duration and three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Larch wood, 0.08 km | [Before](before-larches.jpg) | [After](after-larches.jpg) | Warm larches and darker spruce enclose the lower SS242. A white edge line and delineator posts follow the road into a sunlit opening. Real 02, 12 and 15. Game 03.. |
| Numbered tornante, 2.46 km | [Before](before-tornante.jpg) | [After](after-tornante.jpg) | Look across the inside of a numbered hairpin toward the next stretch of smooth road. A motorbike leans on the far arm and climbs away. Real 01, 02 and 04. Games 02 and 04.. |
| Hay barn and pasture, 4.92 km | [Before](before-fienile.jpg) | [After](after-fienile.jpg) | A dark larch hay barn sits on a stone foot in a sloping meadow. Cattle lower their heads among patches of alpine flowers. Real 04, 12, 14 and 15. Games 01 and 03.. |
| Sassolungo walls, 7.29 km | [Before](before-langkofel.jpg) | [After](after-langkofel.jpg) | Three distinct pale towers stand over a continuous scree apron. Their deep clefts and sunlit facets clear the treeline above the cyclist group. Real 01, 07–09 and 11. Games 01, 02 and 05.. |
| Città dei Sassi, 9.74 km | [Before](before-sassi.jpg) | [After](after-sassi.jpg) | Angular limestone blocks rise alongside the road between dwarf pines. Across the saddle the Sella group has a tiered table-like rim. Real 10–13. Games 04 and 05.. |
| Passo Sella summit, 11.58 km | [Before](before-sellajoch.jpg) | [After](after-sellajoch.jpg) | A summit sign reads Passo Sella / Sellajoch 2244 m beside the rifugio. Timber balconies, the gravel forecourt and white road edge remain visible against the mountains. Real 05–07 and 14. Games 01 and 02.. |

The SS242 climbs through larches, banked bends and hay barns to the stone field beneath Sassolungo. A motorbike leans through a hairpin, cows graze below the towers and cyclists pedal toward the bilingual summit board. [Credited references](../../worlds/sella/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| lower larch bends | 0 m | 0.12 km to 0.95 km | 120.08 | 120.00 | 9.9 ms | 17.4 ms | 41 |
| Città dei Sassi and summit approach | 9710 m | 0.12 km to 0.95 km | 120.48 | 120.00 | 9.8 ms | 17.4 ms | 48 |

Reproduce from the frontend workspace with `npm run perf -- sella-tablet --headed`.
