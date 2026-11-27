# Sydney Harbour Fireworks from the saddle

GCN Training’s New Year Spin: Get Back to Cycling retains all 24 stages, its 30:00 duration and zero video offset. The harbour course covers 12.45 km and climbs 68 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Circular Quay, 0.12 km | [Before](before-quay.jpg) | [After](after-quay.jpg) | Lit towers frame the quay. Yellow-green ferries and spectator boats sit on dark water, with the bridge arch beyond the wharf lights. Real 06, 08, 09 and 14. Games 01 and 04.. |
| Bennelong Point, 2.36 km | [Before](before-sails.jpg) | [After](after-sails.jpg) | Distinct ribbed Opera House sails rise from Bennelong Point. Their pale surfaces catch colour above the spectator-lined steps. Real 01, 04, 08 and 10. Games 03 and 05.. |
| Granite pylons, 4.58 km | [Before](before-pylon.jpg) | [After](after-pylon.jpg) | The granite portals flank the wide Bradfield Highway deck. Riveted steel, lane paint and suspended lamps frame the climb onto the bridge. Real 07, 09 and 12–15. Games 01 and 03.. |
| Midnight over the span, 6.77 km | [Before](before-midnight.jpg) | [After](after-midnight.jpg) | Shell-shaped trails expand over the arch and over barges. Smoke drifts between the bursts and red, white and gold streaks shimmer on the water. Real 01–06 and 11. Games 01 and 04.. |
| Bridge waterfall, 9.23 km | [Before](before-cascade.jpg) | [After](after-cascade.jpg) | A falling curtain of golden light follows the outside of the span. The opposite steelwork changes colour and remains visible through the glow. Real 02, 04, 07 and 11. Games 02 and 05.. |
| Milsons Point, 12.13 km | [Before](before-luna.jpg) | [After](after-luna.jpg) | The route descends toward Luna Park’s illuminated entrance face and towers. Moored boats and the skyline remain visible across the harbour. Real 03, 06, 08 and 15. Games 02 and 04.. |

The 503 m arch, granite pylons and changing arch lights share fixed positions with the deck and north-shore view. A ferry crosses the quay, shells expand above the barges, and light falls from the span. The Opera House and Luna Park use original cutout artwork on dimensional bases. A fixed panorama provides the far city behind the moving foreground, following Caribana. [Credited references](../../worlds/sydneyharbour/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Circular Quay waterfront | 0 m | 0.12 km to 0.95 km | 119.97 | 119.90 | 9.6 ms | 41.4 ms | 453 |
| the midnight bursts | 6550 m | 0.12 km to 0.95 km | 120.24 | 119.68 | 9.8 ms | 60.6 ms | 162 |

Reproduce from the frontend workspace with `npm run perf -- sydneyharbour-tablet --headed`.
