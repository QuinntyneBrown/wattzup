import { mix, positionWorld, texture, uniform, uv, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  Object3D,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
import { canvasTexture } from './world-kit';

const RUNNERS = 12;
const CATTLE = 7;
const CLOTHING = [0xd4553e, 0x5f955a, 0x365c90, 0xe4b950, 0x964359];
const SKIN = [0x785742, 0x664437, 0x75503c, 0x6f4a38, 0x79523b];

function placard(text: string, width: number, base: string) {
  const map = canvasTexture(1024, 160, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 160);
    g.strokeStyle = '#c5be9c';
    g.lineWidth = 6;
    g.strokeRect(9, 9, 1006, 142);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 95px sans-serif';
    g.fillStyle = '#eee4c4';
    g.fillText(text, 512, 86, 965);
  });
  return new Mesh(
    new PlaneGeometry(width, (width * 160) / 1024),
    new MeshBasicMaterial({ map, side: DoubleSide }),
  );
}

/** Roadside athletes and grazing stock use the same joint geometry at fixed, bounded instance counts. */
export class ItenTraining {
  readonly root = new Group();
  private readonly shape = new SphereGeometry(1, 10, 7);
  private readonly surface = new MeshLambertMaterial();
  private readonly athletes = new InstancedMesh(this.shape, this.surface, RUNNERS * 12);
  private readonly herd = new InstancedMesh(this.shape, this.surface, CATTLE * 11);
  private readonly joint = new Object3D();
  private readonly pose = new Group();
  private slot = 0;
  private readonly scratch = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly bike = new Group();
  private readonly wheels = new TorusGeometry(0.29, 0.052, 6, 18);
  private readonly bikeBox = new BoxGeometry(1, 1, 1);
  private readonly bikeMaterials = new Map<number, MeshBasicMaterial>();
  private readonly signs = [
    placard('KAMARINY STADIUM', 5.4, '#446954'),
    placard('ITEN MARKET', 7, '#386467'),
  ];
  private readonly flora: MeshBasicMaterial;
  private readonly rim: MeshBasicNodeMaterial;
  private readonly approach = uniform(0);
  readonly murram = new MeshBasicNodeMaterial({ side: DoubleSide });
  private stride = 0;
  private head = 0;
  private motorcyclePosition = 0;
  static async load(course: Course) {
    const loader = new TextureLoader();
    const images = await Promise.allSettled([
      loader.loadAsync('courses/iten-trees.webp'),
      loader.loadAsync('courses/iten-kerio.webp'),
      loader.loadAsync('courses/iten-laterite.webp'),
    ]);
    const loaded: Texture[] = [];
    for (const result of images) if (result.status === 'fulfilled') loaded.push(result.value);
    const failure = images.find((result) => result.status === 'rejected');
    if (failure) {
      loaded.forEach((image) => image.dispose());
      throw failure.reason;
    }
    return new ItenTraining(course, loaded[0]!, loaded[1]!, loaded[2]!);
  }
  private constructor(
    private readonly course: Course,
    private readonly trees: Texture,
    private readonly valley: Texture,
    private readonly dirt: Texture,
  ) {
    for (const texture of [trees, valley]) {
      texture.flipY = false;
      texture.colorSpace = SRGBColorSpace;
    }
    this.flora = new MeshBasicMaterial({ map: trees, alphaTest: 0.48, side: DoubleSide });
    this.rim = new MeshBasicNodeMaterial({
      side: DoubleSide,
      fog: false,
      transparent: true,
      depthWrite: false,
    });
    const skyImage = texture(valley, uv());
    this.rim.colorNode = skyImage.rgb;
    const horizontal = uv().x.mul(uv().x.oneMinus()).mul(19).clamp(0, 1);
    const upper = uv().y.mul(12).clamp(0, 1);
    this.rim.opacityNode = this.approach.mul(horizontal).mul(upper);
    dirt.wrapS = dirt.wrapT = MirroredRepeatWrapping;
    dirt.colorSpace = SRGBColorSpace;
    dirt.anisotropy = 4;
    const aggregate = texture(dirt, positionWorld.xz.mul(0.57)).rgb;
    const local = vertexColor().rgb;
    this.murram.colorNode = mix(aggregate.mul(local.mul(1.3).add(0.55)), local, 0.22);
    this.pose.add(this.joint);
    this.athletes.frustumCulled = false;
    this.herd.frustumCulled = false;
    this.root.add(this.athletes, this.herd, this.bike, ...this.signs);
    for (let i = 0; i < RUNNERS; i++) {
      const tones = [CLOTHING[i % CLOTHING.length]!, SKIN[i % SKIN.length]!];
      for (let side = 0; side < 2; side++)
        tones.push(
          0x323e49,
          SKIN[i % SKIN.length]!,
          i % 2 ? 0xedcb74 : 0xcbdbd4,
          SKIN[i % SKIN.length]!,
          SKIN[i % SKIN.length]!,
        );
      tones.forEach((tone, j) => this.athletes.setColorAt(i * 12 + j, new Color(tone)));
    }
    for (let i = 0; i < CATTLE; i++) {
      const coat = [0xaf885d, 0xa0704c, 0xd2bd99, 0x6e5648, 0xb39a73, 0xb8a88b, 0x806952][i]!;
      [
        coat,
        coat,
        coat,
        0x98754d,
        0xcbba91,
        0xcbba91,
        0x57483e,
        0x58483b,
        0x5a4a3c,
        0x554940,
        0x65513f,
      ].forEach((t, j) => this.herd.setColorAt(i * 11 + j, new Color(t)));
    }
    const wheelMat = this.paint(0x353936);
    for (const x of [-0.7, 0.7]) {
      const wheel = new Mesh(this.wheels, wheelMat);
      wheel.position.set(x, 0.32, 0);
      this.bike.add(wheel);
      this.box(x, 0.32, 0, 0.11, 0.12, 0.15, 0xb6b0a3);
      this.box(x + 0.05, 0.52, 0, 0.07, 0.47, 0.08, 0x7c7b70, -0.16);
    }
    this.box(-0.1, 0.63, 0, 0.86, 0.32, 0.31, 0x9b493b);
    this.box(-0.31, 0.88, 0, 0.85, 0.14, 0.32, 0x393a34);
    this.box(0.54, 0.91, 0, 0.27, 0.24, 0.2, 0xa9a59a);
    this.box(0.47, 0.99, 0, 0.15, 0.07, 0.62, 0x545b53);
    this.box(-0.14, 1.23, 0, 0.37, 0.59, 0.41, 0xb8a741, -0.16);
    this.box(-0.03, 1.66, 0, 0.28, 0.29, 0.28, 0x45463d);
    for (const side of [-1, 1]) {
      this.box(-0.02, 0.84, 0.2 * side, 0.53, 0.16, 0.16, 0x454b53);
      this.box(0.17, 0.61, 0.18 * side, 0.14, 0.38, 0.15, 0x40454a);
      this.box(0.21, 1.21, 0.2 * side, 0.51, 0.1, 0.12, 0x9b8345, -0.38);
    }
    for (const [mesh, metres, lane, lift] of [
      [this.signs[0]!, 8759, -8.5, 2.2],
      [this.signs[1]!, 12865, -8.0, 2.83],
    ] as const) {
      const p = course.place(metres, lane);
      mesh.position.set(p.x, p.y + lift, p.z);
      mesh.rotation.y = p.heading;
    }
  }
  get materials() {
    return { ItenFlora: this.flora, KerioRim: this.rim, Murram: this.murram };
  }
  private paint(tone: number) {
    let mat = this.bikeMaterials.get(tone);
    if (!mat) {
      mat = new MeshBasicMaterial({ color: tone });
      this.bikeMaterials.set(tone, mat);
    }
    return mat;
  }
  private box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tone: number,
    angle = 0,
  ) {
    const mesh = new Mesh(this.bikeBox, this.paint(tone));
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.rotation.z = angle;
    this.bike.add(mesh);
  }
  private body(
    batch: InstancedMesh,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    angle = 0,
  ) {
    this.joint.position.set(x, y, z);
    this.joint.scale.set(w, h, d);
    this.joint.rotation.z = angle;
    this.joint.updateWorldMatrix(false, false);
    batch.setMatrixAt(this.slot++, this.joint.matrixWorld);
  }
  private anchor(holder: Object3D, metres: number, lane: number, lift = 0) {
    const p = this.course.place(metres, lane, this.scratch);
    holder.position.set(p.x, p.y + lift, p.z);
    holder.rotation.y = p.heading + Math.PI / 2;
  }
  private run(metres: number, time: number) {
    const start = metres > 7500 ? 8672 : 2740;
    this.slot = 0;
    for (let i = 0; i < RUNNERS; i++) {
      const phase = time * 8.7 + i * 1.9;
      const stride = Math.sin(phase);
      if (i === 0) this.stride = stride;
      const pack = Math.floor(i / 4);
      const distance = start + ((time * 3.4 + pack * 54 + (i % 4) * 2.3 + 82) % 162);
      this.anchor(this.pose, distance, 2.55 + (i % 2) * 0.58, -0.07 + Math.abs(stride) * 0.065);
      this.pose.updateMatrixWorld();
      const b = this.athletes;
      this.body(b, 0.045, 1.14, 0, 0.151, 0.281, 0.187, -0.12);
      this.body(b, 0.083, 1.56, 0, 0.113, 0.144, 0.115);
      for (const side of [-1, 1]) {
        const hip = 0.74 * side * stride,
          shin = hip - 0.34 - Math.max(0, -side * stride) * 0.68;
        const kneeX = 0.41 * Math.sin(hip),
          kneeY = 0.88 - 0.41 * Math.cos(hip);
        this.body(b, kneeX / 2, (0.88 + kneeY) * 0.5, side * 0.096, 0.093, 0.225, 0.09, hip);
        this.body(
          b,
          kneeX + 0.2 * Math.sin(shin),
          kneeY - 0.2 * Math.cos(shin),
          side * 0.1,
          0.063,
          0.212,
          0.067,
          shin,
        );
        this.body(
          b,
          kneeX + 0.4 * Math.sin(shin) + 0.052,
          kneeY - 0.4 * Math.cos(shin),
          side * 0.1,
          0.136,
          0.055,
          0.073,
        );
        const arm = -0.62 * side * stride;
        const elbowX = 0.23 * Math.sin(arm),
          elbowY = 1.32 - 0.23 * Math.cos(arm);
        this.body(b, elbowX * 0.5, (1.32 + elbowY) * 0.5, side * 0.184, 0.054, 0.14, 0.06, arm);
        this.body(
          b,
          elbowX + 0.115 * Math.sin(arm + 1.17),
          elbowY - 0.115 * Math.cos(arm + 1.17),
          side * 0.185,
          0.046,
          0.133,
          0.052,
          arm + 1.17,
        );
      }
    }
    this.athletes.instanceMatrix.needsUpdate = true;
  }
  private graze(time: number) {
    this.slot = 0;
    for (let i = 0; i < CATTLE; i++) {
      const goat = i > 3,
        scale = goat ? 0.55 : 1;
      const tilt = 0.16 + 0.15 * Math.sin(time * 0.83 + i);
      if (i === 0) this.head = tilt;
      this.anchor(this.pose, 5628 + i * 4.1, 5.6 + (i % 3) * 1.35, -0.28);
      this.pose.rotation.y += i * 0.86;
      this.pose.scale.setScalar(scale);
      this.pose.updateMatrixWorld();
      const b = this.herd;
      this.body(b, 0, 0.99, 0, 0.94, 0.42, 0.34);
      this.body(b, 0.64, 1.05, 0, 0.39, 0.3, 0.24, -0.44);
      this.body(b, 1.0, 0.57 + tilt, 0, 0.28, 0.225, 0.18, -0.82 + tilt);
      this.body(b, 1.17, 0.42 + tilt, 0, 0.12, 0.11, 0.16);
      for (const sign of [-1, 1])
        this.body(b, 0.93, 0.8 + tilt, 0.13 * sign, 0.064, 0.18, 0.047, -0.38);
      for (const x of [-0.62, 0.6])
        for (const side of [-1, 1]) this.body(b, x, 0.44, 0.19 * side, 0.087, 0.48, 0.075);
      this.body(b, -0.89, 0.65, 0.14, 0.045, 0.32, 0.043, -0.15);
    }
    this.pose.scale.setScalar(1);
    this.herd.instanceMatrix.needsUpdate = true;
  }
  private readonly viewRider = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly viewTarget = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  sightline(
    metres: number,
    camera: { x: number; y: number; z: number },
    ahead: { x: number; y: number; z: number },
  ) {
    let centre: number, range: number, focus: number, offset: number, rise: number;
    if (metres > 8410 && metres < 9030) {
      centre = 8720;
      range = 310;
      focus = 8781;
      offset = -51;
      rise = 1.25;
    } else if (metres > 16320 && metres < 17560) {
      centre = 16940;
      range = 620;
      focus = 17460;
      offset = 660;
      rise = 1.5;
    } else if (metres > 5400 && metres < 5820) {
      centre = 5610;
      range = 210;
      focus = 5650;
      offset = 8;
      rise = 0.55;
    } else return;
    const share = Math.cos(((metres - centre) * Math.PI) / (2 * range)) ** 2;
    const rider = this.course.place(metres, 0, this.viewRider);
    const target = this.course.place(focus, offset, this.viewTarget);
    const dx = target.x - rider.x,
      dz = target.z - rider.z,
      length = Math.hypot(dx, dz);
    const ux = dx / length,
      uz = dz / length;
    camera.x += (rider.x - 5 * ux - camera.x) * share;
    camera.z += (rider.z - 5 * uz - camera.z) * share;
    camera.y += rise * share;
    ahead.x += (rider.x + 14 * ux - ahead.x) * share;
    ahead.z += (rider.z + 14 * uz - ahead.z) * share;
    ahead.y +=
      (rider.y + (centre === 16940 ? 2.8 : centre === 8720 ? 0.45 : 0.35) - ahead.y) * share;
  }
  update(metres: number, time: number) {
    this.approach.value = Math.min(1, Math.max(0, (metres - 14800) / 1050));
    this.athletes.visible = Math.abs(metres - 2840) < 220 || Math.abs(metres - 8760) < 190;
    this.herd.visible = Math.abs(metres - 5632) < 210;
    this.bike.visible = Math.abs(metres - 12820) < 230;
    if (this.athletes.visible) this.run(metres, time);
    if (this.herd.visible) this.graze(time);
    if (this.bike.visible) {
      this.motorcyclePosition = 12720 + ((time * 6.8 + 65) % 196);
      this.anchor(this.bike, this.motorcyclePosition, -2.46, 0.03);
    }
  }
  report() {
    return {
      runnerStride: this.athletes.visible ? this.stride : null,
      grazingHead: this.herd.visible ? this.head : null,
      motorbikePosition: this.bike.visible ? this.motorcyclePosition : null,
    };
  }
  dispose() {
    this.root.removeFromParent();
    this.athletes.dispose();
    this.herd.dispose();
    this.shape.dispose();
    this.surface.dispose();
    this.wheels.dispose();
    this.bikeBox.dispose();
    for (const mat of this.bikeMaterials.values()) mat.dispose();
    for (const mesh of this.signs) {
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
    this.flora.dispose();
    this.rim.dispose();
    this.murram.dispose();
    this.trees.dispose();
    this.valley.dispose();
    this.dirt.dispose();
  }
}
