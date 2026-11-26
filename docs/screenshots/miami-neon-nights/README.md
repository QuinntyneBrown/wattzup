# Miami Neon Nights from the saddle

GCN Training’s Ride to the Beat retains 25 stages over 20:00 and 8.3975 km with a three-second video offset. The course climbs 9 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Colony Hotel and Ocean Drive, 0.08 km | [Before](before-colony.jpg) | [After](after-colony.jpg) | A blue vertical Colony blade rises between two curved neon eyebrows. Pink and cyan pools break over wet asphalt while the Atlantic opens beyond the palms on the other side. Real 01–03 and 06. Games 02–03.. |
| Carlyle sidewalk cafés, 1.44 km | [Before](before-cafes.jpg) | [After](after-cafes.jpg) | Rounded Carlyle corner glazing and horizontal eyebrows overlook umbrella tables, diners and a couple strolling past raised café terraces. Real 04–05, 09–11 and 14. Games 02–03.. |
| Ocean Drive cruisers, 2.88 km | [Before](before-convertibles.jpg) | [After](after-convertibles.jpg) | An open convertible passes parked two-tone classics. Red tail lamps and alternating blade signs leave broken streaks in the road. Real 06–08, 11 and 15. Games 02 and 04.. |
| Lummus Park beach, 4.36 km | [Before](before-lummus.jpg) | [After](after-lummus.jpg) | A raised pastel lifeguard tower, its ladder and wraparound deck stand between coconut palms. White foam catches the moon beyond the sand. Real 01, 06 and 13–14. Games 01 and 05.. |
| Breakwater neon frontage, 6.04 km | [Before](before-breakwater.jpg) | [After](after-breakwater.jpg) | The stepped Breakwater crown and vertical sign alternate with blue and pink window bands. A little steam crosses the kerb near the busiest café. Real 01–05, 07–08 and 10. Games 02–03.. |
| Brickell across the bay, 8.06 km | [Before](before-skyline.jpg) | [After](after-skyline.jpg) | The boulevard opens toward illuminated Brickell and downtown tower silhouettes. Royal palms and streetlight halos frame the rider against the bay. Real 07–08 and 12. Games 01, 03 and 05.. |

Neon blades and eyebrows mark the Colony, Carlyle and Breakwater above broken road reflections. A two-tone cruiser passes café tables, royal and coconut palms. Beyond Lummus Park a raised lifeguard tower overlooks the moving surf. Steam rises by the kerb and the Brickell skyline stands across the bay. [Credited references](../../worlds/miami/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Colony and Ocean Drive | 0 m | 0.12 km to 0.95 km | 120.36 | 119.78 | 9.9 ms | 85.3 ms | 82 |
| Breakwater nightlife | 5850 m | 0.12 km to 0.95 km | 120.76 | 120.00 | 9.7 ms | 15.9 ms | 73 |

Reproduce from the frontend workspace with `npm run perf -- miami-tablet --headed`.
