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
    # A terrace's tread of dry earth and summer grass, and the vines trained along it.
    "ct-terrace": {"color": 0x9A9460, "rough": 1.0},
    "ct-vine": {"color": 0x5C8A38, "rough": 0.9},
    "ct-vine-gold": {"color": 0x8FA040, "rough": 0.9},
    "ct-maquis": {"color": 0x4F7038, "rough": 1.0},
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


# The terraces: how far behind the kerb the first wall stands, each step's depth and each wall's height, in metres.
TERRACE_FOOT, TERRACE_DEPTH, TERRACE_RISE = 2.4, 6.4, 2.3


def terrace_levels(k, i: int) -> int:
    """How many terraces step up the hillside beside sample i: vineyards come in stretches of a few hundred metres,
    three to six steps high, with open hillside between them."""
    d = i * k.step
    band = math.sin(d / 310.0 + 0.8) + 0.6 * math.sin(d / 127.0 + 2.1)
    if band < -0.35:
        return 0
    return 3 + int((band + 0.35) * 1.9) % 4


def terraces(k) -> int:
    """Detail 4, terraced vineyards: dry-stone walls step up the hillside above the road, a strip of earth behind
    each, and on each strip two rows of vines trained along the slope."""
    wall, tread, slope = k.B["stone"], k.B["ct-terrace"], k.B["ct-maquis"]
    at, s = k.road.at, k.s
    built = 0
    for i in range(3, k.n - 4):
        j = i + 1
        levels = min(terrace_levels(k, i), terrace_levels(k, j))
        bend = max(abs(s[i]["k"]), abs(s[j]["k"]))
        top = 0
        for level in range(levels):
            front = -(k.kerb + TERRACE_FOOT + level * TERRACE_DEPTH)
            back = front - TERRACE_DEPTH
            # On the inside of a tight bend the steps would fold over one another; near another stretch of the
            # road they would stand in it.
            if bend * abs(back) > 0.55 or not k.room(i, back, 9.0):
                break
            lo, hi = level * TERRACE_RISE - (0.4 if level == 0 else 0.0), (level + 1) * TERRACE_RISE
            wall.quad(at(j, front, lo), at(i, front, lo), at(i, front, hi), at(j, front, hi))
            tread.quad(at(i, front, hi), at(i, back, hi), at(j, back, hi), at(j, front, hi))
            # Two rows of vines a step: a low ridge of leaves along the terrace, the outer row turning gold.
            for row, mat in ((0.3, "ct-vine"), (0.68, "ct-vine-gold" if (i // 9 + level) % 3 == 0 else "ct-vine")):
                if i % 5 == 4:
                    continue  # a gap between one plant's run of leaves and the next
                mid = front - TERRACE_DEPTH * row
                b = k.B[mat]
                ridge_i, ridge_j = at(i, mid, hi + 1.25), at(j, mid, hi + 1.25)
                b.quad(at(i, mid + 0.55, hi), at(j, mid + 0.55, hi), ridge_j, ridge_i)
                b.quad(at(j, mid - 0.55, hi), at(i, mid - 0.55, hi), ridge_i, ridge_j)
            top = level + 1
        if top:
            # Behind the last step the hillside carries on up in scrub, down to the land beyond.
            back = -(k.kerb + TERRACE_FOOT + top * TERRACE_DEPTH)
            far = back - 30.0
            fi, fj = at(i, far), at(j, far)
            zi = max(k.height_at(fi[0], fi[1]), s[i]["z"] + top * TERRACE_RISE + 4.0)
            zj = max(k.height_at(fj[0], fj[1]), s[j]["z"] + top * TERRACE_RISE + 4.0)
            slope.quad(at(i, back, top * TERRACE_RISE), (fi[0], fi[1], zi), (fj[0], fj[1], zj), at(j, back, top * TERRACE_RISE))
            built += 1
    return built


def scenery(k) -> dict:
    parapet(k)
    stepped = terraces(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD), "terraced": stepped}
