# Songkran, Bangkok from the saddle

GCN Training’s 30 Second Sprints HIIT Sandwich retains all 13 stages, its 27:30 duration and three-second video offset. Four laps of Khao San Road total 11.75 km and climb 12 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Khao San shopfronts, 0.10 km | [Before](before-khaosan.jpg) | [After](after-khaosan.jpg) | Hostel balconies, projecting guesthouse signs and awnings squeeze the view down the wet street. The rider has a clear lane between the two lines of revellers. Real 05, 07, 08 and 10. Games 01 and 05.. |
| Songkran water fight, 0.48 km | [Before](before-waterfight.jpg) | [After](after-waterfight.jpg) | Festivalgoers in floral shirts lean from the kerbs. A bucket tips, a hose arcs and bright water toys send streams into the wet street. Chalk paste is visible on cheeks. Real 01–04, 06, 11 and 13. Games 01 and 04.. |
| Pad thai and fruit carts, 0.96 km | [Before](before-foodcarts.jpg) | [After](after-foodcarts.jpg) | Stainless carts with woks, fruit trays, umbrella shades and warm bulbs stand against the shopfronts. Puddle reflections break around tyre marks. Real 07–10 and 14. Games 02 and 03.. |
| Tuk-tuk rank, 1.42 km | [Before](before-tuktuk.jpg) | [After](after-tuktuk.jpg) | A three-wheel taxi with a curved blue canopy and chrome passenger rails noses forward from the kerb. Parked tuk-tuks and overhead shop signs mark the rank. Real 02, 08, 10 and 14. Games 03 and 05.. |
| Wat Chana Songkhram approach, 2.34 km | [Before](before-wat.jpg) | [After](after-wat.jpg) | Layered red temple roofs with golden chofa finials rise past a pale gate at the end of the street. The surrounding shophouses stay below the roofline. Real 07–10 and 15. Games 02 and 04.. |
| Evening on Khao San, 9.31 km | [Before](before-neon.jpg) | [After](after-neon.jpg) | On the final lap, neon Thai signs and warm stall lamps reflect on the tarmac. Overhead bulbs trace the narrow street above the water fight. Real 05, 06, 09, 11–13. Games 01 and 05.. |

Original shophouse, street food, reveller and temple artwork follows the credited Bangkok photographs. At street level a bucket tips, jets cross the wet asphalt and a blue tuk-tuk travels past the parked vehicles. Festival signs reflect on the road as the light fades. [Credited references](../../worlds/songkran/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Khao San shopfronts | 0 m | 0.12 km to 0.96 km | 120.15 | 119.93 | 9.8 ms | 62.3 ms | 63 |
| water fight and food stalls | 9100 m | 0.12 km to 0.95 km | 120.12 | 120.00 | 9.7 ms | 18.6 ms | 71 |

Reproduce from the frontend workspace with `npm run perf -- songkran-tablet --headed`.
