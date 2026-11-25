import {
  CanvasTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';

/** Wind tears the top off a breaker as it hits a skerry. A single atlas is shared along the road. */
function foamTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  let seed = 2074;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 390; i++) {
    const t = random(),
      spread = 5 + 26 * (1 - t);
    const x = 52 + 28 * t * t + (random() - 0.5) * spread * 2;
    const y = 116 - 98 * t + 8 * Math.sin(x * 0.15);
    const r = 1 + (1 - t) * 11 + 3 * random();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(236,244,239,' + (0.22 + 0.34 * (1 - t)) + ')');
    g.addColorStop(1, 'rgba(238,244,241,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  return new CanvasTexture(canvas);
}

/** Breakers have fixed strike points on the reefs. Each pulse rises, curls inland and falls away. */
export class AtlanticSwell {
  readonly group = new Group();
  private readonly sheet = new PlaneGeometry(1, 1);
  private readonly texture = foamTexture();
  private readonly material = new MeshBasicMaterial({
    map: this.texture,
    transparent: true,
    opacity: 0.91,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly spray = new InstancedMesh(this.sheet, this.material, 60);
  private readonly part = new Object3D();
  private readonly place: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  height = 0;

  constructor(private readonly course: Course) {
    this.spray.frustumCulled = false;
    this.group.add(this.spray);
  }

  update(metres: number, seconds: number, camera: Quaternion): void {
    // A 112 m interval makes a new set appear beyond the previous set, outside the forward window.
    const first = Math.floor((metres - 74) / 112);
    let index = 0;
    for (let j = 0; j < 10; j++) {
      const bank = first + j;
      const base = bank * 112 + 74;
      const side = bank % 3 === 0 ? -1 : 1;
      for (let k = 0; k < 6; k++) {
        const time = seconds / (3.9 + 0.22 * (Math.abs(bank) % 4)) + 0.097 * bank + 0.031 * k;
        const phase = time - Math.floor(time);
        const rise = Math.sin(Math.PI * phase);
        const crest = 2.1 + 3.5 * rise * rise;
        const d = base + 1.75 * k;
        const lane = side * (12.7 + 0.57 * Math.sin(k + bank) - 2.6 * phase);
        this.course.place(d, lane, this.place);
        this.part.position.set(this.place.x, 0.34 + crest * 0.49 * rise, this.place.z);
        this.part.quaternion.copy(camera);
        this.part.rotateZ(side * (0.1 + 0.24 * phase));
        this.part.scale.set(1.8 + 2.4 * rise, Math.max(0.05, crest * rise), 1);
        this.part.updateMatrix();
        this.spray.setMatrixAt(index++, this.part.matrix);
        if (j === 1 && k === 0) this.height = this.part.position.y;
      }
    }
    this.spray.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.spray.dispose();
    this.sheet.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
