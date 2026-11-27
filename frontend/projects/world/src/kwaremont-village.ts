import { mix, positionWorld, texture, vertexColor } from 'three/tsl';
import {
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { canvasTexture } from './world-kit';
import type { Course, CoursePlace } from './course';

const position = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const routeViews = [
  { station: 80, target: 120, lane: -9, rise: 1 },
  { station: 13560, target: 13588, lane: 8.4, rise: 1.3 },
  { station: 14120, target: 14151, lane: -10, rise: 1.25 },
  { station: 15280, target: 15355, lane: -43, rise: -0.2 },
];

function supporterBanner() {
  return canvasTexture(384, 176, (ctx) => {
    ctx.fillStyle = '#26736a';
    ctx.fillRect(0, 0, 384, 176);
    ctx.fillStyle = '#ece2b7';
    ctx.fillRect(0, 19, 384, 7);
    ctx.fillRect(0, 149, 384, 7);
    ctx.font = 'bold 61px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KWAREMONT', 192, 90, 363);
  });
}

/** Fabric deformation, a three-deep roadside crowd and the village materials belong to this course. */
export class KwaremontVillage {
  readonly root = new Group();
  private readonly setts = new MeshStandardNodeMaterial({
    side: DoubleSide,
    roughness: 0.43,
    metalness: 0.09,
  });
  private readonly gutters = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly fields = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly trees = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 });
  private readonly front = new MeshBasicMaterial({ side: DoubleSide });
  private readonly bar = new MeshBasicMaterial({ side: DoubleSide });
  readonly materials = {
    KwaremontSetts: this.setts,
    KwaremontGutters: this.gutters,
    KwaremontFields: this.fields,
    KwaremontTrees: this.trees,
    KwaremontFronts: this.front,
    KwaremontBars: this.bar,
  };
  private readonly banner = supporterBanner();
  private readonly fanInk = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 });
  private readonly crowd: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly flags: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly pose = new Object3D();
  private readonly sample = position();
  private readonly origin = position();
  private readonly drawn = {
    kwaremontLion: null as number | null,
    clubBanner: null as number | null,
    marqueeFan: null as number | null,
  };

  static async load(course: Course) {
    const keys = [
      'koppenberg-setts',
      'koppenberg-bank',
      'koppenberg-trees',
      'koppenberg-fans',
      'koppenberg-lion',
      'kwaremont-cafes',
      'kwaremont-bar',
    ];
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      keys.map((key) => loader.loadAsync('courses/' + key + '.webp')),
    );
    const images: Texture[] = [];
    for (const r of results) if (r.status === 'fulfilled') images.push(r.value);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      images.forEach((image) => image.dispose());
      throw failed.reason;
    }
    return new KwaremontVillage(course, images);
  }

  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [stones, grass, trees, fans, lion, front, bar] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    images.forEach((image) => {
      image.colorSpace = SRGBColorSpace;
    });
    for (const tile of [stones, grass]) {
      tile.wrapS = tile.wrapT = MirroredRepeatWrapping;
      tile.anisotropy = 4;
    }
    const stone = texture(stones, positionWorld.xz.mul(0.34)).rgb;
    this.setts.colorNode = mix(stone, vertexColor().rgb, 0.15);
    this.setts.roughnessNode = stone.r.mul(-0.5).add(0.59);
    this.gutters.colorNode = vertexColor().rgb.mul(
      texture(stones, positionWorld.xz.mul(4.8)).r.mul(0.8).add(0.79),
    );
    this.fields.colorNode = mix(
      texture(grass, positionWorld.xz.mul(0.3)).rgb.mul(vertexColor().rgb.mul(1.2).add(0.4)),
      vertexColor().rgb,
      0.3,
    );
    for (const image of [trees, front, bar]) image.flipY = false;
    this.front.map = front;
    this.bar.map = bar;
    this.trees.map = trees;
    this.fanInk.map = fans;
    for (let v = 0; v < 8; v++) {
      const geometry = new PlaneGeometry(1, 1);
      geometry.translate(0, 0.5, 0);
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, ((v % 4) + uv.getX(i)) / 4, (Math.floor(v / 4) + uv.getY(i)) / 2);
      const mesh = new InstancedMesh(geometry, this.fanInk, 132);
      mesh.frustumCulled = false;
      this.root.add(mesh);
      this.crowd.push(mesh);
    }
    for (const [i, map] of [lion, this.banner].entries()) {
      const width = i === 0 ? 1.62 : 2.21;
      const geometry = new PlaneGeometry(width, 0.91, 12, 2);
      geometry.translate(width / 2, 0, 0);
      const mesh = new InstancedMesh(
        geometry,
        new MeshBasicMaterial({ map, side: DoubleSide }),
        24,
      );
      mesh.frustumCulled = false;
      this.root.add(mesh);
      this.flags.push(mesh);
    }
  }

  update(metres: number, time: number) {
    const first = Math.floor((metres - 18) / 2.6);
    this.drawn.marqueeFan = null;
    for (let v = 0; v < this.crowd.length; v++) {
      const mesh = this.crowd[v]!;
      let count = 0;
      for (let n = 0; n < 64; n++) {
        const index = first + n;
        const station = index * 2.6;
        if (station < 13270 || station > 14860 || ((index % 4) + 4) % 4 !== v % 4) continue;
        const side = v < 4 ? -1 : 1;
        const depth = station >= 13880 && station < 14760 ? 3 : 2;
        for (let row = 0; row < depth; row++) {
          const seat = station + 0.72 * row + 0.3 * Math.sin(index * 1.24 + row);
          const lane = side * (3.9 + row * 0.96 + 0.22 * Math.cos(index * 2.11));
          const p = this.course.place(seat, lane, this.sample);
          const lean =
            side * (0.09 + 0.061 * Math.sin(time * (1.8 + v * 0.14) + index * 0.82 + row * 1.4));
          this.pose.position.set(p.x, p.y - 0.26, p.z);
          this.pose.rotation.set(0, p.heading + 0.37 * side + 0.23 * Math.sin(index), lean, 'YXZ');
          const h = 1.85 + 0.16 * Math.sin(index * 1.51 + row * 2.87);
          this.pose.scale.set(h, h, 1);
          this.pose.updateMatrix();
          mesh.setMatrixAt(count++, this.pose.matrix);
          if (this.drawn.marqueeFan === null) this.drawn.marqueeFan = lean;
        }
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (let kind = 0; kind < this.flags.length; kind++) {
      const mesh = this.flags[kind]!;
      const pos = mesh.geometry.getAttribute('position'),
        uv = mesh.geometry.getAttribute('uv');
      for (let i = 0; i < pos.count; i++) {
        const u = uv.getX(i);
        pos.setZ(
          i,
          u *
            (0.19 * Math.sin(time * 3.35 + u * 7.7 + kind) + 0.072 * Math.sin(time * 5.2 - u * 11)),
        );
      }
      pos.needsUpdate = true;
      let count = 0;
      const firstPole = Math.floor((metres - 13266 - 18) / 17);
      for (let i = firstPole; i < firstPole + 13; i++) {
        const station = 13266 + i * 17;
        if (station < 13266 || station > 14870 || (i % 3 === 0 ? 1 : 0) !== kind) continue;
        const side = i % 2 ? 1 : -1;
        const p = this.course.place(station, side * 3.84, this.sample);
        this.pose.position.set(p.x, p.y + 2.85, p.z);
        this.pose.rotation.set(0, p.heading + side * 0.7, 0.05 * side);
        this.pose.scale.set(1, 1, 1);
        this.pose.updateMatrix();
        mesh.setMatrixAt(count++, this.pose.matrix);
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      const fold = count ? pos.getZ(pos.count - 1) : null;
      if (kind === 0) this.drawn.kwaremontLion = fold;
      else this.drawn.clubBanner = fold;
    }
  }

  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = routeViews.find((v) => Math.abs(v.station - metres) < 82);
    if (!view) return;
    const share = Math.min(1, (1 - Math.abs(view.station - metres) / 82) * 1.6);
    const rider = this.course.place(metres, 0, this.origin);
    const goal = this.course.place(view.target, view.lane, this.sample);
    const dx = goal.x - rider.x,
      dz = goal.z - rider.z,
      len = Math.hypot(dx, dz);
    camera.x += (rider.x - (5.2 * dx) / len - camera.x) * share;
    camera.z += (rider.z - (5.2 * dz) / len - camera.z) * share;
    camera.y += (rider.y + 2.35 - camera.y) * share;
    ahead.x += (rider.x + (12 * dx) / len - ahead.x) * share;
    ahead.z += (rider.z + (12 * dz) / len - ahead.z) * share;
    ahead.y += (rider.y + view.rise - ahead.y) * share;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    for (const flag of this.flags) {
      flag.material.dispose();
      flag.geometry.dispose();
      flag.dispose();
    }
    for (const crowd of this.crowd) {
      crowd.geometry.dispose();
      crowd.dispose();
    }
    for (const item of [...this.images, ...Object.values(this.materials), this.banner, this.fanInk])
      item.dispose();
    this.root.clear();
  }
}
