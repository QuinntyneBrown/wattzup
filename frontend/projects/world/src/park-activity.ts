import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const lapLength = 2645;
const views = [
  [80, 117, -5.6, 1.58],
  [430, 451, -12, 2.2],
  [890, 911, -12, 1.65],
  [1320, 1348, 5.7, 1.33],
  [1850, 1870, -33, 2.45],
  [2300, 2316, -13, 1.42],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class ParkActivity {
  readonly root = new Group();
  readonly materials = {
    PlaygroundTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 }),
    ParkFamilies: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    ParkSign: new MeshBasicMaterial({ side: DoubleSide }),
    ParkLawn: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ParkAsphalt: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly box = new BoxGeometry();
  private readonly wheel = new CylinderGeometry(1, 1, 1, 14);
  private readonly drop = new SphereGeometry(1, 7, 5);
  private readonly shapes = new Set<BufferGeometry>([this.box, this.wheel, this.drop]);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly swing = new Group();
  private readonly spray = new Group();
  private readonly fountain = new Group();
  private readonly stroller = new Group();
  private readonly scooter = new Group();
  private readonly transform = new Object3D();
  private readonly jets: InstancedMesh;
  private readonly plume: InstancedMesh;
  private readonly p = point();
  private readonly target = point();
  private readonly readings = {
    parkStation: 0,
    swingAngle: null as number | null,
    sprayHeight: null as number | null,
    strollerTravel: null as number | null,
  };

  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['canopy', 'families', 'sign'].map((n) =>
        loader.loadAsync('courses/playground-' + n + '.webp'),
      ),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const t of textures) t.dispose();
      throw fail.reason;
    }
    return new ParkActivity(course, textures);
  }
  private paint(color: number) {
    let material = this.paints.get(color);
    if (!material) {
      material = new MeshBasicMaterial({ color, side: DoubleSide });
      this.paints.set(color, material);
    }
    return material;
  }
  private part(
    parent: Group,
    color: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    shape: BufferGeometry = this.box,
  ) {
    const mesh = new Mesh(shape, this.paint(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }
  private fixed(group: Group, distance: number, lane: number, up = 0) {
    const p = this.course.place(distance, lane, this.p);
    group.position.set(p.x, p.y + up, p.z);
    group.rotation.y = p.heading;
  }
  private figure(group: Group, index: number, width: number, height: number, x: number, z: number) {
    const geometry = new PlaneGeometry(width, height),
      uv = geometry.getAttribute('uv');
    const col = index % 4,
      row = Math.floor(index / 4);
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (col + uv.getX(i)) / 4, (row + 1 - uv.getY(i)) / 2);
    this.shapes.add(geometry);
    const mesh = new Mesh(geometry, this.materials.ParkFamilies);
    mesh.position.set(x, height * 0.5, z);
    group.add(mesh);
    return mesh;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    this.materials.PlaygroundTrees.map = textures[0]!;
    this.materials.ParkFamilies.map = textures[1]!;
    this.materials.ParkSign.map = textures[2]!;
    const canopy = sin(positionWorld.x.mul(0.33).add(sin(positionWorld.z.mul(0.71)).mul(2.5))).add(
      sin(positionWorld.z.mul(0.27).add(positionWorld.x.mul(0.32))),
    );
    const light = canopy.smoothstep(-0.42, 0.21).mul(0.39).add(0.65);
    const grit = sin(positionWorld.x.mul(83).add(positionWorld.z.mul(131)))
      .mul(0.036)
      .add(0.96);
    const mow = sin(positionWorld.x.mul(0.72).add(positionWorld.z.mul(0.58)))
      .mul(0.034)
      .add(0.98);
    this.materials.ParkLawn.colorNode = vertexColor().rgb.mul(mow).mul(grit);
    this.materials.ParkAsphalt.colorNode = vertexColor().rgb.mul(light).mul(grit);
    this.fixed(this.swing, 437, -8, 3.5);
    for (const x of [-0.48, 0.48]) this.part(this.swing, 0x999487, x, -1.32, 0, 0.027, 2.65, 0.027);
    this.part(this.swing, 0xd29f40, 0, -2.67, 0, 1.12, 0.102, 0.42);
    this.fixed(this.spray, 911, -14);
    this.fixed(this.fountain, 1870, -33);
    this.jets = new InstancedMesh(this.drop, this.paint(0xaedbe3), 8 * 9);
    this.plume = new InstancedMesh(this.drop, this.paint(0xb8d9df), 12 * 10);
    // Spray stays inside each basin across the full cycle.
    this.jets.frustumCulled = false;
    this.plume.frustumCulled = false;
    this.spray.add(this.jets);
    this.fountain.add(this.plume);
    for (const x of [-0.39, 0.39])
      for (const z of [-0.57, 0.48]) {
        const tyre = this.part(this.stroller, 0x383f40, x, 0.18, z, 0.17, 0.09, 0.17, this.wheel);
        tyre.rotation.z = Math.PI / 2;
        const hub = this.part(this.stroller, 0x939897, x, 0.18, z, 0.074, 0.105, 0.074, this.wheel);
        hub.rotation.z = Math.PI / 2;
        const strut = this.part(this.stroller, 0x687575, x, 0.42, z * 0.52, 0.056, 0.64, 0.056);
        strut.rotation.x = Math.sign(z) * 0.64;
      }
    this.part(this.stroller, 0x356c73, 0, 0.66, -0.04, 0.72, 0.28, 0.97);
    const hood = this.part(this.stroller, 0x478b8f, 0, 0.94, 0.24, 0.42, 0.35, 0.45, this.drop);
    hood.rotation.x = -0.23;
    for (const x of [-0.34, 0.34])
      this.part(this.stroller, 0x586362, x, 0.94, 0.58, 0.045, 0.66, 0.05).rotation.x = 0.48;
    this.part(this.stroller, 0x4e5555, 0, 1.22, 0.75, 0.74, 0.054, 0.063);
    this.figure(this.stroller, 1, 1.02, 1.74, 0, 1.09).rotation.y = -0.76;
    this.figure(this.scooter, 2, 1.3, 1.26, 0, 0).rotation.y = -0.56;
    this.root.add(this.swing, this.spray, this.fountain, this.stroller, this.scooter);
  }
  private droplets(
    batch: InstancedMesh,
    count: number,
    steps: number,
    time: number,
    central: boolean,
  ) {
    for (let i = 0; i < count; i++) {
      const dir = (i * 2 * Math.PI) / count;
      for (let j = 0; j < steps; j++) {
        const age = (time * (central ? 0.62 : 0.87) + j / steps + i * 0.113) % 1;
        const height = (central ? 6.2 : 1.9 + 0.48 * Math.sin(time + i)) * (4 * age * (1 - age));
        this.transform.position.set(
          central ? Math.sin(dir) * age * 5.4 : ((i % 4) - 1.5) * 1.48 + age * 0.75,
          height + 0.14,
          central ? Math.cos(dir) * age * 5.4 : (Math.floor(i / 4) - 0.5) * 1.6 + age * 0.32,
        );
        this.transform.scale.set(
          central ? 0.18 : 0.09,
          central ? 0.46 : 0.25,
          central ? 0.18 : 0.09,
        );
        this.transform.updateMatrix();
        batch.setMatrixAt(i * steps + j, this.transform.matrix);
        if (!central && i === 0 && j === 0) this.readings.sprayHeight = height;
      }
    }
    batch.instanceMatrix.needsUpdate = true;
  }
  update(metres: number, time: number) {
    const d = ((metres % lapLength) + lapLength) % lapLength;
    this.readings.parkStation = d;
    this.swing.visible = Math.abs(d - 437) < 105;
    this.spray.visible = Math.abs(d - 911) < 115;
    this.fountain.visible = Math.abs(d - 1880) < 150;
    this.stroller.visible = this.scooter.visible = Math.abs(d - 1320) < 110;
    this.readings.swingAngle = this.readings.sprayHeight = this.readings.strollerTravel = null;
    if (this.swing.visible) {
      this.swing.rotation.x = 0.42 * Math.sin(time * 1.28);
      this.readings.swingAngle = this.swing.rotation.x;
    }
    if (this.spray.visible) this.droplets(this.jets, 8, 9, time, false);
    if (this.fountain.visible) this.droplets(this.plume, 12, 10, time, true);
    if (this.stroller.visible) {
      const phase = time * 0.11,
        distance = 1348 + 3.6 * Math.sin(phase);
      this.fixed(this.stroller, distance, 5.61);
      this.stroller.rotation.y += Math.cos(phase) < 0 ? Math.PI : 0;
      this.readings.strollerTravel = this.stroller.position.x;
      this.fixed(this.scooter, 1353 + 4.7 * Math.sin(phase + 0.7), 6.75);
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = ((metres % lapLength) + lapLength) % lapLength;
    const view = views.find((v) => Math.abs(d - v[0]) < 48);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(d - view[0]) / 48) * 1.55),
      r = this.course.place(metres, 0, this.p),
      t = this.course.place(metres - d + view[1], view[2], this.target);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.22 - camera.y) * f;
    ahead.x += (r.x + (13 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.22 + (18 * (t.y + view[3] - r.y - 2.22)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    this.jets.dispose();
    this.plume.dispose();
    for (const x of [
      ...this.shapes,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      x.dispose();
  }
}
