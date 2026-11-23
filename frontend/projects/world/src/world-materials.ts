// One material per surface in a World Ride scene (#681). Scene modules ask for a surface by its
// look, and every part with the same look shares one material: one program, one set of
// uniforms, no state change between them. A shared material is never changed after it is
// handed out; a part that changes its material over time (a fading sign, a flashing lamp) makes
// its own.
import {
  type Material,
  MeshStandardMaterial,
  type MeshStandardMaterialParameters,
  type Texture,
} from 'three';

/** The look of a standard surface: every parameter decides whether two parts can share it. */
export type Surface = MeshStandardMaterialParameters;

let nextTexture = 0;
const textureIds = new WeakMap<Texture, number>();
/** Textures are told apart by identity: two canvases that look alike are still two textures. */
const textureId = (t: Texture) => {
  let id = textureIds.get(t);
  if (id === undefined) textureIds.set(t, (id = ++nextTexture));
  return id;
};

/** A key that is the same for the same look, whatever the order of its fields. */
function surfaceKey(surface: Surface): string {
  return Object.entries(surface)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      if (v === null) return `${k}=none`;
      if (typeof v === 'object' && 'isTexture' in v)
        return `${k}=texture${textureId(v as Texture)}`;
      if (typeof v === 'object' && 'getHex' in v) {
        return `${k}=${(v as { getHex(): number }).getHex()}`;
      }
      return `${k}=${String(v)}`;
    })
    .join(';');
}

/** The scene's shared materials, disposed together when the scene is. */
export class SurfaceMaterials {
  private readonly materials = new Map<string, Material>();

  /** How many distinct materials have been handed out. */
  get size(): number {
    return this.materials.size;
  }

  /** The scene's one `MeshStandardMaterial` of this look. */
  standard(surface: Surface): MeshStandardMaterial {
    const key = `standard:${surfaceKey(surface)}`;
    let material = this.materials.get(key) as MeshStandardMaterial | undefined;
    if (!material) {
      material = new MeshStandardMaterial(surface);
      this.materials.set(key, material);
    }
    return material;
  }

  /** Disposes every shared material once; the scene is going. */
  dispose(): void {
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }
}
