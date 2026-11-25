import { abs, mix, smoothstep, texture, uv, vec2 } from 'three/tsl';
import { MeshStandardNodeMaterial, RepeatWrapping } from 'three/webgpu';
import { packedSaltTexture } from './bonneville-packed-salt';
import { saltCrustTexture } from './world-kit';

/** The original Speed Week road and its hexagonal shoulder, with the repeat measured in metres. */
export function saltFlatMaterial(halfWidth: number) {
  const packed = packedSaltTexture();
  const crust = saltCrustTexture();
  for (const map of [packed, crust]) {
    map.wrapS = map.wrapT = RepeatWrapping;
  }
  const position = uv();
  const edge = smoothstep(halfWidth - 0.08, halfWidth + 0.08, abs(position.x));
  const road = texture(packed, position.mul(vec2(1 / (halfWidth * 2), 1 / 12)));
  const shoulder = texture(crust, position.div(9));
  const material = new MeshStandardNodeMaterial({ roughness: 0.87 });
  material.colorNode = mix(road.rgb, shoulder.rgb, edge);
  return { material, textures: [packed, crust] };
}
