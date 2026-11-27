# Lake Tahoe from the saddle

GCN Training’s Sandwich Max Efforts retains all nineteen stages, its 45:00 duration and three-second video offset. The shore highway covers 19.75 km with 128 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| The shore highway, 0.12 km | [Before](before-highway.jpg) | [After](after-highway.jpg) | Paired yellow lines and an edge stripe lead around a granite cut. Jeffrey pine trunks interrupt the lake view beyond a low guard rail. Real 01–05 and 15. Games 01–04.. |
| Sand Harbor, 3.82 km | [Before](before-granite.jpg) | [After](after-granite.jpg) | Pale rounded boulders sit partly below the surface. The sand bed and dark underwater stones show through turquoise shallows that deepen to sapphire. Real 06, 08, 09 and 11. Games 02 and 05.. |
| Zephyr Cove, 7.18 km | [Before](before-kayaks.jpg) | [After](after-kayaks.jpg) | A paddler dips a blade beside the sandy beach and timber pier. Swimmers and the pine-covered headland give scale to the cove. Real 08, 10 and 12. Games 02 and 04.. |
| Emerald Bay overlook, 11.24 km | [Before](before-island.jpg) | [After](after-island.jpg) | Guard rails open a view down to Fannette Island with its tiny stone tea house. Dark green slopes enclose the bay and a snowy Sierra ridge stands beyond. Real 04, 05, 07 and 14. Games 01 and 05.. |
| Tahoe City marina, 15.63 km | [Before](before-marina.jpg) | [After](after-marina.jpg) | Moored boats bob at finger piers below the highway. A green-roofed timber lodge faces the slips while light catches the windows and hulls. Real 03, 10, 12 and 13. Games 03 and 05.. |
| East Shore pines, 19.38 km | [Before](before-pines.jpg) | [After](after-pines.jpg) | Tall Jeffrey and sugar pines shade a needle-covered shoulder. A yellow curve sign stands against the forest and the lake opens between branches. Real 01, 02, 06 and 15. Games 01, 03 and 04.. |

The Sierra rim stays fixed beyond the road, following Caribana’s skyline approach. The highway rolls above Emerald Bay and dips close to water at Sand Harbor, Zephyr Cove and Tahoe City. Original granite, lakebed and pine textures carry local detail. The paddles move on ride time and moored hulls roll alongside finger piers. [Credited references](../../worlds/tahoe/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| shore highway | 0 m | 0.12 km to 0.95 km | 119.23 | 119.12 | 10.2 ms | 72.4 ms | 55 |
| Tahoe City marina | 15420 m | 0.12 km to 0.95 km | 119.34 | 118.98 | 9.9 ms | 125.5 ms | 93 |

Reproduce from the frontend workspace with `npm run perf -- tahoe-tablet --headed`.
