import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, texture, vec3 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const LAP = 5600 / 3;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = (mask = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: mask ? 0.48 : 0 });
const views = [
  [80, 145, 0, 3.6],
  [210, 224, 6.8, 2.7],
  [340, 362, 9.8, 7.7],
  [2340 - LAP, 486, -7.5, 1.9],
  [4290 - 2 * LAP, 571, 6.5, 2.15],
  [6250 - 3 * LAP, 700, 0, 15.0],
] as const;

export class RioParade {
  readonly root = new Group();
  readonly materials = {
    SapucaiConcrete: new MeshBasicNodeMaterial({ side: DoubleSide }),
    RioArquibancadas: surface(),
    Alas: surface(true),
    EscolaPaint: surface(),
    SapucaiLamps: new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, fog: false }),
  };
  private readonly station = point();
  private readonly target = point();
  private readonly box = new BoxGeometry();
  private readonly orb = new SphereGeometry(1, 10, 6);
  private readonly drum = new CylinderGeometry(1, 1, 1, 14);
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly cutouts: PlaneGeometry[] = [];
  private readonly ala = new Group();
  private readonly dancers: Group[] = [];
  private readonly bateria = new Group();
  private readonly mallets: Group[] = [];
  private readonly couple = new Group();
  private readonly bearer = new Group();
  private readonly escort = new Group();
  private readonly banner = new PlaneGeometry(1.47, 0.95, 12, 3);
  private readonly confetti = new Group();
  private readonly paper = new PlaneGeometry(0.062, 0.092);
  private readonly paperPaint = new MeshBasicMaterial({ side: DoubleSide });
  private readonly flakes = new InstancedMesh(this.paper, this.paperPaint, 48);
  private readonly pose = new Object3D();
  private readonly readings = {
    sambadromeStation: 0,
    dancerStep: null as number | null,
    surdoMallet: null as number | null,
    bannerTurn: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['concrete', 'grandstands', 'alas', 'banner'].map((k) =>
        loader.loadAsync('courses/sambadrome-' + k + '.webp'),
      ),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new RioParade(course, textures);
  }
  private colour(value: number) {
    let c = this.colours.get(value);
    if (!c) {
      c = new MeshBasicMaterial({ color: value, side: DoubleSide });
      this.colours.set(value, c);
    }
    return c;
  }
  private place(group: Group, d: number, lane: number, up = 0) {
    const p = this.course.place(d, lane, this.station);
    group.position.set(p.x, p.y + up, p.z);
    group.rotation.y = p.heading;
  }
  private part(
    g: Group,
    value: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    shape = this.box as BoxGeometry | CylinderGeometry | SphereGeometry,
  ) {
    const m = new Mesh(shape, this.colour(value));
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  private portrait(g: Group, x: number, z: number, i: number, w: number, h: number) {
    const plane = new PlaneGeometry(w, h);
    plane.translate(0, h / 2, 0);
    this.cutouts.push(plane);
    const uv = plane.getAttribute('uv');
    for (let k = 0; k < uv.count; k++)
      uv.setXY(
        k,
        ((i % 3) + 0.007 + uv.getX(k) * 0.986) / 3,
        (Math.floor(i / 3) + 0.007 + (1 - uv.getY(k)) * 0.986) / 2,
      );
    const m = new Mesh(plane, this.materials.Alas);
    m.position.set(x, 0, z);
    g.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    [
      this.materials.SapucaiConcrete,
      this.materials.RioArquibancadas,
      this.materials.Alas,
      this.materials.EscolaPaint,
    ].forEach((m, i) => {
      const t = textures[i]!;
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
      m.map = t;
    });
    textures[0]!.wrapS = textures[0]!.wrapT = RepeatWrapping;
    textures[0]!.anisotropy = 4;
    const pool = positionWorld.x
      .mul(Math.PI / 25.5)
      .cos()
      .mul(0.5)
      .add(0.5)
      .pow(2.4);
    const side = positionWorld.z.abs().div(17).clamp(0, 1);
    const spill = pool.mul(side.mul(0.45).add(0.55));
    this.materials.SapucaiConcrete.colorNode = texture(textures[0]!).rgb.mul(
      vec3(0.72, 0.74, 0.86).add(vec3(0.38, 0.31, 0.25).mul(spill)),
    );
    this.place(this.ala, 224, 5.6, 0.12);
    for (let i = 0; i < 6; i++) {
      const g = new Group();
      g.position.set((i % 2) * 1.55, 0, -Math.floor(i / 2) * 2.08);
      this.portrait(g, 0, 0, i % 2 ? 5 : 0, 1.9, 2.13);
      this.dancers.push(g);
      this.ala.add(g);
    }
    this.root.add(this.ala);
    this.place(this.bateria, 486, -5.8, 0.15);
    for (let j = 0; j < 8; j++) {
      const g = new Group();
      g.position.set(-(j % 2) * 1.7, 0, -Math.floor(j / 2) * 1.9);
      this.bateria.add(g);
      this.portrait(g, 0, 0, 4, 2.08, 1.88);
      this.part(g, 0x7190ac, 0.05, 0.68, 0.2, 0.3, 0.63, 0.3, this.drum);
      this.part(g, 0xded4ae, 0.05, 1.01, 0.2, 0.31, 0.045, 0.31, this.drum);
      for (const x of [-0.24, 0.24]) this.part(g, 0xc8c6b2, x, 0.69, 0.31, 0.024, 0.6, 0.03);
      const wrist = new Group();
      wrist.position.set(0.26, 1.18, 0.22);
      g.add(wrist);
      const stick = this.part(wrist, 0xb79364, -0.11, 0.1, 0.12, 0.034, 0.034, 0.43);
      stick.rotation.y = -0.58;
      this.part(wrist, 0xddd4b6, -0.21, 0.1, 0.29, 0.053, 0.054, 0.059, this.orb);
      this.mallets.push(wrist);
    }
    this.root.add(this.bateria);
    this.place(this.couple, 571, 5.6, 0.13);
    this.portrait(this.bearer, 0, 0, 2, 1.94, 2.25);
    this.couple.add(this.bearer);
    this.portrait(this.escort, 0, 0, 3, 1.65, 2.15);
    this.couple.add(this.escort);
    this.part(this.bearer, 0xbe995b, -0.59, 1.68, 0, 0.042, 2.16, 0.042);
    const uv = this.banner.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    this.banner.translate(0.735, 0, 0);
    const cloth = new Mesh(this.banner, this.materials.EscolaPaint);
    cloth.position.set(-0.59, 2.23, 0.026);
    this.bearer.add(cloth);
    this.root.add(this.couple);
    for (let i = 0; i < this.flakes.count; i++)
      this.flakes.setColorAt(i, new Color([0xecce72, 0xb66987, 0x69b9c5, 0xdccdc7][i % 4]!));
    this.flakes.frustumCulled = false;
    this.confetti.add(this.flakes);
    this.root.add(this.confetti);
  }
  update(metres: number, time: number) {
    const d = ((metres % LAP) + LAP) % LAP,
      r = this.readings;
    r.sambadromeStation = metres;
    r.dancerStep = r.surdoMallet = r.bannerTurn = null;
    this.ala.visible = Math.abs(d - 224) < 105;
    if (this.ala.visible) {
      for (const [i, g] of this.dancers.entries()) {
        const beat = time * 3.8 + i * 0.88;
        g.position.y = 0.1 * Math.abs(Math.sin(beat));
        g.rotation.z = 0.095 * Math.sin(beat);
        g.rotation.y = 0.29 * Math.sin(beat * 0.5);
      }
      r.dancerStep = this.dancers[0]!.rotation.z;
    }
    this.bateria.visible = Math.abs(d - 486) < 100;
    if (this.bateria.visible) {
      for (const [i, m] of this.mallets.entries())
        m.rotation.x = 0.21 + 0.78 * Math.sin(time * 5.5 + i * 0.52);
      r.surdoMallet = this.mallets[0]!.rotation.x;
    }
    this.couple.visible = Math.abs(d - 571) < 104;
    if (this.couple.visible) {
      this.bearer.rotation.y = 0.57 * Math.sin(time * 1.05);
      this.escort.position.set(
        -1.78 + 0.35 * Math.cos(time * 1.05),
        0.07 * Math.abs(Math.sin(time * 2.1)),
        0.43 * Math.sin(time * 1.05),
      );
      this.escort.rotation.y = 0.38 * Math.sin(time * 1.05 + 0.91);
      const p = this.banner.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setZ(
          i,
          x * (0.13 * Math.sin(x * 3.5 - time * 2.8) + 0.041 * Math.sin(x * 6.9 - time * 3.7)),
        );
      }
      p.needsUpdate = true;
      r.bannerTurn = this.bearer.rotation.y;
    }
    this.confetti.visible = d < 703;
    if (this.confetti.visible) {
      this.place(this.confetti, metres + 10, 0, 0.2);
      for (let i = 0; i < this.flakes.count; i++) {
        const phase = time * (0.6 + 0.11 * (i % 3)) + i * 0.75;
        this.pose.position.set(
          Math.sin(i * 2.39) * 8.4 + 0.38 * Math.sin(phase),
          6.6 - (((phase % 6.6) + 6.6) % 6.6),
          -((i * 7) % 24),
        );
        this.pose.rotation.set(phase, phase * 0.64, phase * 0.49);
        this.pose.updateMatrix();
        this.flakes.setMatrixAt(i, this.pose.matrix);
      }
      this.flakes.instanceMatrix.needsUpdate = true;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = ((metres % LAP) + LAP) % LAP,
      v = views.find((row) => Math.abs(d - row[0]) < 29);
    if (!v) return;
    const f = Math.min(1, (1 - Math.abs(d - v[0]) / 29) * 1.55),
      r = this.course.place(metres, 0, this.station),
      t = this.course.place(v[1], v[2], this.target);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.28 - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.28 + (19 * (t.y + v[3] - r.y - 2.28)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.box,
      this.orb,
      this.drum,
      this.paper,
      this.paperPaint,
      this.flakes,
      this.banner,
      ...this.cutouts,
      ...this.colours.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
