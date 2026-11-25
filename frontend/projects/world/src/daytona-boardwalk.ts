import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Object3D,
  TorusGeometry,
  Vector3,
  type Scene,
} from 'three/webgpu';

const WHEEL = 3858;
function tinted(source: BufferGeometry, tint: number) {
  const g = source.index ? source.toNonIndexed() : source;
  if (g !== source) source.dispose();
  g.deleteAttribute('uv');
  const c = new Color(tint),
    attr = g.getAttribute('position').clone();
  for (let i = 0; i < attr.count; i++) attr.setXYZ(i, c.r, c.g, c.b);
  g.setAttribute('color', attr);
  return g;
}
function batch(parts: BufferGeometry[]) {
  const geometry = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return geometry;
}
function bar(a: Vector3, b: Vector3, r: number, tint: number) {
  const dir = b.clone().sub(a);
  const geometry = new CylinderGeometry(r, r, dir.length(), 7);
  geometry.applyQuaternion(
    new Object3D().quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()),
  );
  return tinted(geometry.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), tint);
}
function block(x: number, y: number, z: number, w: number, h: number, l: number, tint: number) {
  return tinted(new BoxGeometry(w, h, l).translate(x, y, z), tint);
}
function pickup(tint: number) {
  const parts = [
    block(0, 0.68, 0, 1.93, 0.62, 5.08, tint),
    block(0, 1.28, -0.73, 1.78, 0.72, 1.84, tint),
    block(0, 1.41, -1.66, 1.55, 0.4, 0.047, 0x516e7d),
    block(0, 1.38, 0.201, 1.5, 0.38, 0.046, 0x4f626b),
    block(0, 1.68, -0.72, 1.85, 0.12, 2.02, tint),
    block(0, 1.01, 1.35, 1.54, 0.07, 1.75, 0x414441),
    block(0, 1.12, 2.44, 1.89, 0.39, 0.16, tint),
    block(0, 0.67, -2.57, 0.89, 0.24, 0.06, 0x666a6b),
    block(0, 0.41, -2.58, 1.81, 0.13, 0.13, 0xaeb2af),
  ];
  for (const side of [-1, 1]) {
    parts.push(
      block(side * 0.89, 1.39, -0.77, 0.042, 0.42, 1.52, 0x4c6572),
      block(side * 0.86, 1.11, 1.35, 0.16, 0.38, 2.13, tint),
      block(side * 0.71, 0.76, -2.57, 0.29, 0.2, 0.06, 0xeee4ca),
      block(side * 0.74, 0.78, 2.57, 0.2, 0.26, 0.065, 0xb9483c),
      block(side * 1.02, 1.38, -1.25, 0.23, 0.17, 0.19, tint),
    );
    for (const z of [-1.54, 1.52]) {
      parts.push(
        tinted(
          new CylinderGeometry(0.41, 0.41, 0.22, 14)
            .rotateZ(Math.PI / 2)
            .translate(side * 0.91, 0.41, z),
          0x262823,
        ),
        tinted(
          new CylinderGeometry(0.21, 0.21, 0.03, 10)
            .rotateZ(Math.PI / 2)
            .translate(side * 1.033, 0.41, z),
          0xa7a7a1,
        ),
      );
    }
  }
  return batch(parts);
}
/** Two open-lattice pylons and the suspended cables of the boardwalk thrill ride. */
function skyCoaster() {
  const pieces: BufferGeometry[] = [];
  const summit = 41;
  for (const centre of [-12, 12]) {
    for (let level = 0; level < 10; level++) {
      const bottom = 2 + level * 3.9;
      const lower = 1.7 - level * 0.11;
      const upper = lower - 0.11;
      const paint = level % 3 === 0 ? 0xb35844 : 0xe8ddbb;
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
          const from = new Vector3(centre + side * lower, bottom, end * lower);
          const to = new Vector3(centre + side * upper, bottom + 3.9, end * upper);
          pieces.push(bar(from, to, 0.14, paint));
          pieces.push(bar(from, new Vector3(centre - side * upper, to.y, to.z), 0.065, paint));
        }
      }
    }
    pieces.push(bar(new Vector3(centre, summit, 0), new Vector3(0, 12, 0), 0.075, 0x585c5a));
  }
  pieces.push(block(0, 11.6, 0, 2.2, 0.85, 1.7, 0xaf513d));
  return batch(pieces);
}

