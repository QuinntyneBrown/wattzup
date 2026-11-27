import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv } from 'three/tsl';
import type { Course, CoursePlace } from './course';
import { SteppeHerd } from './steppe-herd';

const viewpoints = [
  [120, 151, -4, 1.4],
  [3160, 3182, -12, 2.3],
  [6550, 6566, -4.3, 1.3],
  [9740, 9754, -7.6, 2.2],
  [13420, 13432, 4.2, 1.5],
  [18740, 18769, 18, 2.5],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class KhentiiSteppe {
  readonly root = new Group();
  readonly materials = {
    SteppeRuts: new MeshBasicNodeMaterial({ side: DoubleSide }),
    SteppeTurf: new MeshBasicNodeMaterial({ side: DoubleSide }),
    GerFelt: new MeshBasicMaterial({ side: DoubleSide }),
    KhentiiSky: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    SteppeFlowers: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
  };
  private readonly evening = uniform(0);
  private readonly clock = uniform(0);
  private readonly herd: SteppeHerd;
  private readonly shadowPlane = new PlaneGeometry(1, 1);
  private readonly shadowMaterial = new MeshBasicNodeMaterial({
    color: 0x41482c,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly silk = new MeshBasicMaterial({ color: 0x278cde, side: DoubleSide });
  private readonly ribbons: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly position = point();
  private readonly focus = point();
  private scarfFold: number | null = null;
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['steppe-felt', 'steppe-ruts', 'steppe-sky', 'steppe-flowers', 'gardena-turf'].map((name) =>
        loader.loadAsync('courses/' + name + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const map of maps) map.dispose();
      throw error.reason;
    }
    return new KhentiiSteppe(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    this.shadowMaterial.opacityNode = smoothstep(0.19, 0.5, uv().sub(0.5).length())
      .oneMinus()
      .mul(0.46);
    for (const map of maps) {
      map.colorSpace = SRGBColorSpace;
      map.flipY = false;
    }
    const [felt, ruts, sky, flowers, turf] = maps as [Texture, Texture, Texture, Texture, Texture];
    ruts.wrapT = turf.wrapS = turf.wrapT = RepeatWrapping;
    this.materials.GerFelt.map = felt;
    this.materials.KhentiiSky.map = sky;
    this.materials.SteppeFlowers.map = flowers;
    const shadows = sin(
      positionWorld.x.mul(0.008).add(positionWorld.z.mul(0.006)).add(this.clock.mul(0.045)),
    )
      .mul(0.12)
      .add(0.87);
    const grass = texture(turf, positionWorld.xz.mul(0.12)).rgb;
    const plain = mix(grass.mul(color(0xa4bb6b)), grass.mul(color(0xf9bd6a)), this.evening).mul(
      shadows,
    );
    this.materials.SteppeTurf.colorNode = plain;
    const track = texture(ruts)
      .rgb.mul(shadows)
      .mul(mix(color(0xffffff), color(0xffcc8b), this.evening));
    const edge = smoothstep(
      0.29,
      0.47,
      uv()
        .x.sub(0.5)
        .abs()
        .add(sin(positionWorld.x.mul(1.72).add(positionWorld.z.mul(1.35))).mul(0.028)),
    );
    this.materials.SteppeRuts.colorNode = mix(track, plain, edge);
    for (const [metres, lane, radius] of [
      [225, -36, 3.3],
      [3182, -12, 3.9],
      [3201, -23, 3.2],
      [3218, -15, 3.5],
      [4440, 29, 3.4],
      [11040, -28, 3.2],
      [13455, -31, 3.1],
      [18769, 18, 3.6],
      [18790, 24, 3.1],
    ] as const) {
      const p = course.place(metres, lane, this.position);
      const shadow = new Mesh(this.shadowPlane, this.shadowMaterial);
      const length = metres > 18000 ? radius * 4 : radius * 1.65;
      shadow.position.set(p.x + length * 0.33, p.y + 0.07, p.z);
      shadow.rotation.set(-Math.PI / 2, 0, -0.19);
      shadow.scale.set(length * 2, radius * 2.3, 1);
      this.root.add(shadow);
    }
    this.herd = new SteppeHerd(course);
    this.root.add(this.herd.mesh);
    for (const [metres, lane] of [
      [9754, -7.6],
      [15280, 11.7],
    ] as const) {
      const p = course.place(metres, lane, this.position);
      for (let i = 0; i < 7; i++) {
        const geometry = new PlaneGeometry(1.45, 0.19, 8, 1);
        geometry.translate(0.725, 0, 0);
        const sash = new Mesh(geometry, this.silk);
        sash.position.set(
          p.x + 0.23 * Math.sin(i),
          p.y + 2.31 + i * 0.19,
          p.z + 0.25 * Math.cos(i),
        );
        sash.rotation.y = p.heading + i * 0.48;
        this.ribbons.push(sash);
        this.root.add(sash);
      }
    }
    this.update(0, 0);
  }
  update(metres: number, time: number) {
    this.herd.update(metres, time);
    this.clock.value = time;
    const dusk = Math.max(0, Math.min(1, (metres - 14100) / 4500));
    this.evening.value = dusk;
    this.materials.KhentiiSky.color.setRGB(1, 1 - 0.18 * dusk, 1 - 0.44 * dusk);
    this.scarfFold = null;
    for (const [i, sash] of this.ribbons.entries()) {
      sash.visible = Math.abs(metres - (i < 7 ? 9754 : 15280)) < 260;
      if (!sash.visible) continue;
      const verts = sash.geometry.attributes['position']!;
      for (let v = 0; v < verts.count; v++) {
        const x = verts.getX(v),
          wave = Math.sin(time * 2.3 + i + x * 4.2);
        verts.setXYZ(
          v,
          x,
          (v < 9 ? 0.095 : -0.095) - x * 0.24 + 0.13 * x * wave,
          0.22 * x * Math.cos(time * 2.3 + i + x * 4.2),
        );
      }
      verts.needsUpdate = true;
      if (i % 7 === 0) this.scarfFold = verts.getZ(8);
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of viewpoints) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.position),
        p = this.course.place(to, lane, this.focus);
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
    return {
      horseStride: this.herd.horseStride,
      herderTravel: this.herd.herderTravel,
      scarfFold: this.scarfFold,
    };
  }
  dispose() {
    this.root.clear();
    this.herd.dispose();
    for (const sash of this.ribbons) sash.geometry.dispose();
    for (const resource of [
      this.shadowPlane,
      this.shadowMaterial,
      this.silk,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      resource.dispose();
  }
}
