import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { cameraPosition, mix, positionWorld, sin, uniform, vec3, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 135, -15, 3],
  [1710, 1751, 2.1, 2],
  [3620, 3671, 18, 3.6],
  [5410, 5760, 820, 80],
  [7880, 8230, -590, 108],
  [10210, 10680, 640, 93],
] as const;

export class LasseterRoadTrain {
  readonly root = new Group();
  readonly materials = {
    LasseterSeal: new MeshBasicNodeMaterial({ side: DoubleSide }),
    RedSand: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true }),
    DesertScrub: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    StationFront: new MeshBasicMaterial({ side: DoubleSide }),
    LasseterSigns: new MeshBasicMaterial({ side: DoubleSide }),
    RedCentreRock: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true, fog: false }),
  };
  private readonly truck = new Group();
  private readonly trailers = [new Group(), new Group(), new Group()];
  private readonly dust = new Group();
  private readonly bird = new Group();
  private readonly p = point();
  private readonly t = point();
  private readonly geo = new Set<BufferGeometry>();
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly paint: MeshBasicMaterial[] = [];
  private readonly cube = new BoxGeometry();
  private readonly tyre = new CylinderGeometry(1, 1, 1, 12);
  private readonly puff = new SphereGeometry(1, 8, 5);
  private readonly readings = {
    truckTravel: null as number | null,
    dustDrift: null as number | null,
    eagleTrack: null as number | null,
  };
  private gust = 0;
  private readonly mirageTime = uniform(0);
  private readonly daylight = uniform(1);
  private encounter: { time: number; distance: number } | undefined;
  static async load(course: Course) {
    const result = await Promise.allSettled(
      ['scrub', 'station', 'signs', 'rock', 'sand', 'bonnet', 'prime', 'eagle'].map((k) =>
        new TextureLoader().loadAsync('courses/outback-' + k + '.webp'),
      ),
    );
    const images = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const fail = result.find((r) => r.status === 'rejected');
    if (fail) {
      for (const image of images) image.dispose();
      throw fail.reason;
    }
    return new LasseterRoadTrain(course, images);
  }
  private pigment(value: number) {
    let c = this.colours.get(value);
    if (!c) {
      c = new MeshBasicMaterial({ color: value });
      this.colours.set(value, c);
    }
    return c;
  }
  private box(
    g: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new Mesh(this.cube, this.pigment(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private wheels(g: Group, z: number) {
    for (const side of [-1, 1])
      for (const [radius, depth, offset, col] of [
        [0.55, 0.32, 1.08, 0x33312f],
        [0.32, 0.06, 1.27, 0xa5a39a],
      ] as const) {
        const m = new Mesh(this.tyre, this.pigment(col));
        m.rotation.z = Math.PI / 2;
        m.scale.set(radius, depth, radius);
        m.position.set(side * offset, 0.56, z);
        g.add(m);
      }
  }
  private plate(
    g: Group,
    img: Texture,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
  ) {
    const geometry = new PlaneGeometry(w, h);
    this.geo.add(geometry);
    const uv = geometry.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    const mat = new MeshBasicMaterial({ map: img, alphaTest: 0.39, side: DoubleSide });
    this.paint.push(mat);
    const m = new Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.rotation.y = yaw;
    g.add(m);
    return m;
  }
  private place(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.p);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.heading + Math.PI;
    g.rotateX(p.pitch);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [scrub, station, signs, rock, sand, bonnet, prime, eagle] = textures;
    this.materials.DesertScrub.map = scrub!;
    this.materials.StationFront.map = station!;
    this.materials.LasseterSigns.map = signs!;
    for (const t of [rock!, sand!]) t.wrapS = t.wrapT = MirroredRepeatWrapping;
    this.materials.RedCentreRock.map = rock!;
    this.materials.RedSand.map = sand!;
    const asphalt = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(83).add(positionWorld.z.mul(57)))
        .mul(0.04)
        .add(0.965),
    );
    const distance = positionWorld.distance(cameraPosition);
    const ripple = sin(
      distance.mul(0.32).add(this.mirageTime.mul(2.8)).add(positionWorld.x.mul(0.42)),
    );
    const reflection = distance
      .smoothstep(65, 210)
      .mul(ripple.mul(0.5).add(0.5))
      .mul(this.daylight)
      .mul(0.17);
    this.materials.LasseterSeal.colorNode = mix(asphalt, vec3(0.55, 0.65, 0.72), reflection);
    // A fallen kangaroo lies on the gravel beneath the circling eagle.
    const animal = new Group();
    const fur = this.pigment(0x796556);
    for (const [x, y, z, w, h, l, angle] of [
      [0, 0.18, 0, 0.31, 0.19, 0.59, 0],
      [0.13, 0.21, 0.52, 0.14, 0.12, 0.23, -0.2],
      [-0.12, 0.09, -0.7, 0.1, 0.08, 0.49, 0.29],
      [0.24, 0.09, -0.17, 0.11, 0.08, 0.39, -0.53],
      [0.17, 0.28, 0.71, 0.052, 0.052, 0.16, -0.27],
    ]) {
      const piece = new Mesh(this.puff, fur);
      piece.position.set(x, y, z);
      piece.scale.set(w, h, l);
      piece.rotation.y = angle;
      animal.add(piece);
    }
    this.place(animal, 5452, 6.3);
    this.root.add(animal);
    this.geo.add(this.cube);
    this.geo.add(this.tyre);
    this.geo.add(this.puff);
    this.box(this.truck, 0x5b5147, 0, 0.98, 0, 2.2, 0.57, 8.3);
    this.box(this.truck, 0xa14336, 0, 1.63, -2.77, 2.17, 1.13, 2.87);
    this.box(this.truck, 0x873f36, 0, 2.23, -0.28, 2.32, 2.87, 2.26);
    this.box(this.truck, 0x5d7981, 0, 2.99, -1.44, 2.06, 0.74, 0.086);
    this.plate(this.truck, bonnet!, 2.93, 3.97, 0, 1.99, -4.34, Math.PI);
    for (const side of [-1, 1])
      this.plate(this.truck, prime!, 8.2, 3.91, 1.22 * side, 1.96, 0, (side * Math.PI) / 2);
    for (const z of [-2.81, 1.62, 2.93]) this.wheels(this.truck, z);
    for (const [i, g] of this.trailers.entries()) {
      this.box(g, 0x6f5947, 0, 1.02, 0, 2.36, 0.54, 13.25);
      const col = [0x915c47, 0x9e694c, 0x88614a][i]!;
      this.box(g, col, 0, 2.05, 0, 2.46, 1.82, 12.87);
      this.box(g, 0x857969, 0, 3.01, 0, 2.49, 0.16, 12.98);
      for (const side of [-1, 1])
        for (let post = 0; post < 9; post++)
          this.box(g, 0x705343, side * 1.24, 2.06, -6.16 + post * 1.54, 0.065, 1.87, 0.1);
      for (const z of [3.18, 4.48, 5.78]) this.wheels(g, z);
      this.box(g, 0x505150, 0, 0.79, -7.34, 0.28, 0.19, 2.24);
      this.root.add(g);
    }
    for (let i = 0; i < 14; i++) {
      const mat = new MeshBasicMaterial({
        color: new Color(i % 2 ? 0xb59170 : 0xb7815e),
        transparent: true,
        opacity: 0.085,
        depthWrite: false,
      });
      this.paint.push(mat);
      this.dust.add(new Mesh(this.puff, mat));
    }
    const wing = this.plate(this.bird, eagle!, 2.91, 1.66, 0, 0, 0, 0);
    wing.rotation.x = -Math.PI / 2;
    this.root.add(this.truck, this.bird, this.dust);
  }
  update(metres: number, time: number) {
    // Each train travels west to east. Recycle it beyond the ends of its visibility window.
    const spacing = 545,
      axis = 1740 - time * 12.3;
    let d = axis + Math.round((metres - axis) / spacing) * spacing;
    if (metres >= 1480 && metres < 2020) {
      // Stage the encounter beyond the sight distance on entry. Once on the road the
      // train moves at a fixed speed, including if the rider slows or stops.
      this.encounter ??= { time, distance: 1732 + (Math.max(0, 1710 - metres) * 12.3) / 13.7 };
      d = this.encounter.distance - (time - this.encounter.time) * 12.3;
    } else {
      this.encounter = undefined;
    }
    this.truck.visible = d > 0 && d + 52 < this.course.length && Math.abs(d - metres) < 204;
    for (const t of this.trailers) t.visible = this.truck.visible;
    this.dust.visible = this.truck.visible;
    this.readings.truckTravel = this.readings.dustDrift = null;
    this.gust = 0;
    if (this.truck.visible) {
      this.place(this.truck, d, 1.78);
      this.readings.truckTravel = d;
      for (const [i, g] of this.trailers.entries()) this.place(g, d + 10.48 + i * 15.13, 1.78);
      const tail = this.course.place(d + 51, 2.96, this.p);
      this.dust.position.set(tail.x, tail.y, tail.z);
      this.dust.rotation.y = tail.heading;
      for (const [i, m] of this.dust.children.entries()) {
        const age = (time * 0.46 + i / 14) % 1;
        m.position.set(1.1 + age * 4 + 0.7 * Math.sin(i * 1.8), 0.37 + age * 2.63, -age * 22);
        m.scale.set(0.8 + age * 2.1, 0.4 + age * 1.54, 1.17 + age * 2.9);
      }
      this.readings.dustDrift = this.dust.children[0]!.position.z;
      const near = Math.max(0, 1 - Math.abs(d + 22 - metres) / 37);
      this.gust = 0.15 * near * Math.sin(time * 8.4);
    }
    this.bird.visible = Math.abs(metres - 5440) < 250;
    this.readings.eagleTrack = null;
    if (this.bird.visible) {
      const orbit = time * 0.31;
      const p = this.course.place(5452 + 16 * Math.sin(orbit), 12 + 8 * Math.cos(orbit), this.p);
      this.bird.position.set(p.x, p.y + 8.6 + 1.5 * Math.sin(orbit * 0.8), p.z);
      this.bird.rotation.set(
        0.06 * Math.cos(orbit),
        p.heading + orbit,
        -0.21 + 0.1 * Math.sin(orbit),
      );
      this.readings.eagleTrack = this.bird.position.x;
    }
    const dusk = Math.min(1, Math.max(0, (metres - 5790) / 4200));
    this.mirageTime.value = time;
    this.daylight.value = 1 - dusk;
    this.materials.RedCentreRock.color.setRGB(1 + 0.28 * dusk, 1 - 0.19 * dusk, 1 - 0.32 * dusk);
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((s) => Math.abs(metres - s[0]) < 90);
    if (s) {
      const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 90) * 1.6),
        p = this.course.place(metres, -1.45, this.p),
        t = this.course.place(s[1], s[2], this.t),
        dx = t.x - p.x,
        dz = t.z - p.z,
        len = Math.hypot(dx, dz);
      camera.x += (p.x - (5.4 * dx) / len - camera.x) * f;
      camera.z += (p.z - (5.4 * dz) / len - camera.z) * f;
      camera.y += (p.y + 2.36 - camera.y) * f;
      ahead.x += (p.x + (14 * dx) / len - ahead.x) * f;
      ahead.z += (p.z + (14 * dz) / len - ahead.z) * f;
      ahead.y += (p.y + 2.36 + (19.4 * (t.y + s[3] - p.y - 2.36)) / (len + 5.4) - ahead.y) * f;
    }
    camera.x += this.gust;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.geo,
      ...this.colours.values(),
      ...this.paint,
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
