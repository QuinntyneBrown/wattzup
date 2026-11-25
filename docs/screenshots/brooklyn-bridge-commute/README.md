# Brooklyn Bridge Commute from the saddle

Select Brooklyn Bridge Commute in Map Select. The 22 original stages of GCN Training’s Get to Work on Your Cycling Fitness last 25:00. Three crossings cover 10.700 km and climb 117 m with the final descent toward Manhattan. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| DUMBO, 0.08 km | [Before](before-dumbo.jpg) | [After](after-dumbo.jpg) | Cobbles, warehouse glazing, fire stairs and street signs line the Brooklyn approach. Real 10, 15; games 01 and 05. |
| Timber approach, 0.71 km | [Before](before-ramp.jpg) | [After](after-ramp.jpg) | Wooden boards, iron lamps, rail and lower carriageways rise off the street. Real 01, 04 and 12–14; games 01 and 03. |
| Brooklyn-side portal, 1.23 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | Movement toward the stone tower separates the main cables, vertical suspenders and the diagonal stays. Real 01–04, 12 and 14; games 01–03. |
| Midspan, 1.53 km | [Before](before-river.jpg) | [After](after-river.jpg) | The river and waterfront open beyond the rails, the promenade passes commuters and the two gothic openings frame the continuing ride. Real 01, 05–09, 12 and 14; games 01, 03 and 04. |
| Manhattan-side tower, 1.77 km | [Before](before-traffic.jpg) | [After](after-traffic.jpg) | The promenade curves through a pointed opening above the traffic decks. The main cables and steel trusses follow a different line from the boards. Real 03, 12–14; games 01 and 03. |
| Manhattan landing, 2.57 km | [Before](before-landing.jpg) | [After](after-landing.jpg) | The long deck descends among waterfront buildings and the Financial District street canyon. Real 06–09, 11 and 14; games 02 and 05. |
| Final westbound crossing, 9.20 km | [Before](before-manhattan.jpg) | [After](after-manhattan.jpg) | The last crossing retains the fixed skyline and the warm morning light. Real 02, 06–09 and 14; games 01 and 05. |

The upper wooden promenade bends around the masonry piers while yellow cabs and other vehicles keep to two lower decks. The two stone towers have separate pointed openings, recessed soffits and individual granite courses. A catenary-like main cable, diagonal stays, vertical suspenders and iron rails establish separate depths. Like Caribana’s CN Tower and fixed skyline, One World Trade Center and the Financial District stand behind a continuous bank of waterfront buildings. Walkers, runners, bikes, motor traffic and the ferry use ride time. Figures and the neighbouring Manhattan Bridge use simplified geometry on Low. The original Beautiful Boom Bap music assignment is preserved as requested in rider feedback #938. [Credited references](../../worlds/brooklyn/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Gothic tower and commuters | 1120 m | 0.12 km to 0.95 km | 120.55 | 120.00 | 9.6 ms | 12.3 ms | 71 |
| Traffic and ferries at midspan | 1520 m | 0.12 km to 0.95 km | 120.29 | 120.00 | 9.7 ms | 14.8 ms | 55 |

Reproduce from the frontend workspace with `npm run perf -- brooklyn-tablet --headed`.
