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
    """Detail 3, the corniche road: a low stone wall follows the cliff edge through every bend."""
    face = k.B["stone"]
    inner = k.kerb + 0.8
    outer = inner + 0.5
    for i in range(k.n - 1):
        a = k.road.at(i, inner, 0.72)
        b = k.road.at(i + 1, inner, 0.72)
        c = k.road.at(i + 1, outer, 0.72)
        d = k.road.at(i, outer, 0.72)
        face.quad(k.road.at(i, inner), k.road.at(i + 1, inner), b, a)
        face.quad(a, b, c, d)
        face.quad(d, c, k.road.at(i + 1, outer, -0.25), k.road.at(i, outer, -0.25))


def scenery(k) -> dict:
    parapet(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD)}
