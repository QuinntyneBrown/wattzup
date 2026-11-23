"""The course's rider, built in Blender (ADR 0036, L2-166 AC26).

    python tools/blender/rider.py            (with `pip install bpy`)
    blender --background --python tools/blender/rider.py

It writes `frontend/projects/ride/public/riders/rider.glb` and `tools/blender/scenes/rider.blend`.

The rider's body is one connected, watertight mesh: trunk, neck, head, arms to mitten hands on the hoods, and legs
to the ankles. The helmet, the shoes and the bike are not in it: the app makes those (course-cyclist.ts). It is
modelled as a cage of quads in the riding position and subdivided, so there are edge loops round every knee, elbow,
hip and shoulder; the kit stands 2 to 4 mm proud of the skin at the collar, the sleeve hems, the shorts' cuffs, the
jersey's hem, the gloves' cuffs and the sock tops.

It hangs on an armature of 19 bones. The feet are held by inverse kinematics to targets that ride the pedals, and
the hands to the brake hoods; one turn of the cranks is animated seated and one out of the saddle, and both are
baked to plain keyframes (visual keying, constraints cleared) before the export, so the app works out no
kinematics: it plays the turn from the crank's angle.

Everything here is worked out in the app's own axes (x to the rider's right, y up, the bike pointing along -z,
metres) and turned to Blender's (z up, the bike along +y) only as it is made. The bike's measurements are
course-cyclist.ts's: change them there and here together.
"""

import math
import os
import sys

import bpy
import bmesh  # isort: skip (bpy brings it)
from mathutils import Matrix, Quaternion, Vector as V

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "frontend", "projects", "ride", "public", "riders", "rider.glb")
BLEND = os.path.join(HERE, "scenes", "rider.blend")

# --- The bike and the rider on it, as in course-cyclist.ts -----------------------------------------------------------
BB = V((0, 0.28, 0.09))
HOOD = V((0.2, 0.955, -0.535))
CRANK = 0.1725
PEDAL_OUT = 0.115
HIP = V((0, 0.975, 0.21))
SHOULDER = V((0, 1.3, -0.2))
HEAD = V((0, 1.455, -0.345))
THIGH = 0.43
SHIN = 0.43
UPPER_ARM = 0.29
FOREARM = 0.265
ACROSS = V((1, 0, 0))
# How the rider moves on the bike with each stroke (course-cyclist.ts): the shoulders' sway and the back's rise and
# fall, seated and out of the saddle, and how far a rider standing on the pedals turns about their hands.
SWAY, SWAY_STANDING = 0.028, 0.04
BOB, BOB_STANDING = 0.002, 0.006
STAND = 0.085
HANDS = V((0, HOOD.y, HOOD.z))
SPINE = V((0, HOOD.y - HIP.y, HOOD.z - HIP.z)).normalized()
# The share of the kit's texture, from its left, that wraps the trunk; the rest is the sleeve.
KIT_TRUNK = 0.7

# One turn of the cranks is this many frames; the seated turn, then the turn out of the saddle.
TURN = 30
FPS = 30

# How far the kit stands off the skin, and the jersey off the shorts, in metres.
CLOTH = 0.002
JERSEY = 0.002

# The regions of the body, each a material while it is modelled. The app paints them (course-cyclist.ts reads the
# colour each is given here and gives the rider's own in its place).
REGIONS = ["skin", "shorts", "gripper", "sock", "glove", "hair", "jersey", "bib", "sleeve"]
MARKERS = {
    "skin": (1, 0, 0),
    "shorts": (0, 1, 0),
    "gripper": (0, 0, 1),
    "sock": (1, 1, 0),
    "glove": (1, 0, 1),
    "hair": (0, 1, 1),
    "jersey": (1, 1, 1),
    "bib": (1, 1, 1),
    "sleeve": (1, 1, 1),
}
# What is drawn with the kit's texture; the rest is coloured by vertex.
KIT = {"jersey", "bib", "sleeve"}
CLOTHED = {"shorts", "gripper", "sock", "glove", "jersey", "bib", "sleeve"}


def blender(p):
    """A place in the app's axes, in Blender's."""
    return V((p[0], -p[2], p[1]))


def frame(tangent):
    """The axes of a ring whose plane `tangent` stands on: x as near across the bike as can be, z = x cross y."""
    y = tangent.normalized()
    x = ACROSS - y * ACROSS.dot(y)
    if x.length < 1e-6:
        x = V((0, 0, 1)) - y * y.z
    x.normalize()
    return x, y, x.cross(y)


