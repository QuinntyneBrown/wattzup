import { positionWorld, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { perleyThomas } from './perley-thomas';

function quarter(column: number, row: number) {
  const g = new PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, (column + 0.006 + uv.getX(i) * 0.988) / 2, (row + 0.006 + uv.getY(i) * 0.988) / 2);
  return g;
}
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const stops = [
  [80, 110, 4.26, 1.8],
  [1560, 1580, -13, 2.8],
  [3180, 3210, -1.2, 1.5],
  [4740, 4770, -1.3, 2.4],
  [6240, 6268, -1.3, 1.6],
  [7960, 7983, -5, 2.3],
] as const;

export class StCharlesParade {
  readonly root = new Group();
  private readonly facades = new MeshBasicMaterial({ side: DoubleSide });
  private readonly oakCrowd = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 });
  private readonly streetSurface = new MeshBasicNodeMaterial({ side: DoubleSide });
  readonly materials = {
    ParadeAvenue: this.streetSurface,
    GardenDistrict: this.facades,
    KreweCrowd: this.oakCrowd,
  };
  private readonly vehiclePaint = new MeshLambertMaterial({ vertexColors: true });
  private readonly car = perleyThomas(this.vehiclePaint);
  private readonly platform = new BoxGeometry(1, 1, 1);
  private readonly gilt = new MeshBasicMaterial({ color: 0xc9a554 });
  private readonly paper = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36 });
  private readonly marchers = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 });
  private readonly figures = [quarter(0, 1), quarter(1, 1), quarter(0, 0), quarter(1, 0)];
  private readonly actors = this.figures.map((g) => new InstancedMesh(g, this.marchers, 16));
  private readonly floats: Group[] = [];
  private readonly beadRing = new TorusGeometry(0.11, 0.027, 5, 13);
  private readonly beads = new InstancedMesh(this.beadRing, this.gilt, 12);
  private readonly pose = new Object3D();
  private readonly p = place();
  private readonly origin = place();
  private readonly drawn = {
    streetcarStation: null as number | null,
    marchStride: null as number | null,
    beadHeight: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const loaded = await Promise.allSettled(
      ['avenue', 'krewe', 'band'].map((n) => loader.loadAsync('courses/mardigras-' + n + '.webp')),
    );
    const images: Texture[] = [];
    for (const r of loaded) if (r.status === 'fulfilled') images.push(r.value);
    const failed = loaded.find((r) => r.status === 'rejected');
    if (failed) {
      for (const i of images) i.dispose();
      throw failed.reason;
    }
    return new StCharlesParade(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    for (const image of images) image.colorSpace = SRGBColorSpace;
    const [street, krewe, band] = images as [Texture, Texture, Texture];
    const coarse = positionWorld.x
      .mul(33.17)
      .add(positionWorld.z.mul(22.81))
      .sin()
      .mul(4327.61)
      .fract();
    const fine = positionWorld.x
      .mul(77.1)
      .add(positionWorld.z.mul(91.23))
      .sin()
      .mul(7318.21)
      .fract();
    this.streetSurface.colorNode = vertexColor().rgb.mul(
      coarse.mul(0.28).add(fine.mul(0.18)).add(0.74),
    );
    street.flipY = false;
    this.facades.map = this.oakCrowd.map = street;
    this.paper.map = krewe;
    this.marchers.map = band;
    for (const batch of [...this.actors, this.beads]) batch.frustumCulled = false;
    this.root.add(this.car, ...this.actors, this.beads);
    for (let i = 0; i < 2; i++) {
      const g = new Group();
      const deck = new Mesh(this.platform, this.gilt);
      deck.scale.set(2.67, 0.82, 7.2);
      deck.position.y = 0.72;
      g.add(deck);
      const banner = (
        tile: number,
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        rotation: number,
      ) => {
        const plane = new Mesh(this.figures[tile]!, this.paper);
        plane.position.set(x, y, z);
        plane.rotation.y = rotation;
        plane.scale.set(w, h, 1);
        g.add(plane);
      };
      for (const side of [-1, 1]) {
        banner(2, side * 1.36, 0.4, 0, 7.25, 1.74, (side * Math.PI) / 2);
        banner(3, side * 0.66, 1.52, 0.66, 3.25, 1.88, (side * Math.PI) / 2);
      }
      for (const end of [-1, 1]) banner(2, 0, 0.43, end * 3.63, 2.74, 1.18, 0);
      banner(i, 0, 1.03, -2.45, 3.23, 4.42, 0);
      banner(3, 0, 1.48, 1.62, 2.9, 1.86, 0);
      this.floats.push(g);
      this.root.add(g);
    }
    for (let i = 0; i < 12; i++)
      this.beads.setColorAt(i, new Color([0x8143af, 0x6ac25d, 0xffcb47][i % 3]));
  }
  update(metres: number, time: number) {
    const offset = 129 - time * 2.3;
    const carStation = Math.ceil((metres + 6 - offset) / 79) * 79 + offset;
    const car = this.car,
      p = this.course.place(carStation, 4.26, this.p);
    car.visible = carStation >= 0 && carStation < 7050;
    car.position.set(p.x, p.y + 0.075, p.z);
    car.rotation.set(-p.pitch, p.heading + Math.PI, 0, 'YXZ');
    this.drawn.streetcarStation = car.visible ? carStation : null;
    this.drawn.marchStride = null;
    for (let kind = 0; kind < 4; kind++) {
      const batch = this.actors[kind]!,
        stage = kind < 2 ? 3180 : 6240;
      batch.visible = Math.abs(metres - stage) < 350;
      if (!batch.visible) continue;
      for (let i = 0; i < 16; i++) {
        const stride = Math.sin(time * 4.8 + i * 0.7 + kind * 0.6);
        const phase = 7 * Math.sin(time * 0.085);
        const mid = stage + 23 + phase + (kind % 2) * 5 + (i % 8) * 3.05;
        const walk = this.course.place(
          mid,
          -1.52 + (i >= 8 ? 0.83 : 0) + (kind % 2) * 0.59,
          this.p,
        );
        this.pose.position.set(walk.x, walk.y + 0.07 + 0.048 * stride, walk.z);
        this.pose.rotation.set(0, walk.heading, 0.04 * stride, 'YXZ');
        this.pose.scale.set(kind === 3 ? 1.57 : 1.26, kind === 3 ? 2.62 : 1.87, 1);
        this.pose.updateMatrix();
        batch.setMatrixAt(i, this.pose.matrix);
        if (i === 0 && kind === 0) this.drawn.marchStride = this.pose.position.y;
      }
      batch.instanceMatrix.needsUpdate = true;
    }
    this.drawn.beadHeight = null;
    this.beads.count = 0;
    for (let i = 0; i < 2; i++) {
      const float = this.floats[i]!,
        stage = i === 0 ? 4740 : 7960;
      float.visible = Math.abs(metres - stage) < 310;
      if (!float.visible) continue;
      const travel = 8 * Math.sin(time * 0.071),
        station = stage + 32 + travel;
      const q = this.course.place(station, -1.27, this.p);
      float.position.set(q.x, q.y, q.z);
      float.rotation.set(q.pitch, q.heading, 0, 'YXZ');
      this.beads.count = 12;
      for (let j = 0; j < 12; j++) {
        const flight = (time * 0.56 + j / 12) % 1;
        const arc = 3.1 + 2.25 * Math.sin(Math.PI * flight) - 2.05 * flight;
        this.pose.position.set(-0.7 - flight * 3.28, arc, 1.6 - (j % 4) * 0.7);
        this.pose.position.applyQuaternion(float.quaternion).add(float.position);
        this.pose.rotation.set(flight * 4.9, j + flight * 2.1, 0);
        this.pose.scale.set(1, 1.3, 1);
        this.pose.updateMatrix();
        this.beads.setMatrixAt(j, this.pose.matrix);
        if (j === 0) this.drawn.beadHeight = this.pose.position.y;
      }
      this.beads.instanceMatrix.needsUpdate = true;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = stops.find((s) => Math.abs(metres - s[0]) < 60);
    if (!view) return;
    const origin = this.course.place(metres, 0, this.origin);
    const target = this.course.place(view[1], view[2], this.p);
    const dx = target.x - origin.x,
      dz = target.z - origin.z,
      len = Math.max(0.01, Math.hypot(dx, dz));
    const blend = Math.min(1, (1 - Math.abs(metres - view[0]) / 60) * 1.65);
    camera.x += (origin.x - (dx * 4.75) / len - camera.x) * blend;
    camera.z += (origin.z - (dz * 4.75) / len - camera.z) * blend;
    camera.y += (origin.y + 2.17 - camera.y) * blend;
    ahead.x += (origin.x + (13 * dx) / len - ahead.x) * blend;
    ahead.z += (origin.z + (13 * dz) / len - ahead.z) * blend;
    ahead.y += (origin.y + view[3] - ahead.y) * blend;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    this.car.geometry.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      ...this.figures,
      ...this.actors,
      this.beads,
      this.beadRing,
      this.gilt,
      this.platform,
      this.paper,
      this.marchers,
      this.vehiclePaint,
    ])
      item.dispose();
  }
}
