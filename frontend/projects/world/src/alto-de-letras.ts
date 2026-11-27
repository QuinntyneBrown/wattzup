import { mix, positionWorld, texture, uniform, vec3, vertexColor } from 'three/tsl';
import {
  Color,
  DoubleSide,
  Fog,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type DirectionalLight,
  type FogExp2,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { Course, CoursePlace } from './course';
import { LetrasTraffic } from './letras-traffic';
import type { RiderBody } from './rider-body';
import { canvasTexture } from './world-kit';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 126, 2, 1.7],
  [3620, 3653, 6, 1.7],
  [7680, 7712, -11, 3.8],
  [11840, 11878, 4, 1.6],
  [16920, 17011, -15, 1.9],
  [21490, 21523, -3.5, 1.7],
] as const;

export class AltoDeLetras {
  readonly root = new Group();
  private readonly skyline = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.42,
    fog: false,
    color: 0xd3dcd0,
  });
  private readonly leaves = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.46,
    color: 0xd6dcb7,
  });
  private readonly canopy = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 });
  private readonly soil = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly disc = new MeshBasicMaterial({ side: DoubleSide, fog: false, color: 0xffefca });
  private readonly walls = new MeshBasicMaterial({ side: DoubleSide });
  private readonly tarmac = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly overcast = uniform(0);
  private readonly sky = new MeshBasicNodeMaterial({
    vertexColors: true,
    fog: false,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  });
  readonly materials = {
    Cordillera: this.skyline,
    CloudForest: this.canopy,
    AndesBank: this.soil,
    Sun: this.disc,
    LetrasFlora: this.leaves,
    FresnoWalls: this.walls,
    Ruta50: this.tarmac,
    Sky: this.sky,
  };
  private readonly mistMap = canvasTexture(256, 96, (g) => {
    for (let i = 0; i < 17; i++) {
      const x = 20 + ((i * 43) % 216),
        y = 29 + ((i * 19) % 35),
        r = 18 + ((i * 7) % 18);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(231,235,227,.38)');
      grad.addColorStop(1, 'rgba(224,231,224,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
  private readonly haze = new MeshBasicMaterial({
    map: this.mistMap,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  private readonly clouds = new InstancedMesh(new PlaneGeometry(1, 1), this.haze, 8);
  private readonly kit: CourseCyclistKit;
  private readonly riders: RiderModel[];
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly vehicles: LetrasTraffic[];
  private readonly vehicleMap: Texture;
  private readonly pose = new Object3D();
  private readonly p = point();
  private readonly rider = point();
  private readonly dusk = new Color(0xb8c4c5);
  private readonly drawn = {
    chivaStation: null as number | null,
    lorryStation: null as number | null,
    localCyclist: null as number | null,
    cloudDrift: null as number | null,
  };
  static async load(course: Course, body: RiderBody) {
    const loader = new TextureLoader();
    const names = [
      'letras-cordillera',
      'letras-flora',
      'letras-paint',
      'goldengate-lawn',
      'letras-canopy',
      'letras-loam',
      'letras-tussocks',
    ];
    const result = await Promise.allSettled(
      names.map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const images: Texture[] = [];
    for (const r of result) if (r.status === 'fulfilled') images.push(r.value);
    const error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const img of images) img.dispose();
      throw error.reason;
    }
    return new AltoDeLetras(course, body, images);
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly images: Texture[],
  ) {
    const [ridge, plants, facades, grain, trees, loam, tussocks] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const img of images) img.colorSpace = SRGBColorSpace;
    ridge.flipY = plants.flipY = facades.flipY = false;
    trees.flipY = false;
    this.canopy.map = trees;
    for (const surface of [loam, tussocks]) {
      surface.wrapS = surface.wrapT = MirroredRepeatWrapping;
      surface.anisotropy = 4;
    }
    const groundUv = positionWorld.xz.mul(0.18);
    const underfoot = mix(
      texture(loam, groundUv).rgb,
      texture(tussocks, groundUv).rgb,
      positionWorld.y.sub(3280).div(255).clamp(0, 1),
    );
    this.soil.colorNode = mix(underfoot, vertexColor().rgb, 0.28);
    this.sky.colorNode = mix(vertexColor().rgb, vec3(0.64, 0.68, 0.68), this.overcast);
    this.skyline.map = ridge;
    this.leaves.map = plants;
    this.walls.map = facades;
    this.vehicleMap = facades.clone();
    this.vehicleMap.flipY = true;
    this.vehicleMap.needsUpdate = true;
    this.vehicles = [
      new LetrasTraffic(this.vehicleMap, true),
      new LetrasTraffic(this.vehicleMap, false),
    ];
    for (const vehicle of this.vehicles) this.root.add(vehicle.body);
    grain.wrapS = grain.wrapT = MirroredRepeatWrapping;
    grain.anisotropy = 4;
    const grit = texture(grain, positionWorld.xz.mul(2.9)).r;
    this.tarmac.colorNode = vertexColor().rgb.mul(grit.mul(0.56).add(0.72));
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.riders = [0xf2bd32, 0x3485ad, 0xd94e44].map((color, i) =>
      this.kit.make(new Color(color), 21 + i * 13, false, 0.58),
    );
    for (const rider of this.riders) this.root.add(rider.group);
    this.clouds.frustumCulled = false;
    this.root.add(this.clouds);
  }
  update(metres: number, time: number, sun: DirectionalLight, fog: Fog | FogExp2 | null) {
    const cold = Math.min(1, Math.max(0, (metres - 8800) / 11300));
    this.overcast.value = 0.77 * cold;
    this.skyline.color.setRGB(0.75 + 0.09 * cold, 0.81 + 0.02 * cold, 0.72 + 0.11 * cold);
    sun.intensity = 1.7 - 0.57 * cold;
    sun.color.setRGB(0.99 - 0.14 * cold, 0.89, 0.67 + 0.26 * cold);
    if (fog instanceof Fog) {
      fog.color.set(0xc5d3c1).lerp(this.dusk, cold);
      fog.far = 1560 - 915 * cold;
    }
    this.drawn.chivaStation = this.drawn.lorryStation = null;
    for (let i = 0; i < 2; i++) {
      const vehicle = this.vehicles[i]!.body;
      const anchor = i === 0 ? 3658 : 11904;
      // A loop along the town frontage slows the vehicles at either end as they turn.
      const phase = time * (i === 0 ? 0.049 : 0.041) + i * 0.7;
      const radius = 17;
      const station = anchor + radius * Math.sin(phase);
      vehicle.visible = Math.abs(station - metres) < 195;
      if (!vehicle.visible) continue;
      const lane = i === 0 ? -1.65 * Math.cos(phase) : -2.7 + 0.48 * Math.cos(phase);
      const p = this.course.place(station, lane, this.p);
      vehicle.position.set(p.x, p.y, p.z);
      vehicle.rotation.set(
        p.pitch * Math.cos(phase),
        p.heading + Math.atan2(1.73 * Math.sin(phase), radius * Math.cos(phase)),
        0,
        'YXZ',
      );
      if (i === 0) this.drawn.chivaStation = station;
      else this.drawn.lorryStation = station;
    }
    this.drawn.localCyclist = null;
    for (let i = 0; i < this.riders.length; i++) {
      const model = this.riders[i]!;
      const speed = 4.1 + i * 0.22;
      const offset = time * speed + i * 20;
      const station = Math.ceil((metres - 12 - offset) / 114) * 114 + offset;
      model.group.visible = station >= 0 && station < this.course.file.lengthMetres;
      if (!model.group.visible) continue;
      const p = this.course.place(station, 0.95 + (i % 2) * 0.9, this.p);
      model.group.position.set(p.x, p.y, p.z);
      model.group.rotation.set(p.pitch, p.heading, 0.025 * Math.sin(time * 4.6 + i), 'YXZ');
      model.pose(time * (5.6 + i * 0.25) + i);
      if (this.drawn.localCyclist === null) this.drawn.localCyclist = station;
    }
    this.drawn.cloudDrift = null;
    this.clouds.visible = metres > 8900;
    if (this.clouds.visible) {
      const first = Math.floor(metres / 54) - 1;
      for (let i = 0; i < 8; i++) {
        const j = first + i,
          station = j * 54;
        const drift = 19 * Math.sin(time * 0.17 + j);
        const across = j % 3 === 0 ? drift : -53 + drift;
        const p = this.course.place(station, across, this.p);
        this.pose.position.set(
          p.x,
          p.y + (j % 3 === 0 ? 4 : -13) + 1.4 * Math.sin(j + time * 0.12),
          p.z,
        );
        this.pose.rotation.set(0, p.heading + 0.19 * Math.sin(j), 0);
        this.pose.scale.set(75, 11 + 6 * (j % 3), 1);
        this.pose.updateMatrix();
        this.clouds.setMatrixAt(i, this.pose.matrix);
        if (i === 2) this.drawn.cloudDrift = this.pose.position.x;
      }
      this.clouds.instanceMatrix.needsUpdate = true;
      this.haze.opacity = 0.56 + 0.38 * cold;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = stops.find((v) => Math.abs(metres - v[0]) < 86);
    if (!s) return;
    const fraction = Math.min(1, (1 - Math.abs(metres - s[0]) / 86) * 1.65);
    const p = this.course.place(metres, 0, this.rider),
      t = this.course.place(s[1], s[2], this.p);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5.3 * dx) / len - camera.x) * fraction;
    camera.z += (p.z - (5.3 * dz) / len - camera.z) * fraction;
    camera.y += (p.y + 2.38 - camera.y) * fraction;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * fraction;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * fraction;
    ahead.y += (p.y + s[3] + ((t.y - p.y) * 14) / len - ahead.y) * fraction;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    for (const v of this.vehicles) v.dispose();
    for (const rider of this.riders) for (const item of rider.owned) item.dispose();
    this.kit.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.vehicleMap,
      this.mistMap,
      this.haze,
      this.clouds.geometry,
      this.clouds,
      this.plain,
    ])
      item.dispose();
  }
}
