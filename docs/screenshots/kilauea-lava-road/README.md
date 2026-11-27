# Kīlauea Lava Road from the saddle

Crater Rim Drive follows the six original stages of GCN Training’s Instant Inferno. The route climbs 89 m in 7.696 km. The original class runs 18:22 from the beginning of the video. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lava fields, 0.08 km | [Before](before-flows.jpg) | [After](after-flows.jpg) | Yellow centre lines cross the black field between ropy lava and jagged fragments. Real 01, 05, 07, 11 and 13; games 01 and 04. |
| Wahinekapu, 1.54 km | [Before](before-wahinekapu.jpg) | [After](after-wahinekapu.jpg) | Separate columns rise behind the fence at openings in the field. Real 06, 08, 09 and 14; games 01 and 04. |
| Sulphur Banks, 2.62 km | [Before](before-sulphur.jpg) | [After](after-sulphur.jpg) | A vent rises inside a yellow mineral apron. Real 06, 08, 09 and 14; game 04. |
| Nāhuku, 3.94 km | [Before](before-tube.jpg) | [After](after-tube.jpg) | Layered rock surrounds the dark opening among native tree ferns and ʻōhiʻa. Real 02, 12 and 14; game 05. |
| Halemaʻumaʻu, 5.68 km | [Before](before-rim.jpg) | [After](after-rim.jpg) | The rider looks over the terraced wall, incandescent lava and plumes. Real 03, 04, 10 and 15; games 01–03. |
| Crater dusk, 7.24 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | Violet light meets warm reflected glow across the broken caldera wall. Real 03–05, 11 and 15; games 01–03. |

A fixed, modelled shield rises behind shelves cut into the caldera. A shared botanical atlas draws ʻōhiʻa and tree ferns on the banks above Nāhuku. Original textures supply the crusted lake and far basalt walls; the near pāhoehoe ropes, clinker and mineral deposits use native geometry. Plumes rise at individual cracks, the lake pulses and reflected orange light spreads above it with the ride clock. The dusk sky retains the World Ride scattering settings from rider feedback #936. [Credited references](../../worlds/kilauea/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Crater Rim Drive | 0 m | 0.12 km to 0.95 km | 120.31 | 120.00 | 9.7 ms | 14.7 ms | 34 |
| Steam and the Halemaʻumaʻu overlook | 5480 m | 0.12 km to 0.95 km | 120.08 | 120.00 | 9.6 ms | 14.2 ms | 40 |

Reproduce from the frontend workspace with `npm run perf -- kilauea-tablet --headed`.
