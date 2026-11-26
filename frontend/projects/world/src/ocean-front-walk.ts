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
  TorusGeometry,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, texture, uniform } from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 175, -16, 2],
  [1320, 1345, 15, 3],
  [2640, 2665, -14, 1],
  [3810, 3841, -5.6, 1.7],
  [5110, 5143, -28, 3.9],
  [6770, 6850, -103, 19],
] as const;
export class OceanFrontWalk {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshBasicNodeMaterial)[] = [];
  private readonly time = uniform(0);
  private readonly rotor = new Group();
  private readonly cabins: Mesh[] = [];
  private readonly skaters: Mesh[] = [];
  private readonly busker = new Group();
  private readonly arm = new Group();
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    skaterTravel: null as number | null,
    strumAngle: null as number | null,
    gondolaHeight: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'shops',
        'palms',
        'performers',
        'sand',
        'coast',
        'walls',
        'skaters',
        'busker',
        'forearm',
        'signs',
      ].map((k) => loader.loadAsync('courses/venice-' + k + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new OceanFrontWalk(course, maps, low);
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
    const [shops, palms, people, sand, sky, walls, skaters, busker, forearm, signs] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    sand!.wrapS = sand!.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const paving = new MeshBasicNodeMaterial({ side: DoubleSide });
    paving.colorNode = mix(color(0x8d8982), color(0xd1c9b7), texture(sand!, xz.mul(0.66)).r);
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const wash = sin(
      xz.y
        .mul(0.91)
        .add(this.time.mul(0.86))
        .add(sin(xz.x.mul(0.14)).mul(0.7)),
    );
    water.colorNode = mix(color(0x45889a), color(0xe2efed), wash.mul(0.5).add(0.5).pow(12));
    const cut = (m: Texture) =>
      new MeshBasicMaterial({ map: m, side: DoubleSide, alphaTest: 0.59 });
    this.materials = {
      BraudeConcrete: paving,
      VeniceSand: new MeshBasicMaterial({ map: sand, side: DoubleSide }),
      WalkShops: cut(shops!),
      BeachSigns: new MeshBasicMaterial({ map: signs, side: DoubleSide }),
      FanPalms: cut(palms!),
      VeniceMurals: new MeshBasicMaterial({ map: walls, side: DoubleSide }),
      BeachPerformers: cut(people!),
      SantaMonicaBay: new MeshBasicMaterial({ map: sky, side: DoubleSide, fog: false }),
      BeachSurf: water,
    };
    const block = new BoxGeometry();
    this.geometries.push(block);
    const mat = (c: number) => {
      const m = new MeshBasicMaterial({ color: c });
      this.paint.push(m);
      return m;
    };
    const steel = mat(0xb07a57);
    const bar = (
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
      return mesh;
    };
    const anchor = (d: number, lane: number, g: Group) => {
      const p = course.place(d, lane, this.point);
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = p.heading;
      this.root.add(g);
    };
    const wheel = new Group();
    anchor(6850, -103, wheel);
    wheel.add(this.rotor);
    this.rotor.position.y = 19;
    const hoop = new TorusGeometry(16.5, 0.3, 6, 72);
    this.geometries.push(hoop);
    this.rotor.add(new Mesh(hoop, mat(0xe7b853)));
    const spokes: BoxGeometry[] = [];
    const cabin = new BoxGeometry(1.65, 1.02, 1.33);
    this.geometries.push(cabin);
    const cabinPaint = [mat(0xd95e45), mat(0xdcaa43), mat(0x54a0b3)];
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI) / 10;
      const spoke = new BoxGeometry(0.14, 16.5, 0.12);
      spoke.translate(0, 8.25, 0);
      spoke.rotateZ(a);
      spokes.push(spoke);
      const g = new Mesh(cabin, cabinPaint[i % 3]);
      this.rotor.add(g);
      this.cabins.push(g);
      g.position.set(-16.5 * Math.sin(a), 16.5 * Math.cos(a), 0);
    }
    const merged = mergeGeometries(spokes);
    this.geometries.push(merged);
    this.rotor.add(new Mesh(merged, steel));
    for (const s of spokes) s.dispose();
    for (const side of [-1, 1])
      bar(wheel, side * 3.6, 9.5, 0, 0.65, 20, 0.61, steel).rotation.z = side * 0.409;
    const sprite = (w: number, h: number, map: Texture, lo = 0, hi = 1) => {
      const geometry = new PlaneGeometry(w, h);
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setXY(i, lo + uv.getX(i) * (hi - lo), 1 - uv.getY(i));
      geometry.translate(0, h / 2, 0);
      this.geometries.push(geometry);
      const m = cut(map);
      this.paint.push(m);
      return new Mesh(geometry, m);
    };
    for (let i = 0; i < 3; i++) {
      const sk = sprite(2.08, 1.84, skaters!, i * 0.25, (i + 1) * 0.25);
      this.root.add(sk);
      this.skaters.push(sk);
    }
    anchor(3841, -5.6, this.busker);
    this.busker.rotation.y += 0.23;
    this.busker.add(sprite(1.18, 1.91, busker!));
    const hand = sprite(1.18, 1.91, forearm!);
    this.arm.position.set(-0.32, 1.35, 0.012);
    hand.position.set(0.32, -1.35, 0);
    this.arm.add(hand);
    this.busker.add(this.arm);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.rotor.rotation.z = t * 0.065;
    for (const c of this.cabins) c.rotation.z = -this.rotor.rotation.z;
    this.poses.gondolaHeight = 19 + 16.5 * Math.cos(this.rotor.rotation.z);
    this.arm.rotation.z = 0.15 * Math.sin(t * 8.7);
    this.poses.strumAngle = this.arm.rotation.z;
    for (const [i, s] of this.skaters.entries()) {
      const a = t * (0.66 - i * 0.045) + i * 2.36;
      const d = (i === 2 ? 2657 : 2665 + i * 27) + Math.sin(a) * (i === 2 ? 10 : 7.8);
      const lane = i === 2 ? 6.8 : -(15 + i * 8 + Math.cos(a) * 4);
      const p = this.course.place(d, lane, this.point);
      s.visible = Math.abs(metres - 2665) < 310;
      s.position.set(p.x, p.y + (i === 2 ? 0.1 : 0.35 + 0.65 * Math.cos(a) ** 2), p.z);
      s.rotation.set(
        0,
        p.heading + (i === 2 ? 0.2 : 0.62) * Math.sin(a),
        0.08 * Math.cos(a),
        'YXZ',
      );
      if (i === 0) this.poses.skaterTravel = s.position.x;
    }
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
      const height = at === 2640 ? 5.6 : 2.54;
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
