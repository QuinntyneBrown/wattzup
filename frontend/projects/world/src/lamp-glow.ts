// The lamps' light on whatever stands near the road (L2-166 AC14): the grid of lamp-light-map.ts as a texture, and
// the node a material adds to what it emits. A surface reads the grid by where it is in the world, so the same
// node lights a wall, a post, the land and a rider, and it fades with the surface's height above the road: a lamp
// lights what is beneath it.
import {
  float,
  materialColor,
  positionWorld,
  smoothstep,
  texture,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  type Material,
  MeshLambertNodeMaterial,
  type MeshStandardMaterial,
  MeshStandardNodeMaterial,
  type Node,
  RGFormat,
  UnsignedByteType,
} from 'three/webgpu';
import type { CourseLamps } from './course';
import { LAMP_LIGHT_MAX, type LampLightMap } from './lamp-light-map';

/** Metres above the road where the lamps' light starts to fade, and where it is gone. */
const FADE_FROM = 1.5;
const FADE_TO = 9;

/** The lamps' light as materials read it. */
export class LampGlow {
  private readonly grid: DataTexture;
  /** The lamps' light at the surface being drawn, in the lamps' colour: 1 is a lone lamp straight overhead. */
  private readonly light: Node<'vec3'>;

  constructor(map: LampLightMap, lamps: CourseLamps) {
    const grid = new DataTexture(map.texels, map.width, map.height, RGFormat, UnsignedByteType);
    grid.magFilter = grid.minFilter = LinearFilter;
    grid.needsUpdate = true;
    this.grid = grid;
    const at = positionWorld.xz
      .sub(vec2(map.minX, map.minZ))
      .div(vec2(map.width * map.cell, map.height * map.cell));
    const cell = texture(grid, at);
    const above = positionWorld.y.sub(cell.g.mul(map.spanY).add(map.minY));
    const tint = new Color(lamps.colour);
    this.light = vec3(tint.r, tint.g, tint.b)
      .mul(cell.r.mul(cell.r).mul(LAMP_LIGHT_MAX))
      .mul(float(1).sub(smoothstep(FADE_FROM, FADE_TO, above)));
  }

  /** A material for a group of the map, coloured by vertex and shaded flat, that the lamps light. */
  scenery(strength: number, doubleSided = false): Material {
    const material = new MeshLambertNodeMaterial({ vertexColors: true, flatShading: true });
    if (doubleSided) material.side = DoubleSide;
    material.emissiveNode = vertexColor().rgb.mul(this.light).mul(strength);
    return material;
  }

  /** A rider's material as the lamps light it: the same surface, with the lamps' light added. */
  rider(source: MeshStandardMaterial, strength: number): Material {
    const material = new MeshStandardNodeMaterial();
    material.color.copy(source.color);
    material.map = source.map;
    material.roughness = source.roughness ?? 1;
    material.metalness = source.metalness ?? 0;
    material.vertexColors = source.vertexColors;
    material.side = source.side;
    const surface = source.vertexColors ? materialColor.mul(vertexColor().rgb) : materialColor;
    material.emissiveNode = surface.mul(this.light).mul(strength);
    return material;
  }

  dispose(): void {
    this.grid.dispose();
  }
}
