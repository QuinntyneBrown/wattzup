import { mix, positionWorld, texture, uniform, vec2, vertexColor } from 'three/tsl';
import {
  CanvasTexture,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { makeShuttle } from './urubamba-shuttle';

function valleyMist() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const brush = canvas.getContext('2d')!;
  brush.scale(1, 0.55);
  for (let i = 0; i < 22; i++) {
    const x = 32 + i * 9,
      y = 86 + 18 * Math.sin(i * 1.7),
      r = 22 + 13 * Math.sin(i * 0.72) ** 2;
    const g = brush.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(221,229,226,.34)');
    g.addColorStop(1, 'rgba(221,229,226,0)');
    brush.fillStyle = g;
    brush.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  return new CanvasTexture(canvas);
}
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 115, 0, 1.5],
  [1740, 1804, -49, -1.1],
  [3880, 3910, 0, 1.8],
  [6220, 6250, 0, 2.25],
  [8400, 8440, -28, 0.7],
  [10370, 10428, -30, 2.75],
] as const;

export class UrubambaGorge {
  readonly root = new Group();
  private readonly asphalt = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly masonry = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly earth = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly water = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly leaves = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 });
  private readonly mountain = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.45,
    fog: false,
  });
  private readonly ridges = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  readonly materials = {
    Peaks: this.ridges,
    HuaynaPicchu: this.mountain,
    HiramRoad: this.asphalt,
    IncaAshlar: this.masonry,
    VilcanotaForest: this.earth,
    Sea: this.water,
    YungasPlants: this.leaves,
  };
  private readonly phase = uniform(0);
  private readonly busPaint = new MeshLambertMaterial({ vertexColors: true });
  private readonly shuttles = [makeShuttle(false, this.busPaint), makeShuttle(true, this.busPaint)];
  private readonly vapor = valleyMist();
  private readonly mist = new SpriteMaterial({
    map: this.vapor,
    transparent: true,
    depthWrite: false,
    opacity: 0.44,
  });
  private readonly clouds = Array.from({ length: 5 }, () => new Sprite(this.mist));
  private readonly origin = place();
  private readonly target = place();
  private readonly drawn = {
    shuttleStation: null as null | number,
    riverPhase: null as null | number,
    cloudPosition: null as null | number,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const loaded = await Promise.allSettled(
      ['road', 'ashlar', 'forest', 'granite', 'plants', 'huayna'].map((n) =>
        loader.loadAsync('courses/machupicchu-' + n + '.webp'),
      ),
    );
    const images: Texture[] = [];
    for (const result of loaded) if (result.status === 'fulfilled') images.push(result.value);
    const error = loaded.find((r) => r.status === 'rejected');
    if (error) {
      for (const image of images) image.dispose();
      throw error.reason;
    }
    return new UrubambaGorge(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [road, ashlar, forest, granite, plants] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const image of images) image.colorSpace = SRGBColorSpace;
    for (const t of [road, ashlar, forest, granite]) {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 4;
    }
    this.mountain.map = images[5]!;
    this.mountain.map.flipY = false;
    plants.flipY = false;
    this.leaves.map = plants;
    this.asphalt.colorNode = mix(
      texture(road, positionWorld.xz.mul(0.37)).rgb,
      vertexColor().rgb,
      0.22,
    );
    const uv = vec2(positionWorld.x.add(positionWorld.z.mul(0.64)), positionWorld.y);
    this.masonry.colorNode = mix(texture(ashlar, uv.mul(0.35)).rgb, vertexColor().rgb, 0.26);
    this.ridges.colorNode = mix(texture(granite, uv.mul(0.016)).rgb, vertexColor().rgb, 0.44).mul(
      0.8,
    );
    this.earth.colorNode = mix(
      texture(forest, positionWorld.xz.mul(0.24)).rgb,
      texture(granite, uv.mul(0.093)).rgb,
      vertexColor().r.smoothstep(0.08, 0.27),
    )
      .mul(0.77)
      .add(vertexColor().rgb.mul(0.2));
    const flow = positionWorld.x.mul(0.64).add(positionWorld.z.mul(0.19)).add(this.phase).sin();
    const rapids = flow
      .mul(positionWorld.z.mul(0.93).add(this.phase.mul(0.46)).sin())
      .smoothstep(0.57, 0.94);
    this.water.colorNode = mix(vertexColor().rgb, vec2(0.71, 0.75).xyx, rapids.mul(0.31));
    this.root.add(...this.shuttles, ...this.clouds);
  }
  update(metres: number, time: number) {
    this.phase.value = time * 1.65;
    this.drawn.riverPhase = metres < 2550 ? this.phase.value : null;
    this.drawn.shuttleStation = null;
    for (let i = 0; i < this.shuttles.length; i++) {
      const bus = this.shuttles[i]!,
        offset = (i === 0 ? -4.15 : 3.85) * time + 67 + i * 178;
      const station = Math.ceil((metres - 32 - offset) / 336) * 336 + offset;
      bus.visible = station >= 140 && station < 5800 && Math.abs(metres - station) < 168;
      if (!bus.visible) continue;
      const p = this.course.place(station, i === 0 ? -1.47 : 1.47, this.target);
      bus.position.set(p.x, p.y + 0.03, p.z);
      bus.rotation.set(i === 0 ? -p.pitch : p.pitch, p.heading + (i === 0 ? Math.PI : 0), 0, 'YXZ');
      this.drawn.shuttleStation = station;
    }
    this.drawn.cloudPosition = null;
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i]!,
        station = (Math.floor(metres / 370) + i - 1) * 370;
      const p = this.course.place(station, -150 - (i % 3) * 53, this.target);
      cloud.visible = station >= 0 && station <= this.course.file.lengthMetres;
      cloud.scale.set(150 + (i % 3) * 23, 33 + (i % 2) * 12, 1);
      cloud.position.set(
        p.x + 27 * Math.sin(time * 0.029 + station * 0.023),
        p.y + 24 + (i % 3) * 13,
        p.z,
      );
      if (i === 1 && cloud.visible) this.drawn.cloudPosition = cloud.position.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(v[0] - metres) < 65);
    if (!view) return;
    const w = Math.min(1, (1 - Math.abs(view[0] - metres) / 65) * 1.8),
      p = this.course.place(metres, 0, this.origin),
      t = this.course.place(view[1], view[2], this.target);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.max(0.01, Math.hypot(dx, dz));
    camera.x += (p.x - (5 * dx) / len - camera.x) * w;
    camera.z += (p.z - (5 * dz) / len - camera.z) * w;
    camera.y += (p.y + (view[0] >= 8400 || view[0] === 1740 ? 5.6 : 2.3) - camera.y) * w;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (p.y + view[3] + ((t.y - p.y) * 14) / len - ahead.y) * w;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    for (const bus of this.shuttles) bus.geometry.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.busPaint,
      this.vapor,
      this.mist,
    ])
      item.dispose();
  }
}
