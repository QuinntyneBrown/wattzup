import {
  cos,
  mix,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  CanvasTexture,
  AdditiveBlending,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  MirroredRepeatWrapping,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { OceanDriveConvertible } from './ocean-drive-convertible';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 110, 12.2, 3.4],
  [1440, 1478, 11.5, 3],
  [2880, 2909, 3.1, 1.7],
  [4360, 4402, -28, 2.7],
  [6040, 6077, 12.2, 3.8],
  [8060, 8330, -160, 3.8],
] as const;
function steamImage() {
  const el = document.createElement('canvas');
  el.width = el.height = 128;
  const c = el.getContext('2d')!;
  for (let i = 0; i < 13; i++) {
    const x = 50 + 22 * Math.sin(i * 2.3),
      y = 15 + i * 7,
      r = 12 + i * 0.93,
      g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(214,190,224,.38)');
    g.addColorStop(1, 'rgba(171,146,194,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return new CanvasTexture(el);
}
export class OceanDrive {
  readonly root = new Group();
  private readonly p = point();
  private readonly origin = point();
  private readonly phase = uniform(0);
  readonly materials = {
    DecoBlades: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    DecoFronts: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    LummusPalms: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45, fog: false }),
    OceanDrive: new MeshBasicNodeMaterial({ side: DoubleSide }),
    AtlanticSurf: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    NeonTubes: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    BeachGlow: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    WetNeon: new MeshBasicNodeMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      opacity: 0.74,
      blending: AdditiveBlending,
    }),
  };
  private readonly car = new OceanDriveConvertible();
  private readonly mist = steamImage();
  private readonly steamPaint = new MeshBasicMaterial({
    map: this.mist,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    opacity: 0.55,
  });
  private readonly skylinePaint = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.25,
    fog: false,
  });
  private readonly plane = new PlaneGeometry(1, 1);
  private readonly skyline = new Mesh(this.plane, this.skylinePaint);
  private readonly steam = new Mesh(this.plane, this.steamPaint);
  private readonly drawn = {
    cruiserStation: null as number | null,
    surfPhase: null as number | null,
    steamRise: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      results = await Promise.allSettled(
        ['deco', 'nightlife', 'brickell', 'asphalt', 'blades'].map((n) =>
          loader.loadAsync('courses/miami-' + n + '.webp'),
        ),
      );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const image of images) image.dispose();
      throw fail.reason;
    }
    return new OceanDrive(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [deco, people, brickell, asphalt, blades] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const i of images) i.colorSpace = SRGBColorSpace;
    deco.flipY = people.flipY = blades.flipY = false;
    this.materials.DecoBlades.map = blades;
    asphalt.wrapS = asphalt.wrapT = MirroredRepeatWrapping;
    asphalt.anisotropy = 4;
    this.materials.DecoFronts.map = deco;
    this.materials.LummusPalms.map = people;
    this.skylinePaint.map = brickell;
    const pos = positionWorld,
      base = vertexColor().rgb,
      grit = sin(pos.x.mul(137).add(pos.z.mul(91)))
        .mul(0.1)
        .add(0.86);
    const streak = sin(pos.x.mul(0.073).add(pos.z.mul(0.24)))
      .mul(0.5)
      .add(0.5)
      .pow(6);
    this.materials.OceanDrive.colorNode = base
      .mul(grit.mul(0.75).add(texture(asphalt, pos.xz.mul(0.47)).r.mul(4)))
      .mul(0.71)
      .add(
        mix(
          vec3(0.009, 0.045, 0.08),
          vec3(0.09, 0.008, 0.064),
          sin(pos.x.mul(0.102)).mul(0.5).add(0.5),
        ).mul(streak),
      );
    this.materials.NeonTubes.colorNode = base.mul(2.0);
    this.materials.BeachGlow.colorNode = base.mul(2.1);
    const broken = sin(pos.z.mul(7).add(sin(pos.x.mul(4.3))))
      .mul(0.31)
      .add(0.61);
    const reflection = uv();
    const feather = sin(reflection.x.mul(Math.PI))
      .max(0)
      .mul(sin(reflection.y.mul(Math.PI)).max(0));
    const ripples = texture(asphalt, pos.xz.mul(0.77)).r.mul(3.2).add(0.32);
    this.materials.WetNeon.opacityNode = feather.mul(broken).mul(ripples).clamp(0, 0.88);
    this.materials.WetNeon.colorNode = base.mul(2.25);
    const wave = sin(pos.z.mul(0.49).add(pos.x.mul(0.045)).sub(this.phase)).add(
      cos(pos.z.mul(0.18).add(pos.x.mul(0.13))).mul(0.42),
    );
    const glint = smoothstep(0.85, 1.39, wave);
    this.materials.AtlanticSurf.colorNode = base
      .mul(0.87)
      .add(vec3(0.19, 0.23, 0.31).mul(glint).mul(base.r.mul(9).add(0.15)));
    this.root.add(this.car.root, this.steam, this.skyline);
    const p = course.place(8330, -160, this.p);
    this.skyline.position.set(p.x, p.y + 26, p.z);
    this.skyline.rotation.y = p.heading + 0.38;
    this.skyline.scale.set(268, 54, 1);
  }
  update(metres: number, time: number) {
    this.phase.value = time * 0.91;
    this.drawn.surfPhase = this.phase.value;
    const car = this.car.root,
      zone = Math.round((metres - 2880) / 500),
      anchor = 2880 + zone * 500,
      station = anchor + 43 + 24 * Math.sin(time * 0.115);
    car.visible = Math.abs(metres - station) < 180;
    this.drawn.cruiserStation = null;
    if (car.visible) {
      const p = this.course.place(station, 3.35, this.p);
      car.position.set(p.x, p.y + 0.02, p.z);
      car.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      this.drawn.cruiserStation = station;
    }
    this.steam.visible = Math.abs(metres - 6040) < 300;
    this.drawn.steamRise = null;
    if (this.steam.visible) {
      const p = this.course.place(6059, 5.1, this.p),
        rise = (time * 0.3) % 1;
      this.steam.position.set(p.x + 0.43 * Math.sin(time * 0.6), p.y + 1.15 + rise * 1.6, p.z);
      this.steam.rotation.y = p.heading;
      this.steam.scale.set(1.55 + rise * 1.2, 2.1 + rise * 1.3, 1);
      this.steamPaint.opacity = 0.65 * Math.sin(Math.PI * rise);
      this.drawn.steamRise = rise;
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
    this.car.dispose();
    for (const item of [
      this.plane,
      this.mist,
      this.steamPaint,
      this.skylinePaint,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
