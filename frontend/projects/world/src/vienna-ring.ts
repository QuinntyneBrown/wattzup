import type { BufferGeometry, Texture } from 'three/webgpu';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  CylinderGeometry,
  type Vector3,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { color, mix, positionWorld, smoothstep, sin } from 'three/tsl';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
import type { Course, CoursePlace } from './course';
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const views = [
  [140, 180, 24, 12],
  [1190, 1225, -32, 10],
  [2020, 2053, -28, 6],
  [2550, 2584, -131, 33],
  [3120, 3154, -131, 29],
  [4710, 4731, -13, 2],
] as const;
export class ViennaRing {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly tram = new Group();
  private readonly jets: Mesh[] = [];
  private readonly cyclist: SceneRider;
  private readonly target = place();
  private readonly point = place();
  private readonly poses = { tramTravel: 0, jetHeight: 0, pedalAngle: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const res = await Promise.allSettled(
      ['oper', 'palaces', 'trees', 'tram', 'gothic'].map((n) =>
        loader.loadAsync('courses/vienna-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new ViennaRing(course, maps, kit, plain);
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
    private readonly kit: Riders,
    private readonly plain: MeshStandardMaterial,
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = 4;
    }

    const [oper, palaces, trees, tram, gothic] = maps;
    const flat = (map: Texture) =>
      new MeshBasicMaterial({ map, alphaTest: 0.49, side: DoubleSide });
    const asphalt = new MeshBasicNodeMaterial({ side: DoubleSide });
    const xz = positionWorld.xz;
    asphalt.colorNode = mix(
      color(0x716f71),
      color(0x757375),
      sin(xz.x.mul(2.3).add(xz.y.mul(1.9)))
        .mul(0.5)
        .add(0.5),
    );
    const paving = new MeshBasicNodeMaterial({ side: DoubleSide });
    const tile = xz.mul(1.5).fract();
    paving.colorNode = mix(
      color(0x9c9690),
      color(0xc5c0b4),
      smoothstep(0.015, 0.045, tile.x.min(tile.y)),
    );
    this.materials = {
      RingAsphalt: asphalt,
      RingPaving: paving,
      RingCycle: new MeshBasicMaterial({ color: 0xa8776c }),
      RingRails: new MeshBasicMaterial({ color: 0xbabbb9 }),
      RingLawns: new MeshBasicMaterial({ color: 0x859668 }),
      Staatsoper: flat(oper!),
      RingPalaces: flat(palaces!),
      RingGothic: flat(gothic!),
      RingTrees: flat(trees!),
    };
    const paint = (hex: number) => {
      const mat = new MeshBasicMaterial({ color: hex });
      this.local.push(mat);
      return mat;
    };
    const block = new BoxGeometry();
    this.geo.add(block);
    const red = paint(0xaa3933),
      roof = paint(0xc6c0b2),
      window = paint(0x5b7074),
      black = paint(0x383a3d);
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      mat: MeshBasicMaterial,
    ) => {
      const m = new Mesh(block, mat);
      m.scale.set(w, h, l);
      m.position.set(x, y, z);
      this.tram.add(m);
      return m;
    };
    for (const centre of [-7.9, 0, 7.9]) {
      box(0, 1, centre, 2.52, 1.12, 7.66, red);
      box(0, 2.06, centre, 2.43, 1.08, 7.64, window);
      box(0, 2.72, centre, 2.54, 0.3, 7.65, roof);
    }
    // The transparent side illustration includes the trucks, doors and collector.
    const side = new PlaneGeometry(24.8, 7.05);
    const uv = side.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    this.geo.add(side);
    const skin = flat(tram!);
    this.local.push(skin);
    for (const sign of [-1, 1]) {
      const m = new Mesh(side, skin);
      m.rotation.y = (sign * Math.PI) / 2;
      m.position.set(1.28 * sign, 3.5, 0);
      this.tram.add(m);
    }
    for (const sign of [-1, 1]) {
      box(0, 1.64, sign * 11.8, 2.58, 0.13, 0.25, roof);
      for (const x of [-0.87, 0.87]) box(x, 1.12, sign * 11.84, 0.26, 0.23, 0.18, roof);
    }
    box(0, 3.01, 6, 0.13, 0.16, 2.3, black);
    this.root.add(this.tram);
    const spray = new CylinderGeometry(0.049, 0.1, 1, 6);
    spray.translate(0, 0.5, 0);
    this.geo.add(spray);
    const aqua = paint(0xc3ded9);
    const basin = course.place(2053, -17.2, this.point);
    for (let j = 0; j < 10; j++) {
      const jet = new Mesh(spray, aqua),
        a = (j * Math.PI) / 5;
      jet.position.set(basin.x + 2.5 * Math.cos(a), basin.y + 0.8, basin.z + 2.5 * Math.sin(a));
      jet.rotation.z = 0.17 * Math.cos(a);
      jet.rotation.x = 0.17 * Math.sin(a);
      this.root.add(jet);
      this.jets.push(jet);
    }
    this.cyclist = kit.make(new Color(0x335d77), 4);
    this.cyclist.setCastShadow(false);
    this.root.add(this.cyclist.group);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    const lap = ((metres % 5300) + 5300) % 5300;
    const tramStation = (93 + 5.3 * t) % 5300;
    const p = this.course.place(tramStation, 6.7, this.point);
    this.tram.position.set(p.x, p.y + 0.06, p.z);
    this.tram.rotation.set(p.pitch, p.heading, 0, 'YXZ');
    this.poses.tramTravel = p.x;
    for (const [i, m] of this.jets.entries())
      m.scale.y = 1.15 + 0.41 * Math.sin(t * 3.3 + i * 0.61);
    this.poses.jetHeight = this.jets[0]!.scale.y;
    this.cyclist.group.visible = lap > 4350 && lap < 5050;
    if (this.cyclist.group.visible) {
      const q = this.course.place((lap + 18 + 1.8 * Math.sin(t * 0.3)) % 5300, -13, this.point);
      this.cyclist.group.position.set(q.x, q.y + 0.14, q.z);
      this.cyclist.group.rotation.set(q.pitch, q.heading, 0, 'YXZ');
      const crank = t * 5.4;
      this.cyclist.pose(crank, 0.031 * Math.sin(crank), 0.17);
      this.poses.pedalAngle = crank;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    metres = ((metres % 5300) + 5300) % 5300;
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(at === 4710 ? metres + 18 : to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      const height = 2.65;
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
      ...this.geo,
      ...this.local,
      ...Object.values(this.materials),
      ...this.maps,
    ]))
      item.dispose();
  }
}