def bend(a, c, upper, lower, hint):
    """The middle joint of a two-bone limb from `a` to `c`, bent towards `hint` (course-cyclist.ts)."""
    along = c - a
    d = min(along.length, upper + lower - 1e-4)
    reach = (upper * upper - lower * lower + d * d) / (2 * d)
    out = math.sqrt(max(upper * upper - reach * reach, 0))
    along.normalize()
    side = (hint - along * hint.dot(along)).normalized()
    return a + along * reach + side * out


def turn_x(angle, v):
    """`v` turned `angle` about the axis across the bike."""
    c, s = math.cos(angle), math.sin(angle)
    return V((v.x, v.y * c - v.z * s, v.y * s + v.z * c))


def pedal_at(side, a):
    return V((side * PEDAL_OUT, BB.y - math.cos(a) * CRANK, BB.z - math.sin(a) * CRANK))


def foot_pitch(a):
    """How the foot tips on the pedal through the stroke: toe down through the bottom, lifting over the top."""
    return -0.22 - 0.2 * math.cos(a - 0.5)


def ankle_at(side, a):
    ankle = turn_x(foot_pitch(a), V((0, 0.085, 0.115))) + pedal_at(side, a)
    ankle.x = side * (PEDAL_OUT - 0.01)
    return ankle


def hip_at(side):
    return HIP + V((side * 0.085, -0.035, 0.005))


def knee_at(side, hip, ankle):
    return bend(hip, ankle, THIGH, SHIN, V((side * 0.05, 0.25, -1)))


def shoulder_at(side):
    return SHOULDER + V((side * 0.158, -0.018, 0.004))


def hand_at(side):
    return V((side * 0.2, HOOD.y + 0.022, HOOD.z + 0.02))


def elbow_at(side):
    return bend(shoulder_at(side), hand_at(side), UPPER_ARM, FOREARM, V((side * 0.55, -0.5, 0.45)))


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def section(table, t):
    """(rx, rz, z) of a limb `t` along it, between the rows of `table`: (t, rx, rz, z)."""
    if t <= table[0][0]:
        return table[0][1:]
    for a, b in zip(table, table[1:]):
        if t <= b[0]:
            k = (t - a[0]) / (b[0] - a[0])
            return tuple(lerp(a[i], b[i], k) for i in (1, 2, 3))
    return table[-1][1:]


# The body's sections: half-widths across and fore-and-aft, and how far off the limb's line, along each part.
TRUNK = [
    (0.27, 0.156, 0.116, 0.022),
    (0.45, 0.142, 0.106, 0.034),
    (0.68, 0.164, 0.116, 0.036),
    (0.82, 0.186, 0.11, 0.028),
    (0.9, 0.172, 0.096, 0.02),
    (0.96, 0.11, 0.074, 0.01),
    (1.0, 0.062, 0.058, 0.004),
]
# A thigh: +z is its front, the quadriceps.
THIGHS = [
    (0.3, 0.086, 0.1, -0.004),
    (0.55, 0.074, 0.086, 0.002),
    (0.74, 0.063, 0.07, 0),
    (0.8, 0.059, 0.064, 0),
    (0.93, 0.053, 0.058, 0.002),
    (1.0, 0.052, 0.056, 0.005),
]
# A shin: the kneecap to the front, the calf swelling behind, drawn in to the ankle.
SHINS = [
    (0.0, 0.052, 0.056, 0.005),
    (0.06, 0.054, 0.058, 0.004),
    (0.16, 0.058, 0.064, -0.012),
    (0.3, 0.061, 0.068, -0.018),
    (0.46, 0.05, 0.055, -0.012),
    (0.62, 0.039, 0.042, -0.004),
    (0.69, 0.037, 0.041, 0),
    (0.92, 0.034, 0.037, 0),
    (1.0, 0.035, 0.039, 0),
]
UPPER_ARMS = [
    (0.0, 0.05, 0.052, 0),
    (0.1, 0.054, 0.056, 0),
    (0.3, 0.05, 0.054, 0),
    (0.62, 0.043, 0.047, 0),
    (0.86, 0.038, 0.041, 0),
    (1.0, 0.037, 0.04, 0),
]
FOREARMS = [
    (0.0, 0.037, 0.04, 0),
    (0.2, 0.042, 0.047, 0),
    (0.55, 0.035, 0.038, 0),
    (0.84, 0.027, 0.03, 0),
    (1.0, 0.029, 0.026, 0),
]


