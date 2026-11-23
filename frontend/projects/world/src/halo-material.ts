// The glow in the air round a course's lights (L2-166 AC21). The Blender pipeline puts four corners at each light's
// own place in the map's `Halos` group, the corner in their UV and the light's colour in their vertices. The material
// spreads the corners to face the eye, wherever it is, and draws a soft disc of light there, added to what is behind:
// bright at the lamp and fading out, as a lamp looks through damp air. Far lamps dwindle to points along the road.
import {
  cameraProjectionMatrix,
  float,
  modelViewMatrix,
  positionLocal,
  positionView,
  smoothstep,
  uv,
  vec4,
  vertexColor,
} from 'three/tsl';
import { AdditiveBlending, DoubleSide, type Material, MeshBasicNodeMaterial } from 'three/webgpu';

/** A halo's radius in metres, and how bright its heart and its skirt are. */
const RADIUS = 2.4;
const HEART = 1.1;
const SKIRT = 0.22;

/** The halos' material; they fade out between `fadeFrom` and `fadeTo` metres from the eye. */
export function haloMaterial(fadeFrom: number, fadeTo: number): Material {
  const corner = uv().sub(0.5).mul(2);
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
  });
  // Every corner is at the light: in the eye's own axes each steps out to its side, so the disc faces the eye.
  const centre = modelViewMatrix.mul(vec4(positionLocal, 1));
  material.vertexNode = cameraProjectionMatrix.mul(
    centre.add(vec4(corner.x.mul(RADIUS), corner.y.mul(RADIUS), 0, 0)),
  );
  const away = corner.length();
  const glow = away
    .mul(away)
    .mul(-14)
    .exp()
    .mul(HEART)
    .add(float(1).sub(away).max(0).pow(3).mul(SKIRT));
  const near = float(1).sub(smoothstep(fadeFrom, fadeTo, positionView.z.negate()));
  material.colorNode = vertexColor().rgb.mul(glow).mul(near);
  return material;
}
