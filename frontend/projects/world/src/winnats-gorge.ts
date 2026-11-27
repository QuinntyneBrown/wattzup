import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  SRGBColorSpace,
  TextureLoader,
  CylinderGeometry,
  SphereGeometry,
  RepeatWrapping,
  MeshStandardMaterial,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, texture } from 'three/tsl';
import { Color } from 'three/webgpu';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
type Kit = Awaited<ReturnType<typeof caribanaCyclists>>;
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const views = [
  [140, 172, 11, 4],
  [4820, 4853, 0, 1],
  [6380, 6420, -8, 10],
  [7060, 7104, -0.8, 2],
  [9860, 9910, -230, 91],
  [12980, 13185, 145, 12],
] as const;
export class WinnatsGorge {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicNodeMaterial | MeshBasicMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: MeshStandardMaterial[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly riders: SceneRider[] = [];
  private readonly sheep: { root: Group; head: Group; station: number; lane: number }[] = [];
  private readonly walkers: { root: Group; limbs: Group[]; station: number; lane: number }[] = [];
  private readonly poses = { grazingAngle: 0, pedalAngle: 0, strideAngle: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const res = await Promise.allSettled(
      ['grass', 'limestone', 'valley', 'walkers'].map((n) =>
        loader.loadAsync('courses/winnats-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new WinnatsGorge(course, maps, kit, plain);
      } catch (error) {
        kit.dispose();
        throw error;
      }
    } catch (error) {
      for (const m of maps) m.dispose();
      plain.dispose();
      throw error;
    }
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    private readonly kit: Kit,
    private readonly plain: MeshStandardMaterial,
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = 4;
    }

    const [grass, rocks, valley, walkers] = maps;
    grass!.wrapS = grass!.wrapT = RepeatWrapping;
    rocks!.wrapS = rocks!.wrapT = RepeatWrapping;
    const xz = positionWorld.xz,
      turf = new MeshBasicNodeMaterial({ side: DoubleSide });
    turf.colorNode = texture(grass!, xz.mul(0.18)).rgb.mul(
      sin(xz.x.mul(0.021).add(xz.y.mul(0.027)))
        .mul(0.09)
        .add(0.9),
    );
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = mix(
      color(0x535354),
      color(0x777674),
      texture(grass!, xz.mul(0.49)).g.mul(0.67),
    );
    this.materials = {
      WinnatsLane: road,
      DerbyshireGrass: turf,
      WinnatsCrags: new MeshBasicMaterial({ map: rocks, side: DoubleSide }),
      HopeValley: new MeshBasicMaterial({ map: valley, side: DoubleSide, fog: false }),
      WinnatsWalkers: new MeshBasicMaterial({ map: walkers, alphaTest: 0.89, side: DoubleSide }),
    };
    const ball = new SphereGeometry(1, 10, 8),
      leg = new CylinderGeometry(1, 1, 1, 7);
    this.geometries.push(ball, leg);
    const paint = (c: number) => {
      const m = new MeshStandardMaterial({ color: c, roughness: 0.96 });
      this.paint.push(m);
      return m;
    };
    const cream = paint(0xe1d9c4),
      dark = paint(0x584e43),
      skin = paint(0xb88b74),
      ink = paint(0x3a4148),
      boot = paint(0x514638);
    const shape = (
      g: Group,
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
      g.add(mesh);
      return mesh;
    };
    for (const [i, [station, lane]] of [
      [6406, -3.2],
      [6420, -4.2],
      [6413, -6.1],
      [6389, 4.0],
      [7128, 3.3],
      [7140, 4.8],
    ].entries()) {
      const root = new Group(),
        head = new Group();
      shape(root, ball, cream, 0, 0.65, 0, 0.35, 0.38, 0.6);
      for (const a of [-1, 1])
        for (const b of [-1, 1]) {
          shape(root, leg, dark, a * 0.19, 0.24, b * 0.32, 0.054, 0.47, 0.062);
          shape(root, ball, cream, a * 0.22, 0.66, b * 0.21, 0.18, 0.23, 0.27);
        }
      head.position.set(0, 0.76, -0.39);
      root.add(head);
      shape(head, ball, dark, 0, 0.011, -0.22, 0.172, 0.21, 0.23);
      shape(head, ball, cream, 0, 0.14, -0.15, 0.173, 0.117, 0.17);
      for (const a of [-1, 1]) shape(head, ball, dark, a * 0.17, 0.04, -0.15, 0.12, 0.058, 0.069);
      root.rotation.y = i * 0.86;
      this.root.add(root);
      this.sheep.push({ root, head, station: station!, lane: lane! });
    }
    for (const [j, station] of [9880, 9886, 7101].entries()) {
      const root = new Group(),
        coat = paint([0x9a573d, 0x426a72, 0x81964c][j]!);
      shape(root, ball, coat, 0, 1.14, 0, 0.24, 0.34, 0.16);
      shape(root, ball, skin, 0, 1.68, -0.015, 0.124, 0.16, 0.12);
      shape(root, ball, ink, 0, 1.77, 0.016, 0.13, 0.095, 0.125);
      shape(root, ball, boot, 0, 1.27, 0.16, 0.171, 0.249, 0.115);
      const limbs: Group[] = [];
      for (const a of [-1, 1]) {
        const thigh = new Group();
        thigh.position.set(a * 0.103, 0.87, 0);
        root.add(thigh);
        limbs.push(thigh);
        shape(thigh, leg, ink, 0, -0.36, 0, 0.083, 0.7, 0.083);
        shape(thigh, ball, boot, 0, -0.76, -0.055, 0.09, 0.076, 0.16);
        const arm = new Group();
        arm.position.set(0.2 * a, 1.41, 0);
        root.add(arm);
        limbs.push(arm);
        shape(arm, leg, coat, 0.03 * a, -0.2, 0, 0.064, 0.43, 0.062);
        shape(arm, ball, skin, 0.04 * a, -0.44, -0.04, 0.06, 0.085, 0.062);
      }
      this.root.add(root);
      this.walkers.push({ root, limbs, station, lane: j === 2 ? -3.37 : 3.48 + j * 0.5 });
    }
    for (const [i, c] of [0x9b4339, 0x445f97].entries()) {
      const r = kit.make(new Color(c), i + 3);
      r.setCastShadow(false);
      this.root.add(r.group);
      this.riders.push(r);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    for (const [i, s] of this.sheep.entries()) {
      s.root.visible = Math.abs(metres - s.station) < 220;
      if (!s.root.visible) continue;
      const p = this.course.place(
        s.station + 0.55 * Math.sin(t * 0.31 + i),
        s.lane * (0.93 + 0.07 * Math.sin(t * 0.24 + i)),
        this.point,
      );
      s.root.position.set(p.x, p.y - 0.15 + Math.max(0, Math.abs(s.lane) - 5) * 0.36, p.z);
      s.root.rotation.y = p.heading + 1.2 + i * 0.64;
      s.head.rotation.x = -0.55 + 0.52 * Math.sin(t * 1.36 + i);
      if (i === 0) this.poses.grazingAngle = s.head.rotation.x;
    }
    for (const [i, r] of this.riders.entries()) {
      r.group.visible = metres > 5820 && metres < 7820;
      if (!r.group.visible) continue;
      const p = this.course.place(
        metres + 11.8 + i * 4.8 + Math.sin(t * 0.36),
        -0.75 - i * 0.69,
        this.point,
      );
      r.group.position.set(p.x, p.y + 0.07, p.z);
      r.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      const crank = t * (5.1 + 0.27 * i) + i;
      r.pose(crank, 0.051 * Math.sin(crank), 0.26);
      if (!i) this.poses.pedalAngle = crank;
    }
    for (const [i, h] of this.walkers.entries()) {
      h.root.visible = Math.abs(h.station - metres) < 210;
      if (!h.root.visible) continue;
      const phase = 0.053 * t + i * 0.22,
        p = this.course.place(h.station + 11 * Math.sin(phase), h.lane, this.point);
      h.root.position.set(p.x, p.y - 0.13, p.z);
      h.root.rotation.y = p.heading + (Math.cos(phase) < 0 ? Math.PI : 0);
      const step = 0.51 * Math.sin(3.3 * t + i);
      for (const [j, l] of h.limbs.entries()) l.rotation.x = (j === 0 || j === 3 ? 1 : -1) * step;
      if (!i) this.poses.strideAngle = step;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      const height = 2.58;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y + height - 0.8 + (18.8 * (p.y + lift - r.y - height)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.kit.dispose();
    this.plain.dispose();
    for (const item of new Set([
      ...this.geometries,
      ...this.paint,
      ...Object.values(this.materials),
      ...this.maps,
    ]))
      item.dispose();
  }
}
