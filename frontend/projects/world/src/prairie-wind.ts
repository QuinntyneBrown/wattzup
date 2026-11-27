import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, texture, uniform, uv, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 158, -8, 6],
  [2480, 2680, -57, 41],
  [5210, 5262, -26, 2.5],
  [8740, 8777, -30, 4.8],
  [12610, 12648, -25, 13.5],
  [17960, 18177, 8.0, 14.0],
] as const;
export class PrairieWind {
  readonly root = new Group();
  readonly materials = {
    PrairieWheat: new MeshBasicNodeMaterial({ side: DoubleSide }),
    CanolaFields: new MeshBasicNodeMaterial({ side: DoubleSide }),
    RouteNineAsphalt: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ElevatorSiding: new MeshBasicMaterial({ side: DoubleSide }),
    PrairieSigns: new MeshBasicMaterial({ side: DoubleSide }),
    WheatHeads: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
  };
  private readonly cropClock = uniform(0);
  private readonly bladePaint = new MeshBasicMaterial({ side: DoubleSide, vertexColors: true });
  private readonly blades: InstancedMesh;
  private readonly blade = new BufferGeometry();
  private readonly rotors: { x: number; y: number; z: number; phase: number }[] = [];
  private readonly transform = new Object3D();
  private readonly verge = new Group();
  private readonly stems: InstancedMesh;
  private readonly stem = new PlaneGeometry(1, 1);
  private readonly clouds: { mesh: Mesh; x: number; z: number }[] = [];
  private readonly cloudGeometry: PlaneGeometry[] = [];
  private readonly cloudPaint = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    rotorAngle: null as number | null,
    wheatLean: null as number | null,
    cloudDrift: null as number | null,
    prairieStation: 0,
  };
  static async load(course: Course) {
    const rs = await Promise.allSettled(
      ['wheat', 'canola', 'siding', 'sign', 'verge', 'clouds'].map((n) =>
        new TextureLoader().loadAsync('courses/prairie-' + n + '.webp'),
      ),
    );
    const textures = rs.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = rs.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of textures) t.dispose();
      throw failed.reason;
    }
    return new PrairieWind(course, textures);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
    }
    const [wheat, canola, siding, sign, verge, clouds] = textures;
    wheat!.wrapS = wheat!.wrapT = canola!.wrapS = canola!.wrapT = MirroredRepeatWrapping;
    this.materials.ElevatorSiding.map = siding!;
    this.materials.PrairieSigns.map = sign!;
    this.materials.WheatHeads.map = verge!;
    this.cloudPaint.map = clouds!;
    const ripple = sin(
      positionWorld.x.mul(0.23).add(positionWorld.z.mul(0.43)).add(this.cropClock.mul(2.41)),
    )
      .mul(0.046)
      .add(0.95);
    this.materials.PrairieWheat.colorNode = texture(wheat!, uv()).rgb.mul(ripple);
    this.materials.CanolaFields.colorNode = texture(canola!, uv()).rgb.mul(ripple);
    this.materials.RouteNineAsphalt.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(72).add(positionWorld.z.mul(101)))
        .mul(0.031)
        .add(0.97),
    );
    // One merged rotor has three tapered airfoils. Each rotates about its own tower hub.
    const vertices: number[] = [],
      colors: number[] = [];
    for (let arm = 0; arm < 3; arm++) {
      const a = (arm * Math.PI * 2) / 3,
        cs = Math.cos(a),
        sn = Math.sin(a);
      const sections = [
        [0.33, -0.27, 0.45],
        [5.8, -0.94, 1.55],
        [12, -0.81, 1.3],
        [20, -0.63, 0.91],
        [30.6, -0.19, 0.15],
      ];
      for (let j = 0; j < sections.length - 1; j++) {
        const [r0, a0, b0] = sections[j]!,
          [r1, a1, b1] = sections[j + 1]!;
        for (const [r, w, c] of [
          [r0, a0, 0.74],
          [r0, b0, 0.97],
          [r1, b1, 0.97],
          [r0, a0, 0.74],
          [r1, b1, 0.97],
          [r1, a1, 0.78],
        ]) {
          vertices.push(-1.2 - r * 0.014, r * cs - w * sn, r * sn + w * cs);
          colors.push(c, c * 0.985, c * 0.91);
        }
      }
    }
    this.blade.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.blade.setAttribute('color', new Float32BufferAttribute(colors, 3));
    for (let row = 0; row < 2; row++)
      for (let j = 0; j < 58; j++) {
        const d = 152 + j * 320 + row * 97,
          v = (j % 3 ? 1 : -1) * (91 + row * 230 + 24 * Math.sin(j * 0.91)),
          p = this.course.place(d, -v, this.p);
        const smooth = (a: number, b: number, x: number) => {
          const w = Math.max(0, Math.min(1, (x - a) / (b - a)));
          return w * w * (3 - 2 * w);
        };
        const land =
          (2.4 * Math.sin(d / 346 + v / 177) + 6.1 * Math.sin(v / 242)) *
            smooth(8, 181, Math.abs(v)) +
          8 * smooth(115, 245, Math.abs(v)) -
          0.17;
        this.rotors.push({
          x: p.x - 2,
          y: p.y + land + 62.05 + (j % 4) * 3,
          z: p.z,
          phase: j * 0.71 + row * 1.43,
        });
      }
    this.blades = new InstancedMesh(this.blade, this.bladePaint, this.rotors.length);
    this.blades.frustumCulled = false;
    this.stems = new InstancedMesh(this.stem, this.materials.WheatHeads, 72);
    this.stems.frustumCulled = false;
    // Runtime cards use standard plane UVs; the course atlas is decoded in glTF orientation.
    const stemUV = this.stem.getAttribute('uv');
    for (let i = 0; i < stemUV.count; i++) stemUV.setY(i, 1 - stemUV.getY(i));
    this.verge.add(this.stems);
    for (let j = 0; j < 24; j++) {
      const id = j % 3,
        geo = new PlaneGeometry(1, 1),
        attr = geo.getAttribute('uv');
      for (let i = 0; i < attr.count; i++) attr.setXY(i, (id + attr.getX(i)) / 3, 1 - attr.getY(i));
      this.cloudGeometry.push(geo);
      const mesh = new Mesh(geo, this.cloudPaint);
      const x = 1100 + j * 820,
        z = (j % 2 ? 1 : -1) * (280 + (j % 4) * 170);
      mesh.position.set(x, 147 + (j % 5) * 18, z);
      mesh.rotation.y = -Math.PI * 0.5 + ((j % 3) - 1) * 0.15;
      mesh.scale.set(520 + (j % 4) * 78, 172 + (j % 3) * 21, 1);
      mesh.renderOrder = -1;
      this.clouds.push({ mesh, x, z });
      this.root.add(mesh);
    }
    this.root.add(this.blades, this.verge);
  }
  update(metres: number, time: number) {
    this.cropClock.value = time;
    this.readings.prairieStation = metres;
    this.readings.rotorAngle = null;
    let index = 0,
      nearest = Infinity;
    for (const rotor of this.rotors) {
      const gap = Math.abs(rotor.x - metres);
      if (gap > 3700) continue;
      const angle = rotor.phase + time * 0.54;
      this.transform.position.set(rotor.x, rotor.y, rotor.z);
      this.transform.rotation.set(angle, 0, 0);
      this.transform.scale.set(1, 1, 1);
      this.transform.updateMatrix();
      this.blades.setMatrixAt(index++, this.transform.matrix);
      if (gap < nearest) {
        nearest = gap;
        this.readings.rotorAngle = this.transform.rotation.x;
      }
    }
    this.blades.count = index;
    this.blades.instanceMatrix.needsUpdate = true;
    const start = Math.floor(metres / 3.2) - 9;
    for (let i = 0; i < 72; i++) {
      const n = start + Math.floor(i / 2),
        side = i % 2 ? 1 : -1,
        d = n * 3.2,
        p = this.course.place(d, side * (5.35 + 0.5 * Math.sin(n * 0.85)), this.p);
      const lean = 0.17 * Math.sin(time * 2.4 + n * 0.63);
      this.transform.position.set(p.x, p.y + 0.37, p.z);
      this.transform.rotation.set(lean, -1.07 + Math.sin(n * 0.42) * 0.3, 0.14 + lean);
      this.transform.scale.set(1.81, 0.89, 1);
      this.transform.updateMatrix();
      this.stems.setMatrixAt(i, this.transform.matrix);
      if (i === 16) this.readings.wheatLean = this.transform.rotation.z;
    }
    this.stems.instanceMatrix.needsUpdate = true;
    let closest = Infinity;
    for (const [i, c] of this.clouds.entries()) {
      const distance = Math.abs(c.x - metres);
      c.mesh.visible = distance < 4800;
      if (!c.mesh.visible) continue;
      c.mesh.position.z = c.z + 81 * Math.sin(time * 0.008 + i);
      if (distance < closest) {
        closest = distance;
        this.readings.cloudDrift = c.mesh.position.z;
      }
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((v) => Math.abs(metres - v[0]) < 82);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 82) * 1.57),
      r = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.1 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5.1 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.31 - camera.y) * f;
    ahead.x += (r.x + (13.8 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13.8 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.31 + (18.9 * (t.y + s[3] - r.y - 2.31)) / (len + 5.1) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    this.blades.dispose();
    this.stems.dispose();
    for (const x of [
      this.stem,
      this.blade,
      this.bladePaint,
      this.cloudPaint,
      ...this.cloudGeometry,
      ...this.textures,
      ...Object.values(this.materials),
    ])
      x.dispose();
  }
}
