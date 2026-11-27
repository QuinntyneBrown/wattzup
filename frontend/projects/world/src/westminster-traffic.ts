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
  TorusGeometry,
  SphereGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three/webgpu';
import type { BufferGeometry, Texture } from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, uniform } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const views = [
  [140, 456, 50, -25],
  [430, 456, 64, -25],
  [1220, 0, 0, 0],
  [2380, 795, 12, 811],
  [4620, -79, 67, 687],
  [6120, 436, 27, -157],
] as const;
export class WestminsterTraffic {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: MeshBasicMaterial[] = [];
  private readonly time = uniform(0);
  private readonly point = place();
  private readonly traffic: {
    group: Group;
    lane: number;
    speed: number;
    offset: number;
    bus: boolean;
  }[] = [];
  private readonly eye = new Group();
  private readonly capsules: InstancedMesh;
  private readonly capsuleMatrix = new Matrix4();
  private readonly translation = new Vector3();
  private readonly upright = new Quaternion();
  private readonly capsuleSize = new Vector3(4.2, 2.15, 2.65);
  private readonly poses = { busTravel: 0, cabTravel: 0, wheelAngle: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['palace', 'county', 'clock', 'people', 'traffic'].map((k) =>
        loader.loadAsync('courses/westminster-' + k + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new WestminsterTraffic(course, maps, low);
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
    const [palace, county, clock, people, traffic] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    const flat = (map: Texture) =>
      new MeshBasicMaterial({ map, alphaTest: 0.49, side: DoubleSide });
    const xz = positionWorld.xz;
    const surface = (base: number, lit: number) => {
      const m = new MeshBasicNodeMaterial({ side: DoubleSide });
      const glint = sin(xz.x.mul(0.25).add(sin(xz.y.mul(0.88))))
        .mul(0.5)
        .add(0.5)
        .pow(9)
        .mul(
          sin(xz.y.mul(1.27).add(xz.x.mul(0.73)))
            .mul(0.5)
            .add(0.5),
        );
      m.colorNode = mix(color(base), color(lit), glint.mul(0.6));
      return m;
    };
    const paving = new MeshBasicNodeMaterial({ side: DoubleSide });
    const tile = xz.mul(1.35).fract();
    paving.colorNode = mix(
      color(0x686369),
      color(0xaaa49e),
      smoothstep(0.015, 0.045, tile.x.min(tile.y)),
    );
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(
      xz.y
        .mul(1.2)
        .add(this.time.mul(0.58))
        .add(sin(xz.x.mul(0.41))),
    )
      .mul(0.5)
      .add(0.5);
    water.colorNode = mix(
      color(0x414657),
      color(0xc69876),
      ripple.pow(6).mul(sin(xz.x.mul(0.062)).mul(0.5).add(0.5).pow(4)),
    );
    this.materials = {
      LondonAsphalt: surface(0x4b4b53, 0x9b8477),
      LondonBusLane: surface(0x894b50, 0xbb8d77),
      LondonPaving: paving,
      LondonBanks: new MeshBasicMaterial({ color: 0x787479, side: DoubleSide }),
      WestminsterStone: flat(palace!),
      CountyHall: flat(county!),
      BigBenFace: flat(clock!),
      LondonTourists: flat(people!),
      ThamesWater: water,
    };
    const material = (color: number) => {
      const m = new MeshBasicMaterial({ color });
      this.paint.push(m);
      return m;
    };
    const block = new BoxGeometry(),
      wheel = new CylinderGeometry(1, 1, 1, 10);
    const pearl = material(0xd3c6bd),
      rubber = material(0x302e33),
      red = material(0xb4383e),
      black = material(0x302f34),
      glass = material(0x65717b),
      amber = material(0xffca62),
      tail = material(0xe64c3e);
    this.geometries.push(block, wheel);
    const box = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      m: MeshBasicMaterial,
    ) => {
      const mesh = new Mesh(block, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
    };
    const skin = flat(traffic!);
    this.paint.push(skin);
    for (let track = 0; track < 3; track++) {
      for (let j = 0; j < 6; j++) {
        const bus = (j + track) % 3 === 0;
        const v = (bus ? 0 : 2) + (j % 2),
          g = new Group(),
          length = bus ? 10.5 : 4.7,
          width = bus ? 2.45 : 1.86,
          height = bus ? 4.15 : 1.73;
        const uvMin = (v % 2) * 0.5,
          uvTop = v < 2 ? 0 : 0.5;
        const geo = new PlaneGeometry(length * 1.07, height * 1.08);
        const uv = geo.getAttribute('uv');
        for (let k = 0; k < uv.count; k++) {
          uv.setXY(k, uvMin + uv.getX(k) * 0.5, uvTop + (1 - uv.getY(k)) * 0.5);
        }
        this.geometries.push(geo);
        for (const side of [-1, 1]) {
          const wall = new Mesh(geo, skin);
          wall.rotation.y = (side * Math.PI) / 2;
          wall.position.set(side * width * 0.501, height * 0.52, 0);
          g.add(wall);
          for (const sign of [-1, 1]) {
            const tyre = new Mesh(wheel, rubber);
            tyre.scale.set(height * (bus ? 0.113 : 0.197), 0.23, height * (bus ? 0.113 : 0.197));
            tyre.rotation.z = Math.PI / 2;
            tyre.position.set(
              side * width * 0.45,
              height * (bus ? 0.113 : 0.197),
              sign * length * 0.32,
            );
            g.add(tyre);
          }
        }
        box(g, 0, height * 0.4, 0, width * 0.96, height * 0.51, length * 0.94, bus ? red : black);
        box(
          g,
          0,
          height * 0.75,
          bus ? 0 : 0.2,
          width * 0.89,
          height * 0.36,
          length * (bus ? 0.92 : 0.55),
          glass,
        );
        box(
          g,
          0,
          height * 0.953,
          bus ? 0 : 0.2,
          width * 0.88,
          0.13,
          length * (bus ? 0.91 : 0.48),
          bus ? red : black,
        );
        if (bus) box(g, 0, height * 0.64, 0, width * 0.96, 0.18, length * 0.94, red);
        else box(g, 0, height * 1.04, -0.24, 0.43, 0.16, 0.23, amber);
        for (const x of [-0.35, 0.35]) {
          box(g, x * width, height * 0.32, -length * 0.475, 0.24, 0.15, 0.08, amber);
          box(g, x * width, height * 0.33, length * 0.475, 0.2, 0.15, 0.08, tail);
        }
        this.root.add(g);
        this.traffic.push({
          group: g,
          lane: [-5.7, 3.7, 7][track]!,
          speed: [6.0, -8.5, -5.4][track]!,
          offset: j * 65 + track * 13 + 18,
          bus,
        });
      }
    }
    // The observation wheel stands over its two raking legs at County Hall.
    const hoop = new TorusGeometry(55, 0.59, 6, 80),
      spoke = new CylinderGeometry(0.074, 0.1, 55, 4);
    this.geometries.push(hoop, spoke);
    this.eye.position.set(-79, 67, 687);
    this.eye.rotation.y = Math.PI / 2;
    this.root.add(this.eye);
    for (const z of [-1.5, 1.5]) {
      const m = new Mesh(hoop, pearl);
      m.position.z = z;
      this.eye.add(m);
    }
    for (let i = 0; i < 32; i++) {
      const angle = (i * Math.PI) / 16;
      const m = new Mesh(spoke, pearl);
      m.rotation.z = angle;
      m.position.set(-27.5 * Math.sin(angle), 27.5 * Math.cos(angle), 0);
      this.eye.add(m);
    }
    const pod = new SphereGeometry(1, 9, 6);
    this.geometries.push(pod);
    this.capsules = new InstancedMesh(pod, material(0xe8b8ae), 32);
    this.capsules.frustumCulled = false;
    this.root.add(this.capsules);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    for (const [i, car] of this.traffic.entries()) {
      // Each vehicle keeps its phase. Reuse it only after it is behind the visibility window.
      const phase = car.offset + car.speed * t;
      const d = phase + 390 * Math.floor((metres - phase + 195) / 390);
      car.group.visible = d >= -65 && d <= 6500 && Math.abs(d - metres) < 178;
      if (!car.group.visible) continue;
      const p = this.course.place(
        d,
        car.lane + (car.bus ? 0 : 0.18 * Math.sin(t * 0.28 + i)),
        this.point,
      );
      car.group.position.set(p.x, p.y + 0.085, p.z);
      car.group.rotation.set(
        car.speed < 0 ? -p.pitch : p.pitch,
        p.heading + (car.speed < 0 ? Math.PI : 0),
        0,
        'YXZ',
      );
      if (car.bus) this.poses.busTravel = d;
      else this.poses.cabTravel = d;
    }
    this.eye.rotation.z = t * 0.027;
    for (let j = 0; j < 32; j++) {
      const a = (j * Math.PI) / 16 + this.eye.rotation.z;
      this.translation.set(-79, 67 + 55 * Math.sin(a), 687 - 55 * Math.cos(a));
      this.capsules.setMatrixAt(
        j,
        this.capsuleMatrix.compose(this.translation, this.upright, this.capsuleSize),
      );
    }
    this.capsules.instanceMatrix.needsUpdate = true;
    this.poses.wheelAngle = this.eye.rotation.z;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [station, x, y, z] of views) {
      const gap = Math.abs(station! - metres);
      if (gap > 45) continue;
      const p = this.course.place(metres, 0, this.point);
      const statue = station === 1220 ? this.course.place(1246, -19) : null;
      const dx = (statue?.x ?? x!) - p.x,
        dz = (statue?.z ?? z!) - p.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (45 - gap) / 21);
      const height = 2.55;
      const back = station === 430 ? 32 : station === 4620 ? 29 : 5;
      camera.x += (p.x - (back * dx) / len - camera.x) * w;
      camera.z += (p.z - (back * dz) / len - camera.z) * w;
      camera.y += (p.y + height - camera.y) * w;
      ahead.x += (p.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (p.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (p.y +
          height -
          0.72 +
          ((14 + back) * ((statue ? statue.y + 3.3 : y!) - p.y - height)) / (len + back) -
          ahead.y) *
        w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.capsules.dispose();
    for (const item of [
      ...this.geometries,
      ...this.maps,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      item.dispose();
  }
}
