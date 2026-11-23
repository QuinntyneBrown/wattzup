// The material a course's windows are drawn with (L2-166 AC18). The Blender pipeline builds each window as one flat
// panel in the map's `Windows` group, a little larger than the opening; its UV is the place on the panel (0 to 1 each
// way), with 2 added across for a lit window and 2 added up for each step of the window's own number. From that the
// material draws the stone lintel and sill, the frame and its glazing bars, and behind the glass either a lit room
// (its lamp's colour, a blind drawn part-way, shapes against the light) or dark panes holding a little of the sky.
// A loading door is a panel of the same group, marked as one: a steel frame and a roller shutter, part-way up on a
// lit bay or shut.
import {
  abs,
  float,
  floor,
  fract,
  max,
  mix,
  min,
  sin,
  smoothstep,
  step,
  texture,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { Color } from 'three/webgpu';
import {
  type DataTexture,
  DoubleSide,
  type Material,
  MeshBasicNodeMaterial,
  type Node,
} from 'three/webgpu';

/**
 * The opening within the panel, as shares of the panel: `Kit.window` (tools/blender/themes.py) builds a 1.4 x 1.9 m
 * opening with 0.18 m each side, 0.14 m of sill beneath and 0.24 m of lintel above.
 */
const OPENING = { left: 0.102, right: 0.898, bottom: 0.061, top: 0.895 } as const;
/** The frame's width and a glazing bar's, as shares of the opening; the panes across and up. */
const FRAME = 0.075;
const BAR = 0.028;
const PANES = [2, 3] as const;
/** The slats of a loading door's shutter, from its foot to its head. */
const SLATS = 22;
/** How bright a lit room is: enough to bloom at the tiers that have it. */
const ROOM = 1.7;

/**
 * The windows' material. `detail` is the ground's detail texture; `haze` the colour dark glass holds of the sky;
 * `light`, where the course has street lamps, their light at the surface (lamp-glow.ts).
 */
export function windowMaterial(
  detail: DataTexture,
  haze: Color,
  light: Node<'vec3'> | null,
): Material {
  const across = uv().x;
  // glTF keeps a UV's second number upside down.
  const raised = float(1).sub(uv().y);
  // Two numbers ride on the place across the panel: 2 for a lit one, 4 for a door (tools/blender/themes.py).
  const kind = floor(across.div(2));
  const door = step(2, kind);
  const lit = kind.sub(door.mul(2));
  const number = floor(raised.div(2));
  const panel = vec2(across.sub(kind.mul(2)), raised.sub(number.mul(2)));
  const pick = (salt: number) => fract(sin(number.mul(12.9898).add(salt)).mul(43758.5453));

  // Where on the opening: 0 to 1 each way, outside it beyond.
  const at = vec2(
    panel.x.sub(OPENING.left).div(OPENING.right - OPENING.left),
    panel.y.sub(OPENING.bottom).div(OPENING.top - OPENING.bottom),
  );
  const inside = step(0, at.x).mul(step(at.x, 1)).mul(step(0, at.y)).mul(step(at.y, 1));
  // The lintel spans the panel above the opening and the sill beneath it; beside the opening the wall shows.
  const stone = step(1, at.y).max(step(at.y, 0));
  const edge = min(min(at.x, at.x.oneMinus()), min(at.y, at.y.oneMinus()));
  const frame = step(edge, FRAME);
  const bars = PANES.map((count, axis) => {
    const along = (axis === 0 ? at.x : at.y).mul(count);
    return step(abs(fract(along).sub(0.5)).oneMinus().sub(0.5), (BAR * count) / 2);
  });
  const wood = max(frame, max(bars[0]!, bars[1]!));

  // A lit room: its lamp warm or cool, brighter towards the ceiling, a blind drawn part-way, shapes against the light.
  const lamp = mix(vec3(1, 0.7, 0.36), vec3(0.72, 0.86, 1), step(0.78, pick(1))).mul(
    pick(2).mul(0.7).add(0.55),
  );
  const shapes = texture(detail, vec2(at.x.mul(0.07).add(pick(3)), at.y.mul(0.05).add(pick(4)))).g;
  const blind = step(pick(5).mul(0.75).oneMinus(), at.y);
  const room = lamp
    .mul(mix(0.5, 1.15, at.y))
    .mul(mix(smoothstep(0.25, 0.6, shapes).mul(0.75).add(0.3), float(0.8), blind))
    .mul(ROOM);
  // A dark one: black glass holding a little of the sky, more towards its top; a pane here and there darker still.
  const pane = floor(at.mul(vec2(PANES[0], PANES[1])));
  const dull = fract(sin(pane.dot(vec2(39.346, 11.135)).add(number)).mul(24634.6345));
  const dark = vec3(haze.r, haze.g, haze.b)
    .mul(mix(0.12, 0.5, at.y))
    .mul(mix(0.35, 1, step(0.25, dull)))
    .add(vec3(0.004, 0.005, 0.008));
  const glass = mix(dark, room, lit);

  // Painted wood and pale stone, by the night's own light and the lamps'.
  const day = light ? vec3(0.1, 0.11, 0.16).add(light.mul(0.55)) : vec3(0.75, 0.75, 0.75);
  const grain = texture(detail, panel.mul(vec2(1.1, 1.5)).add(pick(6)))
    .r.mul(0.5)
    .add(0.75);
  // Warm aged-larch / dark-stained timber muntin frames & pale Dolomite stone sills/lintels.
  const timber = mix(vec3(0.14, 0.1, 0.075), vec3(0.09, 0.1, 0.11), step(0.5, pick(8)))
    .mul(grain)
    .mul(day);
  const masonry = vec3(0.56, 0.53, 0.48).mul(grain).mul(day);

  // A loading door fills its panel: a steel frame and a roller shutter of slats. A dark one is shut; a lit one is
  // part-way up, and under it the bay shows, lit like a room.
  const rim = min(min(panel.x, panel.x.oneMinus()), panel.y.oneMinus());
  const open = lit.mul(pick(7).mul(0.6).add(0.25));
  const slat = step(fract(panel.y.mul(SLATS)), 0.16);
  const steel = vec3(0.3, 0.33, 0.37)
    .mul(grain)
    .mul(mix(float(1), float(0.55), slat))
    .mul(day);
  const bay = lamp
    .mul(mix(0.35, 1, panel.y.div(open.max(0.01)).min(1)))
    .mul(smoothstep(0.2, 0.65, shapes).mul(0.8).add(0.25))
    .mul(ROOM * 0.8);
  const shutter = mix(steel, bay, step(panel.y, open));
  const doorway = mix(shutter, timber.mul(1.6), step(rim, 0.035));

  const material = new MeshBasicNodeMaterial({ side: DoubleSide });
  material.colorNode = mix(mix(mix(glass, timber, wood), masonry, stone), doorway, door);
  // Beside a window's opening, between the sill and the lintel, the panel is not drawn; a door's is, all of it.
  material.opacityNode = max(max(inside, stone), door);
  material.alphaTest = 0.5;
  return material;
}
