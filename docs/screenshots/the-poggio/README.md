# The Poggio from the saddle

GCN Training’s Tempo Efforts With Sprint Finishes retains 15 stages over 28:30 with zero video offset. The 11.55 km course climbs 179 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| SS1 Aurelia, 0.08 km | [Before](before-aurelia.jpg) | [After](after-aurelia.jpg) | The coast road runs between green-shuttered Riviera houses and a stone seawall. Canary palms and a palm-shadowed zebra crossing break up the seafront. Real 03, 04, 08, 10 and 15. Games 02 and 05.. |
| Capo headlands, 1.84 km | [Before](before-capo.jpg) | [After](after-capo.jpg) | The capes overlap over the Ligurian Sea. An arched road tunnel pierces the nearest rocky spur, with moving whitewash at its foot. Real 05–07, 11 and 14. Games 04 and 05.. |
| Flower terraces, 4.82 km | [Before](before-serre.jpg) | [After](after-serre.jpg) | A blue sign points to Poggio on the narrow climbing road. Switchbacks turn between retaining walls, glasshouses and terraces of carnations. Real 01, 02, 06 and 12. Games 01 and 03.. |
| Summit church, 7.15 km | [Before](before-chiesa.jpg) | [After](after-chiesa.jpg) | Pastel walls frame the church front, campanile and clock. Tifosi lean over temporary rails and wave Italian flags at the summit. Real 02, 09, 12 and 13. Games 01 and 02.. |
| Walled descent, 8.38 km | [Before](before-picchiata.jpg) | [After](after-picchiata.jpg) | A tight descending bend passes a rough stone wall. Behind the outside rail three coastal ridges fall away toward the water. Real 01, 05, 11, 12 and 14. Games 03 and 05.. |
| Via Roma sprint, 11.41 km | [Before](before-viaroma.jpg) | [After](after-viaroma.jpg) | The final straight narrows between barriers and shuttered shops. Dense spectators and flags line the finish gantry, with painted finish markings under the arch. Real 03, 08–10 and 15. Games 02–04.. |

The SS1 passes palms and a headland tunnel. Flower terraces and glasshouses flank the climb before the church and tifosi at the summit. The descent opens toward the Ligurian coast and ends among the Via Roma shops. Surf and tricolores move on ride time. [Credited references](../../worlds/poggio/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| SS1 seafront and palms | 0 m | 0.12 km to 0.95 km | 120.29 | 120.00 | 9.8 ms | 26.6 ms | 41 |
| flower terraces and climbing bends | 4550 m | 0.12 km to 0.95 km | 118.58 | 118.53 | 10.2 ms | 216.8 ms | 51 |

Reproduce from the frontend workspace with `npm run perf -- poggio-tablet --headed`.
