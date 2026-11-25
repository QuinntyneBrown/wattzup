# Passo Campolongo from the saddle

Choose Passo Campolongo in Map Select. The eleven stages of GCN’s Intense Climb: Passo Campolongo run for 21:50. The 8.235 km race climbs 307 m from Corvara at 1,568 m to the 1,875 m saddle. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Corvara, 0.08 km | [Before](before-corvara.jpg) | [After](after-corvara.jpg) | Village hotels and Sassongher above the roofs. Real 03, 07, 10, 12, 14 and game 04. |
| Village church, 0.43 km | [Before](before-church.jpg) | [After](after-church.jpg) | White plaster, timber balconies and a pointed church tower. Real 07–08, 10, 12, 14 and game 04. |
| Lower forest, 2.16 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Grey asphalt, spruce, larch, chevrons and guardrails on a returning bend. Real 01–05 and games 02–03, 05. |
| Sassongher opening, 3.46 km | [Before](before-sassongher.jpg) | [After](after-sassongher.jpg) | The isolated limestone horn reappears above the valley trees. Real 06, 09, 10, 12 and game 01. |
| Ski crossing, 5.12 km | [Before](before-lift.jpg) | [After](after-lift.jpg) | Chairlift towers and moving carriers cross an opening in the forest. Real 05, 06 and 13, games 01 and 03. |
| Upper pasture, 6.42 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Brown-and-white cattle graze behind the wood fence among hay barns. Real 06, 11 and 15 and game 01. |
| Campolongo saddle, 8.05 km | [Before](before-pass.jpg) | [After](after-pass.jpg) | The pass sign and rifugio stand below the snow-streaked Sella wall. Real 06, 09, 11 and 15, games 01 and 04. |

The Corvara buildings and upper rifugio reuse the Sella Ronda kit’s Ladin building geometry. The pointed church tower, timber balconies, multilingual signs and the isolated Sassongher distinguish the village. The Sella wall and Piz Boè stand at another bearing like Caribana’s fixed skyline behind its detailed foreground. Guardrails hug physical hairpins in spruce and larch. The forest opens into pasture with hay barns, cattle and wooden fences. Lift carriers travel both sides of their sagging cables. A single route condenses the village-to-pass climb to the original class distance. [Credited references](../../worlds/campolongo/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Forested hairpins below Sassongher | 2010 m | 0.12 km to 0.96 km | 119.99 | 119.83 | 10.2 ms | 30.1 ms | 164 |
| Chairlift and grazing pasture | 4960 m | 0.12 km to 0.95 km | 120.25 | 119.92 | 10.2 ms | 64.3 ms | 160 |

Reproduce from the frontend workspace with `npm run perf -- campolongo-tablet --headed`.
