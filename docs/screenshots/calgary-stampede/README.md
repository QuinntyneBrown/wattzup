# Calgary Stampede from the saddle

GCN Training’s Start Hard, Finish Hard retains its 13 stages, 30:00 duration and zero video offset. The 13.2 km course climbs 145 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Downtown parade, 0.12 km | [Before](before-parade.jpg) | [After](after-parade.jpg) | The red observation deck of Calgary Tower rises above sandstone façades and a kerb packed with white cowboy hats. Brass players march past bunting and a mounted parade rider. Real 01–05 and 15. Games 01 and 03.. |
| Western parade float, 2.23 km | [Before](before-float.jpg) | [After](after-float.jpg) | A decorated flatbed rolls past the crowd. Straw bales and split rails separate the riders from plaid shirts, boots and Smithbilt hats. Real 01–05 and 10. Games 01 and 02.. |
| Chuckwagon track, 4.54 km | [Before](before-wagons.jpg) | [After](after-wagons.jpg) | Four horses in two pairs pull a canvas-topped wagon around a packed ochre oval. A low timber rail keeps the team outside the race lane. Real 06, 07 and 13. Games 02 and 05.. |
| Grandstand and chutes, 6.91 km | [Before](before-arena.jpg) | [After](after-arena.jpg) | The long canopy shades two tiers of spectators; white numbered bucking chutes face the dusty infield. The tower and pale Rockies remain on the horizon. Real 08, 09, 13 and 14. Games 01 and 04.. |
| Elbow River Camp, 9.12 km | [Before](before-camp.jpg) | [After](after-camp.jpg) | Tipis stand in a grassy clearing by the river. Participants and visitors gather along the footpath; the downtown towers remain visible beyond the trees. Real 02, 04 and 12. Games 03 and 05.. |
| Stampede Park midway, 12.65 km | [Before](before-midway.jpg) | [After](after-midway.jpg) | A Ferris wheel turns over striped food booths and flags. The high prairie sun casts short shadows across the closing straight. Real 10–13 and 15. Games 01 and 04.. |

Original downtown facades, white-hatted spectators and the skyline frame the parade. A decorated float carries brass players, a four-horse chuckwagon team runs by the dirt track, the grandstand overlooks the chutes, and visitors and riders gather around Elbow River Camp. The Ferris wheel turns over the midway. Like the CN Tower in Caribana, Calgary Tower has a modeled core and observation deck that stand in front of the downtown skyline. Cloth and distant faces use atlases. Near the track the four horses have moving legs and separate harnesses. [Credited references](../../worlds/stampede/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| downtown parade | 0 m | 0.12 km to 0.95 km | 120.07 | 119.78 | 10.0 ms | 46.4 ms | 33 |
| chuckwagon track | 4400 m | 0.12 km to 0.95 km | 120.81 | 119.97 | 9.8 ms | 28.8 ms | 139 |

Reproduce from the frontend workspace with `npm run perf -- stampede-tablet --headed`.
