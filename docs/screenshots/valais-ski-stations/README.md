# Valais Ski Stations from the saddle

The historical GCN Tour des Stations Zone 2 class supplies twelve stages over thirty minutes with zero video offset. Its 12 km station road gains 333 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| The summer meadow, 0.14 km | [Before](before-meadow.jpg) | [After](after-meadow.jpg) | Alpine daisies edge a smooth tarmac road. The Matterhorn and Weisshorn rise above the sunny green pasture. Real 03–05, 11, 13 and games 01–02, 05. |
| Grimentz granaries, 2.35 km | [Before](before-mazots.jpg) | [After](after-mazots.jpg) | Dark larch chalets carry red window boxes. A stone-roofed mazot stands on mushroom-shaped stone supports. Real 06–08, 10 and games 02–03. |
| The idle ski lift, 4.65 km | [Before](before-piste.jpg) | [After](after-piste.jpg) | Empty chairs hang over a summer piste between pylons. Larch and pine mark the edge of the meadow. Real 04–05, 11–12 and games 01–03. |
| The Hérens pasture, 6.73 km | [Before](before-herens.jpg) | [After](after-herens.jpg) | A black cow grazes near her calf. The brass bell beneath her collar swings as she lowers her head. Real 03, 09, 11 and games 02, 04–05. |
| The PostBus junction, 8.92 km | [Before](before-postbus.jpg) | [After](after-postbus.jpg) | A yellow postal bus rounds the hairpin near a yellow hiking sign. The white village church rises beyond the bus. Real 01–02, 05–06, 12 and games 01, 03–04. |
| Rhône valley overlook, 11.76 km | [Before](before-rhone.jpg) | [After](after-rhone.jpg) | Beyond the stone parapet, terraced vineyards descend to the wide Rhône valley and snow-covered skyline. Real 11–15 and games 02, 04–05. |

Near the herd, articulated cow heads and bronze bells follow the ride clock. An original two-bell recording grows louder as the rider approaches and stops on pause. Native mazots, a white church, static summer lift chairs, an animated PostBus and layered Rhône vineyard views distinguish the stations. [Credited references](../../worlds/valais/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| alpine meadow | 0 m | 0.12 km to 0.96 km | 120.02 | 119.56 | 10.1 ms | 79.7 ms | 40 |
| PostBus junction | 8640 m | 0.12 km to 0.95 km | 119.44 | 119.06 | 10.0 ms | 176.0 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- valais-tablet --headed`.