class Cage:
    """The body as a cage of quads: the mesh that is subdivided."""

    def __init__(self):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.deform = self.bm.verts.layers.deform.new()
        self.bones = []

    def vert(self, at, weights):
        v = self.bm.verts.new(blender(at))
        total = sum(weights.values())
        for bone, weight in weights.items():
            if weight <= 0:
                continue
            if bone not in self.bones:
                self.bones.append(bone)
            v[self.deform][self.bones.index(bone)] = weight / total
        return v

    def ring(self, centre, tangent, shape, weights):
        """A ring of vertices: `shape` is each one's place across and fore-and-aft of `centre`."""
        x, _, z = frame(tangent)
        made = []
        for i, (across, fore) in enumerate(shape):
            w = weights(i, across) if callable(weights) else weights
            made.append(self.vert(centre + x * across + z * fore, w))
        return made

    def face(self, verts, region, uvs=None):
        f = self.bm.faces.new(verts)
        f.material_index = REGIONS.index(region)
        f.smooth = True
        if uvs:
            # glTF counts a texture's rows from its top: the export turns v over, so it is turned over here first.
            for loop, uv in zip(f.loops, uvs):
                loop[self.uv].uv = (uv[0], 1 - uv[1])
        return f

    def skin(self, a, b, region, u=None, va=0.0, vb=0.0):
        """Quads between two rings of as many vertices; `u(i)` is the texture's place across at column `i`."""
        n = len(a)
        for i in range(n):
            j = (i + 1) % n
            uvs = None
            if u:
                uvs = [(u(i), va), (u(i + 1), va), (u(i + 1), vb), (u(i), vb)]
            self.face([a[i], a[j], b[j], b[i]], region, uvs)

    def cap(self, ring, at, region, weights):
        """Closes a ring to a point."""
        tip = self.vert(at, weights)
        for i in range(len(ring)):
            self.face([ring[i], ring[(i + 1) % len(ring)], tip], region)


def ellipse(rx, rz, count):
    return [
        (math.cos(i / count * math.tau) * rx, math.sin(i / count * math.tau) * rz)
        for i in range(count)
    ]


def match(loop, ring):
    """`loop` turned (and, if need be, reversed) so that each of its vertices is nearest its own in `ring`."""
    best = None
    for order in (loop, loop[::-1]):
        for shift in range(len(order)):
            turned = order[shift:] + order[:shift]
            cost = sum((a.co - b.co).length for a, b in zip(turned, ring))
            if best is None or cost < best[0]:
                best = (cost, turned)
    return best[1]


