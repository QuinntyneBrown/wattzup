// The sky's light and the sun's rim on a rider by day (L2-166 AC36). A course in daylight has a sun and a sky but
// no map of light for a rider to read, and with the sun ahead of them a rider's back, which is what the camera sees,
// is in their own shade: darker than the land about them, and flat. Two things a real rider has are given back: the
// light the open sky and the bright road throw into the shade, and the line of sun along the edges that face it.
// On a course with street lamps the lamps do this work instead (lamp-glow.ts).
import { diffuseColor, float, normalWorld, vec3 } from 'three/tsl';
import type { Color } from 'three/webgpu';
import {
  type Material,
  type MeshStandardMaterial,
  MeshStandardNodeMaterial,
  type Vector3,
} from 'three/webgpu';
import { sheen, vertexFinish } from './rider-finish';

/** How much of the sky's colour a rider's own colour gives back from every side, in the shade as in the sun. */
const SKY_LIFT = 0.3;
/** How bright the sun's line along a glossy edge is, and the gloss the dullest cloth is counted as having for it. */
const SUN_RIM = 1.1;
const LEAST_GLOSS = 0.25;

/** The daylight's share of a rider's materials. */
export class SunGlow {
  private readonly sky: Color;
  private readonly sun: Color;

  /** `towards` points from the ground at the sun; `sun` and `sky` are their colours. */
  constructor(
    private readonly towards: Vector3,
    sun: Color,
    sky: Color,
  ) {
    this.sun = sun.clone();
    this.sky = sky.clone();
  }

  /**
   * A rider's material in daylight: `source`'s colour, map, finish and holes, lit by the scene's lights as it was,
   * with the sky's lift and the sun's rim added.
   */
  rider(source: MeshStandardMaterial): Material {
    const material = new MeshStandardNodeMaterial();
    material.color.copy(source.color);
    material.map = source.map;
    material.roughness = source.roughness ?? 1;
    material.metalness = source.metalness ?? 0;
    material.vertexColors = source.vertexColors;
    material.side = source.side;
    material.alphaTest = source.alphaTest;
    const gloss = source.vertexColors ? vertexFinish(material) : float(1 - material.roughness);
    // The rim is the sun's, so it shows on the edges turned towards the sun and not on those turned away.
    const sunward = normalWorld
      .dot(vec3(this.towards.x, this.towards.y, this.towards.z))
      .mul(0.5)
      .add(0.5)
      .clamp(0, 1);
    material.emissiveNode = diffuseColor.rgb
      .mul(vec3(this.sky.r, this.sky.g, this.sky.b))
      .mul(SKY_LIFT)
      .add(
        vec3(this.sun.r, this.sun.g, this.sun.b)
          .mul(sheen(gloss.max(LEAST_GLOSS)))
          .mul(sunward)
          .mul(SUN_RIM),
      );
    return material;
  }
}
