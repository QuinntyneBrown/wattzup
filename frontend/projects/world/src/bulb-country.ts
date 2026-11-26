import {
  BoxGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  RepeatWrapping,
  TextureLoader,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import {
  color,
  mix,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course, CoursePlace } from './course';

const views = [
  [140, 170, -8, 1.3],
  [2160, 2184, -11, 1],
  [4170, 4222, 22, 7.4],
  [5890, 5914, -13, 1.3],
  [7640, 7655, 35, 4],
  [9920, 9974, -23, 7],
] as const;
const palette = [0xca343b, 0xf2c13b, 0xe77ba1, 0xe87830, 0xf0e9d6, 0x797abd, 0xeec83f];
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class BulbCountry {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly time = uniform(0);
  private readonly rotors: Group[] = [];
  private readonly objects: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshBasicNodeMaterial)[] = [];
  private readonly beds: InstancedMesh[] = [];
  private readonly cyclist = new Group();
  private readonly point = place();
  private readonly target = place();
  private section = -1;
  private readonly poses = { sailAngle: 0, bloomSway: 0, cyclistTravel: null as number | null };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['flowers', 'farms', 'horizon', 'mill', 'willows', 'visitors', 'lane'].map((key) =>
        loader.loadAsync('courses/tulips-' + key + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new BulbCountry(course, maps, low);
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
    const [flowers, farms, sky, wood, trees, people, lane] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    const cut = (map: Texture) => new MeshBasicMaterial({ map, alphaTest: 0.42, side: DoubleSide });
    const xz = positionWorld.xz;
    const dirt = new MeshBasicNodeMaterial({ side: DoubleSide });
    const grains = sin(xz.x.mul(31).add(sin(xz.y.mul(59))))
      .mul(0.5)
      .add(0.5);
    lane!.wrapS = lane!.wrapT = RepeatWrapping;
    dirt.colorNode = texture(lane!, xz.mul(0.45)).rgb.mul(0.83);
    const grass = new MeshBasicNodeMaterial({ side: DoubleSide });
    grass.colorNode = mix(
      color(0x688044),
      color(0x91a561),
      grains
        .mul(0.23)
        .add(sin(xz.x.mul(0.9)).mul(0.15))
        .add(0.41),
    );
    const crops = new MeshBasicNodeMaterial({ side: DoubleSide });
    const variety = uv().x.floor();
    let heads = color(palette[0]!).rgb;
    for (let i = 1; i < palette.length; i++)
      heads = mix(heads, color(palette[i]!), smoothstep(i - 0.4, i - 0.1, variety));
    const row = sin(uv().y.mul(Math.PI * 2)),
      petals = sin(xz.x.mul(18).add(sin(xz.y.mul(13))))
        .mul(0.08)
        .add(0.88);
    crops.colorNode = mix(
      color(0x705b43),
      mix(color(0x547337), heads.mul(petals), smoothstep(-0.8, -0.11, row)),
      smoothstep(-0.99, -0.68, row),
    );
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(xz.x.mul(0.6).add(xz.y.mul(2.8)).add(this.time.mul(0.7)));
    water.colorNode = mix(color(0x668183), color(0xb4c9c7), ripple.mul(0.16).add(0.53));
    const heaven = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
    const drift = sin(this.time.mul(0.018)).mul(0.009);
    heaven.colorNode = texture(
      sky!,
      uv().add(drift.mul(smoothstep(0.1, 0.75, uv().y.oneMinus()))),
    ).rgb;
    this.materials = {
      PolderLane: dirt,
      PolderGrass: grass,
      BulbBeds: crops,
      Sloten: water,
      PolderTrees: cut(trees!),
      BulbFarms: cut(farms!),
      BulbVisitors: cut(people!),
      SmockTimber: new MeshBasicMaterial({ map: wood, side: DoubleSide }),
      PolderHorizon: heaven,
    };
    // Four lattice sails share two merged meshes per mill; only the shaft rotates.
    const lattice: BoxGeometry[] = [];
    const cloth: BoxGeometry[] = [];
    const part = (
      dst: BoxGeometry[],
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      angle: number,
    ) => {
      const box = new BoxGeometry(w, h, d);
      box.translate(x, y, z);
      box.rotateZ(angle);
      dst.push(box);
    };
    for (let n = 0; n < 4; n++) {
      const angle = (n * Math.PI) / 2;
      part(lattice, 0, 4.35, 0, 0.18, 8.7, 0.2, angle);
      for (let i = 0; i < 9; i++) part(lattice, 0.64, 2.5 + i * 0.72, 0, 1.48, 0.065, 0.1, angle);
      for (let i = 0; i < 3; i++) part(lattice, 0.26 + i * 0.49, 5.45, 0, 0.065, 6.18, 0.1, angle);
      part(cloth, 0.69, 5.7, -0.05, 1.16, 4.28, 0.025, angle);
    }
    const blades = mergeGeometries(lattice),
      canvas = mergeGeometries(cloth);
    for (const g of [...lattice, ...cloth]) g.dispose();
    this.objects.push(blades, canvas);
    const timber = new MeshBasicMaterial({ color: 0x493d31 });
    const linen = new MeshBasicMaterial({ color: 0xd1c3a5 });
    this.paint.push(timber, linen);
    for (const [d, lane] of [
      [4222, 22],
      [9974, -23],
    ] as const) {
      const p = course.place(d, lane, this.point);
      const support = new Group(),
        rotor = new Group();
      support.position.set(p.x, p.y + 12.1, p.z);
      support.rotation.y = p.heading + 0.38;
      rotor.position.z = 2.7;
      rotor.add(new Mesh(blades, timber), new Mesh(canvas, linen));
      support.add(rotor);
      this.root.add(support);
      this.rotors.push(rotor);
    }
    const card = (w: number, h: number, cell: number, count: number) => {
      const geo = new PlaneGeometry(w, h);
      geo.translate(0, h / 2, 0);
      const coords = geo.getAttribute('uv');
      for (let i = 0; i < coords.count; i++) {
        coords.setX(i, (cell + 0.002 + coords.getX(i) * 0.996) / count);
        coords.setY(i, 1 - coords.getY(i));
      }
      this.objects.push(geo);
      return geo;
    };
    for (let i = 0; i < 6; i++) {
      const mat = new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.48 });
      const printed = texture(flowers!, uv());
      mat.colorNode = printed.rgb;
      mat.opacityNode = printed.a;
      mat.positionNode = positionLocal.add(
        vec3(
          sin(this.time.mul(2.1).add(positionWorld.z.mul(0.27)))
            .mul(positionLocal.y)
            .mul(0.085),
          0,
          0,
        ),
      );
      this.paint.push(mat);
      const plants = new InstancedMesh(card(1.48, 0.64, i, 6), mat, low ? 96 : 180);
      this.beds.push(plants);
      this.root.add(plants);
    }
    const bikeMat = cut(people!);
    this.paint.push(bikeMat);
    this.cyclist.add(new Mesh(card(2.25, 1.88, 0, 3), bikeMat));
    this.root.add(this.cyclist);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.sailAngle = t * 0.43;
    this.poses.bloomSway = Math.sin(t * 2.1);
    for (const rotor of this.rotors) rotor.rotation.z = this.poses.sailAngle + 0.32;
    const section = Math.floor(metres / 54);
    if (section !== this.section) {
      this.section = section;
      const dummy = new Object3D();
      for (const [variety, plants] of this.beds.entries()) {
        for (let i = 0; i < plants.count; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const row = Math.floor(i / 2) % 4;
          const d = section * 54 - 17 + Math.floor(i / 8) * 8.1 + variety * 1.21;
          const p = this.course.place(
            d,
            side * (11.9 + row * 1.22 + (variety % 3) * 0.12),
            this.point,
          );
          dummy.position.set(p.x, p.y - 0.55, p.z);
          dummy.rotation.y = p.heading + side * 0.49;
          dummy.scale.setScalar(0.8 + 0.25 * Math.abs(Math.sin(i * 5.1)));
          dummy.updateMatrix();
          plants.setMatrixAt(i, dummy.matrix);
        }
        plants.instanceMatrix.needsUpdate = true;
        plants.computeBoundingSphere();
      }
    }
    this.cyclist.visible = Math.abs(metres - 7640) < 410;
    if (this.cyclist.visible) {
      const p = this.course.place(7652 + 11 * Math.sin(t * 0.13), -2.84, this.point);
      this.cyclist.position.set(p.x, p.y + 0.04, p.z);
      this.cyclist.rotation.y = p.heading + 0.62;
      this.poses.cyclistTravel = p.x;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 45) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (45 - gap) / 22);
      camera.x += (r.x - (4.9 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.9 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.45 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.66 + (18.9 * (p.y + lift - r.y - 2.45)) / (len + 4.9) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const m of this.beds) m.dispose();
    for (const m of [
      ...this.maps,
      ...this.objects,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