def build_cage():
    cage = Cage()
    up = (SHOULDER - HIP).normalized()
    base = HIP - up * 0.085
    neck_base = SHOULDER + up * 0.035
    trunk_length = (neck_base - base).length
    back = frame(up)[2]

    # Both legs are modelled with their pedal forward, the middle of the knee's and the hip's travel.
    rest = math.pi / 2
    hips = {s: hip_at(s) for s in (-1, 1)}
    ankles = {s: ankle_at(s, rest) for s in (-1, 1)}
    knees = {s: knee_at(s, hips[s], ankles[s]) for s in (-1, 1)}
    middle = (hips[1] + hips[-1]) / 2
    down = ((knees[1] + knees[-1]) / 2 - middle).normalized()
    under = frame(-down)[2]

    # Where the lap meets the belly: the line the pelvis's rings fan about, from the thighs' to the trunk's.
    t_fan = 0.342
    belly_r = section(TRUNK, t_fan)
    thigh_r = section(THIGHS, 0.36)
    belly_at = lambda s: base + up * (s * trunk_length) + back * (belly_r[2] - belly_r[1])
    lap_at = lambda u: middle + down * u - under * thigh_r[1]
    # The two lines meet where the belly's, followed down, crosses the lap's.
    u_fold, t_fold = 0.15, t_fan
    for _ in range(40):
        p = belly_at(t_fold)
        u_fold = (p - middle).dot(down)
        q = lap_at(u_fold)
        t_fold += (q - p).dot(up) / trunk_length
    fold = lap_at(u_fold)
    t_fan = t_fold

    def trunk_u(i):
        return KIT_TRUNK * (1 - i / 12)

    # The pelvis: five rings of twelve about the fold, from the two thighs side by side to the trunk's ellipse.
    leg_x = 0.085
    rt = thigh_r[0]
    c45 = math.cos(math.pi / 4)
    split = [
        (leg_x + rt, 0),
        (leg_x + rt * c45, thigh_r[1] * c45),
        (leg_x, thigh_r[1]),
        (0, thigh_r[1] * 0.55),
        (-leg_x, thigh_r[1]),
        (-leg_x - rt * c45, thigh_r[1] * c45),
        (-leg_x - rt, 0),
        (-leg_x - rt * c45, -thigh_r[1] * c45),
        (-leg_x, -thigh_r[1]),
        (0, -thigh_r[1] * 0.55),
        (leg_x, -thigh_r[1]),
        (leg_x + rt * c45, -thigh_r[1] * c45),
    ]
    sweep = under.angle(back)
    fan_v = [0.1, 0.16, 0.215, 0.266, t_fan]
    rings = []
    for j, v in enumerate(fan_v):
        f = j / (len(fan_v) - 1)
        # The ring's own "under": the thighs' underside at the first ring, the rider's back at the last.
        turned = turn_x(-sweep * f, under) if turn_x(-sweep, under).dot(back) > 0.99 else turn_x(sweep * f, under)
        tangent = turned.cross(ACROSS)
        oval = ellipse(lerp(leg_x + rt, belly_r[0], f), lerp(thigh_r[1], belly_r[1], f), 12)
        blend = smooth(f * 1.6)
        shape = [(lerp(a[0], b[0], blend), lerp(a[1], b[1], blend)) for a, b in zip(split, oval)]
        # The seat rests on the saddle between the thighs: the ring's underside is drawn up there.
        if 0 < j < len(fan_v) - 1:
            shape[3] = (0, shape[3][1] * (0.6 + 0.3 * f))
        radius = lerp(thigh_r[1], belly_r[1], f)
        centre = fold + turned * radius

        def weights(i, across, f=f):
            leg = (1 - f) ** 1.5 * min(abs(across) / leg_x, 1) * 0.9
            if across == 0:
                leg = 0
            return {"pelvis": 1 - leg, ("thigh.R" if across > 0 else "thigh.L"): leg}

        rings.append((v, cage.ring(centre, tangent, shape, weights)))
    for (va, a), (vb, b) in zip(rings, rings[1:]):
        cage.skin(a, b, "bib" if vb <= 0.2661 else "jersey", trunk_u, va, vb)
    seat = rings[0][1]

    # The trunk above it, to the base of the neck.
    def trunk_weights(t):
        spine = smooth((t - 0.38) / 0.14)
        chest = smooth((t - 0.58) / 0.14)
        neck = smooth((t - 0.94) / 0.1)
        return {
            "pelvis": 1 - spine,
            "spine": spine * (1 - chest),
            "chest": chest * (1 - neck),
            "neck": chest * neck,
        }

    arm_rows = {}
    previous = rings[-1]
    for t in (0.45, 0.57, 0.68, 0.78, 0.87, 0.94, 1.0):
        rx, rz, off = section(TRUNK, t)
        made = cage.ring(base + up * (t * trunk_length) + back * off, up, ellipse(rx, rz, 12), trunk_weights(t))
        cage.skin(previous[1], made, "jersey", trunk_u, previous[0], t)
        previous = (t, made)
        if t in (0.78, 0.87, 0.94):
            arm_rows[t] = made
    neck_ring = previous[1]

    # The neck and the head: an egg, leaning back at the crown as a rider's does who looks up the road.
    nape = neck_base - up * 0.03
    neck_dir = (HEAD - nape).normalized()
    crown_dir = V((0, math.cos(0.25), math.sin(0.25)))
    neck_mid = cage.ring(lerp(nape, HEAD, 0.42), neck_dir, ellipse(0.054, 0.053, 12), {"neck": 1})
    cage.skin(neck_ring, neck_mid, "skin")
    previous = neck_mid
    for h in (-0.072, -0.036, 0.004, 0.044, 0.078):
        f = math.sqrt(1 - (h / 0.098) ** 2)
        made = cage.ring(
            HEAD + crown_dir * h,
            crown_dir,
            ellipse(0.076 * f, 0.092 * f, 12),
            {"head": 1, "neck": 0.4 if h < -0.05 else 0},
        )
        for i in range(12):
            # The hair: the back of the head, and all of it above the brow.
            hair = (h > -0.04 and 1 <= i <= 4) or h > 0.04
            cage.face([previous[i], previous[(i + 1) % 12], made[(i + 1) % 12], made[i]], "hair" if hair else "skin")
        previous = made
    cage.cap(previous, HEAD + crown_dir * 0.098, "hair", {"head": 1})

    for side, name in ((1, "R"), (-1, "L")):
        # A leg: from its half of the seat's ring down the thigh, round the knee and down the shin to the ankle.
        hip, knee, ankle = hips[side], knees[side], ankles[side]
        thigh_dir = (knee - hip).normalized()
        shin_dir = (ankle - knee).normalized()
        knee_dir = (thigh_dir + shin_dir).normalized()
        if side > 0:
            loop = [seat[0], seat[11], seat[10], seat[9], None, seat[3], seat[2], seat[1]]
        else:
            loop = [None, seat[9], seat[8], seat[7], seat[6], seat[5], seat[4], seat[3]]
        loop_region = "shorts"
        steps = []
        start = (seat[0].co - blender(middle)).dot(blender(down)) + 0.0
        for u in (start + 0.07, 0.55 * THIGH, 0.74 * THIGH, 0.8 * THIGH):
            steps.append(("thigh", u))
        steps += [("thigh", THIGH - 0.05), ("knee", 0), ("shin", 0.05)]
        steps += [("shin", s * SHIN) for s in (0.3, 0.46, 0.62, 0.69, 0.92, 1.0)]
        previous, previous_u = None, start
        for part, u in steps:
            if part == "thigh":
                rx, rz, off = section(THIGHS, u / THIGH)
                centre, tangent, along = hip + thigh_dir * u, thigh_dir, u
            elif part == "knee":
                rx, rz, off = section(THIGHS, 1)
                # The kneecap stands a little proud at the front of the bend.
                centre, tangent, along = knee, knee_dir, THIGH
                off += 0.012
            else:
                rx, rz, off = section(SHINS, u / SHIN)
                centre, tangent, along = knee + shin_dir * u, shin_dir, THIGH + u
            lower = smooth((along - (THIGH - 0.06)) / 0.12)
            x, _, front = frame(tangent)
            made = cage.ring(
                centre + front * off,
                tangent,
                ellipse(rx, rz, 8),
                {f"thigh.{name}": 1 - lower, f"shin.{name}": lower},
            )
            if previous is None:
                # The crotch: one vertex between the legs, which both legs' first rings share.
                if "crotch" not in arm_rows:
                    arm_rows["crotch"] = cage.vert(middle + down * (start - 0.012), {"pelvis": 1})
                loop = [v if v is not None else arm_rows["crotch"] for v in loop]
                previous = loop
            if along <= 0.74 * THIGH + 1e-6:
                region = "shorts"
            elif along <= 0.8 * THIGH + 1e-6:
                region = "gripper"
            elif along <= THIGH + 0.69 * SHIN + 1e-6:
                region = "skin"
            else:
                region = "sock"
            cage.skin(previous, made, region)
            previous, previous_u = made, along
        cage.cap(previous, ankle + shin_dir * 0.012, "sock", {f"shin.{name}": 1})

        # An arm: out of the shoulder's corner of the trunk, round the elbow to a mitten hand on the hood.
        shoulder, elbow, hand = shoulder_at(side), elbow_at(side), hand_at(side)
        upper_dir = (elbow - shoulder).normalized()
        fore_dir = (hand - elbow).normalized()
        low, mid, high = arm_rows[0.78], arm_rows[0.87], arm_rows[0.94]
        cols = (10, 11, 0) if side > 0 else (8, 7, 6)
        cage.bm.faces.ensure_lookup_table()
        bmesh.ops.delete(cage.bm, geom=[mid[cols[1]]], context="VERTS")
        hole = [low[cols[0]], low[cols[1]], low[cols[2]], mid[cols[2]], high[cols[2]], high[cols[1]], high[cols[0]], mid[cols[0]]]
        for v in hole:
            v[cage.deform][cage.bones.index("chest")] = 0.65
            bone = f"clavicle.{name}"
            if bone not in cage.bones:
                cage.bones.append(bone)
            v[cage.deform][cage.bones.index(bone)] = 0.35
        steps = [("upper", m) for m in (0.035, 0.1, 0.62 * UPPER_ARM, UPPER_ARM - 0.045)]
        steps += [("elbow", 0), ("fore", 0.045), ("fore", 0.55 * FOREARM), ("fore", 0.84 * FOREARM), ("fore", FOREARM)]
        previous, first = None, True
        sleeve_u = lambda i: 1 - (i / 8) * (1 - KIT_TRUNK)
        cuff = 0.62 * UPPER_ARM
        previous_m = 0.0
        for part, m in steps:
            if part == "upper":
                rx, rz, off = section(UPPER_ARMS, m / UPPER_ARM)
                centre, tangent, along = shoulder + upper_dir * m, upper_dir, m
            elif part == "elbow":
                rx, rz, off = section(UPPER_ARMS, 1)
                centre, tangent, along = elbow, (upper_dir + fore_dir).normalized(), UPPER_ARM
            else:
                rx, rz, off = section(FOREARMS, m / FOREARM)
                centre, tangent, along = elbow + fore_dir * m, fore_dir, UPPER_ARM + m
            lower = smooth((along - (UPPER_ARM - 0.045)) / 0.09)
            wrist = smooth((along - (UPPER_ARM + 0.84 * FOREARM)) / (0.16 * FOREARM))
            collar = 0.3 if first else 0
            made = cage.ring(
                centre,
                tangent,
                ellipse(rx, rz, 8),
                {
                    f"clavicle.{name}": collar,
                    f"upperarm.{name}": (1 - collar) * (1 - lower),
                    f"forearm.{name}": lower * (1 - wrist),
                    f"hand.{name}": lower * wrist,
                },
            )
            if first:
                previous = match(hole, made)
                first = False
            if along <= cuff + 1e-6:
                cage.skin(previous, made, "sleeve", sleeve_u, previous_m / cuff, along / cuff)
            else:
                cage.skin(previous, made, "glove" if along > UPPER_ARM + 0.84 * FOREARM + 1e-6 else "skin")
            previous, previous_m = made, along
        # The hand, in a fingerless glove: the palm lying along the hood, the fingers curled down over its front.
        knuckles = hand + V((0, -0.012, -0.076))
        tips = knuckles + V((0, -0.07, 0.016))
        palm_dir = (knuckles - hand).normalized()
        finger_dir = (tips - knuckles).normalized()
        hand_w = {f"hand.{name}": 1}
        for centre, tangent, rx, rz, region in (
            (lerp(hand, knuckles, 0.45), palm_dir, 0.041, 0.024, "glove"),
            (knuckles + V((0, 0.004, -0.004)), (palm_dir + finger_dir).normalized(), 0.041, 0.021, "glove"),
            (lerp(knuckles, tips, 0.45), finger_dir, 0.039, 0.016, "glove"),
            (lerp(knuckles, tips, 0.92), finger_dir, 0.035, 0.012, "skin"),
        ):
            made = cage.ring(centre, tangent, ellipse(rx, rz, 8), hand_w)
            cage.skin(previous, made, region)
            previous = made
        cage.cap(previous, tips + finger_dir * 0.006, "skin", hand_w)

    bmesh.ops.remove_doubles(cage.bm, verts=cage.bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(cage.bm, faces=cage.bm.faces)
    return cage


def check_watertight(bm, what):
    open_edges = [e for e in bm.edges if len(e.link_faces) != 2]
    if open_edges:
        raise SystemExit(f"{what} is not watertight: {len(open_edges)} edges are not shared by two faces")


def make_body(cage, armature, name, levels):
    """The cage, subdivided `levels` times, clothed and painted, as an object on the armature."""
    mesh = bpy.data.meshes.new(name + "-cage")
    cage.bm.to_mesh(mesh)
    for region in REGIONS:
        mesh.materials.append(material(region))
    obj = bpy.data.objects.new(name + "-cage", mesh)
    bpy.context.scene.collection.objects.link(obj)
    for bone in cage.bones:
        obj.vertex_groups.new(name=bone)
    subdivision = obj.modifiers.new("Subdivision", "SUBSURF")
    subdivision.levels = levels
    subdivision.render_levels = levels
    subdivision.uv_smooth = "PRESERVE_BOUNDARIES"
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    fine = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=bpy.context.evaluated_depsgraph_get())
    bpy.data.objects.remove(obj)
    bpy.data.meshes.remove(mesh)
    fine.name = name

    bm = bmesh.new()
    bm.from_mesh(fine)
    check_watertight(bm, name)
    # The kit's thickness: everything worn is raised off the skin, and the jersey again off the shorts, so every
    # hem is a small step that catches the light.
    kit_index = {REGIONS.index(r) for r in CLOTHED}
    jersey_index = {REGIONS.index(r) for r in ("jersey", "sleeve")}
    for worn, depth in ((kit_index, CLOTH), (jersey_index, JERSEY)):
        faces = [f for f in bm.faces if f.material_index in worn]
        before = set(bm.faces)
        bmesh.ops.inset_region(bm, faces=faces, thickness=0.0, depth=depth, use_even_offset=True, use_boundary=True)
        for f in set(bm.faces) - before:
            # The hem's own edge: the cloth's colour, and a crisp step.
            inner = [n for e in f.edges for n in e.link_faces if n.material_index in worn and n in before]
            if inner:
                f.material_index = inner[0].material_index
            for e in f.edges:
                e.smooth = False
    check_watertight(bm, name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    colour = bm.loops.layers.color.new("Col")
    for f in bm.faces:
        marker = MARKERS[REGIONS[f.material_index]]
        for loop in f.loops:
            loop[colour] = (*marker, 1)
        f.material_index = 0 if REGIONS[f.material_index] in KIT else 1
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(fine)
    bm.free()
    # Two materials are left: what the kit's texture is drawn on, and what is coloured by vertex.
    while len(fine.materials) > 2:
        fine.materials.pop(index=len(fine.materials) - 1)
    fine.materials[0] = material("kit")
    fine.materials[1] = material("plain")
    fine.color_attributes.active_color = fine.color_attributes["Col"]
    fine.color_attributes.render_color_index = fine.color_attributes.find("Col")

    body = bpy.data.objects.new(name, fine)
    bpy.context.scene.collection.objects.link(body)
    body.parent = armature
    modifier = body.modifiers.new("Armature", "ARMATURE")
    modifier.object = armature
    return body


def material(name):
    made = bpy.data.materials.get(name)
    if not made:
        made = bpy.data.materials.new(name)
    return made


def build_armature():
    """Nineteen bones: pelvis, spine, chest, neck, head, and a collarbone, arm and leg each side."""
    up = (SHOULDER - HIP).normalized()
    neck_base = SHOULDER + up * 0.035
    data = bpy.data.armatures.new("rider")
    armature = bpy.data.objects.new("rider", data)
    bpy.context.scene.collection.objects.link(armature)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None, connect=False):
        made = data.edit_bones.new(name)
        made.head, made.tail = blender(head), blender(tail)
        if parent:
            made.parent = data.edit_bones[parent]
            made.use_connect = connect
        return made

    rest = math.pi / 2
    waist = HIP + up * 0.16
    chest = HIP + up * 0.32
    bone("pelvis", HIP + V((0, -0.035, 0.005)), waist)
    bone("spine", waist, chest, "pelvis", True)
    bone("chest", chest, neck_base, "spine", True)
    bone("neck", neck_base, lerp(neck_base, HEAD, 0.6), "chest", True)
    bone("head", lerp(neck_base, HEAD, 0.6), HEAD + V((0, 0.1, 0.02)), "neck", True)
    for side, name in ((1, "R"), (-1, "L")):
        shoulder, elbow, hand = shoulder_at(side), elbow_at(side), hand_at(side)
        bone(f"clavicle.{name}", SHOULDER + V((side * 0.03, 0, 0)), shoulder, "chest")
        bone(f"upperarm.{name}", shoulder, elbow, f"clavicle.{name}", True)
        bone(f"forearm.{name}", elbow, hand, f"upperarm.{name}", True)
        bone(f"hand.{name}", hand, hand + V((0, -0.012, -0.076)), f"forearm.{name}", True)
        hip, ankle = hip_at(side), ankle_at(side, rest)
        knee = knee_at(side, hip, ankle)
        bone(f"thigh.{name}", hip, knee, "pelvis")
        bone(f"shin.{name}", knee, ankle, f"thigh.{name}", True)
        bone(f"foot.{name}", ankle, pedal_at(side, rest) + V((0, 0.012, 0)), f"shin.{name}", True)
    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def empty(name, at, parent=None):
    made = bpy.data.objects.new(name, None)
    made.empty_display_size = 0.04
    bpy.context.scene.collection.objects.link(made)
    made.parent = parent
    made.location = at
    made.rotation_mode = "XYZ"
    return made


