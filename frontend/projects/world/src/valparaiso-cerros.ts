import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 175, -1, 2],
  [5180, 5200, -9, 4.4],
  [10350, 10387, -13, 3.5],
  [14820, 14844, -10, 3.4],
  [20140, 20183, 1.3, 1.85],
  [26410, 26445, -64, 0.5],
] as const;

export class ValparaisoCerros {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paints: MeshBasicMaterial[] = [];
  private readonly cars = [new Group(), new Group()];
  private readonly trolley = new Group();
  private readonly dog = new Group();
  private readonly time = uniform(0);
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    ascensorClimb: null as number | null,
    trolleyTravel: null as number | null,
    dogTravel: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'houses',
        'murals',
        'harbour',
        'people',
        'cobbles',
        'ascensor-profile',
        'ascensor-front',
        'trolley-profile',
        'trolley-front',
      ].map((k) => loader.loadAsync('courses/valparaiso-' + k + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new ValparaisoCerros(course, maps, low);
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
    const [homes, mural, sea, people, cobbles, carSide, carFront, busSide, busFront] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    cobbles!.wrapS = cobbles!.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const paving = new MeshBasicNodeMaterial({ side: DoubleSide });
    paving.colorNode = mix(texture(cobbles!, xz.mul(0.24)).rgb, color(0xc3a48c), 0.46);
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = texture(cobbles!, xz.mul(0.51)).rgb.mul(0.9);
    const sky = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
    const localMist = smoothstep(0.23, 0.71, uv().y.oneMinus()).mul(
      sin(uv().x.mul(13).add(this.time.mul(0.028)))
        .mul(0.06)
        .add(0.12),
    );
    sky.colorNode = mix(texture(sea!, uv()).rgb, color(0xe6c8bd), localMist);
    const cut = (map: Texture) => new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.47 });
    this.materials = {
      CerroCobbles: road,
      CerroPaving: paving,
      CerroHouses: cut(homes!),
      CerroMurals: new MeshBasicMaterial({ map: mural, side: DoubleSide }),
      CerroNeighbours: cut(people!),
      PuertoPacifico: sky,
    };
    const box = new BoxGeometry();
    this.geometries.push(box);
    const solid = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      c: number,
    ) => {
      const mat = new MeshBasicMaterial({ color: c });
      this.paints.push(mat);
      const m = new Mesh(box, mat);
      m.position.set(x, y, z);
      m.scale.set(w, h, l);
      g.add(m);
      return m;
    };
    const plate = (map: Texture, w: number, h: number, col = 0, count = 1) => {
      const geometry = new PlaneGeometry(w, h);
      this.geometries.push(geometry);
      const coords = geometry.getAttribute('uv');
      for (let n = 0; n < coords.count; n++) {
        coords.setX(n, (col + 0.001 + 0.998 * coords.getX(n)) / count);
        coords.setY(n, 1 - coords.getY(n));
      }
      const mat = cut(map);
      this.paints.push(mat);
      return new Mesh(geometry, mat);
    };
    const skin = (g: Group, side: Texture, front: Texture, w: number, h: number, l: number) => {
      for (const s of [-1, 1]) {
        const a = plate(side, l, h);
        a.position.set(s * w * 0.5, h * 0.5, 0);
        a.rotation.y = (s * Math.PI) / 2;
        g.add(a);
        const b = plate(front, w, h);
        b.position.set(0, h * 0.5, s * l * 0.5);
        b.rotation.y = s === 1 ? 0 : Math.PI;
        g.add(b);
      }
    };
    for (const car of this.cars) {
      solid(car, 0, 1.39, 0, 2.34, 1.83, 3.63, 0x973e38);
      solid(car, 0, 2.51, 0, 2.55, 0.19, 3.98, 0x405e53);
      skin(car, carSide!, carFront!, 2.6, 2.91, 4.08);
      this.root.add(car);
    }
    solid(this.trolley, 0, 1.58, 0, 2.26, 1.95, 8.9, 0x4e7966);
    skin(this.trolley, busSide!, busFront!, 2.44, 3.08, 9.5);
    for (const s of [-1, 1]) {
      const pole = solid(this.trolley, s * 0.43, 4.42, 1.1, 0.055, 3.78, 0.055, 0x4b4b44);
      pole.rotation.x = 0.51;
    }
    this.root.add(this.trolley);
    const dog = plate(people!, 1.25, 0.82, 2, 4);
    dog.position.y = 0.41;
    this.dog.add(dog);
    this.root.add(this.dog);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    const p = this.course.place(10387, -12, this.point),
      dx = -Math.sin(p.heading),
      dz = -Math.cos(p.heading);
    for (const [i, car] of this.cars.entries()) {
      car.visible = Math.abs(metres - 10387) < 435;
      if (!car.visible) continue;
      const u = (i === 0 ? 1 : -1) * 24 * Math.sin(t * 0.083),
        v = i === 0 ? -1.85 : 1.85;
      car.position.set(p.x + u * dx + v * dz, p.y + u * 0.43 + 0.28, p.z + u * dz - v * dx);
      car.rotation.y = p.heading;
      if (i === 0) this.poses.ascensorClimb = car.position.y;
    }
    this.trolley.visible = Math.abs(metres - 20140) < 450;
    if (this.trolley.visible) {
      const bus = this.course.place(20170 + 7 * Math.sin(t * 0.12), 1.32, this.point);
      this.trolley.position.set(bus.x, bus.y + 0.11, bus.z);
      this.trolley.rotation.set(-bus.pitch, bus.heading + Math.PI, 0, 'YXZ');
      this.poses.trolleyTravel = bus.x + bus.z;
    }
    this.dog.visible = Math.abs(metres - 14820) < 270;
    if (this.dog.visible) {
      const animal = this.course.place(14842 + 2.7 * Math.sin(t * 0.32), -3.15, this.point);
      this.dog.position.set(animal.x, animal.y + 0.065 * Math.abs(Math.sin(t * 4.2)), animal.z);
      this.dog.rotation.y = animal.heading + 0.48 + 0.33 * Math.sin(t * 0.32);
      this.poses.dogTravel = animal.x + animal.z;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 48) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target),
        dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (48 - gap) / 24);
      camera.x += (r.x - (4.9 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.9 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.46 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.67 + (18.9 * (p.y + lift - r.y - 2.46)) / (len + 4.9) - ahead.y) * w;
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
      ...this.paints,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
