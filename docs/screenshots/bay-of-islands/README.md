# Bay of Islands Group Ride from the saddle

Choose Bay of Islands Group Ride in Map Select. GCN’s *Zwift Group Workout: HIIT Intervals* retains all 23 original stages, 61:20 of riding and 27.95 km with 59 m of ascent. The route combines Paihia, the Waitangi inlet and Russell into a Northland coastal race. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Marsden Road, 0.08 km | [Before](before-paihia.jpg) | [After](after-paihia.jpg) | Low shops face grassy verges and the wharf. Real 01, 02 and 05, game 01. |
| Paihia wharf, 0.34 km | [Before](before-wharf.jpg) | [After](after-wharf.jpg) | White rails, piled deck, green roof and the ferry crossing. Real 05–07 and 10, game 02. |
| Bush-clad rocks, 1.56 km | [Before](before-islands.jpg) | [After](after-islands.jpg) | Wind-shaped trees and offshore islets separate the bay from the hills. Real 08–10 and 14, games 03 and 04. |
| Waitangi inlet, 3.16 km | [Before](before-waitangi.jpg) | [After](after-waitangi.jpg) | Bridge rails frame the red gable, flagstaff lawn and moorings. Real 11–13, game 05. |
| Russell waterfront, 8.14 km | [Before](before-russell.jpg) | [After](after-russell.jpg) | White weatherboards beneath spreading pohutukawa, with yachts close offshore. Real 03, 04 and 06, games 01 and 03. |
| Last bay, 26.73 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | The low golden sun and mirrored amber water frame the final curve. Real 15 and game 04. |

The wharf stands on timber piles under a green pavilion roof. A passenger ferry, yachts and a tall ship share three instanced geometry batches. The ferry traces a continuous crossing loop while the sailing boats swing near their moorings, including through pause and resume. Pohutukawa crown clusters overhang the roadside, separate from the fixed volcanic islets. The final approach changes the light, sky and sea reflection together. [Credited references](../../worlds/bayofislands/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Paihia waterfront | 0 m | 0.12 km to 0.95 km | 120.33 | 119.98 | 10.0 ms | 17.8 ms | 19 |
| Waitangi inlet and ferry | 2880 m | 0.12 km to 0.95 km | 119.05 | 118.64 | 10.6 ms | 106.7 ms | 30 |

Reproduce from the frontend workspace with `npm run perf -- bayofislands-tablet --headed`.
