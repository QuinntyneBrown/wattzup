import { mix, positionWorld, texture, vertexColor } from 'three/tsl';
import {
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import { SalarMirage } from './atacama-salt';
import type { Course, CoursePlace } from './course';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { RiderBody } from './rider-body';

const position = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const COAST_VIEWS: readonly [number, number, number, number][] = [
  [1530, 1560, 9, 0.4],
  [3240, 3272, -4.4, 0.4],
  [4920, 4954, -8, 0.65],
  [7300, 7350, -55, -2.9],
  [9510, 9552, -1, 0.8],
];
const RIDER_SPACING = 118;

/** Numbered riders travel independently of the bike. Only the three closest slots need geometry. */
export class KonaTriathlon {
  readonly root = new Group();
  private readonly mirage = new SalarMirage();
  private readonly ground = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly fans = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 });
  private readonly water = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  readonly materials = { KonaLava: this.ground, KonaFans: this.fans, Sea: this.water };
  private readonly suit = new MeshLambertMaterial({ vertexColors: true });
  private readonly kit: CourseCyclistKit;
  private readonly riders: RiderModel[];
  private readonly carbon = new MeshBasicMaterial({ color: 0x29292d });
  private readonly disc = new CylinderGeometry(0.308, 0.308, 0.025, 32);
  private readonly bar = new CylinderGeometry(0.012, 0.012, 0.43, 8);
  private readonly grassMaterial: MeshBasicMaterial;
  private readonly patches: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly sample = position();
  private readonly transform = new Object3D();
  private readonly drawn = {
    triathleteStation: null as number | null,
    grassLean: 0,
    mirageOpacity: 0,
  };

  static async load(course: Course, body: RiderBody) {
    const loader = new TextureLoader();
    const lava = await loader.loadAsync('courses/kona-lava.webp');
    try {
      const grass = await loader.loadAsync('courses/kona-grass.webp');
      try {
        const supporters = await loader.loadAsync('courses/kona-fans.webp');
        return new KonaTriathlon(course, body, lava, grass, supporters);
      } catch (error) {
        grass.dispose();
        throw error;
      }
    } catch (error) {
      lava.dispose();
      throw error;
    }
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly lava: Texture,
    private readonly grass: Texture,
    private readonly supporters: Texture,
  ) {
    supporters.flipY = false;
    supporters.colorSpace = SRGBColorSpace;
    this.fans.map = supporters;
    lava.wrapS = lava.wrapT = MirroredRepeatWrapping;
    lava.colorSpace = grass.colorSpace = SRGBColorSpace;
    lava.anisotropy = 4;
    this.ground.colorNode = mix(
      texture(lava, positionWorld.xz.mul(0.24)).rgb,
      vertexColor().rgb,
      0.22,
    );
    this.grassMaterial = new MeshBasicMaterial({ map: grass, alphaTest: 0.45, side: DoubleSide });
    for (let variant = 0; variant < 4; variant++) {
      const geometry = new PlaneGeometry(1, 1);
      geometry.translate(0, 0.5, 0);
      const uv = geometry.getAttribute('uv');
      for (let v = 0; v < uv.count; v++)
        uv.setXY(v, (uv.getX(v) + (variant % 2)) / 2, (uv.getY(v) + Math.floor(variant / 2)) / 2);
      const clumps = new InstancedMesh(geometry, this.grassMaterial, 20);
      clumps.frustumCulled = false;
      this.patches.push(clumps);
      this.root.add(clumps);
    }
    this.root.add(this.mirage.mesh);
    this.kit = new CourseCyclistKit(this.suit, body, false, true, true);
    this.riders = [0xed6b42, 0x5196c5, 0xf0c853].map((colour, i) => {
      const rider = this.kit.make(new Color(colour), 37 + i * 19, false, 0.58);
      const wheel = new Mesh(this.disc, this.carbon);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.34, 0.5);
      rider.group.add(wheel);
      for (const side of [-1, 1]) {
        const bar = new Mesh(this.bar, this.carbon);
        bar.rotation.x = Math.PI / 2 - 0.12;
        bar.position.set(side * 0.095, 0.946, -0.59);
        rider.group.add(bar);
      }
      this.root.add(rider.group);
      return rider;
    });
  }
  update(metres: number, time: number) {
    // Number, colour and lane remain associated with each moving athlete through a pass.
    const first = Math.floor((metres - 6.8 * time) / RIDER_SPACING);
    this.drawn.triathleteStation = null;
    for (let k = 0; k < 3; k++) {
      const index = first + k;
      const slot = ((index % 3) + 3) % 3;
      const racer = this.riders[slot]!;
      const station = index * RIDER_SPACING + 6.8 * time;
      racer.group.visible = station >= 0 && station < 9430 && station - metres > -22;
      if (!racer.group.visible) continue;
      const p = this.course.place(station, -4.32 - 0.19 * Math.sin(index * 2.15), this.sample);
      racer.group.position.set(p.x, p.y, p.z);
      racer.group.rotation.set(p.pitch, p.heading, 0.035, 'YXZ');
      racer.pose(time * (8.7 + slot * 0.31) + slot);
      if (this.drawn.triathleteStation === null) this.drawn.triathleteStation = station;
    }
    const base = Math.floor(metres / 4.4) - 6;
    for (let variant = 0; variant < 4; variant++) {
      const clumps = this.patches[variant]!;
      let count = 0;
      for (let n = 0; n < 20; n++) {
        const index = base + n * 4 + variant;
        const d = index * 4.4;
        if (d < 0 || d > 9260) continue;
        const side = d > 6540 ? 1 : index % 3 === 0 ? -1 : 1;
        const p = this.course.place(
          d,
          side * (7.3 + 3.6 * (1 + Math.sin(index * 2.51))),
          this.sample,
        );
        const lean = -0.16 + 0.085 * Math.sin(time * 2.8 + d * 0.043);
        const size = 1.35 + 0.44 * Math.sin(index * 1.97);
        this.transform.position.set(p.x, p.y - 0.24, p.z);
        this.transform.rotation.set(0, p.heading + 0.38 * Math.sin(index), lean, 'YXZ');
        this.transform.scale.set(size, size * 0.88, 1);
        this.transform.updateMatrix();
        clumps.setMatrixAt(count++, this.transform.matrix);
        if (variant === 0 && count === 1) this.drawn.grassLean = lean;
      }
      clumps.count = count;
      clumps.instanceMatrix.needsUpdate = true;
    }
    const heat = this.course.place(metres + 112, 0, this.sample);
    this.mirage.update(0, heat.y, time);
    this.mirage.mesh.position.x = heat.x;
    this.mirage.mesh.position.z = heat.z;
    this.mirage.mesh.rotation.y = heat.heading;
    this.drawn.mirageOpacity = this.mirage.mesh.material.opacity;
  }
  sightline(metres: number, camera: Object3D['position'], ahead: CoursePlace) {
    const view = COAST_VIEWS.find(([station]) => Math.abs(metres - station) < 95);
    if (!view) return;
    const [station, target, lane, rise] = view;
    const share = Math.min(1, (1 - Math.abs(metres - station) / 95) * 1.6);
    const at = this.course.place(metres, 0, this.origin);
    const point = this.course.place(target, lane, this.sample);
    const dx = point.x - at.x,
      dz = point.z - at.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (at.x - (5.4 * dx) / len - camera.x) * share;
    camera.z += (at.z - (5.4 * dz) / len - camera.z) * share;
    camera.y += (at.y + 2.35 - camera.y) * share;
    ahead.x += (at.x + (12 * dx) / len - ahead.x) * share;
    ahead.z += (at.z + (12 * dz) / len - ahead.z) * share;
    ahead.y += (at.y + rise - ahead.y) * share;
  }
  private readonly origin = position();
  report() {
    return this.drawn;
  }
  dispose() {
    this.mirage.dispose();
    for (const clumps of this.patches) {
      clumps.geometry.dispose();
      clumps.dispose();
    }
    for (const rider of this.riders) for (const resource of rider.owned) resource.dispose();
    this.kit.dispose();
    for (const resource of [
      this.water,
      this.fans,
      this.supporters,
      this.grassMaterial,
      this.suit,
      this.grass,
      this.lava,
      this.ground,
      this.carbon,
      this.disc,
      this.bar,
    ])
      resource.dispose();
    this.root.clear();
  }
}
