import {
  DoubleSide,
  Group,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';

import type { Course } from './course';
import { MarktRaceFurniture } from './markt-race-furniture';

export class MarktSquare {
  readonly furniture: MarktRaceFurniture;
  readonly root = new Group();
  readonly materials = {
    MarktSetts: new MeshBasicMaterial({ vertexColors: true, side: DoubleSide }),
    TownhouseFronts: new MeshBasicMaterial({ side: DoubleSide }),
    WestPortal: new MeshBasicMaterial({ side: DoubleSide }),
    MarktSupporters: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    RaceSponsors: new MeshBasicMaterial({ side: DoubleSide }),
  };
  static async load(course: Course) {
    const loaded = await Promise.allSettled(
      ['setts', 'frontages', 'portal', 'supporters', 'sponsors'].map((key) =>
        new TextureLoader().loadAsync('courses/oldtown-' + key + '.webp'),
      ),
    );
    const textures = loaded.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    const failure = loaded.find((result) => result.status === 'rejected');
    if (failure) {
      for (const texture of textures) texture.dispose();
      throw failure.reason;
    }
    return new MarktSquare(course, textures);
  }
  private constructor(
    course: Course,
    private readonly textures: Texture[],
  ) {
    const [setts, frontages, portal, crowd, sponsors] = textures;
    for (const texture of textures) {
      texture.flipY = false;
      texture.colorSpace = SRGBColorSpace;
    }
    setts!.wrapS = setts!.wrapT = RepeatWrapping;
    setts!.anisotropy = 4;
    this.materials.MarktSetts.map = setts!;
    this.materials.TownhouseFronts.map = frontages!;
    this.materials.WestPortal.map = portal!;
    this.materials.MarktSupporters.map = crowd!;
    this.materials.RaceSponsors.map = sponsors!;
    this.furniture = new MarktRaceFurniture(course, this.materials.MarktSupporters);
    this.root.add(this.furniture.root);
  }
  dispose() {
    this.root.clear();
    this.furniture.dispose();
    for (const item of [...Object.values(this.materials), ...this.textures]) item.dispose();
  }
}
