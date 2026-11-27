# Marrakech Medina from the saddle

GCN Training’s Fast Fitness: High Cadence 30 retains 21 stages over 29:50 and 12.808 km. The video offset is three seconds. The course climbs 24 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Jemaa el-Fnaa at dusk, 0.08 km | [Before](before-square.jpg) | [After](after-square.jpg) | Koutoubia’s square sandstone minaret rises above the open plaza, beyond grill canopies, palm crowns and glowing café windows. Real 01, 03–06 and 14. Games 01–03.. |
| Night grill stalls, 2.16 km | [Before](before-grills.jpg) | [After](after-grills.jpg) | Steam and charcoal smoke drift above rows of numbered canvas stalls. Bare bulbs pick out seated diners and cooks. Real 01–06. Games 01 and 03.. |
| Spice and juice market, 4.32 km | [Before](before-oranges.jpg) | [After](after-oranges.jpg) | Orange pyramids, spice mounds and striped awnings narrow the passage. A donkey cart passes the juice sellers. Real 02, 11–12. Games 01 and 04.. |
| Souk Semmarine, 6.68 km | [Before](before-semmarine.jpg) | [After](after-semmarine.jpg) | Reed screens stripe the lane. Hanging rugs and leather slippers give way to perforated brass lamps. A moped threads between the stalls. Real 07–10 and 15. Games 01 and 05.. |
| Musicians and performers, 9.24 km | [Before](before-performers.jpg) | [After](after-performers.jpg) | A half-ring of onlookers gathers around a seated pipe player, a rising snake and a percussionist. A clear line through the square stays visible to the rider. Real 01–04 and 09. Games 02–03.. |
| Ramparts and café terraces, 12.24 km | [Before](before-ramparts.jpg) | [After](after-ramparts.jpg) | Crenellated red walls and a passage under a horseshoe arch frame the closing lane. Lit rooftop cafés overlook the square, with the Atlas behind the minaret. Real 04–06 and 13–15. Games 02, 04 and 05.. |

The Koutoubia overlooks rows of lit grill stalls. Smoke rises over the grills, a scooter moves through the covered souk, and musicians gather in the square. Reed slats, brass lamps and the horseshoe gateway mark the route back to the ramparts. [Credited references](../../worlds/marrakech/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Dusk square and minaret | 0 m | 0.12 km to 0.95 km | 120.58 | 120.00 | 10.1 ms | 20.0 ms | 66 |
| Semmarine lamps and covered lane | 6440 m | 0.12 km to 0.95 km | 120.21 | 119.97 | 10.0 ms | 27.4 ms | 52 |

Reproduce from the frontend workspace with `npm run perf -- marrakech-tablet --headed`.
