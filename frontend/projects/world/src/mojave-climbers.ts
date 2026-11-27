import { positionWorld, texture, vertexColor, vec2, uv } from 'three/tsl';
import {
  Color,
  CylinderGeometry,
  Mesh,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  Object3D,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

/** A climber and belayer work the same crack cut into the roadside monzogranite. */
export class MojaveClimbers {
  readonly range: Mesh<CylinderGeometry, MeshBasicNodeMaterial>;
  readonly sand = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly gravel = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#ccad88';
    g.fillRect(0, 0, 256, 256);
    let seed = 2144;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 10000; i++) {
      g.fillStyle = i % 4 === 0 ? 'rgba(97,73,54,.42)' : 'rgba(246,211,155,.44)';
      const x = random() * 256,
        y = random() * 256,
        r = random();
      g.fillRect(x, y, 1 + 3 * r, 1 + r);
    }
  });
  readonly group = new Group();
  readonly granite = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly ball = new SphereGeometry(1, 10, 8);
  private readonly material = new MeshLambertMaterial();
  private readonly figures = new InstancedMesh(this.ball, this.material, 48);
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly swatch = new Color();
  private readonly site = place();
  private readonly rider = place();
  private readonly target = place();
  private slot = 0;
  handHeight = 0;
  belayHand = 0;

  static async load(course: Course) {
    const stone = await new TextureLoader().loadAsync('courses/joshuatree-granite.webp');
    try {
      const backdrop = await new TextureLoader().loadAsync('courses/joshuatree-range.webp');
      return new MojaveClimbers(course, stone, backdrop);
    } catch (error) {
      stone.dispose();
      throw error;
    }
  }

  private constructor(
    private readonly course: Course,
    private readonly stone: Texture,
    private readonly backdrop: Texture,
  ) {
    backdrop.colorSpace = SRGBColorSpace;
    backdrop.wrapS = MirroredRepeatWrapping;
    const sky = new MeshBasicNodeMaterial({
      side: DoubleSide,
      fog: false,
      depthWrite: false,
      transparent: true,
    });
    sky.colorNode = texture(backdrop, uv().mul(vec2(5, 1))).rgb;
    sky.opacityNode = uv().y.oneMinus().mul(8).clamp(0, 1);
    this.range = new Mesh(new CylinderGeometry(23600, 23600, 7900, 96, 1, true), sky);
    const middle = course.place(course.length / 2);
    this.range.position.set(middle.x, 2000, middle.z);
    this.range.renderOrder = -0.5;
    this.gravel.wrapS = this.gravel.wrapT = MirroredRepeatWrapping;
    this.sand.colorNode = texture(this.gravel, positionWorld.xz.mul(0.55)).rgb.mul(
      vertexColor().rgb.mul(0.65).add(0.68),
    );
    stone.colorSpace = SRGBColorSpace;
    stone.wrapS = stone.wrapT = MirroredRepeatWrapping;
    const grain = texture(stone, positionWorld.xy.add(positionWorld.z.mul(0.61)).mul(0.6)).rgb;
    this.granite.colorNode = vertexColor().rgb.mul(grain.mul(0.78).add(0.58));
    this.figures.frustumCulled = false;
    this.figures.setColorAt(0, this.swatch);
    this.group.add(this.figures);
  }

  private paint(tint: number) {
    this.part.updateMatrix();
    this.figures.setMatrixAt(this.slot, this.part.matrix);
    this.figures.setColorAt(this.slot++, this.swatch.setHex(tint));
  }

  private oval(x: number, y: number, z: number, w: number, h: number, d: number, tint: number) {
    this.part.position.set(x, y, z);
    this.part.scale.set(w, h, d);
    this.part.rotation.set(0, 0, 0);
    this.paint(tint);
  }

  private link(
    x: number,
    y: number,
    z: number,
    ex: number,
    ey: number,
    ez: number,
    r: number,
    tint: number,
  ) {
    this.direction.set(ex - x, ey - y, ez - z);
    this.part.position.set((x + ex) / 2, (y + ey) / 2, (z + ez) / 2);
    this.part.scale.set(r, this.direction.length() / 2 + r * 0.35, r);
    this.part.quaternion.setFromUnitVectors(this.axis, this.direction.normalize());
    this.paint(tint);
  }

  update(metres: number, time: number) {
    const station = metres < 8000 ? 4272 : 12396;
    this.group.visible = Math.abs(metres - station) < 200;
    if (!this.group.visible) return;
    const p = this.course.place(station, -10.64, this.site);
    this.group.position.set(p.x, p.y, p.z);
    this.group.rotation.y = p.heading + Math.PI / 2;
    const phase = time * 0.67;
    const y = 3.58 + 0.28 * Math.sin(phase),
      x = 0.13 * y + 0.18 * Math.sin(y);
    this.slot = 0;
    this.oval(x, y, 0, 0.21, 0.33, 0.17, 0xbc5744);
    this.oval(x, y + 0.47, 0, 0.127, 0.156, 0.122, 0xc49474);
    this.oval(x, y + 0.59, 0, 0.152, 0.099, 0.146, 0xdbab40);
    this.oval(x, y - 0.26, 0, 0.207, 0.105, 0.16, 0x455969);
    for (const s of [-1, 1]) {
      const grip = 0.45 + 0.21 * Math.sin(phase + s * 1.23);
      const finger = x + s * 0.39;
      this.link(x + s * 0.17, y + 0.14, 0, x + s * 0.32, y + 0.25, 0.12, 0.069, 0xb65a47);
      this.link(x + s * 0.32, y + 0.25, 0.12, finger, y + grip, -0.06, 0.055, 0xc49678);
      this.oval(finger, y + grip, -0.09, 0.064, 0.062, 0.052, 0xc99f7b);
      this.link(x + s * 0.12, y - 0.23, 0, x + s * 0.33, y - 0.51, 0.2, 0.088, 0x536a73);
      this.link(x + s * 0.33, y - 0.51, 0.2, x + s * 0.29, y - 0.81, -0.04, 0.067, 0x465b68);
      this.oval(x + s * 0.29, y - 0.82, -0.02, 0.103, 0.061, 0.087, 0x373f43);
      if (s === 1) this.handHeight = y + grip;
    }
    const bx = 2.1,
      bz = 1.7;
    this.oval(bx, 1.05, bz, 0.21, 0.33, 0.16, 0x548a95);
    this.oval(bx, 1.51, bz, 0.128, 0.155, 0.124, 0xbe9171);
    this.oval(bx, 1.63, bz, 0.15, 0.086, 0.145, 0xe2b651);
    this.belayHand = 1.15 + 0.14 * Math.sin(phase + 0.8);
    for (const s of [-1, 1]) {
      this.link(bx + s * 0.14, 0.81, bz, bx + s * 0.2, 0.13, bz + s * 0.16, 0.1, 0x57616e);
      this.link(bx + s * 0.17, 1.24, bz, bx + s * 0.29, 1.08, bz - 0.08, 0.073, 0x538997);
      this.link(
        bx + s * 0.29,
        1.08,
        bz - 0.08,
        bx + 0.08,
        this.belayHand + s * 0.09,
        bz - 0.29,
        0.055,
        0xb78b6d,
      );
    }
    // The loop runs from the harness to the top anchor and back into the belayer's hands.
    this.link(x, y - 0.21, -0.11, 0.88, 7.4, -0.34, 0.023, 0xc46d3f);
    this.link(0.88, 7.4, -0.34, 1.21, 3.6, 0.72, 0.024, 0xde8250);
    this.link(1.21, 3.6, 0.72, bx + 0.08, this.belayHand, bz - 0.29, 0.024, 0xde8250);
    this.figures.count = this.slot;
    this.figures.instanceMatrix.needsUpdate = true;
    if (this.figures.instanceColor) this.figures.instanceColor.needsUpdate = true;
  }

  aim(metres: number, camera: Vector3, ahead: CoursePlace) {
    const sites = [
      [4250, 4272, -10.64, 2.2],
      [9780, 9818, -12.3, 3.8],
      [12370, 12401, 17, 0.8],
      [17630, 17661, 14, 1.5],
    ] as const;
    for (const [centre, station, lane, rise] of sites) {
      const delta = Math.abs(metres - centre);
      if (delta > 85) continue;
      const a = this.course.place(metres, 0, this.rider),
        b = this.course.place(station, lane, this.target);
      const dx = b.x - a.x,
        dz = b.z - a.z,
        length = Math.max(1, Math.hypot(dx, dz));
      const share = Math.cos((delta * Math.PI) / 170) ** 2;
      camera.x += (a.x - (5 * dx) / length - camera.x) * share;
      camera.z += (a.z - (5 * dz) / length - camera.z) * share;
      camera.y += 0.35 * share;
      ahead.x += (a.x + (14 * dx) / length - ahead.x) * share;
      ahead.z += (a.z + (14 * dz) / length - ahead.z) * share;
      ahead.y += rise * share;
      break;
    }
  }

  dispose() {
    this.figures.dispose();
    this.ball.dispose();
    this.material.dispose();
    this.granite.dispose();
    this.stone.dispose();
    this.range.geometry.dispose();
    this.range.material.dispose();
    this.backdrop.dispose();
    this.sand.dispose();
    this.gravel.dispose();
    this.group.clear();
  }
}
