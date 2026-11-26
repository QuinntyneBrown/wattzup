import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  CylinderGeometry,
  SphereGeometry,
  RepeatWrapping,
  MeshStandardMaterial,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, texture, uniform } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const views = [
  [140, 170, 1, 2],
  [3060, 3090, -22, -2],
  [6240, 6268, -3.7, 1],
  [8680, 8688, -126, -2],
  [10150, 10176, 4.65, 3],
  [14870, 14951, 40, 10],
] as const;
export class WicklowWeather {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshStandardMaterial)[] = [];
  private readonly time = uniform(0);
  private readonly point = place();
  private readonly target = place();
  private readonly flock: { group: Group; neck: Group; legs: Mesh[]; d: number; lane: number }[] =
    [];
  private readonly cloud = new Group();
  private readonly cloth = new PlaneGeometry(2.4, 1.28, 8, 2);
  private readonly poses = { grazingAngle: 0, flagTip: 0, cloudTravel: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['moor', 'flora', 'ridges', 'granite', 'signs', 'mist'].map((k) =>
        loader.loadAsync('courses/wicklow-' + k + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new WicklowWeather(course, maps, low);
    } catch (e) {
      for (const m of maps) m.dispose();
      throw e;
    }
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    low: boolean,
  ) {
    const [moor, flora, ridges, granite, signs, mist] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    const xz = positionWorld.xz;
    moor!.wrapS = moor!.wrapT = RepeatWrapping;
    const peat = new MeshBasicNodeMaterial({ side: DoubleSide });
    const moorland = texture(moor!, xz.mul(0.13)).rgb;
    peat.colorNode = moorland.mul(
      sin(xz.x.mul(0.024).add(xz.y.mul(0.035)))
        .mul(0.09)
        .add(0.93),
    );
    const tar = new MeshBasicNodeMaterial({ side: DoubleSide });
    tar.colorNode = mix(color(0x555553), color(0x727372), moorland.r.mul(0.75));
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(
      xz.x
        .mul(1.7)
        .add(this.time.mul(0.69))
        .add(sin(xz.y.mul(0.58))),
    )
      .mul(0.5)
      .add(0.5);
    water.colorNode = mix(color(0x39454b), color(0x6b7b80), ripple.pow(5).mul(0.19));
    const flat = (map: Texture) =>
      new MeshBasicMaterial({ map, alphaTest: 0.48, side: DoubleSide });
    this.materials = {
      R756Tarmac: tar,
      WicklowWater: water,
      WicklowPeat: peat,
      WicklowGranite: flat(granite!),
      WicklowFlora: new MeshBasicMaterial({ map: flora, alphaTest: 0.93, side: DoubleSide }),
      WicklowSigns: flat(signs!),
      WicklowRidges: new MeshBasicMaterial({ map: ridges, side: DoubleSide, fog: false }),
    };
    const ball = new SphereGeometry(1, 10, 8),
      limb = new CylinderGeometry(1, 1, 1, 7),
      block = new BoxGeometry();
    this.geometries.push(ball, limb, block, this.cloth);
    const paint = (hex: number) => {
      const m = new MeshStandardMaterial({ color: hex, roughness: 1 });
      this.paint.push(m);
      return m;
    };
    const wool = [paint(0xd9d3c4), paint(0xc6c4b4), paint(0xe9dfcf)],
      dark = paint(0x433d39),
      horn = paint(0x9e8d73),
      eye = paint(0x232329);
    const shape = (
      parent: Group,
      geo: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
    ) => {
      const mesh = new Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      parent.add(mesh);
      return mesh;
    };
    for (const [i, [d, lane]] of [
      [6268, -3.8],
      [6274, -5.3],
      [6262, -7.6],
      [6281, -6.3],
      [6228, 4.7],
      [6294, -5.7],
      [10184, 5.2],
      [10189, 7.2],
    ].entries()) {
      const g = new Group(),
        neck = new Group();
      const fleece = wool[i % 3]!;
      shape(g, ball, fleece, 0, 0.66, 0.04, 0.37, 0.39, 0.63);
      for (const sign of [-1, 1])
        for (const along of [-0.32, 0.05, 0.36])
          shape(g, ball, fleece, sign * 0.24, 0.68, along, 0.16, 0.23, 0.23);
      neck.position.set(0, 0.81, -0.41);
      g.add(neck);
      shape(neck, ball, dark, 0, -0.01, -0.21, 0.186, 0.22, 0.28);
      shape(neck, ball, fleece, 0, 0.135, -0.16, 0.18, 0.15, 0.18);
      for (const side of [-1, 1]) {
        const ear = shape(neck, ball, dark, side * 0.203, 0.02, -0.17, 0.126, 0.059, 0.08);
        ear.rotation.z = side * 0.28;
        shape(neck, ball, horn, side * 0.15, 0.14, -0.13, 0.09, 0.088, 0.09);
        shape(neck, ball, eye, side * 0.161, 0.013, -0.29, 0.027, 0.029, 0.035);
      }
      const legs: Mesh[] = [];
      for (const a of [-1, 1])
        for (const b of [-1, 1]) {
          legs.push(shape(g, limb, dark, a * 0.18, 0.255, b * 0.32, 0.052, 0.44, 0.059));
        }
      this.flock.push({ group: g, neck, legs, d: d!, lane: lane! });
      this.root.add(g);
    }
    const at = course.place(10176, 4.65, this.point),
      flag = new Group();
    flag.position.set(at.x, at.y, at.z);
    flag.rotation.y = at.heading;
    shape(flag, limb, paint(0x77756b), 0, 2.1, 0, 0.046, 4.2, 0.046);
    this.cloth.translate(1.2, -0.64, 0);
    const arr = [];
    const pos = this.cloth.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      arr.push(
        ...(x < 0.78 ? [0.05, 0.46, 0.23] : x < 1.59 ? [0.91, 0.91, 0.82] : [0.97, 0.38, 0.09]),
      );
    }
    const c = this.cloth.getAttribute('normal').clone();
    c.array = new Float32Array(arr);
    this.cloth.setAttribute('color', c);
    const flagMat = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
    this.paint.push(flagMat);
    const sheet = new Mesh(this.cloth, flagMat);
    sheet.position.y = 4.05;
    flag.add(sheet);
    this.root.add(flag);
    const bank = new PlaneGeometry(330, 45);
    this.geometries.push(bank);
    const haze = new MeshBasicMaterial({
      map: mist,
      transparent: true,
      opacity: 0.49,
      depthWrite: false,
      side: DoubleSide,
    });
    this.paint.push(haze);
    for (let i = 0; i < 5; i++) {
      const m = new Mesh(bank, haze);
      m.position.set(155 * i, 11 * Math.sin(i), -72 * i);
      m.rotation.y = i * 0.22;
      this.cloud.add(m);
    }
    this.root.add(this.cloud);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    for (const [i, r] of this.flock.entries()) {
      r.group.visible = Math.abs(metres - r.d) < 230;
      if (!r.group.visible) continue;
      const step = i % 3 === 0,
        phase = t * 0.87 + i * 2.3;
      const p = this.course.place(
        r.d + (step ? 1.35 * Math.sin(t * 0.19 + i) : 0),
        r.lane + (step ? 0.24 * Math.cos(t * 0.29) : 0),
        this.point,
      );
      r.group.position.set(p.x, p.y - 0.24, p.z);
      r.group.rotation.y = p.heading + (i % 2 ? -0.74 : 1.03);
      r.neck.rotation.x = -0.58 + 0.49 * Math.sin(phase);
      for (const [j, leg] of r.legs.entries())
        leg.rotation.x = step ? 0.22 * Math.sin(phase * 2 + j * 2.5) : 0.05;
      if (i === 0) this.poses.grazingAngle = r.neck.rotation.x;
    }
    const pos = this.cloth.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(
        i,
        x * 0.13 * (Math.sin(x * 3 - t * 5) + 0.4 * Math.sin(x * 5.4 - t * 2 + pos.getY(i))),
      );
    }
    pos.needsUpdate = true;
    this.poses.flagTip = pos.getZ(8);
    const p = this.course.place(8820, -210, this.point);
    this.cloud.position.set(
      p.x + 33 * Math.sin(t * 0.016),
      p.y + 41,
      p.z + 11 * Math.cos(t * 0.011),
    );
    this.poses.cloudTravel = this.cloud.position.x;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 48) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (48 - gap) / 24);
      const back = 4.9;
      camera.x += (r.x - (back * dx) / len - camera.x) * w;
      camera.z += (r.z - (back * dz) / len - camera.z) * w;
      const height = at === 8680 ? 5.8 : 2.55;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y +
          height -
          0.79 +
          ((14 + back) * (p.y + lift - r.y - height)) / (len + back) -
          ahead.y) *
        w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const m of [
      ...this.maps,
      ...this.geometries,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