/** Print the same local sign once for every ramp that uses it. */
function sign(face: string, lines: readonly string[], ink: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.strokeRect(9, 9, 494, 238);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.font = 'bold ' + (lines.length === 1 ? 86 : 66) + 'px sans-serif';
    ctx.fillText(line, 256, ((i + 0.5) * 226) / lines.length + 15, 460);
  });
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return new MeshBasicMaterial({ map });
}
export class DaytonaBoardwalk {
  private readonly paint = new MeshLambertMaterial({ vertexColors: true });
  private readonly root = new Group();
  private readonly wheel = new Group();
  private readonly rotor = new Group();
  private readonly parts: BufferGeometry[] = [];
  private readonly signs: MeshBasicMaterial[] = [];
  private readonly cabins;
  private readonly trucks;
  private readonly matrix = new Object3D();
  constructor(scene: Scene) {
    const axle = new Vector3(0, 0, 0),
      rim: BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      rim.push(
        tinted(new TorusGeometry(15.2, 0.11, 6, 100).translate(0, 0, side * 1.14), 0xc8564c),
      );
      for (let i = 0; i < 24; i++) {
        const t = (i * Math.PI) / 12;
        const edge = new Vector3(15.2 * Math.cos(t), 15.2 * Math.sin(t), side * 1.14);
        rim.push(bar(axle, edge, 0.055, i % 3 === 0 ? 0xd09d47 : 0xe5e0d0));
        if (side > 0) rim.push(bar(edge, new Vector3(edge.x, edge.y, -1.14), 0.085, 0xdac4a1));
      }
    }
    const frame = batch(rim);
    this.parts.push(frame);
    this.rotor.add(new Mesh(frame, this.paint));
    this.wheel.add(this.rotor);
    const feet: BufferGeometry[] = [];
    for (const side of [-1, 1])
      for (const leg of [-1, 1])
        feet.push(
          bar(
            new Vector3(leg * 7, -17, side * 4.1),
            new Vector3(0, 0, side * 1.68),
            0.39,
            0x67818a,
          ),
        );
    const stands = batch(feet);
    this.parts.push(stands);
    this.wheel.add(new Mesh(stands, this.paint));
    const seats = batch([
      block(0, -0.62, 0, 1.56, 0.66, 1.79, 0xfcfcf5),
      block(0, 0.81, 0, 1.81, 0.15, 1.9, 0xfbedd4),
      ...[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => block(x * 0.71, 0.14, z * 0.77, 0.06, 1.31, 0.06, 0xd3c9b7)),
      ),
    ]);
    this.parts.push(seats);
    this.cabins = new InstancedMesh(seats, this.paint, 24);
    this.cabins.frustumCulled = false;
    for (let i = 0; i < 24; i++)
      this.cabins.setColorAt(i, new Color([0xcd6460, 0xf5c455, 0x6eabbb, 0xa7b481][i % 4]));
    this.wheel.add(this.cabins);
    this.wheel.position.set(31, 20.4, -WHEEL);
    this.wheel.rotation.y = -0.39;
    const coaster = skyCoaster();
    this.parts.push(coaster);
    const towers = new Mesh(coaster, this.paint);
    towers.position.set(54, 0, -3892);
    this.root.add(towers);
    const face = new PlaneGeometry(1, 1);
    this.parts.push(face);
    const access = sign('#247c88', ['BEACH', 'ACCESS'], '#fff4dc');
    const speed = sign('#f7f3dd', ['SPEED LIMIT', '10 MPH'], '#313a3b');
    const restaurant = sign('#e9dfb8', ['JOE’S CRAB SHACK'], '#983c31');
    this.signs.push(access, speed, restaurant);
    const restaurantFace = new Mesh(face, restaurant);
    restaurantFace.scale.set(29, 3.1, 1);
    restaurantFace.position.set(-58, 14.1, -3907.55);
    this.root.add(restaurantFace);
    const posts: BufferGeometry[] = [];
    for (const d of [680, 1860, 3080, 4930, 6520, 7780]) {
      for (const [index, material] of [access, speed].entries()) {
        const board = new Mesh(face, material);
        board.position.set(12.2 + index * 1.6, 4.06, -d - index * 11);
        board.scale.set(1.42, 0.94, 1);
        board.rotation.y = -0.26;
        this.root.add(board);
        posts.push(
          block(board.position.x, 2.9, board.position.z - 0.04, 0.09, 2.42, 0.09, 0x817765),
        );
      }
    }
    const uprights = batch(posts);
    this.parts.push(uprights);
    this.root.add(new Mesh(uprights, this.paint));
    const vehicles = [0x5e94a8, 0xdfbf92, 0xb65b4d].map(pickup);
    this.parts.push(...vehicles);
    this.trucks = vehicles.map((g) => new Mesh(g, this.paint));
    this.root.add(this.wheel, ...this.trucks);
    scene.add(this.root);
  }
  get pickupZ() {
    const first = this.trucks[0];
    return first?.visible ? first.position.z : null;
  }
  get gondolaY() {
    return this.wheel.visible ? this.cabins.instanceMatrix.array[13]! : null;
  }
  update(seconds: number, metres: number) {
    this.wheel.visible = Math.abs(metres - WHEEL) < 640;
    if (this.wheel.visible) {
      const angle = seconds * 0.051;
      this.rotor.rotation.z = angle;
      for (let i = 0; i < 24; i++) {
        const t = (i * Math.PI) / 12 + angle;
        this.matrix.position.set(15.2 * Math.cos(t), 15.2 * Math.sin(t) - 0.85, 0);
        this.matrix.updateMatrix();
        this.cabins.setMatrixAt(i, this.matrix.matrix);
      }
      this.cabins.instanceMatrix.needsUpdate = true;
    }
    for (const [i, truck] of this.trucks.entries()) {
      const origin = [738, 824, 989][i]! + seconds * (i === 1 ? -1.7 : 2.38);
      const d = origin + Math.ceil((metres - 52 - origin) / 515) * 515;
      truck.visible = d < metres + 305;
      truck.position.set(8.78 + i * 1.24, 1.78, -d);
      truck.rotation.y = i === 1 ? Math.PI : 0.016;
    }
  }
  dispose() {
    this.root.removeFromParent();
    this.cabins.dispose();
    this.parts.forEach((g) => g.dispose());
    this.signs.forEach((material) => {
      material.map?.dispose();
      material.dispose();
    });
    this.paint.dispose();
  }
}
