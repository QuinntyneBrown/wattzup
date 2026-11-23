"""Detail 8 (valley-villages): Corvara, Arabba, Canazei & Selva with Tyrolean onion-dome churches."""

from __future__ import annotations

import math


def _onion_dome_church(B, kit, x: float, y: float, z: float, yaw: float, dome_mat: str = "copper-patina", spire: bool = False) -> None:
    """Builds a classic Dolomite parish church with whitewashed nave, belfry clock tower & bulbous Zwiebelturm onion dome."""
    # Whitewashed nave + pitched slate roof
    B["stone"].box((x, y, z - 2.0), (16.5, 9.2, 2.6), yaw)
    B["chalet-plaster"].box((x, y, z + 0.6), (16.2, 8.8, 7.2), yaw)
    kit.gable(B["roof-slate"], (x, y, z + 7.8), 16.8, 9.4, 3.8, yaw)

    # Tall square campanile bell tower rising beside the chancel
    tx = x + math.cos(yaw) * 6.4 - math.sin(yaw) * 3.8
    ty = y + math.sin(yaw) * 6.4 + math.cos(yaw) * 3.8
    B["chalet-plaster"].box((tx, ty, z - 1.5), (4.4, 4.4, 19.5), yaw)
    # Dark arched belfry openings & gold-rimmed clock faces on all 4 sides
    B["dark"].box((tx, ty, z + 14.8), (4.52, 1.45, 2.2), yaw)
    B["dark"].box((tx, ty, z + 14.8), (1.45, 4.52, 2.2), yaw)
    B["gold"].box((tx, ty, z + 12.6), (4.54, 1.15, 1.15), yaw)
    B["gold"].box((tx, ty, z + 12.6), (1.15, 4.54, 1.15), yaw)

    if spire:
        # Pointed Gothic alpine shingle spire (Arabba style)
        kit.gable(B[dome_mat], (tx, ty, z + 18.0), 4.8, 4.8, 7.6, yaw)
        kit.gable(B[dome_mat], (tx, ty, z + 18.0), 4.8, 4.8, 7.6, yaw + math.pi * 0.5)
        B["gold"].box((tx, ty, z + 25.4), (0.22, 0.22, 1.8), yaw)
    else:
        # Bulbous Tyrolean octagonal Zwiebelturm onion dome!
        tiers = (
            (18.0, 3.4, 1.2),
            (19.2, 5.2, 1.9),
            (21.1, 4.6, 1.7),
            (22.8, 2.4, 1.5),
            (24.3, 1.1, 2.4),
        )
        for z_off, w_oct, h_oct in tiers:
            B[dome_mat].box((tx, ty, z + z_off), (w_oct, w_oct, h_oct), yaw)
            B[dome_mat].box((tx, ty, z + z_off), (w_oct * 0.92, w_oct * 0.92, h_oct), yaw + math.pi * 0.25)
        B["gold"].box((tx, ty, z + 26.7), (0.45, 0.45, 0.45), yaw)
        B["gold"].box((tx, ty, z + 27.15), (0.14, 0.85, 1.45), yaw)


def _village_chalet(B, kit, road, idx: int, side: float, off_extra: float, w: float, d: float, storeys: int, height_at) -> None:
    yaw = road.s[idx]["h"] + (0.0 if side < 0 else math.pi)
    off = (kit.kerb + off_extra) * side
    cx_v, cy_v, _ = road.at(idx, off)
    if not road.clear_of_road(cx_v, cy_v, kit.kerb + 5.5, idx):
        return
    cz_v = max(height_at(cx_v, cy_v), road.s[idx]["z"] - 0.6)
    B["stone"].box((cx_v, cy_v, cz_v - 2.4), (w, d, 3.0), yaw)
    B["chalet-plaster"].box((cx_v, cy_v, cz_v + 0.6), (w + 0.2, d + 0.2, storeys * 2.95), yaw)
    B["larch-aged"].box((cx_v, cy_v, cz_v + 0.6 + (storeys - 0.35) * 2.95), (w + 0.35, d + 0.35, 1.15), yaw)
    kit.gable(B["chalet-wood"], (cx_v, cy_v, cz_v + 0.6 + storeys * 2.95), w + 1.2, d + 1.2, 2.6, yaw)
    for st_i in range(storeys):
        wz_rel = (cz_v - road.s[idx]["z"]) + 1.45 + st_i * 2.95
        for w_k in (-1, 1):
            kit.window(idx, w_k * (w * 0.26), off - side * (d * 0.5 + 0.16), wz_rel, 1.15, 1.4, (st_i + w_k) % 2 == 0, yaw)


