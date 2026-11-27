import { mix, positionWorld, texture, uniform, vec3, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { RiderBody } from './rider-body';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const position = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const mod = (x: number, d: number) => ((x % d) + d) % d;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const beach = (d: number) =>
  Math.max(
    smooth(2800, 3290, d) * (1 - smooth(3910, 4460, d)),
    smooth(7130, 7470, d) * (1 - smooth(8100, 8650, d)),
  );
const shore = (d: number) => 8 + beach(d) * (49 + 7 * Math.cos(d / 142));
const stops = [
  [80, 128, -3, 1.2],
  [1780, 1818, -28, 0.7],
  [3540, 3580, -17, 1.7],
  [5680, 5716, -16, -0.25],
  [7840, 7881, -20, 0.25],
  [9940, 10275, -14, 2.1],
] as const;

function sprayTexture() {
  return canvasTexture(256, 64, (g) => {
    for (let i = 0; i < 125; i++) {
      const x = (i * 61) % 256;
      const y = 39 + 6 * Math.sin(x * 0.035) + 9 * Math.sin(i * 17.2);
      const radius = 3.2 + 2 * Math.sin(i * 2.35);
      const a = Math.sin((x * Math.PI) / 256) ** 0.6;
      const grad = g.createRadialGradient(x, y, 0.4, x, y, radius);
      grad.addColorStop(0, 'rgba(236,249,239,' + 0.77 * a + ')');
      grad.addColorStop(1, 'rgba(215,243,233,0)');
      g.fillStyle = grad;
      g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  });
}

/** Bounded foreground traffic and shore motion in front of the fixed Chicago skyline. */
export class ChicagoLakefront {
  readonly root = new Group();
  private readonly park = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly trail = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly sandy = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly lake = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly trees = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 });
  private readonly towers = new MeshBasicMaterial({
    side: DoubleSide,
    fog: false,
    color: 0xc9d5df,
  });
  readonly materials = {
    LincolnPark: this.park,
    LakefrontTrail: this.trail,
    LakeSand: this.sandy,
    LakefrontTrees: this.trees,
    MichiganTowers: this.towers,
    Sea: this.lake,
  };
  private readonly clock = uniform(0);
  private readonly fanInk = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 });
  private readonly figures: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly spray = sprayTexture();
  private readonly foamInk = new MeshBasicMaterial({
    map: this.spray,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly foam = new InstancedMesh(new PlaneGeometry(1, 1), this.foamInk, 44);
  private readonly haze = canvasTexture(256, 64, (g) => {
    for (let i = 0; i < 6; i++) {
      const x = 25 + i * 42,
        y = 30 + 9 * Math.sin(i * 1.43);
      const grad = g.createRadialGradient(x, y, 1, x, y, 29);
      grad.addColorStop(0, 'rgba(220,235,234,.65)');
      grad.addColorStop(1, 'rgba(220,235,234,0)');
      g.fillStyle = grad;
      g.fillRect(x - 29, y - 29, 58, 58);
    }
  });
  private readonly fog = new Mesh(
    new PlaneGeometry(260, 28),
    new MeshBasicMaterial({
      map: this.haze,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  private readonly white = new MeshBasicMaterial({ color: 0xe4e7dc, side: DoubleSide });
  private readonly blue = new MeshBasicMaterial({ color: 0x289dbb });
  private readonly rail = new MeshBasicMaterial({ color: 0x616a6c });
  private readonly box = new BoxGeometry(1, 1, 1);
  private readonly mast = new CylinderGeometry(0.038, 0.052, 5.5, 8);
  private readonly sail = new BufferGeometry();
  private readonly hull = new SphereGeometry(1, 14, 8);
  private readonly boats: Group[] = [];
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly kit: CourseCyclistKit;
  private readonly bikes: RiderModel[];
  private readonly pose = new Object3D();
  private readonly sample = position();
  private readonly origin = position();
  private readonly waterLevel: number;
  private readonly drawn = {
    divvyStation: null as number | null,
    lakeBreakerHeight: 0,
    sailboatRoll: null as number | null,
  };

  static async load(course: Course, body: RiderBody) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['lakefront-trees', 'lakefront-towers', 'lakefront-users', 'goldengate-lawn'].map((key) =>
        loader.loadAsync('courses/' + key + '.webp'),
      ),
    );
    const images: Texture[] = [];
    for (const r of results) if (r.status === 'fulfilled') images.push(r.value);
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      images.forEach((t) => t.dispose());
      throw failure.reason;
    }
    return new ChicagoLakefront(course, body, images);
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly images: Texture[],
  ) {
    let level = Infinity;
    for (let i = 1; i < course.file.points.length; i += 3)
      level = Math.min(level, course.file.points[i]!);
    this.waterLevel = level - 0.8;
    for (const img of images) img.colorSpace = SRGBColorSpace;
    const [trees, towers, users, lawn] = images as [Texture, Texture, Texture, Texture];
    trees.flipY = towers.flipY = false;
    this.trees.map = trees;
    this.towers.map = towers;
    this.fanInk.map = users;
    lawn.wrapS = lawn.wrapT = MirroredRepeatWrapping;
    lawn.anisotropy = 4;
    const grass = texture(lawn, positionWorld.xz.mul(0.18)).rgb;
    this.park.colorNode = mix(grass.mul(vec3(0.53, 0.77, 0.32)), vertexColor().rgb, 0.2);
    const grit = texture(lawn, positionWorld.xz.mul(2.7)).r;
    this.trail.colorNode = vertexColor().rgb.mul(grit.mul(0.49).add(0.78));
    this.sandy.colorNode = vertexColor().rgb.mul(grit.mul(0.52).add(0.78));
    const ripple = positionWorld.x
      .mul(1.05)
      .add(positionWorld.z.mul(0.65))
      .add(this.clock.mul(0.82))
      .sin()
      .mul(positionWorld.z.mul(0.41).sub(this.clock.mul(0.55)).sin());
    this.lake.colorNode = vertexColor().rgb.mul(ripple.mul(0.085).add(0.99));
    for (let v = 0; v < 8; v++) {
      const geo = new PlaneGeometry(1, 1);
      geo.translate(0, 0.5, 0);
      const uv = geo.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, ((v % 4) + uv.getX(i)) / 4, (Math.floor(v / 4) + uv.getY(i)) / 2);
      const mesh = new InstancedMesh(geo, this.fanInk, 12);
      mesh.frustumCulled = false;
      this.figures.push(mesh);
      this.root.add(mesh);
    }
    this.sail.setAttribute(
      'position',
      new Float32BufferAttribute(
        [0, 0, 0, 0, 4.8, 0, 0, 0.1, -2.54, 0, 0.2, 0.17, 0, 4.3, 0.17, 0, 0.12, 1.96],
        3,
      ),
    );
    this.sail.computeVertexNormals();
    for (let i = 0; i < 5; i++) {
      const frame = new Group();
      const hull = new Mesh(this.hull, i % 2 === 0 ? this.white : this.blue);
      hull.scale.set(0.9, 0.51, 2.98);
      const mast = new Mesh(this.mast, this.rail);
      mast.position.y = 2.83;
      const sail = new Mesh(this.sail, this.white);
      sail.position.y = 0.56;
      frame.add(hull, mast, sail);
      this.boats.push(frame);
      this.root.add(frame);
    }
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.bikes = [0x619c85, 0xce8358].map((jersey, index) => {
      const rider = this.kit.make(new Color(jersey), 43 + index * 12, false, 0.56);
      const rearGuard = new Mesh(this.box, this.blue);
      rearGuard.position.set(0, 0.69, 0.49);
      rearGuard.scale.set(0.17, 0.17, 0.45);
      const frame = new Mesh(this.box, this.blue);
      frame.position.set(0, 0.56, 0.03);
      frame.scale.set(0.1, 0.14, 0.63);
      frame.rotation.x = 0.47;
      const basket = new Mesh(this.box, this.rail);
      basket.position.set(0, 0.95, -0.66);
      basket.scale.set(0.33, 0.16, 0.23);
      rider.group.add(rearGuard, frame, basket);
      this.root.add(rider.group);
      return rider;
    });
    this.foam.frustumCulled = false;
    this.root.add(this.foam, this.fog);
  }
  update(metres: number, time: number) {
    this.clock.value = time;
    const first = Math.floor((metres - 12) / 4.5);
    for (let n = 0; n < this.foam.count; n++) {
      const i = first + n;
      const station = i * 4.5;
      const phase = time * 1.54 + i * 1.76;
      const lane = -(shore(station) + 1.35 + 0.7 * Math.sin(phase));
      const p = this.course.place(station, lane, this.sample);
      const h = this.waterLevel + 0.26 + 0.22 * Math.sin(phase);
      this.pose.position.set(p.x, h, p.z);
      this.pose.rotation.set(-0.47, p.heading + Math.PI / 2, 0, 'YXZ');
      this.pose.scale.set(4.8, 1.2 + 0.66 * Math.sin(phase), 1);
      this.pose.updateMatrix();
      this.foam.setMatrixAt(n, this.pose.matrix);
      if (n === 9) this.drawn.lakeBreakerHeight = this.pose.position.y;
    }
    this.foam.instanceMatrix.needsUpdate = true;
    this.drawn.sailboatRoll = null;
    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i]!,
        station = 1739 + i * 21 + 2.9 * Math.sin(time * 0.12 + i);
      boat.visible = Math.abs(metres - station) < 200;
      if (!boat.visible) continue;
      const p = this.course.place(station, -36 - i * 4.4, this.sample);
      boat.position.set(p.x, this.waterLevel + 0.26 + 0.11 * Math.sin(time * 1.16 + i), p.z);
      boat.rotation.set(0, p.heading - 0.37 + i * 0.19, 0.09 * Math.sin(time * 0.96 + i), 'YXZ');
      if (this.drawn.sailboatRoll === null) this.drawn.sailboatRoll = boat.rotation.z;
    }
    const base = Math.floor((metres - 5.7 * time) / 62);
    this.drawn.divvyStation = null;
    for (let i = base; i < base + 2; i++) {
      const bike = this.bikes[mod(i, 2)]!,
        station = i * 62 + time * 5.7;
      bike.group.visible =
        station >= 0 && station < this.course.file.lengthMetres && station > metres - 18;
      if (!bike.group.visible) continue;
      const p = this.course.place(station, 1.06 + 0.16 * Math.sin(i * 1.92), this.sample);
      bike.group.position.set(p.x, p.y, p.z);
      bike.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      bike.pose(time * 6.8 + i);
      if (this.drawn.divvyStation === null) this.drawn.divvyStation = station;
    }
    for (let v = 0; v < 8; v++) {
      const mesh = this.figures[v]!;
      const seated = v === 2 || v === 3;
      const skater = v < 2;
      const pace = seated ? 0 : skater ? 4.8 : 2.9;
      const gap = 74.8;
      const offset = v * 9.35 + time * pace;
      const start = Math.floor((metres - 16 - offset) / gap);
      let count = 0;
      for (let n = 0; n < 4; n++) {
        const i = start + n;
        const station = i * gap + offset;
        if (
          station < metres - 16 ||
          station > metres + 185 ||
          station < 0 ||
          station > this.course.file.lengthMetres
        )
          continue;
        if (seated && station < 330) continue;
        const p = this.course.place(station, seated ? -5.7 : skater ? 2.25 : -1.37, this.sample);
        const seatHeight = seated ? p.y - (p.y - this.waterLevel) * 0.22 : p.y;
        this.pose.position.set(
          p.x,
          seatHeight + (seated ? -0.07 : 0.03 + 0.032 * Math.sin(time * 4 + i)),
          p.z,
        );
        this.pose.rotation.set(
          0,
          p.heading + (seated ? 0.75 : 0.31 * Math.sin(i)),
          seated ? 0 : 0.046 * Math.sin(time * 2.3 + i),
          'YXZ',
        );
        this.pose.scale.set(1.82, 1.82, 1);
        this.pose.updateMatrix();
        mesh.setMatrixAt(count++, this.pose.matrix);
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
    }
    this.fog.visible = metres > 4970 && metres < 6420;
    if (this.fog.visible) {
      const p = this.course.place(metres + 172, -95, this.sample);
      this.fog.position.set(p.x, this.waterLevel + 10, p.z + 5 * Math.sin(time * 0.11));
      this.fog.rotation.y = p.heading + 0.36;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const v = stops.find((row) => Math.abs(metres - row[0]) < 92);
    if (!v) return;
    const share = Math.min(1, (1 - Math.abs(metres - v[0]) / 92) * 1.6);
    const rider = this.course.place(metres, 0, this.origin),
      goal = this.course.place(v[1], v[2], this.sample);
    const dx = goal.x - rider.x,
      dz = goal.z - rider.z,
      len = Math.hypot(dx, dz);
    camera.x += (rider.x - (5.05 * dx) / len - camera.x) * share;
    camera.z += (rider.z - (5.05 * dz) / len - camera.z) * share;
    camera.y += (rider.y + 2.38 - camera.y) * share;
    ahead.x += (rider.x + (13 * dx) / len - ahead.x) * share;
    ahead.z += (rider.z + (13 * dz) / len - ahead.z) * share;
    ahead.y += (rider.y + v[3] - ahead.y) * share;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    for (const m of this.figures) {
      m.geometry.dispose();
      m.dispose();
    }
    for (const rider of this.bikes) for (const resource of rider.owned) resource.dispose();
    this.kit.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.fanInk,
      this.spray,
      this.foamInk,
      this.foam.geometry,
      this.foam,
      this.haze,
      this.fog.geometry,
      this.fog.material,
      this.white,
      this.blue,
      this.rail,
      this.box,
      this.mast,
      this.sail,
      this.hull,
      this.plain,
    ])
      item.dispose();
    this.root.clear();
  }
}
