// The drawn look's ink outlines (L2-111 technique 52, criterion 11, ADR 0024): one full-screen
// pass over the scene pass's depth, normals and ink mask. A pixel is inked where its view depth
// jumps, or its normal turns, against any of its four neighbours, by edgeAmount()'s rule. Where
// the rider or a pacer is drawn, the ink is warmer. The HUD is HTML over the canvas, never inked.
import {
  cameraFar,
  cameraNear,
  color,
  colorToDirection,
  float,
  max,
  mix,
  perspectiveDepthToViewZ,
  screenSize,
  screenUV,
  smoothstep,
  vec2,
  vec4,
} from 'three/tsl';
import { EDGE, INK } from './drawn-look';

type Vec4Node = ReturnType<typeof vec4>;
type Vec2Node = ReturnType<typeof vec2>;
/** Typed loosely: three's TSL typings give each operation its own node class. */
type FloatNode = ReturnType<typeof max>;

/** The parts of three's PassNode this pass reads. */
interface ScenePass {
  getTextureNode(name: string): { sample(uv: Vec2Node): Vec4Node };
}

/** The four neighbours a pixel is compared with, in pixels. */
const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** `beauty` with the ink outline drawn over it. */
export function inkOutline(beauty: Vec4Node, scenePass: ScenePass): Vec4Node {
  const depth = scenePass.getTextureNode('depth');
  const normals = scenePass.getTextureNode('normal');
  const ink = scenePass.getTextureNode('ink');
  const texel = vec2(1, 1).div(screenSize);
  const viewZ = (uv: Vec2Node) =>
    perspectiveDepthToViewZ(depth.sample(uv).r, cameraNear, cameraFar) as unknown as FloatNode;
  const normalAt = (uv: Vec2Node) => colorToDirection(normals.sample(uv).rgb);

  const here = screenUV as unknown as Vec2Node;
  const z = viewZ(here);
  const n = normalAt(here);
  let depthJump = float(0) as unknown as FloatNode;
  let normalTurn = float(0) as unknown as FloatNode;
  let warm: FloatNode = ink.sample(here).r as unknown as FloatNode;
  for (const [dx, dy] of NEIGHBOURS) {
    const uv = here.add(texel.mul(vec2(dx, dy))) as unknown as Vec2Node;
    depthJump = max(depthJump, viewZ(uv).sub(z).abs().div(z.abs())) as unknown as FloatNode;
    normalTurn = max(normalTurn, float(1).sub(n.dot(normalAt(uv)))) as unknown as FloatNode;
    warm = max(warm, ink.sample(uv).r) as unknown as FloatNode;
  }
  const edge = max(
    smoothstep(float(EDGE.depth - EDGE.soft), float(EDGE.depth + EDGE.soft), depthJump),
    smoothstep(float(EDGE.normal - EDGE.soft), float(EDGE.normal + EDGE.soft), normalTurn),
  ).mul(EDGE.strength);
  const inkColour = mix(color(INK.scenery), color(INK.riders), warm);
  return vec4(mix(beauty.rgb, inkColour, edge), beauty.a);
}
