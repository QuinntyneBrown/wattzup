# 0036. The course's rider is one mesh built in Blender, rigged, and its pedalling baked

- **Status:** Proposed
- **Date:** 2026-11-23
- **Amends:** [0034](0034-maps-built-in-blender.md)

## Context

The course's rider (L2-166 AC26) was put together in the browser from separate rigid shapes: a
trunk, two tubes an arm, two a leg, a ball for the seat. Where they met they showed: a gap at the
shoulder, a pinch at the elbow, a knee standing out of the leg. The kit was painted on the same
smooth tubes, so nothing told the eye where a sleeve ended. Each frame the app worked out where
each knee was from the pedal under it.

A map is already a model built in Blender by a script (ADR 0034).

## Decision

- **The rider's body is one connected, watertight mesh, built in Blender.** `tools/blender/rider.py`
  models trunk, neck, head, arms to mitten hands and legs to the ankles as one cage of quads in the
  riding position and subdivides it, with edge loops round each knee, elbow, hip and shoulder. The
  helmet, the shoes and the bike are not part of it: the app still makes those.
- **It is modelled by the script, not from a bought or downloaded figure.** No licence comes with
  it, the build is repeatable, and the loops are where the script puts them (a figure decimated to
  size loses its loops).
- **The kit has thickness.** What is worn is raised 2 mm off the skin and the jersey 2 mm more off
  the shorts, so the collar, the sleeve hems, the jersey's hem, the shorts' cuffs, the gloves' cuffs
  and the sock tops are each a small step.
- **A humanoid armature of 19 bones** (pelvis, spine, chest, neck, head; a collarbone, upper arm,
  forearm, hand, thigh, shin and foot each side). No finger bones.
- **Inverse kinematics in Blender, baked before export.** The feet are held to targets that ride
  the pedals and the hands to the brake hoods. One turn of the cranks is keyed seated and one out
  of the saddle, 30 frames each, and both are baked to plain keyframes on every bone (visual
  keying, constraints cleared). The app plays the turn from the crank's angle and blends the two by
  how far the rider is out of the saddle; it works out no kinematics.
- **Served as `public/riders/rider.glb`**, loaded with the course. It holds the body at two
  finenesses (the cage subdivided once and twice) on the one armature. The body's regions (skin,
  shorts, gripper, sock, glove, hair, kit) are marked in its vertex colours; the app paints each
  rider's own colours over them and draws the kit's texture on the trunk and sleeves.

## Consequences

- The bike's measurements are in two places, `course-cyclist.ts` and `tools/blender/rider.py`. A
  change to the frame, the cranks or the hoods needs the rider rebuilt, or the feet leave the
  pedals. The script fails if a baked ankle is more than 4 mm from where its pedal puts it.
- The muscles and tendons that were painted on the skin as lines of light and shade are gone; the
  body's shape carries them.
- Between seated and standing the app blends two baked poses, so on a 6 % climb an ankle can sit a
  few millimetres off its pedal, inside the shoe.
- A rider's body is two draw calls (the kit's texture, and everything coloured by vertex) and is
  no longer part of the batch that draws every rider's moving parts as one; the shoes, cranks and
  pedals still are.
- The rider is rebuilt by its script: a change modelled by hand in `rider.blend` is lost on the
  next build.
