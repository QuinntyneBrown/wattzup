# Pike Place at Dawn from the saddle

GCN Training’s Wake Up and Smell the Lactic retains 17 stages over 25:00 with a three-second video offset. The 10.4375 km ride climbs 65 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Public Market Center clock, 0.08 km | [Before](before-clock.jpg) | [After](after-clock.jpg) | The red Public Market Center letters and round clock rise on a steel frame above the brick intersection. A crosswalk, parked delivery truck and morning shoppers establish scale. Real 01, 04, 06–08 and 12. Games 01 and 03.. |
| Fish counter, 1.79 km | [Before](before-fish.jpg) | [After](after-fish.jpg) | Warm pendant lamps light silver salmon on crushed ice, crab and handwritten price cards. A vendor tosses a salmon above the counter. Real 02, 09 and 13. Games 02 and 04.. |
| Farmers Market arcade, 3.38 km | [Before](before-arcade.jpg) | [After](after-arcade.jpg) | Green columns and a striped awning frame produce pyramids and bouquets. Meet the Producer lettering runs above the stalls opposite the Corner Market. Real 01, 05, 07–08 and 15. Games 01 and 03.. |
| Post Alley entrance, 5.22 km | [Before](before-alley.jpg) | [After](after-alley.jpg) | A narrow brick side lane recedes under the Post Alley sign. Dawn catches steam above the café and vent at the opening. Real 03, 08 and 14. Games 02, 04 and 05.. |
| Elliott Bay descent, 7.69 km | [Before](before-waterfront.jpg) | [After](after-waterfront.jpg) | The downhill street opens onto a white-and-green ferry crossing Elliott Bay. The Great Wheel, piers and Olympic skyline stand beyond the lower market roofs. Real 03, 10–12. Games 01 and 05.. |
| Downtown dawn, 10.13 km | [Before](before-skyline.jpg) | [After](after-skyline.jpg) | An open view frames downtown glass towers, the Space Needle and warm reflections on Elliott Bay. Brick paving and a final arc of market spectators bring the route home. Real 03, 05 and 10–12. Games 03–05.. |

The Public Market Center clock spans the brick intersection. Salmon fly over the fish counter, produce fills the arcade, steam rises at Post Alley and a double-ended ferry crosses Elliott Bay beside the Great Wheel. [Credited references](../../worlds/pikeplace/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| market clock and brick intersection | 0 m | 0.12 km to 0.95 km | 115.97 | 115.85 | 11.3 ms | 136.9 ms | 61 |
| produce arcade and morning shoppers | 3240 m | 0.12 km to 0.95 km | 120.40 | 120.00 | 9.8 ms | 25.4 ms | 60 |

Reproduce from the frontend workspace with `npm run perf -- pikeplace-tablet --headed`.
