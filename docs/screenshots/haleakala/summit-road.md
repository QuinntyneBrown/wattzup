# Haleakalā from the saddle

Choose Maximum Intensity Hill Climb Efforts in Map Select. The original 11-stage GCN Training workout lasts 35:00. The road covers 15.75 km and climbs 923 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Pāʻia, 0.08 km | [Before](before-paia.jpg) | [After](after-paia.jpg) | Lowland palms and open coastal sky. Real 09, game 03. |
| Kula, 4.83 km | [Before](before-kula.jpg) | [After](after-kula.jpg) | Upcountry pasture and tree belts. Real 07–08, game 01. |
| Cloud belt, 8.77 km | [Before](before-cloudbelt.jpg) | [After](after-cloudbelt.jpg) | The inversion separates upland road from the coast. Real 03–04 and 06, game 04. |
| Cinder slope, 11.49 km | [Before](before-cinder.jpg) | [After](after-cinder.jpg) | Coarse volcanic ground borders the upper road. Real 10–15, game 02. |
| Silversword garden, 13.44 km | [Before](before-garden.jpg) | [After](after-garden.jpg) | A flowering silversword grows on the roadside. Real 01–02, game 05. |
| Science City, 15.68 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | The road approaches the solar observatory. Real 05–06, game 04. |

Grazing horses lower their heads in Kula pasture and the trade-wind cloud bank drifts with ride time. Original eucalyptus and jacaranda crowns give way to volcanic scoria. Folded silvery leaves radiate from each silversword and the flowering plant carries clusters along its central stalk. The solar telescope rises above the summit with a segmented dome, service panels and catwalk. [Credited references](../../worlds/haleakala/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Pāʻia coast and plantation | 0 m | 0.12 km to 0.95 km | 120.71 | 120.00 | 9.7 ms | 21.4 ms | 53 |
| Upper silversword colonies | 13200 m | 0.12 km to 0.95 km | 120.28 | 120.00 | 9.6 ms | 14.2 ms | 49 |

Reproduce from the frontend workspace with `npm run perf -- haleakala-tablet --headed`.
