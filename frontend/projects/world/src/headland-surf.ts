import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  type Scene,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';

/** Four curved crests with holes in the foam, laid on the tide shelf in world metres. */
function foamTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  for (let row = 0; row < 4; row++) {
    for (let j = 0; j < 158; j++) {
      const x = (j * 67 + row * 17) % 256;
      const width = 2 + ((j * 37) % 13);
      const y = row * 12 + 5 + Math.sin(x * 0.047 + row) * 3 + Math.sin(x * 0.12) * 1.4;
      ctx.fillStyle = 'rgba(240,249,242,' + (0.32 + ((j * 31) % 51) / 100) + ')';
      ctx.beginPath();
      ctx.ellipse(x, y, width, 1 + (j % 3) * 0.45, -0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return new CanvasTexture(canvas);
}
function walkerShape() {
  const pieces = [
    [new SphereGeometry(0.15, 8, 6), 0xad7e63, 0, 1.56, 0],
    [new BoxGeometry(0.35, 0.55, 0.25), 0xba5a45, 0, 1.12, 0],
    [new BoxGeometry(0.26, 0.36, 0.15), 0x345560, 0, 1.17, 0.17],
    [new SphereGeometry(0.19, 8, 4).scale(1, 0.47, 1), 0xb99a69, 0, 1.68, 0],
    ...[-1, 1].flatMap((s) => [
      [new BoxGeometry(0.13, 0.87, 0.14), 0x485364, s * 0.1, 0.43, s * 0.1] as const,
      [new BoxGeometry(0.1, 0.48, 0.13), 0xb58b71, s * 0.23, 1.1, -0.025] as const,
    ]),
  ] as const;
  const parts = pieces.map(([source, colour, x, y, z]) => {
    const geometry = source.toNonIndexed();
    source.dispose();
    geometry.translate(x, y, z);
    geometry.deleteAttribute('uv');
    const rgb = new Color(colour);
    const tint = geometry.getAttribute('normal').clone();
    for (let i = 0; i < tint.count; i++) tint.setXYZ(i, rgb.r, rgb.g, rgb.b);
    geometry.setAttribute('color', tint);
    return geometry;
  });
  const geometry = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return geometry;
}
export class HeadlandSurf {
  private readonly root = new Group();
  private readonly foam = foamTexture();
  private readonly surface = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private readonly wash = new MeshBasicMaterial({
    map: this.foam,
    transparent: true,
    depthWrite: false,
    color: 0xe5ece5,
  });
  private readonly breakers = new InstancedMesh(this.surface, this.wash, 30);
  private readonly pose = new Object3D();
  private readonly shape = walkerShape();
  private readonly clothes = new MeshLambertMaterial({ vertexColors: true });
  private readonly walkers = Array.from({ length: 3 }, () => new Mesh(this.shape, this.clothes));
  breakerHeight = 0;
  get walkerX(): number | null {
    return this.walkers[0]!.visible ? this.walkers[0]!.position.x : null;
  }
  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    this.breakers.frustumCulled = false;
    this.root.add(this.breakers, ...this.walkers);
    scene.add(this.root);
    this.update(0, 0);
  }
  update(seconds: number, metres: number): void {
    const coast = this.course.file.headland!;
    // The first two authored surf stations give the spacing. Adjacent sections retain
    // their phase when a crest leaves the back of the camera's visibility window.
    const spacing = coast.surf[1]![0] - coast.surf[0]![0];
    const first = Math.max(0, Math.floor((metres - coast.surf[0]![0]) / spacing) - 3);
    const count = Math.min(30, coast.surf.length - first - 1);
    for (let j = 0; j < count; j++) {
      const idx = first + j;
      const [, x, z] = coast.surf[idx]!;
      const [, nx, nz] = coast.surf[idx + 1]!;
      const phase = seconds * 0.89 + idx * 0.52;
      const swell = (1 + Math.sin(phase)) / 2;
      this.pose.position.set((nx + x) / 2, 0.14 + swell * 0.32, (nz + z) / 2 + 7 * (1 - swell));
      this.pose.rotation.y = -Math.atan2(nz - z, nx - x);
      this.pose.scale.set(Math.hypot(nx - x, nz - z) * 0.93, 1, 2.1 + 4 * swell);
      this.pose.updateMatrix();
      this.breakers.setMatrixAt(j, this.pose.matrix);
      if (j === Math.min(3, count - 1)) this.breakerHeight = this.pose.position.y;
    }
    this.breakers.count = count;
    this.breakers.instanceMatrix.needsUpdate = true;
    const station = coast.lookouts.find((d) => Math.abs(d - metres) < 180);
    for (const [i, walker] of this.walkers.entries()) {
      walker.visible = station !== undefined;
      if (station === undefined) continue;
      const phase = seconds * 0.15 + i * 0.86;
      const p = this.course.place(station + 5 + i * 2.2 + Math.sin(phase) * 2.4, 12.1);
      walker.position.set(p.x, p.y + 0.023 * Math.abs(Math.sin(seconds * 3.3 + i)), p.z);
      walker.rotation.y = p.heading + (Math.cos(phase) > 0 ? 0 : Math.PI);
    }
  }
  dispose(): void {
    this.root.removeFromParent();
    this.breakers.dispose();
    this.surface.dispose();
    this.wash.dispose();
    this.foam.dispose();
    this.shape.dispose();
    this.clothes.dispose();
  }
}
