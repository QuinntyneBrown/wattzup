# Victoria Harbour from the saddle

The 22-minute High Cadence Sprints class follows 9.4 km of Kowloon waterfront. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Kowloon Clock Tower, 0.14 km | [Before](before-clock.jpg) | [After](after-clock.jpg) | The railway clock tower rises between the old pier and the tiled promenade under warm lights. Real 01, 08, 15 and game 03. |
| Star Ferry crossing, 1.72 km | [Before](before-ferry.jpg) | [After](after-ferry.jpg) | A green-and-white double-ended ferry moves past the landing, lighting the water beneath its windows. Real 08, 11, 12, 15 and games 02, 04. |
| Avenue of Stars, 3.38 km | [Before](before-stars.jpg) | [After](after-stars.jpg) | The bronze Bruce Lee figure faces the harbour above star and handprint plaques along the rails. Real 02, 03, 04, 09 and games 01, 03. |
| Red-sailed junk, 5.16 km | [Before](before-junk.jpg) | [After](after-junk.jpg) | A timber junk crosses below its three red battened sails, with a tug and freighter farther out. Real 08, 10, 13 and game 04. |
| Central skyline, 7.18 km | [Before](before-central.jpg) | [After](after-central.jpg) | The IFC crown, Bank of China diagonals and Central Plaza light stand ahead of Victoria Peak. The lights reflect across the water. Real 06, 07, 13, 14 and games 01, 04. |
| Symphony of Lights, 9.18 km | [Before](before-symphony.jpg) | [After](after-symphony.jpg) | Coloured laser fans sweep from the island towers as photographers gather on the Kowloon railing. Real 01, 04, 05, 06, 07, 14 and games 02, 05. |

The Star Ferry and red-sailed junk move offshore, light beams sweep above Central and the promenade passes the Clock Tower and Avenue of Stars. The reference folder on main contains both the restored real photographs and the game views. [Credited references](../../worlds/victoria/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Clock Tower and pier | 0 m | 0.12 km to 0.96 km | 117.81 | 117.72 | 11.2 ms | 97.9 ms | 78 |
| Symphony waterfront | 8580 m | 0.12 km to 0.95 km | 119.84 | 119.55 | 10.3 ms | 90.8 ms | 43 |

Reproduce from the frontend workspace with `npm run perf -- victoria-tablet --headed`.
