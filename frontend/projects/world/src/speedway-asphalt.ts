import { texture, vertexColor, positionWorld } from 'three/tsl';
import { MeshStandardNodeMaterial, type DataTexture } from 'three/webgpu';

/** Grain follows the permanent asphalt in world metres across all three laps. */
export function speedwayAsphalt(detail: DataTexture): MeshStandardNodeMaterial {
  const ground = new MeshStandardNodeMaterial({ roughness: 0.88 });
  const place = positionWorld.xz;
  const aggregate = texture(detail, place.mul(0.97)).r;
  const scuff = texture(detail, place.mul(0.104)).g;
  ground.colorNode = vertexColor()
    .rgb.mul(aggregate.mul(0.18).add(0.9))
    .mul(scuff.mul(0.08).add(0.96));
  return ground;
}
