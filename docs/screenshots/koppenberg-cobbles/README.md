# Koppenberg Cobbles from the saddle

GCN Training’s Low Cadence Strength Builder has ten original stages across 16:00 and 5.640 km. The course climbs 111 m, concentrating the 22% ramp within the first three-minute low-cadence effort. The class video offset is three seconds. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Melden farm lanes, 0.08 km | [Before](before-lanes.jpg) | [After](after-lanes.jpg) | Brick farmhouses and pollarded poplars flank a patched approach through ploughed fields. Real 05, 07, 11, 13–14 and game 05. |
| Foot of the Koppenberg, 1.06 km | [Before](before-foot.jpg) | [After](after-foot.jpg) | Concrete gives way to wet, domed setts. Moss collects at the verges and polished crowns pick out the riding line. Real 01, 04, 06, 08 and games 01–02. |
| Steep chute, 2.39 km | [Before](before-ramp.jpg) | [After](after-ramp.jpg) | A short 22% pitch narrows between undercut grass banks. Only two riders fit abreast. Real 01–04, 08, 15 and games 01–03. |
| Race crowds, 3.74 km | [Before](before-banks.jpg) | [After](after-banks.jpg) | Fans lean over the metal barriers and wave yellow Flemish lion flags. Race signs and a canvas beer tent break up the banks. Real 01–03, 06, 09–10 and games 02–04. |
| Wooded crest, 4.90 km | [Before](before-woods.jpg) | [After](after-woods.jpg) | Bare branches and early leaf buds close above the last wet stones. Spring mist softens the trees across the next field. Real 02–03, 08, 11, 14–15 and games 02 and 05. |
| Melden overlook, 5.32 km | [Before](before-melden.jpg) | [After](after-melden.jpg) | Beyond a row of poplars, Sint-Martinus has a dark rectangular tower, pointed spire and pitched nave above the Scheldt fields. Real 05, 07, 11–14 and games 04–05. |

The chute narrows to 3.24 m between the banks. Shared geometry draws moving spectator poses and the Flemish flags above the rails. Fixed farmhouses, race tents and the separately modeled Sint-Martinus church provide the middle and far landmarks. The road material uses the original wet-sett tile in physical metres. The sky, trees and low valley haze use the muted colours of the real spring photographs. [Credited references](../../worlds/koppenberg/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Melden farm lanes | 0 m | 0.12 km to 0.95 km | 120.04 | 120.00 | 9.7 ms | 15.0 ms | 45 |
| Lion flags and packed banks | 3400 m | 0.12 km to 0.95 km | 120.19 | 119.92 | 9.8 ms | 48.7 ms | 53 |

Reproduce from the frontend workspace with `npm run perf -- koppenberg-tablet --headed`.
