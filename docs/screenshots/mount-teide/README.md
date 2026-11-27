# Mount Teide from the saddle

GCN Training’s Build Your FTP & Increase Muscle Mass retains nine stages, the 30:00 duration and three-second video offset. The 13.50 km route climbs 375 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Canary pine approach, 0.12 km | [Before](before-pines.jpg) | [After](after-pines.jpg) | TF-21 climbs between Canary pines rooted in black scoria. White edge paint leads toward the snow-streaked brown summit. Real 03, 05, 06 and 11. Games 01 and 03.. |
| Above the cloud sea, 2.78 km | [Before](before-clouds.jpg) | [After](after-clouds.jpg) | A low stone wall gives way to a white inversion below the road. The western ridge and distant island break through the cloud. Real 06, 11, 12 and 15. Games 01 and 05.. |
| La Tarta, 5.31 km | [Before](before-tarta.jpg) | [After](after-tarta.jpg) | Cream pumice separates dark basalt and red ash in the exposed cut. Three pro riders climb the bend past flowering tajinaste. Real 02, 03 and 07. Games 02 and 04.. |
| Roques de García, 7.93 km | [Before](before-roques.jpg) | [After](after-roques.jpg) | Roque Cinchado balances an ochre cap on a narrow darker waist. Companion pinnacles and the Parador sit on the caldera floor. Real 01, 08–10, 13 and 14. Games 03 and 04.. |
| Llano de Ucanca, 10.48 km | [Before](before-llano.jpg) | [After](after-llano.jpg) | Frozen black lava tongues cross pale pumice beds beneath Pico del Teide. A cable car glides up the flank beyond retama and red flowers. Real 01, 08, 12–15. Games 02 and 05.. |
| Izaña observatory, 13.19 km | [Before](before-izana.jpg) | [After](after-izana.jpg) | White telescope domes, shutter seams, service buildings and the taller solar tower stand above the ridge against a deep blue sky. Real 03, 04, 06 and 15. Games 01 and 04.. |

The cone stays on the horizon while rock towers and the pro group pass at different distances. Original tuff, scoria and pine artwork distinguishes the Roques, TF-21 and the caldera floor. The cloud bank, riders and cable cabin use ride time. The telescope drum adds architectural detail to the dimensional dome. Caribana provided the reference for separating a fixed landmark from moving cyclists. [Credited references](../../worlds/teide/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Canary pine approach | 0 m | 0.12 km to 0.95 km | 120.00 | 119.23 | 9.7 ms | 133.1 ms | 39 |
| Roques de García | 7700 m | 0.12 km to 0.95 km | 119.98 | 119.91 | 10.0 ms | 48.0 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- teide-tablet --headed`.
