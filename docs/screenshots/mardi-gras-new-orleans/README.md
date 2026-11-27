# Mardi Gras, New Orleans from the saddle

GCN Training’s Ride to the Beat supplies twenty-five stages over 20:00 and 8,397.5 m. Its three-second video offset is preserved. The course climbs 13 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| St. Charles streetcar, 0.08 km | [Before](before-streetcar.jpg) | [After](after-streetcar.jpg) | An olive-green Perley Thomas car runs along the grassy neutral ground under overhead wire and arching live oaks. Real 05, 09 and 12. Games 03 and 05.. |
| Garden District mansions, 1.56 km | [Before](before-mansions.jpg) | [After](after-mansions.jpg) | Painted porch columns, iron fencing and purple, green and gold bunting line the avenue. Bead strings hang from oak branches. Real 05, 09 and 12. Games 03 and 04.. |
| School brass band, 3.18 km | [Before](before-band.jpg) | [After](after-band.jpg) | White plumes and bright sousaphone bells rise behind paired snare drummers. The crowd follows the band from ladders behind barricades. Real 03, 08 and 14. Games 01 and 05.. |
| Masked krewe float, 4.74 km | [Before](before-krewe.jpg) | [After](after-krewe.jpg) | An original painted jester float with a raised deck rolls between spectators. Masked riders reach out and bright throws fall from the deck. Real 01, 02, 06, 07 and 11. Games 01 and 02.. |
| Flambeaux procession, 6.24 km | [Before](before-torches.jpg) | [After](after-torches.jpg) | Torchlight catches the dancers, metallic costume trim and cups and beads on the asphalt as dusk deepens. Real 03, 10, 13 and 14. Games 02 and 05.. |
| Canal Street finish, 7.96 km | [Before](before-canal.jpg) | [After](after-canal.jpg) | Families fill the iron-lace galleries and the street behind the final float. Warm shop windows and street lamps frame the finish. Real 01, 04, 13 and 15. Games 01, 03 and 04.. |

A green Perley Thomas streetcar follows the neutral ground. Decorated mansions give way to iron-lace galleries, while a marching band, flambeaux and masked float riders pass the crowd. Bead throws, marching poses and streetcar movement follow the race clock. [Credited references](../../worlds/mardigras/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Streetcar neutral ground | 0 m | 0.12 km to 0.95 km | 120.91 | 120.00 | 9.7 ms | 19.8 ms | 34 |
| Masked krewe float and spectators | 4510 m | 0.12 km to 0.95 km | 120.31 | 120.00 | 9.8 ms | 16.6 ms | 33 |

Reproduce from the frontend workspace with `npm run perf -- mardigras-tablet --headed`.
