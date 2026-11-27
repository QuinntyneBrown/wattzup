# Serpentine, Hyde Park from the saddle

GCN Training’s 15 Minute HIIT Cardio retains eleven stages, its 15:00 duration and three-second video offset. Two lakeside laps cover 6.638 km and gain 10 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Boathouse jetty, 0.08 km | [Before](before-boathouse.jpg) | [After](after-boathouse.jpg) | The timber boating pavilion and stacked blue-and-white pedalos sit beside the north-bank road. The first band of trees leaves a clear view across open water. Real 05, 06 and 13. Games 01 and 03.. |
| Deckchair lawn, 0.62 km | [Before](before-chairs.jpg) | [After](after-chairs.jpg) | Mottled plane trunks and dappled tarmac frame striped folding chairs. A jogger moves along the separate lawn path between strolling families. Real 03, 07, 11, 12 and 15. Games 02 and 03.. |
| Bridge approach, 1.29 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | Five pale stone arches meet the water on tapered piers. The near abutment grows beside the approaching rider while a far tower stays steady above the trees. Real 01, 02, 04 and 10. Games 02 and 04.. |
| South-bank Lido, 2.13 km | [Before](before-lido.jpg) | [After](after-lido.jpg) | A low lakeside café, west-facing terrace and marked bathing water distinguish the Lido. London plane crowns frame the boathouse on the opposite shore. Real 05, 09 and 13. Games 03 and 05.. |
| Reed-edge birds, 3.04 km | [Before](before-swans.jpg) | [After](after-swans.jpg) | Curved mute-swan necks, darker geese and small ducks stand out along the near waterline. V-shaped wakes trail the swimming birds. Real 01, 06, 08 and 14. Games 01 and 03.. |
| Long Water vista, 4.51 km | [Before](before-regatta.jpg) | [After](after-regatta.jpg) | A moving rowboat crosses a gap in the nearer tree cover. The five-arch bridge and slim Knightsbridge tower overlap at different distances. Real 02, 04, 09 and 10. Games 04 and 05.. |

The five arches, ashlar, north-bank jetty, striped deckchairs and south-bank Lido are fixed around the lake. Mute swans turn as they swim. The oars pivot at their rowlocks, and joggers swing their arms and legs beside the lawn. [Credited references](../../worlds/serpentine/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| north-bank boathouse | 0 m | 0.12 km to 0.95 km | 120.22 | 120.00 | 10.1 ms | 15.4 ms | 149 |
| rowing boats and Serpentine Bridge | 4480 m | 0.12 km to 0.95 km | 120.35 | 119.97 | 10.1 ms | 35.2 ms | 123 |

Reproduce from the frontend workspace with `npm run perf -- serpentine-tablet --headed`.
