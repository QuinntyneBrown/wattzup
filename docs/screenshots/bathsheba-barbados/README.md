# Bathsheba, Barbados from the saddle

Choose Bathsheba, Barbados in Map Select. The nine original stages of GCN Training’s *Take It Easy* run for 25:00 over 10.7 km and 31 m of climbing. The route panel samples the East Coast Road’s physical elevation every 25 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Chattel village, 0.08 km | [Before](before-village.jpg) | [After](after-village.jpg) | Wooden shutters and an aqua veranda beside the road. Real 02, 03, 12 and 14, game 01. |
| Rum shop, 0.58 km | [Before](before-rum-shop.jpg) | [After](after-rum-shop.jpg) | Red-painted wood and pale shop sign under the palms. Real 06, 11 and 12, games 01 and 03. |
| Soup Bowl, 1.23 km | [Before](before-soup-bowl.jpg) | [After](after-soup-bowl.jpg) | Undercut coral boulders and white Atlantic breakers at the curved shore. Real 04, 05, 08 and 09, game 05. |
| Fishing landing, 2.19 km | [Before](before-boats.jpg) | [After](after-boats.jpg) | The low stone wall gives way to beach-launched painted boats. Real 03, 07 and 13 for the sand and shoreline, game 02 for the riding sightline. |
| East coast headland, 5.07 km | [Before](before-headland.jpg) | [After](after-headland.jpg) | The road climbs above the reef, facing coastal pasture and sea. Real 01, 10, 13 and 15, games 03 and 04. |
| Outer reef, 8.14 km | [Before](before-reef.jpg) | [After](after-reef.jpg) | The eroded bases sit in longshore foam beneath an open tropical sky. Real 04, 05, 07 and 15, games 02 and 05. |

The road curves above white-gold sand beneath the fixed Scotland District hills. A section of sea wall opens onto painted fishing boats. The rum shops, sea grape, coconut palms, chattel houses and coral boulders are original baked geometry. Near the shore, batched breakers travel across feathered turquoise pools and split at the Soup Bowl rock. Their progress follows ride time, including pause and resume. Three soft trade-wind cloud banks drift above the water. [Credited references](../../worlds/bathsheba/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Chattel village | 0 m | 0.12 km to 0.95 km | 120.15 | 119.67 | 9.7 ms | 58.5 ms | 28 |
| Soup Bowl reef and surf | 1020 m | 0.12 km to 0.96 km | 120.08 | 119.98 | 10.0 ms | 22.8 ms | 28 |

Reproduce from the frontend workspace with `npm run perf -- bathsheba-tablet --headed`.
