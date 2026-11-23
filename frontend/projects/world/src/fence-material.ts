// The material a course's railings are drawn with (L2-166 AC19). The Blender pipeline builds a railing as one flat
// panel a stretch of road in the map's `Fences` group, its UV the metres along it and the share of its height. From
// that the material draws a post every two metres and three rails, and cuts the rest of the panel away: a railing
// the length of the map for two triangles every four metres.
import { abs, float, fract, max, step, uv, vertexColor } from 'three/tsl';
import { DoubleSide, type Material, MeshLambertNodeMaterial, type Node } from 'three/webgpu';

/** Metres between posts and a post's width; each rail's middle and thickness, as shares of the railing's height. */
const POSTS = { every: 2, width: 0.07 } as const;
const RAILS: readonly (readonly [number, number])[] = [
  [0.97, 0.06],
  [0.55, 0.045],
  [0.14, 0.045],
];

/** The railings' material; `light`, where the course has street lamps, is their light at the surface. */
export function fenceMaterial(light: Node<'vec3'> | null, strength: number): Material {
  const along = uv().x;
  // glTF keeps a UV's second number upside down.
  const up = float(1).sub(uv().y);
  const post = step(abs(fract(along.div(POSTS.every)).sub(0.5)), POSTS.width / POSTS.every / 2);
  let metal: Node<'float'> = post;
  for (const [middle, thick] of RAILS) metal = max(metal, step(abs(up.sub(middle)), thick / 2));

  const material = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  const colour = vertexColor().rgb;
  material.colorNode = colour;
  if (light) material.emissiveNode = colour.mul(light).mul(strength);
  material.opacityNode = metal;
  material.alphaTest = 0.5;
  return material;
}
