import {
  mix,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { RiderBody } from './rider-body';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 150, -22, 2.0],
  [2180, 2210, 7.8, 1.7],
  [4320, 4370, 31, 5.4],
  [6520, 6580, -37, 3.85],
  [9240, 9288, 30, 3.8],
  [12280, 12420, -12, 4.7],
] as const;
function dustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 9; i++) {
    const x = 46 + 15 * Math.cos(i * 3.1),
      y = 45 + 16 * Math.sin(i * 1.8),
      r = 17 + i;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(202,159,115,.5)');
    g.addColorStop(1, 'rgba(214,174,141,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  return new CanvasTexture(canvas);
}
export class MoabTrail {
  readonly root = new Group();
  readonly materials = {
    CanyonRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ColoradoRiver: new MeshBasicNodeMaterial({ side: DoubleSide }),
    DesertSoil: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Slickrock: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Entrada: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Wingate: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Juniper: new MeshBasicMaterial({ alphaTest: 0.45, side: DoubleSide }),
  };
  private readonly p = point();
  private readonly origin = point();
  private readonly phase = uniform(0);
  private readonly mountainPaint = new MeshBasicMaterial({
    fog: false,
    side: DoubleSide,
    alphaTest: 0.22,
  });
  private readonly plane = new PlaneGeometry(1, 1);
  private readonly ridge = new Mesh(this.plane, this.mountainPaint);
  private readonly rubber = new MeshLambertMaterial({ color: 0x37302a });
  private readonly tire = new TorusGeometry(0.326, 0.039, 6, 24);
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly kit: CourseCyclistKit;
  private readonly riders: RiderModel[];
  private readonly dustMap = dustTexture();
  private readonly dustPaint = new MeshBasicMaterial({
    map: this.dustMap,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    opacity: 0.61,
  });
  private readonly dust = new Mesh(this.plane, this.dustPaint);
  private readonly drawn = {
    riverPhase: null as number | null,
    trailStation: null as number | null,
    dustRise: null as number | null,
  };
  static async load(course: Course, body: RiderBody) {
    const loader = new TextureLoader(),
      results = await Promise.allSettled(
        ['wingate', 'slickrock', 'entrada', 'soil', 'juniper', 'lasal'].map((n) =>
          loader.loadAsync('courses/moab-' + n + '.webp'),
        ),
      );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const image of images) image.dispose();
      throw fail.reason;
    }
    return new MoabTrail(course, body, images);
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly images: Texture[],
  ) {
    const [wall, rock, arch, soil, leaves, skyline] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const t of images) t.colorSpace = SRGBColorSpace;
    for (const t of [wall, rock, arch, soil]) {
      t.wrapS = t.wrapT = MirroredRepeatWrapping;
      t.anisotropy = 4;
    }
    leaves.flipY = false;
    this.materials.Juniper.map = leaves;
    this.mountainPaint.map = skyline;
    const pos = positionWorld,
      col = vertexColor().rgb,
      vertical = vec2(pos.x.add(pos.z.mul(0.73)), pos.y);
    this.materials.Wingate.colorNode = texture(wall, vertical.mul(0.039)).rgb.mul(col).mul(1.16);
    this.materials.Entrada.colorNode = texture(arch, vertical.mul(0.134)).rgb.mul(col).mul(1.12);
    this.materials.Slickrock.colorNode = texture(
      rock,
      pos.xz.add(pos.y.mul(0.42)).mul(0.11),
    ).rgb.mul(col);
    this.materials.DesertSoil.colorNode = texture(soil, pos.xz.mul(0.17)).rgb.mul(
      col.mul(0.38).add(0.79),
    );
    this.materials.CanyonRoad.colorNode = col.mul(
      texture(soil, pos.xz.mul(1.42)).r.mul(0.32).add(0.92),
    );
    const waves = sin(
      pos.x
        .mul(0.63)
        .add(sin(pos.z.mul(0.92)))
        .sub(this.phase),
    )
      .mul(0.5)
      .add(0.5);
    this.materials.ColoradoRiver.colorNode = mix(
      col.mul(vec3(0.61, 0.81, 0.85)),
      vec3(0.22, 0.245, 0.19),
      smoothstep(0.92, 0.998, waves).mul(0.34),
    );
    this.root.add(this.ridge, this.dust);
    const summit = course.place(course.file.lengthMetres, -40, this.p);
    this.ridge.position.set(summit.x + 3400, summit.y + 535, summit.z - 230);
    this.ridge.rotation.y = -Math.PI / 2;
    this.ridge.scale.set(6100, 1052, 1);
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.riders = [0x2b8495, 0xb84a34].map((t, i) => {
      const rider = this.kit.make(new Color(t), 41 + i * 8, false, 0.6);
      for (const z of [-0.5, 0.5]) {
        const wheel = new Mesh(this.tire, this.rubber);
        wheel.position.set(0, 0.34, z);
        wheel.rotation.y = Math.PI / 2;
        rider.group.add(wheel);
      }
      this.root.add(rider.group);
      return rider;
    });
  }
  update(metres: number, time: number) {
    this.phase.value = time * 0.81;
    this.drawn.riverPhase = metres < 2180 ? this.phase.value : null;
    const active = Math.abs(metres - 2195) < 320;
    this.drawn.trailStation = null;
    this.drawn.dustRise = null;
    for (let i = 0; i < this.riders.length; i++) {
      const rider = this.riders[i]!;
      rider.group.visible = active;
      if (!active) continue;
      const station = 2200 + i * 9 + 6 * Math.sin(time * 0.13 + i * 0.4),
        p = this.course.place(station, 7.6 + i * 1.55 + 0.65 * Math.sin(time * 0.34), this.p);
      const crown = 0.66 * Math.sin((Math.PI * (station - 2080)) / 230) ** 2;
      rider.group.position.set(p.x, p.y + crown + 0.04, p.z);
      rider.group.rotation.set(-p.pitch, p.heading, Math.sin(time * 1.7 + i) * 0.035, 'YXZ');
      rider.pose(time * 5.9 + i, 0.22);
      if (!i) {
        this.drawn.trailStation = station;
        const rise = (time * 0.42) % 1;
        this.drawn.dustRise = rise;
        const trail = this.course.place(station - 1.2 - rise * 2.8, 7.7, this.p);
        this.dust.position.set(trail.x, trail.y + crown + 0.35 + rise * 0.6, trail.z);
        this.dust.rotation.y = trail.heading;
        this.dust.scale.set(1 + rise * 1.6, 0.61 + rise, 1);
        this.dustPaint.opacity = 0.69 * Math.sin(Math.PI * rise);
      }
    }
    this.dust.visible = active;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 94);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 94) * 1.65);
    const p = this.course.place(metres, 0, this.origin),
      t = this.course.place(stop[1], stop[2], this.p),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5.0 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5.0 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.17 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + ((t.y - p.y) * 14) / len - ahead.y) * blend;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    for (const rider of this.riders) for (const r of rider.owned) r.dispose();
    this.kit.dispose();
    for (const item of [
      this.tire,
      this.rubber,
      this.plain,
      this.dustMap,
      this.dustPaint,
      this.mountainPaint,
      this.plane,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
