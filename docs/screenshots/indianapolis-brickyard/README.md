# Indianapolis Brickyard from the saddle

Select Indianapolis Brickyard in Map Select. The 19 original stages of GCN Training’s 90-Second Extended Accelerations last 30:00 and cover three 4.00 km laps. The racing line stays level while each corner banks to nine degrees. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening straight, 0.07 km | [Before](before-straight.jpg) | [After](after-straight.jpg) | Outside stands and white wall border the rubbered asphalt; the pit lane runs on the left. Real 01–05, 12 and 14; games 01 and 03. |
| Turn One, 0.73 km | [Before](before-banking.jpg) | [After](after-banking.jpg) | The surface banks through the left turn, with outer catch fencing, roof trusses and a painted inner kerb. Real 04–09; games 02 and 03. |
| Back straight, 1.89 km | [Before](before-infield.jpg) | [After](after-infield.jpg) | The low museum and grass lie inside the oval beyond the shoulder. Real 06–09 and 15; games 02 and 04. |
| Front straight approach, 3.65 km | [Before](before-stands.jpg) | [After](after-stands.jpg) | The crowd tiers converge on the steel-and-glass Pagoda. The narrow pylon and roof flags separate from it as the rider approaches. Real 01–06, 10 and 13; games 01 and 05. |
| Pylon and Pagoda, 3.82 km | [Before](before-pagoda.jpg) | [After](after-pagoda.jpg) | The scoring numerals face the approaching bike, the Pagoda has stepped decks, and balloons rise from the infield. Real 01–03, 10, 13–14; games 03 and 05. |
| First lap stripe, 3.97 km | [Before](before-bricks.jpg) | [After](after-bricks.jpg) | The three-foot strip of staggered red brick crosses the whole racing surface below the starter. Real 02, 05 and 11; games 01 and 05. |
| Final lap stripe, 11.97 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | The closing sightline brings the rider back to the same starter and Yard of Bricks. Real 03–05 and 11–13; games 01 and 03. |

The rider crosses the same Yard of Bricks three times. The glass Pagoda, numbered pylon, pit garages, stands, fences and infield museum stay square to their foundations. Rubber darkens the asphalt and ground grain remains fixed across laps. Like the Caribana grandstand, close crowd rows have individual silhouettes, heads, shirts and caps while the distant tiers read as patches of colour. The chequered cloth and a bounded group of balloons move on ride time and hold on pause. Small crowd details and the midday roof shade are baked for Low. [Credited references](../../worlds/brickyard/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Front straight grandstands | 50 m | 0.11 km to 0.95 km | 120.25 | 120.00 | 9.7 ms | 13.9 ms | 50 |
| Turn Four into the bricks | 3370 m | 0.12 km to 0.95 km | 120.43 | 120.00 | 9.7 ms | 19.0 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- brickyard-tablet --headed`.
