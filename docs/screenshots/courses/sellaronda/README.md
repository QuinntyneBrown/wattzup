# Sella Ronda (`sellaronda`)

Built from GCN's *Over/Under Intervals on the Passo Sella* (`bEfCKGBJc6k`, 28:00, 11.65 km) via `tools/blender/sellaronda.py` and `tools/blender/build_course.py`, following Ibiza Sunset Strip's `CourseRenderer` and `CourseCyclistKit` pipeline (`L2-166`).

## Course Profile & Budgets

- **Route:** Clockwise four-pass Dolomite loop circling the central Sella massif (`Peaks` group, drawn whole with `fog: false` in 1 draw call): Passo Campolongo (1,875 m) → Arabba → Passo Pordoi (2,239 m) → Canazei → Passo Sella (2,240 m) → Selva → Passo Gardena (2,121 m) → Corvara.
- **Low-Power Tablet Gate:** Verified on every iteration against `<= 120,000` triangles, `<= 140` draw calls, `<= 3.0 MB` gzipped, and `>= 60 FPS` on simulated low-power tablet (`tier=low` @ `0.75` DPR, `4x` CPU throttle).
