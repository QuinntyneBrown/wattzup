# Marina Bay Night from the saddle

GCN Training’s Fast Paced Cadence Variations retains seven stages, 25:00 and 10.665 km. The video and workout start together. The course climbs 14 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Bayfront promenade, 0.08 km | [Before](before-sands.jpg) | [After](after-sands.jpg) | Three inclined towers support the cantilevered SkyPark across open water. Lamps and palm trunks pass the rider while the hotel stays fixed on the skyline. Real 01, 06, 10 and 14. Games 01 and 02.. |
| Merlion Park, 1.84 km | [Before](before-merlion.jpg) | [After](after-merlion.jpg) | The white lion and scaled tail rise on a wave plinth. Its water jet curves into the bay in front of the reflected CBD towers. Real 06, 07 and 11. Games 02 and 05.. |
| Esplanade shore, 3.62 km | [Before](before-esplanade.jpg) | [After](after-esplanade.jpg) | Twin spiked theatre domes catch gold light behind the promenade. Strollers and joggers pass the rail by the dark water. The spherical Apple pavilion in real 12 is a separate south-bank landmark. Real 03, 06, 07 and 12. Games 01 and 04.. |
| Helix Bridge and lotus, 5.36 km | [Before](before-helix.jpg) | [After](after-helix.jpg) | Two illuminated spirals twist over the bridge deck. The ArtScience lotus petals open beyond the structure. Real 02, 04, 05 and 14. Games 03–05.. |
| Supertree Grove, 7.58 km | [Before](before-grove.jpg) | [After](after-grove.jpg) | Violet and cyan branches spread above a narrow suspended OCBC Skyway. The crowns change colour on the ride clock. Real 08–09. Games 03–05.. |
| Flyer and light show, 10.12 km | [Before](before-flyer.jpg) | [After](after-flyer.jpg) | Upright white capsules follow the illuminated Singapore Flyer rim. Narrow beams cross the bay above the reflections. Real 01, 03, 10, 13 and 15. Games 01–02 and 04.. |

The SkyPark spans three leaning towers above broken window reflections. The Merlion and Esplanade domes line the bay. Paired spirals lead past the ArtScience lotus. Joggers, lit Supertree crowns and the rotating Flyer capsules move with the race clock. The clear night sky preserves the look praised in #913. [Credited references](../../worlds/marinabay/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Bayfront promenade | 0 m | 0.12 km to 0.95 km | 120.47 | 119.92 | 10.1 ms | 57.3 ms | 39 |
| Helix Bridge and ArtScience Museum | 5140 m | 0.12 km to 0.95 km | 117.60 | 117.42 | 11.4 ms | 197.2 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- marinabay-tablet --headed`.
