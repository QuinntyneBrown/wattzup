# Aguascalientes Velodrome

The rider follows the 250 m measurement line for the ten stages of GCN’s *Olympic Pursuit Efforts*. The race covers 12.875 km in the same arena. The bends bank to 42° across the boards and the measurement line stays level. These 1024 × 768 captures use low detail, WebGL 2 and the solo race HUD.

| Rider position | Previous ride | Authored oval | Reference details |
| --- | --- | --- | --- |
| Start of the home straight | [Before](before-opening.jpg) | [After](after-opening.jpg) | Real 01, 04, 10, 11 and 15 inform the pine colour, board joints and stripe widths. Game 03–05 inform the contrast around the HUD. |
| First bend, about 65 m | [Before](before-bank.jpg) | [After](after-bank.jpg) | Real 02, 03, 05–07 and 12–14 inform the apron, turn profile and layered seating. Game 01–03 inform the turn sightline. |
| Opposite pursuit line, about 125 m | [Before](before-pursuit.jpg) | [After](after-pursuit.jpg) | Real 01, 08, 09 and 12–14 inform the pit rails, officials, overhead fixtures and far seats. |

As in Caribana, changing colour in the mesh gives small repeated surfaces depth on low detail. The near timber and paint move past faster than the infield pens and spectators. A single arena mesh set serves every lap. The photographed venues include other velodromes, so the geometry combines their track and enclosure details. [Reference credits](../../worlds/aguascalientes/SOURCES.md) · [Caribana rider views](../caribana/README.md)

## Moving-frame measurement

Before the live timing faces were installed, the arena sustained 120.44 render submissions/s and 120.00 display callbacks/s over 60 seconds, with a 9.70 ms p95 interval, an 18.80 ms longest interval and up to 17 draw calls. The rider advanced from 0.12 to 0.95 km, crossing both straights and bends more than three times. Headed Chromium 159.0.8154.6 ran on an Apple M5 Pro with 24 GB RAM, at DPR 1 with 4× CPU throttling and nine seconds of warm-up. The GPU ran at its normal speed.
