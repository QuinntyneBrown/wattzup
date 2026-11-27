import { mix, positionWorld, sin, uniform, vertexColor, vec3 } from 'three/tsl';
import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { MerceSparks } from './merce-sparks';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 130, 0, 4],
  [2240, 2274, 0, 2.7],
  [4580, 4610, 4.5, 2.7],
  [6760, 6797, 10.7, 3.4],
  [9320, 9377, -38, 5.6],
  [12260, 12380, -24, 4.65],
] as const;
export class MerceFestival {
  readonly root = new Group();
  private readonly p = point();
  private readonly origin = point();
  private readonly cast = new Group();
  private readonly giants: Mesh[] = [];
  private readonly dragon: Mesh;
  private readonly sparks = new MerceSparks(false);
  private readonly fireworks = new MerceSparks(true);
  private readonly phase = uniform(0);
  private readonly drawn = {
    giantTurn: null as number | null,
    sparkPhase: null as number | null,
    burstRadius: null as number | null,
  };
  private readonly costumes: MeshBasicMaterial[] = [];
  private readonly figures: PlaneGeometry[] = [];
  readonly materials = {
    GothicFront: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36, fog: false }),
    LaietanaStone: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    FestivalAudience: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43, fog: false }),
    CatalanRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['stone', 'castellers', 'procession', 'cathedral'].map((n) =>
        loader.loadAsync('courses/merce-' + n + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const image of images) image.dispose();
      throw failure.reason;
    }
    return new MerceFestival(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [stone, people, procession, cathedral] = images as [Texture, Texture, Texture, Texture];
    for (const t of images) t.colorSpace = SRGBColorSpace;
    stone.flipY = people.flipY = cathedral.flipY = false;
    this.materials.GothicFront.map = cathedral;
    this.materials.LaietanaStone.map = stone;
    this.materials.FestivalAudience.map = people;
    const variation = sin(positionWorld.x.mul(180).add(positionWorld.z.mul(79)))
      .mul(0.035)
      .add(0.94);
    const sodium = sin(positionWorld.x.mul(0.138)).mul(0.5).add(0.5).pow(3);
    const warmStreet = vertexColor()
      .rgb.mul(variation)
      .mul(vec3(0.31, 0.29, 0.32).add(vec3(0.59, 0.33, 0.18).mul(sodium)));
    this.materials.CatalanRoad.colorNode = mix(
      warmStreet,
      vec3(0.41, 0.19, 0.07),
      this.phase.mul(0.066),
    );
    const actor = (tile: number, w: number, h: number) => {
      const geometry = new PlaneGeometry(w, h);
      geometry.translate(0, h / 2, 0);
      const uv = geometry.attributes['uv']!;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(
          i,
          (tile % 2) * 0.5 + 0.008 + uv.getX(i) * 0.484,
          (1 - Math.floor(tile / 2)) * 0.5 + 0.008 + uv.getY(i) * 0.484,
        );
      const paint = new MeshBasicMaterial({
        map: procession,
        side: DoubleSide,
        alphaTest: 0.46,
        fog: false,
      });
      this.figures.push(geometry);
      this.costumes.push(paint);
      return new Mesh(geometry, paint);
    };
    for (const [tile, w, h] of [
      [0, 3.8, 5.2],
      [1, 4.2, 5.3],
      [2, 3.6, 2.4],
    ] as const) {
      const m = actor(tile, w, h);
      this.giants.push(m);
      this.cast.add(m);
    }
    this.dragon = actor(3, 5.0, 3.1);
    this.root.add(this.cast, this.dragon, this.sparks.mesh, this.fireworks.mesh);
  }
  update(metres: number, time: number) {
    this.cast.visible = Math.abs(metres - 2240) < 370;
    this.drawn.giantTurn = null;
    if (this.cast.visible) {
      this.giants.forEach((actor, i) => {
        const progress = 2271 + 8 * i + 7 * Math.sin(time * 0.11 + i * 0.64),
          p = this.course.place(progress, -3.5 + i * 2.85, this.p);
        actor.position.set(p.x, p.y + 0.13 + Math.abs(Math.sin(time * 2 + i)) * 0.11, p.z);
        actor.rotation.y = p.heading + 0.37 * Math.sin(time * 0.72 + i);
        actor.rotation.z = 0.03 * Math.sin(time * 1.44 + i);
      });
      this.drawn.giantTurn = this.giants[0]!.rotation.y;
    }
    const fire = Math.abs(metres - 4580) < 420;
    this.dragon.visible = this.sparks.mesh.visible = fire;
    this.drawn.sparkPhase = null;
    this.phase.value = 0;
    if (fire) {
      const p = this.course.place(4600, 3.9, this.p);
      this.dragon.position.set(p.x, p.y + 0.13, p.z);
      this.dragon.rotation.y = p.heading + 0.22 * Math.sin(time * 0.85);
      this.sparks.mesh.position.set(p.x, p.y + 2.7, p.z);
      this.drawn.sparkPhase = this.sparks.at(time);
      this.phase.value = 0.57 + 0.41 * Math.sin(time * 8.2);
    }
    this.fireworks.mesh.visible = metres > 11650;
    this.drawn.burstRadius = null;
    if (this.fireworks.mesh.visible) {
      const p = this.course.place(12430, -16, this.p);
      this.fireworks.mesh.position.set(p.x, p.y + 24, p.z);
      this.drawn.burstRadius = this.fireworks.at(time);
      this.phase.value = 0.5 + 0.44 * Math.cos(time * 1.6);
      this.materials.LaietanaStone.color.setRGB(
        0.86 + 0.14 * Math.sin(time * 0.64),
        0.78 + 0.15 * Math.cos(time * 0.73),
        0.9 + 0.1 * Math.sin(time * 0.81),
      );
    } else this.materials.LaietanaStone.color.setRGB(0.71, 0.59, 0.51);
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
    this.cast.clear();
    this.sparks.dispose();
    this.fireworks.dispose();
    for (const item of [
      ...this.figures,
      ...this.costumes,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
