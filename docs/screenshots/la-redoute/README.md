# La Redoute from the saddle

GCN Training’s Ramp It Up: Punchy Intervals retains 31 stages, 40:00 duration and zero video offset. The 16 km course climbs 249 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Remouchamps church, 0.08 km | [Before](before-remouchamps.jpg) | [After](after-remouchamps.jpg) | Slate roofs and pale stone houses cluster below the church spire. The old rail arches frame the exit from the village beside the Amblève. Real 06, 07 and 13–15. Games 02 and 04.. |
| Amblève pastures, 5.43 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Wire fences, cattle and spring hedges follow the wet road. The river turns beneath wooded valley slopes beyond the pasture. Real 08, 10–12, 14 and 15. Games 01 and 03.. |
| Campervan approach, 11.64 km | [Before](before-campers.jpg) | [After](after-campers.jpg) | The first motorhomes and a frites stall frame the narrowing lane. Belgian flags rise above spectators behind the barriers. Real 01–05 and 11. Games 02 and 05.. |
| Painted wall, 12.57 km | [Before](before-wall.jpg) | [After](after-wall.jpg) | Large hand-painted PHIL names and tricolours run across damp asphalt. The straightest part pitches into double digits between a dense crowd and the hedgerow. Real 01–05, 08 and 09. Games 01–03.. |
| E25 crossing, 13.39 km | [Before](before-viaduct.jpg) | [After](after-viaduct.jpg) | The concrete motorway deck crosses the rider’s road on tall piers near the upper slope. Beech and spruce crowd the verges and a team car passes above. Real 01, 06, 08, 11 and 13. Games 01, 04 and 05.. |
| Redoute summit stone, 15.56 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | A La Redoute stone stands at the summit turnout. Beyond the wire fence, the wooded Amblève valley and the river are visible beneath an overcast spring sky. Real 08–10, 12, 14 and 15. Games 03–05.. |

Ride from the stone church and railway arches through fenced Amblève pastures. Original campervans, spectators and names painted across rough asphalt line the double-digit wall. A Belgian flag, grazing cow and team car on the E25 follow ride time. [Credited references](../../worlds/redoute/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Remouchamps church and rail arches | 0 m | 0.12 km to 0.95 km | 119.70 | 119.39 | 9.9 ms | 171.6 ms | 31 |
| painted wall and campervan crowd | 12380 m | 0.12 km to 0.95 km | 120.79 | 120.00 | 9.8 ms | 17.0 ms | 52 |

Reproduce from the frontend workspace with `npm run perf -- redoute-tablet --headed`.
