# Monaco Street Circuit from the saddle

GCN Training’s Non-Stop Sprinting retains 22 stages over 22:15 and 9.845 km with a three-second video offset. The course climbs 43 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Port Hercule quay, 0.08 km | [Before](before-port.jpg) | [After](after-port.jpg) | Rows of white stern-to superyachts rise behind Armco on the harbour straight. Dark decks, glazing and masts stand out against Mediterranean blue water. Real 01, 07, 09–10. Games 01–03.. |
| Tabac grandstands, 1.62 km | [Before](before-tabac.jpg) | [After](after-tabac.jpg) | Steep blue seats step up from the catch fencing, filled with fans. Red and white kerbs round the bend and the grey barriers follow the grade. Real 02, 04 and 08. Games 01–02 and 05.. |
| Casino Square, 3.22 km | [Before](before-casino.jpg) | [After](after-casino.jpg) | The casino’s symmetrical towers, clock and copper-green roofline rise over palms and the fountain garden. Pastel balconies climb the hill behind them. Real 10–11, 14–15. Games 02–03.. |
| Fairmont tunnel, 4.86 km | [Before](before-tunnel.jpg) | [After](after-tunnel.jpg) | Strip lighting picks out the curving tunnel roof, panel joints and sponsor boards. A bright exit reveals the sea beyond the dark racing line. Real 12 and 14. Games 02 and 04.. |
| Race-weekend pit lane, 6.54 km | [Before](before-pits.jpg) | [After](after-pits.jpg) | An amber-lit safety car approaches a marshal post beside the pit garages. Road paint and pit markings stay flush to the grade. Real 01–06 and 13. Games 01, 02 and 05.. |
| Monaco-Ville and the Palace, 9.32 km | [Before](before-rock.jpg) | [After](after-rock.jpg) | The final waterfront bends open a sightline to the Prince’s Palace on the rock. Stern terraces and palm crowns frame the pastel town across the harbour. Real 07, 09–10 and 15. Games 03–05.. |

The harbour straight passes moored yachts and layered Armco before the climb to the Casino Square fountain. The Fairmont tunnel encloses the road, a safety car works beside the pit garages, and the Prince’s Palace overlooks the return. [Credited references](../../worlds/monaco/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Port Hercule harbour straight | 0 m | 0.12 km to 0.95 km | 119.71 | 119.29 | 9.7 ms | 93.3 ms | 61 |
| Pit lane and grandstands | 6380 m | 0.12 km to 0.95 km | 120.22 | 119.63 | 10.0 ms | 82.2 ms | 57 |

Reproduce from the frontend workspace with `npm run perf -- monaco-tablet --headed`.