def rig(armature):
    """The feet held to targets on the pedals, the hands to the hoods, and the turn of the cranks keyed."""
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 0
    scene.frame_end = 2 * TURN + 1
    guides = []
    crank = empty("crank", blender(BB))
    guides.append(crank)
    pedals = {}
    for i, (side, name) in enumerate(((-1, "L"), (1, "R"))):
        # The pedal turns with the crank and is tipped as the foot is; the ankle's target rides on it.
        away = -CRANK if i == 0 else CRANK
        pedal = empty(f"pedal.{name}", blender(V((side * PEDAL_OUT, away, 0))), crank)
        ankle = empty(f"ankle.{name}", blender(V((-side * 0.01, 0.085, 0.115))), pedal)
        ball = empty(f"ball.{name}", blender(V((0, 0.012, 0))), pedal)
        hood = empty(f"hood.{name}", blender(hand_at(side)))
        pedals[name] = (pedal, i * math.pi)
        guides += [pedal, ankle, ball, hood]
        bpy.context.view_layer.update()
        hood.matrix_world = armature.matrix_world @ armature.data.bones[f"hand.{name}"].matrix_local
        hood.location = blender(hand_at(side))

        pose = armature.pose.bones
        leg = pose[f"shin.{name}"].constraints.new("IK")
        leg.target, leg.chain_count = ankle, 2
        foot = pose[f"foot.{name}"].constraints.new("DAMPED_TRACK")
        foot.target, foot.track_axis = ball, "TRACK_Y"
        arm = pose[f"forearm.{name}"].constraints.new("IK")
        arm.target, arm.chain_count = hood, 2
        hold = pose[f"hand.{name}"].constraints.new("COPY_ROTATION")
        hold.target = hood

    pelvis = armature.pose.bones["pelvis"]
    pelvis.rotation_mode = "QUATERNION"
    rest_matrix = armature.data.bones["pelvis"].matrix_local.copy()
    to_blender = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0))).to_4x4()
    for frame_number in range(2 * TURN + 2):
        standing = 1.0 if frame_number > TURN else 0.0
        step = frame_number if frame_number <= TURN else frame_number - TURN - 1
        a = step / TURN * math.tau
        crank.rotation_euler = (a, 0, 0)
        crank.keyframe_insert("rotation_euler", frame=frame_number)
        for pedal, ahead in pedals.values():
            pedal.rotation_euler = (foot_pitch(a + ahead) - a, 0, 0)
            pedal.keyframe_insert("rotation_euler", frame=frame_number)
        # The trunk sways over the bike about the line from the hips to the hands and rises and falls a touch
        # twice a turn; out of the saddle it turns about the hands, and sways and rises further.
        stroke = math.sin(a)
        rise = Quaternion(ACROSS, -STAND * standing)
        turn = rise @ Quaternion(SPINE, -stroke * (SWAY + SWAY_STANDING * standing))
        hips = HANDS + rise @ (HIP - HANDS)
        hips.y += math.cos(a * 2) * (BOB + BOB_STANDING * standing)
        move = Matrix.Translation(hips) @ turn.to_matrix().to_4x4() @ Matrix.Translation(-HIP)
        pelvis.matrix = to_blender @ move @ to_blender.inverted() @ rest_matrix
        pelvis.keyframe_insert("location", frame=frame_number)
        pelvis.keyframe_insert("rotation_quaternion", frame=frame_number)
    for obj in [armature, *guides]:
        action = obj.animation_data.action if obj.animation_data else None
        for curve in action_curves(action):
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"
    return guides


