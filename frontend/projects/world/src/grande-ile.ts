import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  RepeatWrapping,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [120, 148, 0, 4],
  [1830, 1994, -25, 38],
  [3570, 3590, 5.4, 1.7],
  [5320, 5348, 1, 5],
  [7210, 7276, 10.3, 12],
  [9870, 9935, -29, 3.7],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class GrandeIle {
  readonly root = new Group();
  readonly materials = {
    AlsaceFronts: new MeshBasicMaterial({ side: DoubleSide }),
    AlsaceChalets: new MeshBasicMaterial({ side: DoubleSide }),
    CathedralStone: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    KleberFir: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    MarketGarlands: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      alphaTest: 0.09,
      depthWrite: false,
    }),
    PontsStone: new MeshBasicMaterial({ side: DoubleSide }),
    MarketShoppers: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 }),
    MarketSetts: new MeshBasicNodeMaterial({ side: DoubleSide }),
    IllWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly mist = new SpriteMaterial({
    color: 0xf2d9bf,
    transparent: true,
    opacity: 0.33,
    depthWrite: false,
  });
  private readonly steam: Sprite[] = [];
  private readonly lamp = new SphereGeometry(0.105, 6, 4);
  private readonly glow = new MeshBasicMaterial({ color: 0xffe19b });
  private readonly bulbs = new InstancedMesh(this.lamp, this.glow, 78);
  private readonly clock = uniform(0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    steamRise: null as number | null,
    treeGlow: null as number | null,
    canalRipple: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'strasbourg-fronts',
        'strasbourg-stalls',
        'strasbourg-cathedral',
        'strasbourg-fir',
        'strasbourg-shoppers',
        'strasbourg-cobbles',
        'galibier-cloud',
        'strasbourg-garlands',
        'strasbourg-ponts',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new GrandeIle(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [fronts, stalls, cathedral, fir, shoppers, cobbles, mist] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    this.materials.MarketGarlands.map = maps[7]!;
    this.materials.PontsStone.map = maps[8]!;
    this.materials.AlsaceFronts.map = fronts;
    this.materials.AlsaceChalets.map = stalls;
    this.materials.CathedralStone.map = cathedral;
    this.materials.KleberFir.map = fir;
    this.materials.MarketShoppers.map = shoppers;
    cobbles.wrapS = cobbles.wrapT = RepeatWrapping;
    const stone = texture(cobbles, positionWorld.xz.mul(0.34)).rgb;
    const gleam = smoothstep(
      0.66,
      1.35,
      sin(positionWorld.z.mul(1.34)).add(
        sin(positionWorld.x.mul(0.83).add(positionWorld.z.mul(0.35))).mul(0.46),
      ),
    );
    this.materials.MarketSetts.colorNode = mix(
      stone.mul(color(0xb5a6b3)),
      color(0xcda876),
      gleam.mul(0.055),
    );
    const waves = sin(
      positionWorld.z
        .mul(1.43)
        .add(sin(positionWorld.x.mul(0.51)))
        .add(this.clock),
    )
      .mul(0.32)
      .add(sin(positionWorld.x.mul(0.43)).mul(0.81));
    this.materials.IllWater.colorNode = mix(
      color(0x26354e),
      color(0xdeaa69),
      smoothstep(0.72, 1.09, waves).mul(0.82),
    );
    this.mist.map = mist;
    for (let i = 0; i < 6; i++) {
      const s = new Sprite(this.mist);
      this.root.add(s);
      this.steam.push(s);
    }
    const tree = course.place(7276, 10.3, this.point),
      part = new Object3D(),
      tint = new Color();
    for (let i = 0; i < 78; i++) {
      const h = 1.5 + (i / 78) * 24,
        angle = i * 2.397,
        rad = (1 - h / 27) * 5.6;
      part.position.set(tree.x + rad * Math.cos(angle), tree.y + h, tree.z + rad * Math.sin(angle));
      part.updateMatrix();
      this.bulbs.setMatrixAt(i, part.matrix);
      this.bulbs.setColorAt(i, tint.setHex(i % 5 === 0 ? 0xf28145 : 0xffe6a9));
    }
    this.bulbs.computeBoundingSphere();
    this.root.add(this.bulbs);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.poses.steamRise = null;
    const near = Math.abs(metres - 3570) < 160;
    for (const [i, s] of this.steam.entries()) {
      s.visible = near;
      if (!near) continue;
      const part = (t * 0.41 + i * 0.27) % 1,
        p = this.course.place(3582 + (i % 2) * 0.51, 4.1, this.point);
      s.position.set(
        p.x + 0.15 * Math.sin(t + i) + part * 0.41,
        p.y + 1.42 + part * 1.34,
        p.z + 0.16 * Math.cos(t + i),
      );
      s.scale.set(0.21 + part * 0.72, 0.28 + part * 0.78, 1);
      if (i === 0) this.poses.steamRise = s.position.y;
    }
    this.bulbs.visible = Math.abs(metres - 7252) < 220;
    this.poses.treeGlow = null;
    if (this.bulbs.visible) {
      const glow = 0.83 + 0.15 * Math.sin(t * 2.1);
      this.glow.color.setRGB(1, glow, 0.54 + glow * 0.21);
      this.poses.treeGlow = glow;
    }
    this.clock.value = t * 1.38;
    this.poses.canalRipple = metres > 9500 ? Math.sin(this.clock.value) : null;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to + metres - at, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.35 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.55 + (18.8 * (p.y + lift - r.y - 2.35)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.bulbs.dispose();
    for (const m of [
      this.lamp,
      this.glow,
      this.mist,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
