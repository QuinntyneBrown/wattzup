import { positionWorld, sin, uniform, vec3, vertexColor } from 'three/tsl';
import {
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 113, -9.4, 2.65],
  [1760, 1809, 18.4, 3.55],
  [3310, 3355, 23, 3.35],
  [4890, 4927, 0, 3.82],
  [6770, 6794, -9.4, 2.55],
  [9120, 9190, -160, 4.0],
] as const;
export class MontrealFestival {
  readonly root = new Group();
  private p = point();
  private t = point();
  private readonly bandPanel = new PlaneGeometry(11.6, 3.05);
  private readonly frontRow = new PlaneGeometry(8.5, 2.16);
  private readonly bandRoot = new Group();
  private readonly crowdRoot = new Group();
  private readonly late = uniform(0);
  readonly materials = {
    RoyalRidge: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36, fog: false }),
    MontrealFront: new MeshBasicNodeMaterial({ side: DoubleSide }),
    JazzPrint: new MeshBasicMaterial({ side: DoubleSide }),
    FestAudience: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    JazzBand: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    SummerTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    FestivalAsphalt: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly jetShape = new CylinderGeometry(0.06, 0.13, 1, 8);
  private readonly water = new MeshLambertMaterial({ color: 0xbbd7e3, emissive: 0x4d7687 });
  private readonly jets = new InstancedMesh(this.jetShape, this.water, 30);
  private readonly transform = new Matrix4();
  private readonly shown = {
    bandBeat: null as number | null,
    crowdBeat: null as number | null,
    jetHeight: null as number | null,
  };
  static async load(course: Course) {
    const result = await Promise.allSettled(
      ['fronts', 'print', 'crowd', 'band', 'plane', 'ridge'].map((n) =>
        new TextureLoader().loadAsync('courses/montreal-' + n + '.webp'),
      ),
    );
    const imgs = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = result.find((r) => r.status === 'rejected');
    if (fail) {
      for (const img of imgs) img.dispose();
      throw fail.reason;
    }
    return new MontrealFestival(course, imgs);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [front, print, crowd, band, tree, ridge] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    this.materials.RoyalRidge.map = ridge;
    this.materials.MontrealFront.map = front;
    this.materials.JazzPrint.map = print;
    this.materials.FestAudience.map = crowd;
    this.materials.JazzBand.map = band;
    this.materials.SummerTrees.map = tree;
    const performers = new Mesh(this.bandPanel, this.materials.JazzBand);
    performers.position.y = 1.51;
    this.bandRoot.add(performers);
    const audience = new Mesh(this.frontRow, this.materials.FestAudience);
    audience.position.y = 1.07;
    this.crowdRoot.add(audience);
    // Blender's UVs use a different vertical origin from the runtime planes.
    for (const plane of [this.bandPanel, this.frontRow]) {
      const uv = plane.attributes['uv']!;
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    }
    this.root.add(this.crowdRoot, this.bandRoot);
    const grain = sin(positionWorld.x.mul(71).add(positionWorld.z.mul(86)))
      .mul(0.037)
      .add(0.96);
    this.materials.FestivalAsphalt.colorNode = vertexColor()
      .rgb.mul(grain)
      .mul(vec3(1, this.late.mul(-0.08).add(1), this.late.mul(0.09).add(1)));
    const p = course.place(3341, 12.5, this.p);
    this.jets.position.set(p.x, p.y + 0.1, p.z);
    this.jets.rotation.y = p.heading;
    this.jets.frustumCulled = false;
    this.root.add(this.jets);
  }
  update(metres: number, time: number) {
    this.late.value = metres / 9695;
    const onStage = Math.abs(metres - 1809) < 200 || Math.abs(metres - 6832) < 200;
    this.bandRoot.visible = this.crowdRoot.visible = onStage;
    this.shown.bandBeat = this.shown.crowdBeat = null;
    if (onStage) {
      const station = metres < 4000 ? 1809 : 6832;
      let p = this.course.place(station, 20, this.p);
      this.bandRoot.position.set(p.x, p.y + 1.45, p.z);
      this.bandRoot.rotation.set(0, p.heading + Math.PI * 0.68, 0.016 * Math.sin(time * 3), 'YXZ');
      this.shown.bandBeat = this.bandRoot.rotation.z;
      p = this.course.place(station - 6, 8.05, this.p);
      this.crowdRoot.position.set(p.x, p.y + 0.02, p.z);
      this.crowdRoot.rotation.set(
        0,
        p.heading + Math.PI * 0.65,
        0.018 * Math.sin(time * 2.1),
        'YXZ',
      );
      this.shown.crowdBeat = this.crowdRoot.rotation.z;
    }
    this.jets.visible = Math.abs(metres - 3341) < 210;
    this.shown.jetHeight = null;
    if (this.jets.visible) {
      for (let i = 0; i < 30; i++) {
        const h = 0.31 + 1.62 * (0.5 + 0.5 * Math.sin(time * 1.65 + i * 0.57));
        this.transform
          .makeScale(1, h, 1)
          .setPosition((i % 5) * 1.62, h / 2, (Math.floor(i / 5) - 2.5) * 2.05);
        this.jets.setMatrixAt(i, this.transform);
        if (i === 0) this.shown.jetHeight = h;
      }
      this.jets.instanceMatrix.needsUpdate = true;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 88);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 88) * 1.7),
      p = this.course.place(metres, 0, this.p),
      t = this.course.place(stop[1], stop[2], this.t);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.14 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.bandPanel,
      this.frontRow,
      this.jetShape,
      this.water,
      this.jets,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
