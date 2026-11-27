import { mix, positionWorld, smoothstep, texture, vec2, vertexColor } from 'three/tsl';
import {
  CanvasTexture,
  DoubleSide,
  Group,
  InstancedMesh,
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
import type { Course, CoursePlace } from './course';
import { SummitEquipment } from './summit-equipment';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 148, 7, 2],
  [4420, 4460, -8, 2],
  [8980, 9014, 16, 2.25],
  [14740, 14800, 2, 2],
  [21960, 22017, 37, 4.1],
  [25240, 25315, 39, 5],
] as const;

function cloudBrush() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(1, 0.59);
  for (let i = 0; i < 17; i++) {
    const x = 26 + i * 12.5,
      y = 87 + 12 * Math.sin(i * 2.3),
      radius = 22 + 13 * Math.sin(i * 0.72) ** 2;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, 'rgba(243,239,228,.82)');
    glow.addColorStop(0.55, 'rgba(231,230,226,.65)');
    glow.addColorStop(1, 'rgba(209,214,221,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return new CanvasTexture(canvas);
}

export class MaunaKeaSummit {
  readonly root = new Group();
  private readonly equipment = new SummitEquipment();
  private readonly brush = cloudBrush();
  private readonly cloudPaint = new MeshBasicMaterial({
    map: this.brush,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  private readonly billboards = new PlaneGeometry(1, 1);
  private readonly clouds = new InstancedMesh(this.billboards, this.cloudPaint, 40);
  private readonly brushPose = new Object3D();
  readonly materials = {
    VisitorMasonry: new MeshBasicMaterial({ side: DoubleSide }),
    VisitorGable: new MeshBasicMaterial({ side: DoubleSide }),
    DomePanels: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ObservatoryBase: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Peaks: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    SummitRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    CinderSlope: new MeshBasicNodeMaterial({ side: DoubleSide }),
    MamaneTrees: new MeshBasicMaterial({ alphaTest: 0.47, side: DoubleSide }),
    MaunaSigns: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly p = point();
  private readonly origin = point();
  private readonly drawn = {
    cloudDrift: null as number | null,
    serviceStation: null as number | null,
    enclosureAngle: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'basalt',
        'scoria',
        'gravel',
        'grass',
        'mamane',
        'signs',
        'station',
        'gable',
        'aluminium',
        'cladding',
      ].map((n) => loader.loadAsync('courses/maunakea-' + n + '.webp')),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const image of images) image.dispose();
      throw failure.reason;
    }
    return new MaunaKeaSummit(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [basalt, scoria, gravel, grass, plants, signs, station, gable, aluminium, cladding] =
      images as [
        Texture,
        Texture,
        Texture,
        Texture,
        Texture,
        Texture,
        Texture,
        Texture,
        Texture,
        Texture,
      ];
    for (const image of images) image.colorSpace = SRGBColorSpace;
    for (const image of [basalt, scoria, gravel, grass, aluminium, cladding]) {
      image.wrapS = image.wrapT = MirroredRepeatWrapping;
      image.anisotropy = 4;
    }
    signs.flipY = plants.flipY = station.flipY = gable.flipY = false;
    this.materials.VisitorMasonry.map = station;
    this.materials.VisitorGable.map = gable;
    const metalUv = vec2(positionWorld.x.add(positionWorld.z.mul(0.73)), positionWorld.y).mul(
      0.125,
    );
    this.materials.DomePanels.colorNode = texture(aluminium, metalUv).rgb.mul(
      vertexColor().rgb.mul(0.8).add(0.35),
    );
    this.materials.ObservatoryBase.colorNode = texture(cladding, metalUv.mul(0.72)).rgb.mul(
      vertexColor().rgb.mul(0.65).add(0.55),
    );
    this.equipment.clad(aluminium);

    this.materials.MamaneTrees.map = plants;
    this.materials.MaunaSigns.map = signs;
    const uv = positionWorld.xz.mul(0.18),
      color = vertexColor().rgb;
    const low = mix(texture(basalt, uv).rgb, texture(grass, uv.mul(0.38)).rgb, 0.23);
    const rocky = texture(scoria, positionWorld.xz.mul(0.027).add(positionWorld.y.mul(0.011))).rgb;
    this.materials.Peaks.colorNode = color.mul(rocky.mul(0.81).add(0.57));
    this.materials.CinderSlope.colorNode = mix(
      low,
      texture(scoria, uv.mul(0.72)).rgb,
      smoothstep(2770, 2840, positionWorld.y),
    ).mul(color.mul(0.58).add(0.71));
    this.materials.SummitRoad.colorNode = color.mul(
      texture(gravel, uv.mul(3)).rgb.mul(0.82).add(0.67),
    );
    this.root.add(this.clouds, this.equipment.truck, this.equipment.dome);
    const summit = course.place(25315, 39, this.p);
    this.equipment.dome.position.set(summit.x, summit.y + 6.62, summit.z);
    this.clouds.frustumCulled = false;
  }
  update(metres: number, time: number) {
    const center = this.course.place(metres, 0, this.origin);
    this.clouds.visible = metres > 1800;
    this.drawn.cloudDrift = null;
    if (this.clouds.visible) {
      const drift = Math.sin(time * 0.034) * 24;
      this.drawn.cloudDrift = drift;
      for (let i = 0; i < this.clouds.count; i++) {
        const a = i * 2.39996,
          r = 380 + (i % 5) * 117;
        const pose = this.brushPose;
        pose.position.set(
          center.x + r * Math.cos(a) + drift,
          center.y -
            24 -
            Math.min(60, Math.max(0, (center.y - 2800) * 0.045)) +
            9 * Math.sin(i * 3.3),
          center.z + r * Math.sin(a),
        );
        pose.rotation.y = Math.PI / 2 - a;
        pose.scale.set(220 + (i % 4) * 81, 54 + (i % 5) * 10, 1);
        pose.updateMatrix();
        this.clouds.setMatrixAt(i, pose.matrix);
      }
      this.clouds.instanceMatrix.needsUpdate = true;
    }
    const truck = this.equipment.truck;
    truck.visible = Math.abs(metres - 14740) < 500;
    this.drawn.serviceStation = null;
    if (truck.visible) {
      const station = 14774 + ((time * 3.6) % 85);
      const p = this.course.place(station, 1.88, this.p);
      truck.position.set(p.x, p.y + 0.12, p.z);
      truck.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      this.drawn.serviceStation = station;
    }
    const dome = this.equipment.dome;
    dome.visible = Math.abs(metres - 25315) < 1700;
    this.drawn.enclosureAngle = null;
    if (dome.visible) {
      dome.rotation.y = 1.4 + 0.6 * Math.sin(time * 0.09);
      this.drawn.enclosureAngle = dome.rotation.y;
    }
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
    this.equipment.dispose();
    this.clouds.dispose();
    for (const item of [
      this.brush,
      this.billboards,
      this.cloudPaint,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
