# Overseas Highway from the saddle

Time to Spin Out retains its 20 stages, 20:00 and three-second video offset. The compressed Florida Keys route covers 8.305 km with 20 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Marathon approach, 0.08 km | [Before](before-marathon.jpg) | [After](after-marathon.jpg) | A green US 1 sign and mile marker stand beside white edge stripes. Mangroves and wind-bent palms part around the entrance to the bridge. Real 01, 02 and 15. Games 02–03.. |
| Old railway viaduct, 1.51 km | [Before](before-viaduct.jpg) | [After](after-viaduct.jpg) | Repeated masonry arches carry the historic bridge alongside the modern concrete deck. Their openings frame strips of shallow blue-green water. Real 03, 08, 10 and 11. Games 01 and 04.. |
| Pigeon Key, 2.87 km | [Before](before-pigeon.jpg) | [After](after-pigeon.jpg) | Yellow-and-white cottages, palm crowns, the old access ramp and a small timber dock distinguish Pigeon Key from the distant mangrove islands. Real 05–07, 09 and 13. Games 02–04.. |
| Navigation channel, 4.42 km | [Before](before-channel.jpg) | [After](after-channel.jpg) | The only sustained climb lifts the rider above the flats. A fishing boat crosses the deep-water channel below the crest. Real 01–06 and 08. Games 01 and 04.. |
| Missing railway span, 6.31 km | [Before](before-gap.jpg) | [After](after-gap.jpg) | Open water separates the ends of the abandoned span. Pelicans and gulls skim the chop beside the surviving piers. Real 04, 08, 10–12 and 14. Games 01, 04 and 05.. |
| Lower Keys landfall, 8.02 km | [Before](before-bahia.jpg) | [After](after-bahia.jpg) | A low key and leaning palms rise ahead of the rails. Sunlit cumulus, dark seagrass patches and white wind chop extend to the horizon. Real 02, 05, 09, 13–15. Games 02, 03 and 05.. |

A concrete highway deck and the historic railway run parallel above shallow flats. The Pigeon Key cottages, Moser Channel rise, missing railway span and palm-lined key appear in sequence. Sea breeze, boats and skimming birds follow ride time. [Credited references](../../worlds/overseas/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Marathon and the bridge approach | 0 m | 0.12 km to 0.95 km | 119.81 | 119.56 | 10.2 ms | 39.7 ms | 41 |
| Pigeon Key and the parallel viaduct | 2780 m | 0.14 km to 0.96 km | 120.31 | 120.00 | 9.8 ms | 15.3 ms | 43 |

Reproduce from the frontend workspace with `npm run perf -- overseas-tablet --headed`.
