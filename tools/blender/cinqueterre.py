"""Cinque Terre: the corniche above the Ligurian Sea, for build_course.py (ADR 0034).

The map of GCN Training's 3 Mins On, 2 Mins Off. themes.py takes this module's theme, materials and scenery, so the
world's whole look is here. The scenery works through the ten critical details of `docs/worlds/cinqueterre/README.md`,
from its reference photographs: each function below names the detail it builds.

Budget (L2-166 AC12): what stands by the road is in the chunked groups and drawn only near the rider; what is seen
across a bay (the far headlands and their villages) is a few hundred triangles in the `Peaks` group, drawn whole.
"""

from __future__ import annotations

import math

CROWD = [f"crowd-{i}" for i in range(6)]

# name -> colour, roughness, glow: added to themes.MATERIALS.
MATERIALS: dict[str, dict] = {
    # The parapet's capstones: paler than the wall they lie on, worn smooth.
    "ct-cap": {"color": 0xB5AD9A, "rough": 0.9},
}

THEME: dict = {
    # Detail 10, golden Italian light: a clear afternoon, the sky pale and warm at the horizon and a deep azure
    # overhead, the sun high enough to cut sharp shadows and warm enough to gild the stone.
    "sky": [0xF7E9CF, 0xBFE0EE, 0x86C2E8, 0x4E9BDB, 0x2A72C0],
    "haze": 0xC6DEE9,
    "light": [0xFFE3B2, 3.1],
    "fill": [0xCFE4F5, 0x8A7A5E],
    "sun_altitude": 0.34,
    "palette": {"asphalt": 0x4C4A48, "sand": 0xA5997C, "sea": 0x0F5F8A, "stone": 0x978E79},
    "land": {"low": 0xA39A6E, "mid": 0x6F8A48, "high": 0x55733C, "rock": 0x8A847A},
    "terrain": {"sea": True, "cliff": True, "rise": 48.0, "far": 8.0},
    "edge": "cliff",
    "centre": "white",
    "turns": {"work": (("ess", 0.5), ("sweep", 0.35), ("hairpin", 0.15)),
              "recover": (("sweep", 0.65), ("ess", 0.35)),
              "calm": (("sweep", 0.6), ("straight", 0.4))},
    "grade": {"perLevel": 0.8},
    "reach": 1900.0,
    "sea_clearance": 46.0,
}


def parapet(k) -> None:
    """Detail 3, the corniche road: a low wall of coursed stone follows the cliff edge through every bend, under
    worn capstones, with a squat pier every 32 m and a slot at its foot now and then to let the rain off the road."""
    face, cap = k.B["stone"], k.B["ct-cap"]
    inner, outer, top = k.kerb + 0.8, k.kerb + 1.25, 0.78
    at = k.road.at
    for i in range(k.n - 1):
        j = i + 1
        # A drain: for one sample in eleven the wall stands on a lintel, clear of the ground.
        foot = 0.22 if i % 11 == 5 else 0.0
        face.quad(at(i, inner, foot), at(j, inner, foot), at(j, inner, top), at(i, inner, top))
        face.quad(at(i, outer, top), at(j, outer, top), at(j, outer, -0.4), at(i, outer, -0.4))
        # The capstones overhang the wall a little either side.
        lo, hi, a, b = top, top + 0.09, inner - 0.05, outer + 0.05
        cap.quad(at(i, a, lo), at(j, a, lo), at(j, a, hi), at(i, a, hi))
        cap.quad(at(i, a, hi), at(j, a, hi), at(j, b, hi), at(i, b, hi))
        cap.quad(at(i, b, hi), at(j, b, hi), at(j, b, lo), at(i, b, lo))
        if i % 8 == 0:
            face.box(k.P(i, 0, (inner + outer) / 2, -0.2), (0.7, 0.7, 1.22), k.s[i]["h"])
            cap.box(k.P(i, 0, (inner + outer) / 2, 1.02), (0.82, 0.82, 0.1), k.s[i]["h"])


def scenery(k) -> dict:
    parapet(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD)}