def build_valley_villages(B, kit, road, height_at, rng) -> None:
    """Builds Corvara & Arabba (and Canazei & Selva once added) in the four valley saddles."""
    # 1. Corvara in Badia (1,568 m, around 260 m & finish run-in around 11,420 m)
    c_idx = road.index(275.0)
    cx0, cy0, _ = road.at(c_idx, -(kit.kerb + 20.0))
    _onion_dome_church(B, kit, cx0, cy0, height_at(cx0, cy0), road.s[c_idx]["h"] + 0.2, dome_mat="copper-patina", spire=False)
    for d_m in (150.0, 210.0, 265.0, 330.0, 395.0, 11360.0, 11440.0, 11520.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 11.5, 8.6, 2 + (int(d_m) % 2), height_at)

    # 2. Arabba / Rèba (1,602 m, around 3,120 m between Campolongo & Pordoi)
    a_idx = road.index(3135.0)
    ax0, ay0, _ = road.at(a_idx, kit.kerb + 21.0)
    _onion_dome_church(B, kit, ax0, ay0, height_at(ax0, ay0), road.s[a_idx]["h"] - 0.25, dome_mat="parasol-red", spire=True)
    for d_m in (2990.0, 3055.0, 3115.0, 3185.0, 3245.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.0, 11.0, 8.4, 2, height_at)

    # 3. Canazei / Cianacei (1,465 m approach saddle around 6,120 m between Pordoi & Sella)
    cz_idx = road.index(6130.0)
    zx0, zy0, _ = road.at(cz_idx, -(kit.kerb + 21.5))
    _onion_dome_church(B, kit, zx0, zy0, height_at(zx0, zy0), road.s[cz_idx]["h"] + 0.15, dome_mat="copper-patina", spire=False)
    for d_m in (5990.0, 6055.0, 6115.0, 6180.0, 6240.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 12.2, 8.8, 3 if side < 0 else 2, height_at)

    # 4. Selva di Val Gardena / Sëlva (1,563 m approach around 8,920 m between Sella & Gardena)
    sv_idx = road.index(8930.0)
    sx0, sy0, _ = road.at(sv_idx, kit.kerb + 21.0)
    _onion_dome_church(B, kit, sx0, sy0, height_at(sx0, sy0), road.s[sv_idx]["h"] - 0.2, dome_mat="parasol-red", spire=False)
    for d_m in (8800.0, 8865.0, 8925.0, 8985.0, 9045.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 11.8, 8.6, 2 + (int(d_m) % 2), height_at)

    # Trilingual white/brown Italian & Ladin municipal town-entry boards at all 4 villages
    for entry_m in (125.0, 2965.0, 5965.0, 8775.0):
        e_idx = road.index(entry_m)
        e_yaw = road.s[e_idx]["h"]
        B["steel"].box(kit.P(e_idx, 0.0, -(kit.kerb + 1.8), 0.0), (0.10, 0.10, 2.35), e_yaw)
        B["paint"].box(kit.P(e_idx, 0.0, -(kit.kerb + 1.8), 1.65), (0.08, 1.65, 0.72), e_yaw)
        B["chalet-wood"].box(kit.P(e_idx, 0.0, -(kit.kerb + 1.8), 1.25), (0.08, 1.65, 0.34), e_yaw)
