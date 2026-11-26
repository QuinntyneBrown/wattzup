# Valparaíso Stairways from the saddle

GCN Training’s 24-stage Reverse Steps keeps its hour-long structure and three-second video offset on a 26.725 km route across the cerros. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Cerro Concepción lane, 0.14 km | [Before](before-concepcion.jpg) | [After](after-concepcion.jpg) | Sunlight catches the yellow and turquoise corrugated houses. A tangle of wires crosses the street between painted timber balconies. Real 01–04, 07 and games 01–03. |
| Pasaje Piano, 5.18 km | [Before](before-piano.jpg) | [After](after-piano.jpg) | White risers and black piano keys climb a pedestrian stair beside the rideable lane. A rail and an original mural wrap the landing. Real 06–08, 15 and games 02–04. |
| Ascensor El Peral, 10.35 km | [Before](before-ascensor.jpg) | [After](after-ascensor.jpg) | Wooden funicular cars pass each other on steep rails beside the road. The port appears between the houses below the station. Real 03–05, 09–10 and games 02–03. |
| Cerro Alegre murals, 14.82 km | [Before](before-alegre.jpg) | [After](after-alegre.jpg) | Original painted walls and rainbow steps frame a hillside cafe, an artist at work and a street dog. Real 02, 06–08, 14 and games 01, 03–04. |
| The trolleybus bend, 20.14 km | [Before](before-trolley.jpg) | [After](after-trolley.jpg) | A cream and green electric trolleybus follows its overhead wires on the lower street under the cerros. Real 03–04, 07, 11–12 and games 03–05. |
| Paseo Gervasoni, 26.41 km | [Before](before-gervasoni.jpg) | [After](after-gervasoni.jpg) | Iron mirador railings overlook hillside roofs, working harbour cranes and a container ship under the pink Pacific haze. Real 02, 05, 11–15 and games 01–02, 05. |

Paired wooden cars counterbalance on sloping El Peral rails. Real tread and riser geometry distinguish the piano-key and rainbow stairways beside the bicycle lane. Street motion, corrugated houses, overhead wires and harbour gantries occupy separate depths below the mirador. [Credited references](../../worlds/valparaiso/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Cerro Concepción lane | 0 m | 0.12 km to 0.96 km | 118.93 | 118.64 | 10.4 ms | 147.8 ms | 38 |
| El Peral crossing | 10010 m | 0.12 km to 0.95 km | 120.14 | 119.92 | 10.2 ms | 31.1 ms | 52 |

Reproduce from the frontend workspace with `npm run perf -- valparaiso-tablet --headed`.
