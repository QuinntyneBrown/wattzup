# 0024. World Ride draws a stylised look at the low tier

- **Status:** Proposed, to be reviewed by a person against the first screenshot (#663)
- **Date:** 2026-11-20
- **Amends:** [0020](0020-three-js-for-world-ride.md), [0021](0021-webgpu-renderer-with-webgl2-fallback.md)

## Context

Every tier of L2-111 aims at photorealism. A screen that cannot hold `medium` gets `low`:
physically based shading with most of what makes it look real switched off. That is the least
convincing version of each scene, and it is the one most riders on a phone, tablet or older
laptop see. [StarKnightt/summer-cycle](https://github.com/StarKnightt/summer-cycle) shows a
stylised look that costs little and still looks deliberate: three-band toon shading, ink
outlines from one post pass, a graded sky and dithered leaves.

Three ways were weighed:

1. **Keep PBR at `low`.** Nothing to build; `low` keeps looking unfinished.
2. **A rider choice, "Look: realistic / drawn".** A new option with its own control, kept
   preference and README entry. Every tier would need both looks, doubling what the sweeps and
   specs must cover, for a choice most riders never make.
3. **Replace PBR at `low` with a drawn look.** The tier stays the only knob. The look changes
   only where the realistic one is weakest, and the frame budget picks it as it picks any tier.

## Decision

- At `low`, World Ride draws the **drawn look**: L2-111 techniques 51 to 54 (banded toon shading
  with a sky-coloured rim light, one ink outline pass from depth and normals, a flat three-stop
  sky gradient, and ordered-dither foliage). They draw at `low` only.
- Physically based microfacet shading (technique 4) starts at `medium`. From `medium` up,
  the look is photoreal as ADRs 0020 and 0021 set out.
- **No option** chooses the look, and a catalogue class cannot ask for the drawn look at a
  higher tier. Either can be added later with its own requirement.
- The drawn look keeps every rule of L2-110 and L2-111: the bend in the vertex stage (ADR 0023),
  reduced motion, HUD responsiveness, and compiling ahead (criterion 10).

## Consequences

- A tier drop from `medium` to `low` changes the look visibly, from realistic to drawn. That is
  accepted: the alternative was a scene that looked broken.
- The drawn look must cost no more than today's `low`. The performance sweep checks it.
- Outlines must not be the only way pacers are told apart from the rider (L1-017); their labels
  stay.
- If the first screenshots are not liked, the decision is reversed by switching techniques 51
  to 54 off and moving technique 4 back to `low`; nothing else depends on it.
