# Iceland Ring Road from the saddle

Choose Route 1 in Map Select. GCN Training’s Intense VO2 Cycling Efforts retains all nineteen stages and its zero-second video offset. The 30:00 workout spans 12 km and climbs 91 m. The grade follows target resistance and stage length follows cadence. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Route 1, 0.08 km | [Before](before-poles.jpg) | [After](after-poles.jpg) | Yellow poles and the red roof of the small white church mark the treeless approach. Real 01–03 and 13; games 01 and 03. |
| Skógafoss, 2.42 km | [Before](before-falls.jpg) | [After](after-falls.jpg) | The broad waterfall drops from moss-topped basalt and breaks into spray below. Real 05 and 06; games 01 and 03. |
| Vík, 4.31 km | [Before](before-vik.jpg) | [After](after-vik.jpg) | Basalt columns and dark stacks line the black shore. Low warm sunlight catches the water. Real 07, 08 and 14; games 02 and 05. |
| Eldhraun, 6.12 km | [Before](before-lava.jpg) | [After](after-lava.jpg) | Irregular moss lobes cover the lava beside the gravel shoulder. Real 03 and 09; games 01 and 03. |
| Braided river, 8.54 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The carriageway narrows between steel rails above branching glacial channels. Real 02, 04 and 11; games 01 and 04. |
| Jökulsárlón, 10.96 km | [Before](before-lagoon.jpg) | [After](after-lagoon.jpg) | Broken turquoise ice and grazing animals frame the snowcap beyond the final bend. Real 04, 10–12 and 15; games 04 and 05. |

Skógafoss is broad under its flat brow, and Seljalandsfoss forms a narrow separate jet against the overhang. The black strand gives way to mossy lava, then braided glacial channels. Angular blue bergs drift in front of a modeled glacier tongue and a fixed original Vatnajökull image. Yellow road-edge poles and the low midnight sun give the rider direction. The route uses the same near-to-far division as Caribana’s parade, with a detailed head or cascade only near the bike. Generated distant artwork and the baked grit texture are original. The animal heads, moving water and ice share one material per group. Pause and reduced motion hold their poses. [Credited references](../../worlds/iceland/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Route 1 opening | 0 m | 0.12 km to 0.95 km | 117.92 | 117.83 | 9.7 ms | 296.9 ms | 51 |
| Glacial river, grazing horses and lagoon | 10280 m | 0.12 km to 0.95 km | 120.68 | 120.00 | 9.7 ms | 14.0 ms | 58 |

Reproduce from the frontend workspace with `npm run perf -- iceland-tablet --headed`.
