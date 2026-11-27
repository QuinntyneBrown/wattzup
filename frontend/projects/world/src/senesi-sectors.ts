import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, texture, sin, smoothstep } from 'three/tsl';
import type { Course, CoursePlace } from './course';
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import type { RiderBatch } from './rider-batch';

const views = [
  [120, 143, 2.7, 1.4],
  [1540, 1570, -18, 4.4],
  [3100, 3160, 31, 4],
  [4590, 4612, -1, 1.4],
  [6370, 6402, 2.2, 3.8],
  [8050, 8200, 30, 34],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class SenesiSectors {
  readonly root = new Group();
  readonly materials = {
    CreteRidge: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    WhiteGravel: new MeshBasicNodeMaterial({ side: DoubleSide }),
    SenesiFields: new MeshBasicNodeMaterial({ side: DoubleSide }),
    SectorBoards: new MeshBasicMaterial({ side: DoubleSide }),
    CampoBrick: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ValCypresses: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    SienaFronts: new MeshBasicMaterial({ side: DoubleSide }),
    SectorTifosi: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
  };
  private readonly dust: Sprite[] = [];
  private readonly dustPaint = new SpriteMaterial({
    color: 0xe2d7bf,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  private readonly cloth = new PlaneGeometry(0.34, 0.57, 1, 1);
  private readonly silk = [0x44855c, 0xe7dfc9, 0xbf5141].map(
    (color) => new MeshBasicMaterial({ color, side: DoubleSide }),
  );
  private readonly flag = new Group();
  private readonly riders: RiderModel[] = [];
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    gravelCrank: null as number | null,
    dustTravel: null as number | null,
    tifosoFlag: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'strade-hills',
        'strade-gravel',
        'gardena-turf',
        'strade-boards',
        'strade-campo',
        'strade-tifosi',
        'galibier-cloud',
        'strade-cypress',
        'strade-facades',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new SenesiSectors(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [sky, gravel, turf, boards, brick, fans, dust] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    this.materials.ValCypresses.map = maps[7]!;
    this.materials.SienaFronts.map = maps[8]!;
    this.materials.CreteRidge.map = sky;
    this.materials.SectorBoards.map = boards;
    this.materials.SectorTifosi.map = fans;
    gravel.wrapT = brick.wrapS = brick.wrapT = turf.wrapS = turf.wrapT = RepeatWrapping;
    this.materials.WhiteGravel.colorNode = texture(gravel).rgb;
    this.materials.CampoBrick.colorNode = texture(brick, positionWorld.xz.mul(0.38)).rgb;
    const grass = texture(turf, positionWorld.xz.mul(0.084)).rgb;
    const ridges = sin(
      positionWorld.x.mul(0.0103).add(sin(positionWorld.z.mul(0.015)).mul(2.2)),
    ).add(sin(positionWorld.z.mul(0.031).add(positionWorld.x.mul(0.007))).mul(0.53));
    const fields = mix(color(0x91a769), color(0xc7ae77), smoothstep(-0.65, 0.8, ridges));
    const furrows = sin(positionWorld.x.mul(0.46).add(positionWorld.z.mul(0.77)))
      .mul(0.065)
      .add(0.98);
    const meadows = mix(grass, color(0xd1bf9b), 0.51).mul(fields).mul(furrows);
    this.materials.SenesiFields.colorNode = mix(
      meadows,
      color(0xc1b391),
      smoothstep(1.04, 1.53, ridges).mul(0.73),
    );
    this.dustPaint.map = dust;
    for (let i = 0; i < 9; i++) {
      const cloud = new Sprite(this.dustPaint);
      this.root.add(cloud);
      this.dust.push(cloud);
    }
    for (let i = 0; i < 3; i++) {
      const panel = new Mesh(this.cloth, this.silk[i]!);
      panel.position.x = 0.15 + i * 0.335;
      this.flag.add(panel);
    }
    this.root.add(this.flag);
    this.update(0, 0);
  }
  addRiders(kit: CourseCyclistKit, batch: RiderBatch) {
    for (const [i, c] of [0x82432c, 0x548078, 0xe0ae51, 0x794f62].entries()) {
      const rider = kit.make(new Color(c), 32 + i, true, 0.53);
      this.riders.push(rider);
      this.root.add(rider.group);
      batch.add(rider);
    }
  }
  update(metres: number, t: number) {
    const racing = metres > 4000 && metres < 5050,
      opening = metres < 500;
    for (const [i, rider] of this.riders.entries()) {
      rider.group.visible = racing || opening;
      if (!rider.group.visible) continue;
      const d = metres + 10 + i * 4.6 + 1.8 * Math.sin(t * 0.17 + i);
      const p = this.course.place(
        d,
        -1.1 + (i % 3) * 0.68 + 0.18 * Math.sin(t * 0.32 + i),
        this.point,
      );
      rider.group.position.set(p.x, p.y + 0.02, p.z);
      rider.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      rider.pose(t * 8.4 + i * 1.57, 0.19 + 0.09 * Math.sin(t * 0.49 + i));
    }
    this.poses.gravelCrank = racing ? t * 8.4 : null;
    this.poses.dustTravel = null;
    for (const [i, cloud] of this.dust.entries()) {
      cloud.visible = racing || opening;
      if (!cloud.visible) continue;
      const phase = (((t * 0.3 + i * 0.374) % 1) + 1) % 1;
      const p = this.course.place(
        metres + 10 + (i % 4) * 4.6 - phase * 6,
        -1.08 + (i % 3) * 0.68 + 0.83 * phase,
        this.point,
      );
      cloud.position.set(p.x, p.y + 0.25 + phase * 0.72, p.z);
      cloud.scale.set(1.6 + phase * 2.8, 0.66 + phase * 1.34, 1);
      if (i === 0) this.poses.dustTravel = cloud.position.x;
    }
    this.flag.visible = Math.abs(metres - 6370) < 160;
    this.poses.tifosoFlag = null;
    if (this.flag.visible) {
      const p = this.course.place(6385, 5.25, this.point);
      this.flag.position.set(p.x, p.y + 2.08, p.z);
      this.flag.rotation.set(0, p.heading + 0.86, 0.16 + 0.33 * Math.sin(t * 2.2), 'YXZ');
      for (const [i, part] of this.flag.children.entries())
        part.position.z = 0.08 * Math.sin(t * 2.9 + i * 0.83);
      this.poses.tifosoFlag = this.flag.rotation.z;
    }
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
    for (const r of this.riders) for (const item of r.owned) item.dispose();
    this.riders.length = 0;
    for (const m of [
      this.cloth,
      this.dustPaint,
      ...this.silk,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
