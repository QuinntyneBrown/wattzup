import { positionLocal, positionWorld, sin, uniform, uv, vec3, vertexColor } from 'three/tsl';
import {
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
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
  private readonly tick = uniform(0);
  private readonly late = uniform(0);
  readonly materials = {
    RoyalRidge: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36, fog: false }),
    MontrealFront: new MeshBasicNodeMaterial({ side: DoubleSide }),
    JazzPrint: new MeshBasicMaterial({ side: DoubleSide }),
    FestAudience: new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    JazzBand: new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.41 }),
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
    // Feet stay planted on the paving or stage. The top of each row follows the music.
    const body = uv().y.oneMinus(),
      drift = sin(this.tick.mul(2.1).add(positionLocal.x.mul(0.12)));
    this.materials.FestAudience.positionNode = positionLocal.add(
      vec3(drift.mul(body).mul(0.1), drift.mul(body).mul(0.049), 0),
    );
    const beat = sin(this.tick.mul(3.0));
    this.materials.JazzBand.positionNode = positionLocal.add(
      vec3(beat.mul(body).mul(0.09), beat.mul(body).mul(0.08), 0),
    );
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
    this.tick.value = time;
    this.late.value = metres / 9695;
    const onStage = Math.abs(metres - 1809) < 200 || Math.abs(metres - 6832) < 200;
    this.shown.bandBeat = onStage ? Math.sin(time * 3) : null;
    this.shown.crowdBeat = onStage ? Math.sin(time * 2.1) : null;
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
      this.jetShape,
      this.water,
      this.jets,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
