import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
  type Vector3,
  type BufferGeometry,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const viewpoints = [
  [80, 138, 2, 4.8],
  [2530, 2600, -4, 4],
  [4310, 4344, 7, 5],
  [6980, 7011, 8.1, 3],
  [10450, 10599, -27, 18],
  [14050, 14086, 0, 4.2],
] as const;

export class MarktRaceFurniture {
  readonly root = new Group();
  private readonly gantry = new Group();
  private readonly bell = new Group();
  private readonly supporters = new Group();
  private readonly staff = new Group();
  private readonly bunting = new Group();
  private readonly pennants: Group[] = [];
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly geom = new Set<BufferGeometry>();
  private readonly unit = new BoxGeometry();
  private readonly marker = point();
  private readonly target = point();
  private readonly board: CanvasTexture;
  private readonly boardPaint: MeshBasicMaterial;
  private readonly fanStations = [165, 2562, 4249, 5582, 7028, 8220, 9440, 10489, 11494, 14114];
  private readonly pennantStations = [120, 2590, 4344, 5650, 7012, 8360, 9530, 10518, 11480, 14091];
  private readonly readings = {
    fanWave: null as number | null,
    pennantRise: null as number | null,
    bellSwing: null as number | null,
  };
  constructor(
    private readonly course: Course,
    crowdPaint: MeshBasicMaterial,
  ) {
    this.geom.add(this.unit);
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 144;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#183737';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#dbba6e';
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 6, 754, 130);
    ctx.fillStyle = '#fff1c6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 73px Georgia';
    ctx.fillText('MARKT  ·  FINISH', 384, 76);
    this.board = new CanvasTexture(c);
    this.board.colorSpace = SRGBColorSpace;
    this.boardPaint = new MeshBasicMaterial({ map: this.board, side: DoubleSide });
    const panel = new PlaneGeometry(9.7, 1.8);
    this.geom.add(panel);
    const face = new Mesh(panel, this.boardPaint);
    face.position.set(0, 5.54, 0.38);
    this.gantry.add(face);
    for (const s of [-1, 1]) {
      for (const z of [-0.39, 0.39])
        this.box(this.gantry, 0x586b6a, 5.36 * s, 2.83, z, 0.13, 5.7, 0.13);
      this.box(this.gantry, 0x665849, 5.36 * s, 0.26, 0, 0.94, 0.52, 1.23);
      for (let i = 0; i < 6; i++)
        this.box(
          this.gantry,
          0x929486,
          5.36 * s,
          0.6 + i * 0.86,
          0,
          0.095,
          1.14,
          0.095,
        ).rotation.x = (i % 2 ? 1 : -1) * 0.69;
    }
    for (const z of [-0.39, 0.39])
      for (const y of [4.84, 6.21]) this.box(this.gantry, 0x697879, 0, y, z, 10.86, 0.13, 0.13);
    this.box(this.gantry, 0xc3ae76, 4.15, 4.87, 0.5, 0.16, 0.12, 0.92);
    this.bell.position.set(4.15, 4.85, 0.95);
    this.gantry.add(this.bell);
    const g = new LatheGeometry(
      [
        [0.08, -0.03],
        [0.24, -0.11],
        [0.26, -0.28],
        [0.3, -0.48],
        [0.44, -0.65],
        [0.47, -0.72],
        [0.38, -0.73],
      ].map(([x, y]) => new Vector2(x!, y!)),
      16,
    );
    this.geom.add(g);
    this.bell.add(new Mesh(g, this.colour(0xc3984d)));
    this.box(this.bell, 0x574d40, 0, -0.6, 0, 0.12, 0.48, 0.12);
    this.box(this.gantry, 0x253c3a, -4.62, 2.8, 0, 1.38, 1.09, 0.12);
    this.box(this.gantry, 0xffe8a5, -4.6, 2.82, 0.08, 0.12, 0.7, 0.05);
    this.locate(this.gantry, 14086, 0);
    this.supporters.add(this.staff);
    const bodies = new PlaneGeometry(3.8, 2.27),
      uv = bodies.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    this.geom.add(bodies);
    const fans = new Mesh(bodies, crowdPaint);
    fans.position.set(1.28, 1.26, -0.1);
    this.supporters.add(fans);
    this.box(this.staff, 0x76634b, 0, 0.92, 0, 0.048, 1.85, 0.048);
    for (const [i, col] of [0x292a27, 0xf2bb35, 0xbf4942].entries())
      this.box(this.staff, col, 0.14 + i * 0.27, 1.56, 0, 0.28, 0.52, 0.028);
    this.staff.position.y = 1.12;
    this.box(this.bunting, 0x736551, 0, 0, 0, 11.9, 0.037, 0.037);
    for (let i = 0; i < 14; i++) {
      const flag = new Group();
      flag.position.set(-5.55 + i * 0.85, -0.075, 0);
      const triangle = new PlaneGeometry(0.58, 0.7);
      const xy = triangle.attributes['position']!;
      xy.setX(2, 0);
      xy.setX(3, 0.01);
      this.geom.add(triangle);
      const pennon = new Mesh(triangle, this.colour([0xa9453a, 0xe4be58, 0x658084][i % 3]!));
      pennon.position.y = -0.35;
      flag.add(pennon);
      this.bunting.add(flag);
      this.pennants.push(flag);
    }
    this.root.add(this.gantry, this.supporters, this.bunting);
  }
  private colour(hex: number) {
    let m = this.paints.get(hex);
    if (!m) {
      m = new MeshBasicMaterial({ color: new Color(hex), side: DoubleSide });
      this.paints.set(hex, m);
    }
    return m;
  }
  private box(
    parent: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new Mesh(this.unit, this.colour(c));
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  private locate(group: Group, metres: number, lane: number) {
    const p = this.course.place(metres, lane, this.marker);
    group.position.set(p.x, p.y, p.z);
    group.rotation.y = p.heading;
  }
  update(metres: number, time: number) {
    const fan = this.fanStations.find((d) => Math.abs(d - metres) < 150);
    this.supporters.visible = fan !== undefined;
    this.readings.fanWave = null;
    if (fan !== undefined) {
      this.locate(this.supporters, fan, -5.95);
      this.staff.rotation.z = 0.28 + 0.31 * Math.sin(time * 3.2);
      this.readings.fanWave = this.staff.rotation.z;
    }
    const street = this.pennantStations.find((d) => Math.abs(d - metres) < 170);
    this.bunting.visible = street !== undefined;
    this.readings.pennantRise = null;
    if (street !== undefined) {
      this.locate(this.bunting, street, 0);
      this.bunting.position.y += 6.44;
      for (const [i, flag] of this.pennants.entries())
        flag.rotation.x = 0.29 * Math.sin(time * 2.3 + i * 0.77);
      this.readings.pennantRise = this.pennants[3]!.rotation.x;
    }
    this.gantry.visible = Math.abs(metres - 14086) < 320;
    this.readings.bellSwing = null;
    if (this.gantry.visible) {
      this.bell.rotation.z = 0.36 * Math.sin(time * 3.7);
      this.readings.bellSwing = this.bell.rotation.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = viewpoints.find((v) => Math.abs(metres - v[0]) < 72);
    if (!s) return;
    const blend = Math.min(1, (1 - Math.abs(metres - s[0]) / 72) * 1.6);
    const p = this.course.place(metres, 0, this.marker),
      t = this.course.place(s[1], s[2], this.target),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.2 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + 2.2 + (19 * (t.y + s[3] - p.y - 2.2)) / (len + 5) - ahead.y) * blend;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [...this.geom, ...this.paints.values(), this.boardPaint, this.board])
      item.dispose();
  }
}
