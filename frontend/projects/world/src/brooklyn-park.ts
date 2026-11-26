import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const lap = 6200;
const views = [
  [80, 107, 0, 1.4],
  [1240, 1265, -15, 1.43],
  [2860, 2901, -14, 11.5],
  [4060, 4090, -16, 2.0],
  [5130, 5210, -78, 2.4],
  [5720, 5760, -75, 6.7],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
interface ParkRiderView {
  subject: Mesh<PlaneGeometry, MeshBasicMaterial>;
  index: number;
  station: number;
  lane: number;
  height: number;
  phase: number;
}

export class BrooklynPark {
  readonly root = new Group();
  readonly materials = {
    BrooklynCanopy: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    AudubonFacade: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    BrooklynLawn: new MeshBasicNodeMaterial({ side: DoubleSide }),
    BrooklynDrive: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly paint = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 });
  private readonly actors: ParkRiderView[] = [];
  private readonly tiles: PlaneGeometry[] = [];
  private readonly rider = point();
  private readonly target = point();
  private readonly readings = {
    prospectStation: 0,
    runnerTravel: null as number | null,
    dogTravel: null as number | null,
    swanTravel: null as number | null,
  };

  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['canopy', 'boathouse', 'actors'].map((key) =>
        loader.loadAsync('courses/prospect-' + key + '.webp'),
      ),
    );
    const textures = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    const error = results.find((result) => result.status === 'rejected');
    if (error) {
      for (const texture of textures) texture.dispose();
      throw error.reason;
    }
    return new BrooklynPark(course, textures);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const texture of textures) {
      texture.flipY = false;
      texture.colorSpace = SRGBColorSpace;
    }
    this.materials.BrooklynCanopy.map = textures[0]!;
    this.materials.AudubonFacade.map = textures[1]!;
    this.paint.map = textures[2]!;
    const leaves = sin(positionWorld.x.mul(0.37).add(sin(positionWorld.z.mul(0.8)).mul(2.7))).add(
      sin(positionWorld.z.mul(0.25).add(positionWorld.x.mul(0.34))),
    );
    const grit = sin(positionWorld.x.mul(83).add(positionWorld.z.mul(131)))
      .mul(0.03)
      .add(0.97);
    this.materials.BrooklynDrive.colorNode = vertexColor()
      .rgb.mul(leaves.smoothstep(-0.37, 0.24).mul(0.27).add(0.73))
      .mul(grit);
    this.materials.BrooklynLawn.colorNode = vertexColor().rgb.mul(grit);
    for (let id = 0; id < 6; id++) {
      const tile = new PlaneGeometry(1, 1),
        uv = tile.getAttribute('uv');
      for (let n = 0; n < uv.count; n++)
        uv.setXY(n, ((id % 3) + uv.getX(n)) / 3, (Math.floor(id / 3) + 1 - uv.getY(n)) / 2);
      this.tiles.push(tile);
    }
    this.add(0, 1265, -4.65, 1.83, 0);
    this.add(1, 1262, -13, 1.23, 0.2);
    this.add(2, 5744, -32, 1.44, 0.4);
    this.add(2, 5753, -36, 1.28, 1.6);
    this.add(2, 5170, -39, 1.44, 0.7);
    this.add(5, 4091, -6.5, 1.89, 0.8);
    for (const station of [100, 880, 1910, 3130, 4030, 5490]) {
      for (let j = 0; j < 5; j++)
        this.add(3 + (j % 2), station + j * 3.3, -0.8 + (j % 2) * 0.8, 1.64, station * 0.01);
    }
  }
  private add(index: number, station: number, lane: number, height: number, phase: number) {
    const subject = new Mesh(this.tiles[index]!, this.paint);
    subject.scale.setScalar(height);
    this.actors.push({ subject, index, station, lane, height, phase });
    this.root.add(subject);
  }
  update(metres: number, time: number) {
    const d = ((metres % lap) + lap) % lap;
    this.readings.prospectStation = metres;
    this.readings.runnerTravel = this.readings.dogTravel = this.readings.swanTravel = null;
    const rider = this.course.place(metres, 0, this.rider);
    for (const a of this.actors) {
      const gap = Math.abs(d - a.station);
      a.subject.visible = Math.min(gap, lap - gap) < 210;
      if (!a.subject.visible) continue;
      const pace = a.index === 1 ? 0.33 : a.index === 2 ? 0.073 : a.index === 5 ? 0.09 : 0.18;
      const phase = time * pace + a.phase;
      const travel = (a.index === 2 ? 4 : a.index >= 3 ? 11 : 6) * Math.sin(phase);
      const p = this.course.place(a.station + travel, a.lane, this.target);
      const water = a.index === 2;
      const foot = water ? 22.1 : p.y;
      const bob = a.index <= 1 ? 0.055 * Math.abs(Math.sin(time * 7 + a.phase)) : 0;
      a.subject.position.set(p.x, foot + (water ? 0.19 : 0.48) * a.height + bob, p.z);
      a.subject.rotation.y = Math.atan2(rider.x - p.x, rider.z - p.z);
      if (a.index === 0) this.readings.runnerTravel = a.subject.position.x;
      if (a.index === 1) this.readings.dogTravel = a.subject.position.x;
      if (a.index === 2) this.readings.swanTravel = a.subject.position.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = ((metres % lap) + lap) % lap;
    const view = views.find((v) => Math.abs(d - v[0]) < 58);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(d - view[0]) / 58) * 1.55);
    const r = this.course.place(metres, 0, this.rider),
      t = this.course.place(metres - d + view[1], view[2], this.target);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.23 - camera.y) * f;
    ahead.x += (r.x + (13 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.23 + (18 * (t.y + view[3] - r.y - 2.23)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.tiles,
      this.paint,
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
