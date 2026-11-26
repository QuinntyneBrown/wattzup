import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { attribute, positionWorld, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const lap = 5543.75;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, pitch: 0, heading: 0 });
const views = [
  [100, 147, 30, 11],
  [1420, 1453, 25, 5],
  [3180, 3220, 18, 2],
  [4150, 4235, 0, 1.5],
  [4850, 4881, 1.5, 1],
  [5480, 5499, 4, 2],
] as const;

// Sections of the GT coupe from the front splitter to the rear diffuser.
function shell(rows: readonly (readonly number[])[]) {
  const points: number[] = [],
    indices: number[] = [];
  for (const [z, half, bottom, top] of rows) {
    const ring = [
      [-half! * 0.7, bottom],
      [-half!, bottom! + 0.09],
      [-half! * 0.94, top! - 0.07],
      [-half! * 0.66, top],
      [half! * 0.66, top],
      [half! * 0.94, top! - 0.07],
      [half!, bottom! + 0.09],
      [half! * 0.7, bottom],
    ];
    for (const [x, y] of ring) points.push(x!, y!, z!);
  }
  for (let row = 0; row < rows.length - 1; row++)
    for (let j = 0; j < 8; j++) {
      const a = row * 8 + j,
        b = row * 8 + ((j + 1) % 8);
      indices.push(a, b, a + 8, a + 8, b, b + 8);
    }
  for (const offset of [0, 8 * (rows.length - 1)])
    for (let i = 1; i < 7; i++) indices.push(offset, offset + i, offset + i + 1);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export class SilverstoneTrack {
  readonly root = new Group();
  readonly materials = {
    CircuitAsphalt: new MeshLambertNodeMaterial(),
    CircuitBoards: new MeshBasicMaterial({ side: DoubleSide }),
    PaddockAtlas: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly metal = new Map<number, MeshLambertMaterial>();
  private readonly box = new BoxGeometry();
  private readonly cylinder = new CylinderGeometry(1, 1, 1, 20);
  private readonly sphere = new SphereGeometry(1, 12, 8);
  private readonly hull = shell([
    [-2.24, 0.79, 0.19, 0.41],
    [-1.77, 0.99, 0.23, 0.62],
    [-0.83, 1.01, 0.23, 0.72],
    [0.82, 1.02, 0.23, 0.68],
    [1.65, 1, 0.28, 0.78],
    [2.16, 0.89, 0.31, 0.68],
  ]);
  private readonly canopy = shell([
    [-0.88, 0.86, 0.57, 0.66],
    [-0.28, 0.75, 0.61, 1.14],
    [0.58, 0.73, 0.62, 1.17],
    [1.33, 0.86, 0.63, 0.74],
  ]);
  private readonly car = new Group();
  private readonly trolley = new Group();
  private readonly marshal = new Group();
  private readonly flag = new Group();
  private readonly wheels: Group[] = [];
  private readonly actor = scratch();
  private readonly target = scratch();
  private readonly poses = {
    wheelRotation: null as number | null,
    trolleyTravel: null as number | null,
    flagAngle: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['silverstone-paddock', 'silverstone-boards', 'fishhill-tarmac'].map((n) =>
        loader.loadAsync('courses/' + n + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const t of maps) t.dispose();
      throw error.reason;
    }
    return new SilverstoneTrack(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const t of maps) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
    }
    const [paddock, boards, road] = maps as [Texture, Texture, Texture];
    road.wrapS = road.wrapT = RepeatWrapping;
    road.anisotropy = 4;
    this.materials.PaddockAtlas.map = paddock;
    this.materials.CircuitBoards.map = boards;
    this.materials.CircuitAsphalt.colorNode = texture(road, positionWorld.xz.div(3.2)).rgb.mul(
      attribute('color', 'vec3'),
    );
    this.car.add(
      new Mesh(this.hull, this.tint(0xd05436)),
      new Mesh(this.canopy, this.tint(0x405564)),
    );
    this.part(this.car, this.box, 0, 1.156, 0.17, 1.18, 0.06, 0.79, 0xd6bcb0);
    this.part(this.car, this.box, 0, 0.69, -1.22, 0.36, 0.026, 0.71, 0xe7ded1);
    this.part(this.car, this.box, 0, 0.69, 1.75, 1.96, 0.08, 0.29, 0x363b3e);
    for (const side of [-1, 1]) {
      this.part(this.car, this.box, side * 0.61, 0.49, -2.18, 0.41, 0.1, 0.12, 0xf5e0ac);
      this.part(this.car, this.box, side * 0.64, 0.57, 2.12, 0.41, 0.1, 0.08, 0xae292d);
      this.part(this.car, this.box, side * 0.94, 0.76, -0.46, 0.18, 0.11, 0.19, 0xb74a32);
      for (const station of [-1.36, 1.39]) {
        const wheel = new Group();
        wheel.position.set(side * 0.94, 0.335, station);
        this.car.add(wheel);
        this.wheels.push(wheel);
        const tyre = this.part(wheel, this.cylinder, 0, 0, 0, 0.34, 0.22, 0.34, 0x282b2e);
        tyre.rotation.z = Math.PI / 2;
        const rim = this.part(
          wheel,
          this.cylinder,
          side * 0.121,
          0,
          0,
          0.225,
          0.012,
          0.225,
          0x898c8b,
        );
        rim.rotation.z = Math.PI / 2;
        for (let j = 0; j < 5; j++) {
          const spoke = this.part(
            wheel,
            this.box,
            side * 0.133,
            0,
            0,
            0.024,
            0.045,
            0.37,
            0x44484c,
          );
          spoke.rotation.x = (j * Math.PI) / 5;
        }
      }
    }
    this.part(this.trolley, this.box, 0, 0.42, 0, 1.28, 0.17, 2.12, 0x5d686d);
    for (const x of [-0.55, 0.55])
      for (const z of [-0.83, 0.83]) {
        const roller = this.part(
          this.trolley,
          this.cylinder,
          x,
          0.22,
          z,
          0.21,
          0.14,
          0.21,
          0x292d30,
        );
        roller.rotation.z = Math.PI / 2;
      }
    for (let i = 0; i < 3; i++)
      this.part(this.trolley, this.cylinder, 0, 0.56 + i * 0.23, -0.27, 0.53, 0.21, 0.53, 0x333536);
    for (const x of [-0.52, 0.52])
      this.part(this.trolley, this.box, x, 0.83, 0.88, 0.07, 0.94, 0.07, 0x919b9c);
    this.part(this.trolley, this.box, 0, 1.26, 0.88, 1.08, 0.08, 0.08, 0x919b9c);
    this.person(this.trolley, 0, 1.43, 0x435167);
    this.person(this.marshal, 0, 0, 0xeb722a);
    this.flag.position.set(0.24, 1.35, 0);
    this.marshal.add(this.flag);
    this.part(this.flag, this.box, 0.48, 0.04, 0, 1, 0.035, 0.035, 0xa79978);
    this.part(this.flag, this.box, 0.74, -0.18, 0, 0.54, 0.41, 0.03, 0xead153);
    this.root.add(this.car, this.marshal, this.trolley);
  }
  private tint(c: number) {
    let mat = this.metal.get(c);
    if (!mat) {
      mat = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.metal.set(c, mat);
    }
    return mat;
  }
  private part(
    parent: Group,
    g: BufferGeometry,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tint: number,
  ) {
    const mesh = new Mesh(g, this.tint(tint));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }
  private person(parent: Group, x: number, z: number, tint: number) {
    for (const j of [-1, 1]) {
      this.part(parent, this.box, x + j * 0.12, 0.45, z, 0.18, 0.89, 0.2, 0x43494c);
      this.part(parent, this.sphere, x + j * 0.25, 1.13, z, 0.104, 0.3, 0.12, tint);
    }
    this.part(parent, this.sphere, x, 1.12, z, 0.27, 0.42, 0.2, tint);
    this.part(parent, this.sphere, x, 1.65, z, 0.16, 0.19, 0.155, 0xbd9079);
    this.part(parent, this.sphere, x, 1.79, z, 0.18, 0.083, 0.18, 0xe2dcd1);
  }
  update(metres: number, seconds: number) {
    const d = metres % lap;
    const p = this.course.place(d + 16 + 11 * Math.sin(seconds * 0.23), -2.7, this.actor);
    this.car.visible = Math.abs(d - 4850) < 330;
    this.car.position.set(p.x, p.y, p.z);
    this.car.rotation.set(p.pitch, p.heading, 0, 'YXZ');
    for (const wheel of this.wheels) wheel.rotation.x = (-seconds * 10.4) / 0.34;
    this.poses.wheelRotation = this.car.visible ? this.wheels[0]!.rotation.x : null;
    const crew = this.course.place(1445 + Math.sin(seconds * 0.16) * 6, 16, this.actor);
    this.trolley.visible = Math.abs(d - 1420) < 145;
    this.trolley.position.set(crew.x, crew.y, crew.z);
    this.trolley.rotation.y = crew.heading;
    this.poses.trolleyTravel = this.trolley.visible
      ? this.trolley.position.x + this.trolley.position.z
      : null;
    const post = this.course.place(5491, 11.5, this.actor);
    this.marshal.visible = Math.abs(d - 5480) < 140;
    this.marshal.position.set(post.x, post.y, post.z);
    this.marshal.rotation.y = post.heading;
    this.flag.rotation.z = 0.5 + 0.48 * Math.sin(seconds * 2.6);
    this.poses.flagAngle = this.marshal.visible ? this.flag.rotation.z : null;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = metres % lap;
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - d);
      if (gap > 55) continue;
      const r = this.course.place(metres, 0, this.actor),
        landmark = this.course.place(to, lane, this.target);
      const dx = landmark.x - r.x,
        dz = landmark.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (55 - gap) / 24);
      camera.x += (r.x - (5 * dx) / len - camera.x) * w;
      camera.z += (r.z - (5 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.4 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.5 + (19 * (landmark.y + lift - r.y - 2.4)) / (len + 5) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.car.clear();
    this.trolley.clear();
    this.marshal.clear();
    this.flag.clear();
    this.wheels.length = 0;
    for (const asset of [
      this.hull,
      this.canopy,
      this.box,
      this.cylinder,
      this.sphere,
      ...this.maps,
      ...this.metal.values(),
      ...Object.values(this.materials),
    ])
      asset.dispose();
    this.metal.clear();
  }
}
