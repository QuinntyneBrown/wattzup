# Angkor Temples from the saddle

Ride Temple Road from Map Select. GCN published the class as *60 Minute Reverse Pyramid*. The original 17 stages add up to 59:00, cover 25.15 km at target cadence and lift the rider 24 m over the causeways. Both sets of captures use the same fixture, 90 rpm, Low/WebGL 2 and the race HUD at 1024 × 768.

| View | Earlier ride | Revised ride | Geometry and sources |
| --- | --- | --- | --- |
| Moat, 0.06 km | [Before](before-moat.jpg) | [After](after-moat.jpg) | Five corbelled towers stand beyond the water. The road turns along the near embankment. Broken reflections, small lotus clumps and dawn highlights describe the water surface. Real 04, 05, 07 and game 01. |
| Causeway, 0.52 km | [Before](before-causeway.jpg) | [After](after-causeway.jpg) | Narrow tarmac meets laterite at the verge. Dipterocarp trunks rise above understory. Two lines of guardian figures lead to the South Gate. Real 01–03, 06, 08 and games 02, 04. |
| South Gate, 0.58 km | [Before](before-gate.jpg) | [After](after-gate.jpg) | The face tower straddles the road. The causeway rises beneath the rider as tuk-tuks and cyclists pass. Real 06, 08–11 and games 01, 03. |
| Bayon, 0.93 km | [Before](before-bayon.jpg) | [After](after-bayon.jpg) | Four carved faces look out from each stepped tower. Roadside figures and parasols sit below the canopy. Real 04, 14–15 and games 03, 05. |
| Ta Prohm, 1.18 km | [Before](before-roots.jpg) | [After](after-roots.jpg) | Roots fan from a pale trunk across sandstone courses and the doorway. The dark recess separates the roots from the background wall. Real 12–13 and game 05. |

Caribana separates its skyline from the moving parade. Here the temple and reflection stay fixed as the rider turns along the moat. The canopy, masonry and figures are grouped into static meshes. A bounded pair of shared vehicles follows the road on ride time, holds its position when paused and resumes with the clock. The carved faces, leaves and reflected spires use simplified geometry and baked colour. [Reference credits](../../worlds/angkor/SOURCES.md) · [Earlier rider feedback about the trees](https://github.com/QuinntyneBrown/wattzup/issues/929)

## Simulated tablet

Run `npm run perf -- 'angkor-tablet\.perf\.ts$' --headed` from the frontend workspace. The benchmark uses WebGL 2, Low, 1024 × 768, DPR 1 and Chromium with 4× CPU throttling. It samples submitted frames for a minute after nine seconds of warm-up. The moat and the South Gate have separate moving samples. Final canopy measurements are pending.
