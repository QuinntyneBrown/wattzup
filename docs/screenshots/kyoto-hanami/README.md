# Kyoto Hanami from the saddle

Eleven stages of GCN Training’s Cadence Training to Improve Pedalling run for 25:00 along a 10.400 km interpretation of the Philosopher’s Path. The route climbs 35 m. The video starts with the first stage. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Nanzen-ji, 0.08 km | [Before](before-nanzen.jpg) | [After](after-nanzen.jpg) | The approach passes the timber temple gate, broad tiled eaves and flanking white walls before joining the canal. Real 13–15 and games 03–04. |
| Lake Biwa canal, 1.54 km | [Before](before-canal.jpg) | [After](after-canal.jpg) | The water runs below the narrow path between inclined walls of fitted stone. Pale gravel and rectangular edging separate the rider from the canal. Real 01–04, 10–11 and games 01 and 03. |
| Granite bridge, 3.28 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | A low granite span crosses the canal to the opposite bank. The shaded opening and its reflection stay visible under the parapet. Real 02–03, 05 and 08–11 and games 01 and 05. |
| Hanami walk, 5.42 km | [Before](before-hanami.jpg) | [After](after-hanami.jpg) | Strollers and photographers gather under the pale pink canopy. Clusters of petals drift by and smaller petals float downstream. Real 01–03, 06–09 and games 01–03. |
| Tea shops, 7.46 km | [Before](before-tea.jpg) | [After](after-tea.jpg) | Low timber shop fronts, lattice screens, indigo curtains and the carved 哲学の道 path marker frame the near bank. Real 03–05, 09–11 and games 04–05. |
| Ginkaku-ji approach, 10.04 km | [Before](before-ginkaku.jpg) | [After](after-ginkaku.jpg) | Hedges and tiled timber buildings lead toward the Ginkaku-ji entrance, with green Higashiyama ridges beyond the last bridge. Real 04, 10–11 and 13–15 and games 03–05. |

Original sakura, stone and tea-shop textures sit on the two sides of the canal. Granite bridges cross between retaining walls and the two temple approaches. The tea shop has indigo noren, lanterns and the inscribed path marker. Higashiyama remains fixed behind the nearby buildings. Moving visitors, individually drifting petals and petals floating downstream follow the race clock. [Credited references](../../worlds/kyoto/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Nanzen-ji canal approach | 0 m | 0.12 km to 0.95 km | 120.35 | 120.00 | 9.8 ms | 14.9 ms | 58 |
| Hanami visitors and falling petals | 5120 m | 0.12 km to 0.95 km | 120.27 | 120.00 | 9.8 ms | 15.8 ms | 64 |

Reproduce from the frontend workspace with `npm run perf -- kyoto-tablet --headed`.
