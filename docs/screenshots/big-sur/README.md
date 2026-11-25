# Big Sur from the saddle

Choose Big Sur in Map Select. The 23 stages of GCN Training’s *Under Over Power Blocks* run for 30:00 over 14.075 km and 286 m of climbing. The route follows Highway 1, with the coast and both concrete bridges drawn from the same centre line as the ride. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Rocky Creek, 0.16 km | [Before](before-rocky.jpg) | [After](after-rocky.jpg) | The shorter bridge and dark redwoods identify the first canyon. Real 02, 08 and 10, games 01 and 03. |
| Bixby Canyon overlook, 1.11 km | [Before](before-bixby.jpg) | [After](after-bixby.jpg) | The second bend reveals the arch ribs and columns beyond the turnout. Real 05 and 06, games 03 and 04. |
| Bixby deck, 1.46 km | [Before](before-deck.jpg) | [After](after-deck.jpg) | The double yellow lines cross between slotted concrete parapets. Real 04–06 and 10, game 01. |
| Pacific headland, 3.32 km | [Before](before-stacks.jpg) | [After](after-stacks.jpg) | Monterey cypress and sea stacks frame the coast road and the moving surf. Real 01, 03, 13–15, games 02 and 05. |
| McWay Cove, 5.74 km | [Before](before-mcway.jpg) | [After](after-mcway.jpg) | White water drops from the far headland onto the pocket beach and foam moves offshore. Real 09, 14 and 15, games 02 and 04. |
| Santa Lucia headland, 12.18 km | [Before](before-fog.jpg) | [After](after-fog.jpg) | The low cloud moves along the golden slopes above the dark Pacific. Real 07, 11 and 12, games 02 and 05. |

Bixby’s pale open-spandrel arch, thin columns and deep canyon appear before the deck crossing. Rocky Creek uses a shorter arch in redwoods. Original cypress crowns, gravel shoulders, double yellow lines, coastal scrub and sea stacks establish scale. As in Caribana the distant Santa Lucia silhouette stays fixed behind the detailed foreground. A bounded set of breakers advances around the stacks, the waterfall fans out as it falls and the marine layer rolls over the headlands. The 30-minute class compresses the distance between the landmarks. [Credited references](../../worlds/bigsur/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Bixby Canyon and open arch | 940 m | 0.12 km to 0.95 km | 120.64 | 120.00 | 9.5 ms | 15.3 ms | 24 |
| McWay Cove and the surf | 5520 m | 0.12 km to 0.95 km | 120.61 | 120.00 | 9.5 ms | 17.1 ms | 28 |

Reproduce from the frontend workspace with `npm run perf -- bigsur-tablet --headed`.