def action_curves(action):
    if action is None:
        return []
    if hasattr(action, "fcurves") and len(getattr(action, "layers", [])) == 0:
        return list(action.fcurves)
    curves = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                curves += list(bag.fcurves)
    return curves


def check_feet(armature):
    """How far, at the worst, a baked ankle is from where the pedal puts it."""
    worst = 0.0
    for frame_number in range(2 * TURN + 2):
        bpy.context.scene.frame_set(frame_number)
        step = frame_number if frame_number <= TURN else frame_number - TURN - 1
        a = step / TURN * math.tau
        for i, (side, name) in enumerate(((-1, "L"), (1, "R"))):
            tail = armature.matrix_world @ armature.pose.bones[f"shin.{name}"].tail
            worst = max(worst, (tail - blender(ankle_at(side, a + i * math.pi))).length)
    return worst


def bake(armature, guides):
    """The constraints' result as plain keyframes on every bone; the constraints and their targets go."""
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.nla.bake(
        frame_start=0,
        frame_end=2 * TURN + 1,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        use_current_action=True,
        bake_types={"POSE"},
    )
    bpy.ops.object.mode_set(mode="OBJECT")
    armature.animation_data.action.name = "pedal"
    for guide in guides:
        bpy.data.objects.remove(guide)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cage = build_cage()
    check_watertight(cage.bm, "the cage")
    armature = build_armature()
    bodies = [make_body(cage, armature, "body", 1), make_body(cage, armature, "body-fine", 2)]
    cage.bm.free()
    guides = rig(armature)
    before = check_feet(armature)
    bake(armature, guides)
    after = check_feet(armature)
    print(f"ankles off the pedals' targets by at most {before * 1000:.2f} mm held, {after * 1000:.2f} mm baked")
    if after > 0.004:
        raise SystemExit("the baked feet have left the pedals")
    for body in bodies:
        print(f"{body.name}: {len(body.data.vertices)} vertices, {len(body.data.polygons)} triangles")

    os.makedirs(os.path.dirname(BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_skins=True,
        export_animations=True,
        export_animation_mode="ACTIVE_ACTIONS",
        export_force_sampling=True,
        export_frame_range=True,
        export_optimize_animation_size=False,
        export_def_bones=False,
        export_vertex_color="ACTIVE",
        export_all_vertex_colors=False,
        export_active_vertex_color_when_no_material=True,
        export_tangents=False,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
    )
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {os.path.getsize(OUT) / 1024:.0f} kB")


if __name__ == "__main__":
    main()
