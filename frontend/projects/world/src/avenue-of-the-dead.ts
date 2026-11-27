import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';

// A camera turn eases through each plaza and returns to the ceremonial axis.
const views = [
  [140, 169, 17, 2.4],
  [4200, 4350, 0, 4],
  [8480, 8620, 304, 29],
  [12780, 12890, -28, 24],
  [17450, 17472, 9, 1.5],
  [22050, 22275, 0, 18],
] as const;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class AvenueOfTheDead {
  readonly root = new Group();
  private readonly geometry: BufferGeometry[] = [];
  private readonly ownedMaterials: (MeshBasicMaterial | MeshStandardMaterial)[] = [];
  private readonly balloons: { group: Group; distance: number; lateral: number; height: number }[] =
    [];
  private readonly climber = new Group();
  private readonly seller = new Group();
  private readonly hat = new Group();
  private readonly point = place();
  private readonly target = place();
  private readonly pose = {
    basketHeight: null as number | null,
    stairStep: null as number | null,
    hatLift: null as number | null,
  };
  readonly materials: Record<string, MeshBasicMaterial | MeshStandardMaterial>;
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['masonry', 'plateau', 'serpent', 'plants', 'people', 'earth', 'scrub'].map((name) =>
        loader.loadAsync('courses/teotihuacan-' + name + '.webp'),
      ),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new AvenueOfTheDead(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const map of maps) {
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 4;
    }
    const [stone, sky, serpent, plants, people, dust, grass] = maps;
    stone!.wrapS = stone!.wrapT = RepeatWrapping;
    dust!.wrapS = dust!.wrapT = grass!.wrapS = grass!.wrapT = RepeatWrapping;
    const rock = new MeshStandardMaterial({
      map: stone,
      emissiveMap: stone,
      emissive: 0xbbada4,
      emissiveIntensity: 0.63,
      side: DoubleSide,
      roughness: 1,
    });
    this.materials = {
      VolcanicStone: rock,
      SunPyramid: rock,
      MoonPyramid: rock,
      AvenueDust: new MeshBasicMaterial({ map: dust, side: DoubleSide }),
      HighlandGrass: new MeshBasicMaterial({ map: grass, side: DoubleSide }),
      QuetzalFaces: new MeshBasicMaterial({ map: serpent, side: DoubleSide }),
      AnahuacSky: new MeshBasicMaterial({ map: sky, side: DoubleSide, fog: false }),
      HighlandPlants: new MeshBasicMaterial({ map: plants, side: DoubleSide, alphaTest: 0.44 }),
      ValleyVisitors: new MeshBasicMaterial({ map: people, side: DoubleSide, alphaTest: 0.44 }),
    };
    const profile = [
      [0.55, 0],
      [1.05, 1.7],
      [3.1, 3.8],
      [5.25, 7.4],
      [5.7, 10.3],
      [5, 12.8],
      [3, 14.6],
      [0, 15.4],
    ];
    const envelope = new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y)),
      24,
    ).toNonIndexed();
    const positions = envelope.getAttribute('position');
    const palette = [0xc6573c, 0xe4a84b, 0xe7d9ac, 0x396d87, 0xb94737, 0xd9ad63];
    const tint = new Color();
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 3) {
      let x = 0,
        z = 0;
      for (let j = 0; j < 3; j++) {
        x += positions.getX(i + j);
        z += positions.getZ(i + j);
      }
      const angle = Math.atan2(x, z) + Math.PI;
      const stripe = Math.floor((angle * 12) / Math.PI) % 6;
      tint.setHex(palette[stripe]!);
      if (positions.getY(i) < 3.9) tint.multiplyScalar(0.82);
      for (let j = 0; j < 3; j++) tint.toArray(colors, (i + j) * 3);
    }
    envelope.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const silk = new MeshStandardMaterial({
      vertexColors: true,
      side: DoubleSide,
      roughness: 0.94,
    });
    const cane = new MeshStandardMaterial({ color: 0xa67443 });
    const cord = new MeshBasicMaterial({ color: 0x665647 });
    const basket = new BoxGeometry(1.2, 0.9, 1.12),
      rope = new CylinderGeometry(0.035, 0.035, 1.65, 5);
    this.geometry.push(envelope, basket, rope);
    this.ownedMaterials.push(silk, cane, cord);
    for (const [i, d] of [8450, 8740, 9000, 12866, 12963, 13042, 13260, 21990].entries()) {
      const g = new Group();
      g.add(new Mesh(envelope, silk));
      const bin = new Mesh(basket, cane);
      bin.position.y = -2;
      g.add(bin);
      for (const x of [-0.45, 0.45])
        for (const z of [-0.44, 0.44]) {
          const line = new Mesh(rope, cord);
          line.position.set(x, -0.85, z);
          g.add(line);
        }
      const lateral = [-95, 74, -56, -23, 45, -67, 100, 108][i]!;
      g.scale.setScalar(1 + (i % 3) * 0.23);
      this.root.add(g);
      this.balloons.push({ group: g, distance: d, lateral, height: 24 + (i % 3) * 8 });
    }
    const person = (parent: Group, index: number, w: number, h: number) => {
      const geo = new PlaneGeometry(w, h);
      const uv = geo.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, (index + 0.01 + uv.getX(i) * 0.98) / 4, 1 - uv.getY(i));
      const mesh = new Mesh(geo, this.materials['ValleyVisitors']);
      mesh.position.y = h / 2;
      parent.add(mesh);
      this.geometry.push(geo);
      this.root.add(parent);
    };
    person(this.climber, 1, 1.75, 2.05);
    person(this.seller, 0, 1.38, 1.88);
    const felt = new MeshStandardMaterial({ color: 0xd7af6e });
    const brim = new CylinderGeometry(0.39, 0.4, 0.042, 18),
      crown = new CylinderGeometry(0.16, 0.205, 0.19, 14);
    this.geometry.push(brim, crown);
    this.ownedMaterials.push(felt);
    const cap = new Mesh(crown, felt);
    cap.position.y = 0.1;
    this.hat.add(new Mesh(brim, felt), cap);
    this.seller.add(this.hat);
    this.hat.position.set(0.48, 1.2, 0.08);
    this.update(0, 0);
  }
  update(metres: number, time: number) {
    for (const [i, b] of this.balloons.entries()) {
      const g = b.group;
      g.visible = Math.abs(metres - b.distance) < 1750;
      if (!g.visible) continue;
      const p = this.course.place(
        b.distance + 13 * Math.sin(time * 0.035 + i),
        b.lateral + 12 * Math.sin(time * 0.047 + i * 1.3),
        this.point,
      );
      g.position.set(p.x, p.y + b.height + 1.6 * Math.sin(time * 0.23 + i), p.z);
      g.rotation.z = 0.035 * Math.sin(time * 0.24 + i);
      if (i === 3) this.pose.basketHeight = g.position.y;
    }
    this.climber.visible = Math.abs(metres - 8480) < 400;
    if (this.climber.visible) {
      const step = 9 + 6 * Math.sin(time * 0.1);
      const p = this.course.place(8620, 191 + step * 0.5, this.point);
      this.climber.position.set(
        p.x,
        p.y + step * 0.348 + 0.06 * Math.abs(Math.sin(time * 3.1)),
        p.z,
      );
      this.climber.rotation.y = p.heading + 0.88;
      this.pose.stairStep = this.climber.position.y;
    }
    this.seller.visible = Math.abs(metres - 17450) < 250;
    if (this.seller.visible) {
      const p = this.course.place(17469, 7.2, this.point);
      this.seller.position.set(p.x, p.y, p.z);
      this.seller.rotation.y = p.heading;
      this.hat.position.y = 1.18 + 0.25 * Math.sin(time * 1.24);
      this.hat.rotation.z = 0.18 * Math.sin(time * 0.84);
      this.pose.hatLift = this.hat.position.y;
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
      camera.y += (r.y + 2.35 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.55 + (18.8 * (p.y + lift - r.y - 2.35)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.pose;
  }
  dispose() {
    this.root.clear();
    for (const resource of new Set([
      ...this.geometry,
      ...this.ownedMaterials,
      ...Object.values(this.materials),
      ...this.maps,
    ]))
      resource.dispose();
  }
}
