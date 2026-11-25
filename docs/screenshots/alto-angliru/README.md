# Angliru from the saddle

From Map Select, open Angliru and start a solo race on Cueña les Cabres. Both versions below use a simulated Echelon at 90 rpm, Low/WebGL 2 and a 1024 × 768 race HUD. The original 21 stages of GCN’s *5 Gruelling Minutes* last 40 minutes. At target cadence the route covers 17.625 km and climbs 1,102 m.

| View | Original | Revised | Where to look |
| --- | --- | --- | --- |
| Lower road, 0.07 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Beech and chestnut crowns frame a break in the lower pasture. Cattle, horses and the road occupy separate depths. Real 01–04, 07–10 and games 03, 05. |
| Hórreo approach, 0.28 km | [Before](before-horreo.jpg) | [After](after-horreo.jpg) | An elevated timber grain store stands above the field. The distant limestone ridge stays fixed through the bend. Real 07–15 and game 04. |
| Crowd corridor, 14.22 km | [Before](before-crowd.jpg) | [After](after-crowd.jpg) | Spectators press in on both sides above the painted VAMOS. Camper vans occupy the hillside verge. Real 01–03 and games 01–02. |
| Cueña les Cabres, 14.89 km | [Before](before-crux.jpg) | [After](after-crux.jpg) | Dark pavement gives way to pale grooved concrete as the road pitches up to 23.5%. The gradient sign, gold-cross flags and moving spectator mark the climb. Real 01–03, 05–06 and games 01–02. |
| Maximum pitch, 14.94 km | [Before](before-wall.jpg) | [After](after-wall.jpg) | The route panel reads +23.5% at the same ridden distance as the baked concrete ramp. Real 01–03, 05 and games 01–02. |
| Summit, 17.59 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | At the bare summit the elevation sign reads 1,570 m. Low cloud crosses the ridge and the wet road reflects the light. Real 04–06, 12–15 and game 04. |

The far ridge stays in world coordinates, like Caribana’s skyline. Foreground fans, walls, lettering and livestock share mesh sections. A runner, an Asturian flag and three soft cloud banks move on ride time. The runner’s stride, the cross and its hanging letters remain legible on Low. The ridge uses bands of exposed limestone and turf, and the cloud banks share one translucent texture. [Reference credits](../../worlds/angliru/SOURCES.md) · [Original rider views](../angliru/README.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on an Apple M5 Pro ran at 1024 × 768, DPR 1, Low/WebGL 2 with a 4× CPU throttle. Each sample measures a minute of moving world submissions after nine seconds of warm-up. The simulated bike advanced 0.83 km during each measured minute. The opening included one 91 ms interval.

| Section | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Riosa approach | 119.61 | 119.45 | 10.7 ms | 91.0 ms | 26 |
| Cueña les Cabres crowd corridor | 120.31 | 119.98 | 10.0 ms | 20.9 ms | 32 |

Reproduce from the frontend workspace with `npm run perf -- angliru-tablet --headed`. The separate `angliru-views` run captures the six matched positions.
