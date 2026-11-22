// The finish of each part of a rider and their bike (L2-166 AC28): how glossy it is and whether it is metal, carried
// in the vertices beside the colour (the `finish` attribute course-cyclist.ts writes: gloss, metal), so one mesh
// and one material draw skin, lycra, a helmet's shell, carbon, steel and rubber each as itself.
import { attribute, float, normalView, positionViewDirection } from 'three/tsl';
import type { MeshStandardNodeMaterial, Node } from 'three/webgpu';

/** Gives a material coloured by vertex the roughness and metalness its vertices carry. Returns the gloss. */
export function vertexFinish(material: MeshStandardNodeMaterial): Node<'float'> {
  const finish = attribute('finish', 'vec2');
  const gloss = finish.x as Node<'float'>;
  // The glossiest part is not a mirror: a rough 0.18 keeps a highlight a few pixels wide on a rider far up the road.
  material.roughnessNode = float(1).sub(gloss.mul(0.82));
  material.metalnessNode = finish.y;
  return gloss;
}

/**
 * How much of a light that is all around (the street lamps' glow) a glossy surface throws back along its edges: none
 * face on, most where the surface turns away from the eye.
 */
export function sheen(gloss: Node<'float'>): Node<'float'> {
  const facing = normalView.dot(positionViewDirection).saturate();
  return float(1).sub(facing).pow(3).mul(gloss);
}
