# Oude Kwaremont from the saddle

GCN Training’s Cobbled Mayhem has eleven stages over 40:00 and 16.200 km. The route climbs 231 m, with 2.2 km of wet cobbles leading through Kwaremont village. The class begins three seconds into the video. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Kluisbergen approach, 0.08 km | [Before](before-fields.jpg) | [After](after-fields.jpg) | Furrows and clipped hedges mark gently sloping fields around a brick farm gateway. Bare trees line the next bend. Real 09, 14–15 and games 03–05. |
| Foot of the Kwaremont, 12.84 km | [Before](before-gutter.jpg) | [After](after-gutter.jpg) | The lane changes from tarmac to crowned, damp setts. The smooth strips narrow beside the muddy verges. Real 03–05, 11–12, 15 and games 01 and 05. |
| Village square, 13.56 km | [Before](before-village.jpg) | [After](after-village.jpg) | Two-storey brick and rendered cafés face the narrow riding line. Rider names cross the cobbles below a kilometre banner. Real 01–02, 10, 14 and games 01 and 03. |
| Beer tents, 14.12 km | [Before](before-tents.jpg) | [After](after-tents.jpg) | White VIP marquees rise in tiers above temporary boardwalks, with speaker stacks, serving counters and spectators several rows deep. Real 06–08, 13 and games 01–02. |
| Upper drag, 14.65 km | [Before](before-fans.jpg) | [After](after-fans.jpg) | Yellow lion flags mix with club banners above the metal rails. Fans lean over the edge of the wet cobbles. Real 03–06, 11–13 and games 02, 04–05. |
| Melden and Kluisbergen fields, 15.28 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | The crowds thin at the end of the cobbles, revealing muddy field edges, clipped hedges and the village roofs under low April cloud. Real 07–09, 14–15 and games 03–05. |

Damp setts and smooth gutters have separate materials. The course follows the village street between modelled buildings with original café façades and through the VIP area with white canvas roofs, speaker stacks, boardwalks and staffed bars. The roadside spectators fill two rows in the village and three by the marquees. The original Flemish lion and club pennants move on race time. Rider names follow the grade, and the hedges open onto ploughed fields beyond the upper drag. [Credited references](../../worlds/kwaremont/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Kluisbergen farm lanes | 0 m | 0.12 km to 0.95 km | 120.36 | 120.00 | 9.7 ms | 18.8 ms | 37 |
| Village, beer tents and deep crowds | 13750 m | 0.12 km to 0.95 km | 120.17 | 120.00 | 9.7 ms | 17.1 ms | 59 |

Reproduce from the frontend workspace with `npm run perf -- kwaremont-tablet --headed`.
