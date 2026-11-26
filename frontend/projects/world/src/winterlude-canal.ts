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
  SphereGeometry,
  RepeatWrapping,
  MeshStandardMaterial,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const views = [
  [140, 290, 85, 21],
  [2260, 2292, 5, 5],
  [4120, 4155, 13, 2.4],
  [6320, 6352, 10, 3],
  [7740, 7768, 0, 2],
  [11340, 11320, 8, 2.7],
] as const;
export class WinterludeCanal {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicNodeMaterial | MeshBasicMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshStandardMaterial)[] = [];

  private readonly point = place();
  private readonly target = place();
  private readonly skaters: {
    body: Group;
    legs: Group[];
    arms: Group[];
    lane: number;
    offset: number;
  }[] = [];
  private readonly cloth = new PlaneGeometry(1.8, 0.86, 6, 2);
  private readonly lights: MeshBasicMaterial[] = [];
  private readonly poses = { skateAngle: 0, flagTip: 0, lightLevel: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['ice', 'skyline', 'trees', 'sculptures', 'signs'].map((k) =>
        loader.loadAsync('courses/winterlude-' + k + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new WinterludeCanal(course, maps, low);
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
    const [ice, sky, trees, sculptures, signs] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    ice!.wrapS = ice!.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const floor = new MeshBasicNodeMaterial({ side: DoubleSide });
    const scratches = texture(ice!, xz.mul(0.064)).rgb;
    floor.colorNode = mix(
      scratches.mul(0.78),
      color(0xd9e7ed),
      sin(xz.x.mul(0.017).add(xz.y.mul(0.077)))
        .mul(0.07)
        .add(0.14),
    );
    const snow = new MeshBasicNodeMaterial({ side: DoubleSide });
    snow.colorNode = mix(
      color(0xcdd9e3),
      color(0xf0f3f0),
      sin(xz.x.mul(0.22).add(xz.y.mul(0.26)))
        .mul(0.18)
        .add(0.62),
    );
    const flat = (map: Texture, alphaTest = 0.48) =>
      new MeshBasicMaterial({ map, alphaTest, side: DoubleSide });
    this.materials = {
      RideauIce: floor,
      RideauSnow: snow,
      OttawaTrees: flat(trees!, 0.9),
      WinterCarvings: flat(sculptures!),
      RideauSigns: flat(signs!),
      OttawaSkyline: flat(sky!),
    };
    const ball = new SphereGeometry(1, 9, 7),
      block = new BoxGeometry();
    this.geometries.push(ball, block, this.cloth);
    const paint = (color: number) => {
      const m = new MeshStandardMaterial({ color, roughness: 0.92 });
      this.paint.push(m);
      return m;
    };
    const steel = paint(0xb3bdc5),
      boots = paint(0x353942),
      mitts = paint(0x454954),
      skin = [paint(0xd5aa88), paint(0xb08164), paint(0x89644e)],
      coats = [0xaa4847, 0x3c6b7a, 0xb5914e, 0x65557c, 0x38705e].map(paint);
    const shape = (
      g: Group,
      geom: BufferGeometry,
      mat: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
    ) => {
      const mesh = new Mesh(geom, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
      return mesh;
    };
    for (let j = 0; j < (low ? 16 : 22); j++) {
      const g = new Group(),
        coat = coats[j % 5]!,
        hat = coats[(j + 2) % 5]!;
      shape(g, ball, coat, 0, 1.08, -0.064, 0.235, 0.34, 0.185);
      shape(g, ball, skin[j % 3]!, 0, 1.54, -0.14, 0.132, 0.161, 0.128);
      shape(g, ball, hat, 0, 1.64, -0.13, 0.141, 0.096, 0.143);
      shape(g, ball, hat, 0, 1.73, -0.13, 0.044, 0.054, 0.047);
      const legs: Group[] = [],
        arms: Group[] = [];
      for (const sign of [-1, 1]) {
        const leg = new Group();
        leg.position.set(sign * 0.115, 0.86, 0.02);
        shape(leg, ball, boots, 0, -0.18, -0.07, 0.092, 0.23, 0.102);
        shape(leg, ball, mitts, 0, -0.51, 0.005, 0.073, 0.22, 0.078);
        shape(leg, ball, boots, 0, -0.705, -0.05, 0.093, 0.093, 0.159);
        shape(leg, block, steel, 0, -0.8, -0.052, 0.018, 0.069, 0.32);
        g.add(leg);
        legs.push(leg);
        const arm = new Group();
        arm.position.set(sign * 0.2, 1.32, -0.06);
        shape(arm, ball, coat, 0.032 * sign, -0.17, -0.01, 0.075, 0.2, 0.075);
        shape(arm, ball, mitts, 0.048 * sign, -0.32, -0.095, 0.064, 0.095, 0.074);
        g.add(arm);
        arms.push(arm);
      }
      const size = (j % 5 === 4 ? 0.75 : 0.97) + (j % 3) * 0.025;
      g.scale.setScalar(size);
      this.root.add(g);
      this.skaters.push({
        body: g,
        legs,
        arms,
        lane: [-4.4, 3.7, 6.4, -7.2][j % 4]!,
        offset: 7 + j * 12.3,
      });
    }
    const flag = new Group(),
      f = course.place(4153, -18, this.point);
    flag.position.set(f.x, f.y, f.z);
    flag.rotation.y = f.heading;
    shape(flag, block, steel, 0, 2.6, 0, 0.078, 5.2, 0.078);
    this.cloth.translate(0.9, -0.43, 0);
    const flagMat = new MeshBasicMaterial({ color: 0xb8444f, side: DoubleSide });
    this.paint.push(flagMat);
    const sheet = new Mesh(this.cloth, flagMat);
    sheet.position.y = 5.1;
    flag.add(sheet);
    this.root.add(flag);
    for (const [i, station] of [4151, 4170].entries()) {
      const p = course.place(station, -28, this.point);
      const tint = new MeshBasicMaterial({
        color: i ? 0xbb91e8 : 0x79b5ef,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      });
      this.paint.push(tint);
      this.lights.push(tint);
      const base = new Mesh(block, tint);
      base.scale.set(6.3, 0.26, 3.45);
      base.position.set(p.x, p.y + 0.64, p.z);
      base.rotation.y = p.heading;
      this.root.add(base);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    for (const [i, s] of this.skaters.entries()) {
      const phase = t * 1.62 + i * 2.1,
        speed = i % 4 === 2 ? -3.9 : 3.3,
        cycle = this.skaters.length * 12.3;
      const absolute = s.offset + t * speed,
        d = absolute + cycle * Math.floor((metres - absolute + cycle / 2) / cycle);
      s.body.visible = d >= 0 && d < this.course.length && Math.abs(d - metres) < cycle / 2 - 5;
      if (!s.body.visible) continue;
      const q = this.course.place(d, s.lane + 0.42 * Math.sin(phase * 0.5), this.point);
      s.body.position.set(q.x, q.y + 0.064 + 0.026 * Math.cos(phase * 2), q.z);
      s.body.rotation.set(
        -0.045,
        q.heading + (speed < 0 ? Math.PI : 0),
        0.08 * Math.sin(phase),
        'YXZ',
      );
      for (const [side, leg] of s.legs.entries()) {
        const push = Math.sin(phase + side * Math.PI);
        leg.rotation.set(
          0.31 * push,
          0.05 * push,
          (side ? 1 : -1) * (0.14 + 0.37 * Math.max(0, push)),
        );
        s.arms[side]!.rotation.x = -0.48 * push;
      }
      this.poses.skateAngle = s.legs[0]!.rotation.z;
    }
    const pos = this.cloth.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, x * 0.17 * Math.sin(4 * x - 4.3 * t + pos.getY(i) * 0.5));
    }
    pos.needsUpdate = true;
    this.poses.flagTip = pos.getZ(6);
    for (const [i, m] of this.lights.entries()) {
      const wave = 0.5 + 0.5 * Math.sin(t * 0.83 + i);
      m.color.setRGB(0.32 + wave * 0.3, 0.43 + (1 - wave) * 0.31, 0.96);
      m.opacity = 0.5 + wave * 0.4;
    }
    this.poses.lightLevel = this.lights[0]!.opacity;
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
      camera.x += (r.x - (4.9 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.9 * dz) / len - camera.z) * w;
      const height = 2.55;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y + height - 0.79 + (18.9 * (p.y + lift - r.y - height)) / (len + 4.9) - ahead.y) * w;
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
